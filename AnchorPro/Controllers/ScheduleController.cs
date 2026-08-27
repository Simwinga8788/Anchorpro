using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Native project schedule — a manually-maintained baseline (planned dates) tracked against
    /// actual progress. Not a CPM/auto-scheduling engine: activities are ordered and dated
    /// directly by the user. An activity optionally links to a BOQ section, in which case its
    /// progress/status are auto-derived from certified work rather than entered by hand.
    /// </summary>
    [ApiController]
    [Route("api/schedule")]
    [Authorize]
    public class ScheduleController : ControllerBase
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public ScheduleController(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        /// <summary>
        /// GET /api/schedule/project/{projectId}
        /// BOQ-linked activities have their progress/status computed live from the latest
        /// certificate — the stored values are never trusted for those.
        /// </summary>
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetByProject(int projectId)
        {
            using var db = _factory.CreateDbContext();
            var milestones = await db.ProjectMilestones
                .Include(m => m.BoqSection)
                .Where(m => m.ProjectId == projectId)
                .OrderBy(m => m.DisplayOrder).ThenBy(m => m.PlannedStartDate)
                .ToListAsync();

            var sectionProgress = await GetSectionProgressAsync(db, projectId);

            var result = milestones.Select(m =>
            {
                int progress = m.ProgressPercentage;
                var status = m.Status;
                bool isAutoTracked = m.BoqSectionId.HasValue;

                if (isAutoTracked && sectionProgress.TryGetValue(m.BoqSectionId!.Value, out var pct))
                {
                    progress = pct;
                    status = pct >= 100 ? MilestoneStatus.Complete : pct > 0 ? MilestoneStatus.InProgress : MilestoneStatus.NotStarted;
                }

                return new
                {
                    m.Id,
                    m.ProjectId,
                    m.Title,
                    m.Trade,
                    m.PlannedStartDate,
                    m.PlannedEndDate,
                    m.ActualStartDate,
                    m.ActualEndDate,
                    ProgressPercentage = progress,
                    Status = status,
                    m.DisplayOrder,
                    m.PredecessorMilestoneId,
                    m.BoqSectionId,
                    BoqSectionName = m.BoqSection?.SectionName,
                    IsAutoTracked = isAutoTracked
                };
            });

            return Ok(result);
        }

        /// <summary>
        /// POST /api/schedule
        /// Add a new activity/milestone to a project's schedule.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMilestoneDto dto)
        {
            if (dto.ProjectId <= 0 || string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest("ProjectId and Title are required.");

            if (dto.PlannedEndDate < dto.PlannedStartDate)
                return BadRequest("Planned end date cannot be before the planned start date.");

            using var db = _factory.CreateDbContext();

            if (dto.PredecessorMilestoneId.HasValue &&
                !await db.ProjectMilestones.AnyAsync(m => m.Id == dto.PredecessorMilestoneId.Value && m.ProjectId == dto.ProjectId))
            {
                return BadRequest("The referenced predecessor activity was not found on this project.");
            }

            if (dto.BoqSectionId.HasValue &&
                !await db.BoqSections.AnyAsync(s => s.Id == dto.BoqSectionId.Value && s.BillOfQuantities!.ProjectId == dto.ProjectId))
            {
                return BadRequest("The referenced BOQ section was not found on this project's current BOQ.");
            }

            int nextOrder = await db.ProjectMilestones.CountAsync(m => m.ProjectId == dto.ProjectId);

            var milestone = new ProjectMilestone
            {
                ProjectId = dto.ProjectId,
                Title = dto.Title,
                Trade = dto.Trade,
                PlannedStartDate = dto.PlannedStartDate.Date,
                PlannedEndDate = dto.PlannedEndDate.Date,
                Status = MilestoneStatus.NotStarted,
                ProgressPercentage = 0,
                DisplayOrder = nextOrder,
                PredecessorMilestoneId = dto.PredecessorMilestoneId,
                BoqSectionId = dto.BoqSectionId
            };

            db.ProjectMilestones.Add(milestone);
            await db.SaveChangesAsync();

            return Ok(milestone);
        }

        /// <summary>
        /// PUT /api/schedule/{id}/progress
        /// Update actual dates, progress %, and status — the day-to-day site update.
        /// Rejected for BOQ-linked activities, since their progress is auto-computed.
        /// </summary>
        [HttpPut("{id}/progress")]
        public async Task<IActionResult> UpdateProgress(int id, [FromBody] UpdateMilestoneProgressDto dto)
        {
            using var db = _factory.CreateDbContext();
            var milestone = await db.ProjectMilestones.FindAsync(id);
            if (milestone == null) return NotFound();

            if (milestone.BoqSectionId.HasValue)
                return BadRequest("This activity's progress is auto-computed from the linked BOQ section — unlink it to set progress manually.");

            if (dto.ProgressPercentage < 0 || dto.ProgressPercentage > 100)
                return BadRequest("Progress must be between 0 and 100.");

            milestone.ProgressPercentage = dto.ProgressPercentage;
            milestone.Status = dto.Status;
            milestone.ActualStartDate = dto.ActualStartDate;
            milestone.ActualEndDate = dto.ActualEndDate;

            await db.SaveChangesAsync();
            return Ok(milestone);
        }

        /// <summary>
        /// PUT /api/schedule/{id}
        /// Edit the activity's core details (title, trade, planned dates, predecessor, BOQ link).
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMilestoneDto dto)
        {
            using var db = _factory.CreateDbContext();
            var milestone = await db.ProjectMilestones.FindAsync(id);
            if (milestone == null) return NotFound();

            if (dto.PlannedEndDate < dto.PlannedStartDate)
                return BadRequest("Planned end date cannot be before the planned start date.");

            if (dto.PredecessorMilestoneId == id)
                return BadRequest("An activity cannot be its own predecessor.");

            if (dto.BoqSectionId.HasValue &&
                !await db.BoqSections.AnyAsync(s => s.Id == dto.BoqSectionId.Value && s.BillOfQuantities!.ProjectId == milestone.ProjectId))
            {
                return BadRequest("The referenced BOQ section was not found on this project's current BOQ.");
            }

            milestone.Title = dto.Title;
            milestone.Trade = dto.Trade;
            milestone.PlannedStartDate = dto.PlannedStartDate.Date;
            milestone.PlannedEndDate = dto.PlannedEndDate.Date;
            milestone.PredecessorMilestoneId = dto.PredecessorMilestoneId;
            milestone.BoqSectionId = dto.BoqSectionId;

            await db.SaveChangesAsync();
            return Ok(milestone);
        }

        /// <summary>
        /// DELETE /api/schedule/{id}
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            using var db = _factory.CreateDbContext();
            var milestone = await db.ProjectMilestones.FindAsync(id);
            if (milestone == null) return NotFound();

            var hasDependents = await db.ProjectMilestones.AnyAsync(m => m.PredecessorMilestoneId == id);
            if (hasDependents)
                return BadRequest("Another activity lists this one as its predecessor — update or remove that link first.");

            db.ProjectMilestones.Remove(milestone);
            await db.SaveChangesAsync();

            return Ok(new { message = "Activity removed from schedule." });
        }

        /// <summary>
        /// BOQ section id -> whole-percent complete, derived from the latest non-Draft
        /// certificate's own line items (not the project's current BOQ — see the identical
        /// reasoning in ReportsController.BuildSectionBreakdownAsync: a BOQ revision creates new
        /// BoqItem rows, so a certificate raised against an earlier version wouldn't match).
        /// </summary>
        private static async Task<Dictionary<int, int>> GetSectionProgressAsync(ApplicationDbContext db, int projectId)
        {
            var latestCert = await db.PaymentCertificates
                .Include(c => c.Items)
                    .ThenInclude(i => i.BoqItem!)
                        .ThenInclude(b => b.BoqSection)
                .Where(c => c.ProjectId == projectId && c.Status != CertificateStatus.Draft)
                .OrderByDescending(c => c.PeriodEndDate)
                .FirstOrDefaultAsync();

            if (latestCert == null) return new Dictionary<int, int>();

            return latestCert.Items
                .Where(i => i.BoqItem?.BoqSection != null)
                .GroupBy(i => i.BoqItem!.BoqSection!)
                .ToDictionary(
                    g => g.Key.Id,
                    g => g.Key.Subtotal > 0 ? (int)Math.Round(g.Sum(i => i.CumulativeValueCompleted) / g.Key.Subtotal * 100) : 0);
        }
    }

    public class CreateMilestoneDto
    {
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Trade { get; set; }
        public DateTime PlannedStartDate { get; set; }
        public DateTime PlannedEndDate { get; set; }
        public int? PredecessorMilestoneId { get; set; }
        public int? BoqSectionId { get; set; }
    }

    public class UpdateMilestoneDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Trade { get; set; }
        public DateTime PlannedStartDate { get; set; }
        public DateTime PlannedEndDate { get; set; }
        public int? PredecessorMilestoneId { get; set; }
        public int? BoqSectionId { get; set; }
    }

    public class UpdateMilestoneProgressDto
    {
        public int ProgressPercentage { get; set; }
        public MilestoneStatus Status { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }
    }
}

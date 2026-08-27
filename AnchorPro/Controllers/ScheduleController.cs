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
    /// directly by the user.
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
        /// </summary>
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetByProject(int projectId)
        {
            using var db = _factory.CreateDbContext();
            var milestones = await db.ProjectMilestones
                .Where(m => m.ProjectId == projectId)
                .OrderBy(m => m.DisplayOrder).ThenBy(m => m.PlannedStartDate)
                .ToListAsync();

            return Ok(milestones);
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
                PredecessorMilestoneId = dto.PredecessorMilestoneId
            };

            db.ProjectMilestones.Add(milestone);
            await db.SaveChangesAsync();

            return Ok(milestone);
        }

        /// <summary>
        /// PUT /api/schedule/{id}/progress
        /// Update actual dates, progress %, and status — the day-to-day site update.
        /// </summary>
        [HttpPut("{id}/progress")]
        public async Task<IActionResult> UpdateProgress(int id, [FromBody] UpdateMilestoneProgressDto dto)
        {
            using var db = _factory.CreateDbContext();
            var milestone = await db.ProjectMilestones.FindAsync(id);
            if (milestone == null) return NotFound();

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
        /// Edit the activity's core details (title, trade, planned dates, predecessor).
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

            milestone.Title = dto.Title;
            milestone.Trade = dto.Trade;
            milestone.PlannedStartDate = dto.PlannedStartDate.Date;
            milestone.PlannedEndDate = dto.PlannedEndDate.Date;
            milestone.PredecessorMilestoneId = dto.PredecessorMilestoneId;

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
    }

    public class CreateMilestoneDto
    {
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Trade { get; set; }
        public DateTime PlannedStartDate { get; set; }
        public DateTime PlannedEndDate { get; set; }
        public int? PredecessorMilestoneId { get; set; }
    }

    public class UpdateMilestoneDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Trade { get; set; }
        public DateTime PlannedStartDate { get; set; }
        public DateTime PlannedEndDate { get; set; }
        public int? PredecessorMilestoneId { get; set; }
    }

    public class UpdateMilestoneProgressDto
    {
        public int ProgressPercentage { get; set; }
        public MilestoneStatus Status { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using System.Security.Claims;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VariationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VariationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/variations/project/{projectId}
        /// Returns all variations, claims and site instructions for a project.
        /// </summary>
        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetByProject(int projectId)
        {
            var variations = await _context.Variations
                .Where(v => v.ProjectId == projectId)
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new
                {
                    v.Id,
                    v.ProjectId,
                    v.VariationNumber,
                    SiteInstructionRef = v.Reason ?? "SI-Pending",
                    v.Title,
                    v.Description,
                    v.Amount,
                    v.BoqItemId,
                    BoqItemNumber = v.BoqItem != null ? v.BoqItem.ItemNumber : null,
                    TimeExtensionDays = 0,
                    Status = v.Status == VariationStatus.Approved ? "Approved" :
                             v.Status == VariationStatus.Rejected ? "Rejected" : "Under Review",
                    RequestedDate = v.CreatedAt.ToString("yyyy-MM-dd"),
                    IncludedInCertificateId = v.CertificateVariations.Select(cv => (int?)cv.PaymentCertificateId).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(variations);
        }

        /// <summary>
        /// GET /api/variations/{id}/history
        /// Returns the status-change audit trail for a variation (who raised, reviewed, approved, when).
        /// </summary>
        [HttpGet("{id}/history")]
        public async Task<ActionResult<IEnumerable<object>>> GetHistory(int id)
        {
            var history = await _context.VariationStatusHistories
                .Where(h => h.VariationId == id)
                .OrderBy(h => h.CreatedAt)
                .Select(h => new { h.Status, h.Notes, h.CreatedAt, h.CreatedBy })
                .ToListAsync();

            return Ok(history);
        }

        /// <summary>
        /// POST /api/variations
        /// Log a new Variation Order / Claim, optionally referencing a BOQ item it affects.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CreateVariationDto dto)
        {
            if (dto.ProjectId <= 0 || string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest("ProjectId and Title are required.");
            }

            if (dto.BoqItemId.HasValue && !await _context.BoqItems.AnyAsync(i => i.Id == dto.BoqItemId.Value))
            {
                return BadRequest("The referenced BOQ item was not found.");
            }

            var count = await _context.Variations.CountAsync(v => v.ProjectId == dto.ProjectId);
            var voNumber = string.IsNullOrWhiteSpace(dto.VariationNumber)
                ? $"VO-{count + 1:D3}"
                : dto.VariationNumber;
            var raisedBy = User.FindFirstValue(ClaimTypes.Name) ?? "SiteStaff";

            var variation = new Variation
            {
                ProjectId = dto.ProjectId,
                VariationNumber = voNumber,
                Title = dto.Title,
                Description = dto.Description ?? string.Empty,
                Reason = dto.SiteInstructionRef ?? "SI-Pending",
                Amount = dto.Amount,
                BoqItemId = dto.BoqItemId,
                Status = VariationStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = raisedBy
            };

            variation.StatusHistory.Add(new VariationStatusHistory
            {
                Status = VariationStatus.Pending,
                Notes = "Raised",
                CreatedBy = raisedBy
            });

            _context.Variations.Add(variation);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                variation.Id,
                variation.ProjectId,
                variation.VariationNumber,
                SiteInstructionRef = variation.Reason,
                variation.Title,
                variation.Description,
                variation.Amount,
                variation.BoqItemId,
                TimeExtensionDays = dto.TimeExtensionDays,
                Status = "Under Review",
                RequestedDate = variation.CreatedAt.ToString("yyyy-MM-dd")
            });
        }

        /// <summary>
        /// PUT /api/variations/{id}/approve
        /// Approve a variation claim. Once approved, it automatically becomes available for
        /// inclusion in the next Payment Certificate raised for the project.
        /// </summary>
        [HttpPut("{id}/approve")]
        public async Task<ActionResult> Approve(int id)
        {
            var variation = await _context.Variations.FindAsync(id);
            if (variation == null) return NotFound();
            if (variation.Status == VariationStatus.Approved)
                return BadRequest("This variation is already approved.");

            var reviewer = User.FindFirstValue(ClaimTypes.NameIdentifier);
            variation.Status = VariationStatus.Approved;
            variation.ApprovedAt = DateTime.UtcNow;
            variation.ApprovedById = reviewer;

            _context.VariationStatusHistories.Add(new VariationStatusHistory
            {
                VariationId = id,
                Status = VariationStatus.Approved,
                Notes = "Approved",
                CreatedBy = reviewer
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Variation approved successfully." });
        }

        /// <summary>
        /// PUT /api/variations/{id}/reject
        /// Reject a variation claim.
        /// </summary>
        [HttpPut("{id}/reject")]
        public async Task<ActionResult> Reject(int id, [FromBody] RejectVariationDto? dto)
        {
            var variation = await _context.Variations.FindAsync(id);
            if (variation == null) return NotFound();
            if (variation.Status == VariationStatus.Approved)
                return BadRequest("An already-approved variation cannot be rejected.");

            var reviewer = User.FindFirstValue(ClaimTypes.NameIdentifier);
            variation.Status = VariationStatus.Rejected;

            _context.VariationStatusHistories.Add(new VariationStatusHistory
            {
                VariationId = id,
                Status = VariationStatus.Rejected,
                Notes = dto?.Reason,
                CreatedBy = reviewer
            });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Variation rejected." });
        }
    }

    public class CreateVariationDto
    {
        public int ProjectId { get; set; }
        public string? VariationNumber { get; set; }
        public string? SiteInstructionRef { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Amount { get; set; }
        public int TimeExtensionDays { get; set; }
        public int? BoqItemId { get; set; }
    }

    public class RejectVariationDto
    {
        public string? Reason { get; set; }
    }
}

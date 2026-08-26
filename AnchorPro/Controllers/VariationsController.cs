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
                    TimeExtensionDays = 0,
                    Status = v.Status == VariationStatus.Approved ? "Approved" : 
                             v.Status == VariationStatus.Rejected ? "Rejected" : "Under Review",
                    RequestedDate = v.CreatedAt.ToString("yyyy-MM-dd")
                })
                .ToListAsync();

            return Ok(variations);
        }

        /// <summary>
        /// POST /api/variations
        /// Log a new Variation Order / Claim
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CreateVariationDto dto)
        {
            if (dto.ProjectId <= 0 || string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest("ProjectId and Title are required.");
            }

            var count = await _context.Variations.CountAsync(v => v.ProjectId == dto.ProjectId);
            var voNumber = string.IsNullOrWhiteSpace(dto.VariationNumber) 
                ? $"VO-{count + 1:D3}" 
                : dto.VariationNumber;

            var variation = new Variation
            {
                ProjectId = dto.ProjectId,
                VariationNumber = voNumber,
                Title = dto.Title,
                Description = dto.Description ?? string.Empty,
                Reason = dto.SiteInstructionRef ?? "SI-Pending",
                Amount = dto.Amount,
                Status = dto.Status == "Approved" ? VariationStatus.Approved : VariationStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = User.FindFirstValue(ClaimTypes.Name) ?? "SiteStaff"
            };

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
                TimeExtensionDays = dto.TimeExtensionDays,
                Status = variation.Status == VariationStatus.Approved ? "Approved" : "Under Review",
                RequestedDate = variation.CreatedAt.ToString("yyyy-MM-dd")
            });
        }

        /// <summary>
        /// PUT /api/variations/{id}/approve
        /// Approve a variation claim
        /// </summary>
        [HttpPut("{id}/approve")]
        public async Task<ActionResult> Approve(int id)
        {
            var variation = await _context.Variations.FindAsync(id);
            if (variation == null) return NotFound();

            variation.Status = VariationStatus.Approved;
            variation.ApprovedAt = DateTime.UtcNow;
            variation.ApprovedById = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Variation approved successfully." });
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
        public string? Status { get; set; }
    }
}

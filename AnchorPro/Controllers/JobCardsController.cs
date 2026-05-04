using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobCardsController : ControllerBase
    {
        private readonly IJobCardService _jobService;
        private readonly IJobTaskService _taskService;
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly ICurrentTenantService _tenantService;
        private readonly ISettingsService _settingsService;

        public JobCardsController(
            IJobCardService jobService,
            IJobTaskService taskService,
            IDbContextFactory<ApplicationDbContext> factory,
            ICurrentTenantService tenantService,
            ISettingsService settingsService)
        {
            _jobService = jobService;
            _taskService = taskService;
            _factory = factory;
            _tenantService = tenantService;
            _settingsService = settingsService;
        }

        [HttpGet]
        public async Task<ActionResult<List<JobCard>>> GetAll()
        {
            var result = await _jobService.GetAllJobCardsAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<JobCard>> GetById(int id)
        {
            var result = await _jobService.GetJobCardByIdAsync(id);
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpGet("technician/{technicianId}")]
        public async Task<ActionResult<List<JobCard>>> GetByTechnician(string technicianId)
        {
            var result = await _jobService.GetJobCardsByTechnicianAsync(technicianId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] JobCard jobCard)
        {
            var userId = User.Identity?.Name ?? "API_User";
            var tenantId = _tenantService.TenantId;
            await _jobService.CreateJobCardAsync(jobCard, userId, tenantId);
            return CreatedAtAction(nameof(GetById), new { id = jobCard.Id }, jobCard);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] JobCard jobCard)
        {
            if (id != jobCard.Id)
            {
                return BadRequest("ID mismatch");
            }

            var userId = User.Identity?.Name ?? "API_User";
            await _jobService.UpdateJobCardAsync(jobCard, userId);
            return NoContent();
        }

        [HttpPatch("{id}/status")]
        public async Task<ActionResult> UpdateStatus(int id, [FromBody] JobStatus status)
        {
            // ── Safety Gate: block InProgress if PTW required but not approved ──
            if (status == JobStatus.InProgress)
            {
                var requirePermit = await _settingsService.GetSettingAsync("Op.RequireSafetyPermit", "false");
                if (requirePermit?.ToLower() == "true")
                {
                    using var ctx = _factory.CreateDbContext();
                    ctx.IgnoreTenantFilter = true;
                    var tid = _tenantService.TenantId;

                    var hasApprovedPermit = await ctx.Set<PermitToWork>()
                        .AnyAsync(p => p.JobCardId == id
                            && p.Status == AnchorPro.Data.Entities.PermitStatus.Active);

                    if (!hasApprovedPermit)
                    {
                        return BadRequest(new
                        {
                            error = "safety_permit_required",
                            message = "A Permit to Work (PTW) must be approved before this job can be started. Go to Safety & Compliance to issue a permit."
                        });
                    }
                }
            }

            var userId = User.Identity?.Name ?? "API_User";
            await _jobService.UpdateJobStatusAsync(id, status, userId);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _jobService.DeleteJobCardAsync(id);
            return NoContent();
        }

        [HttpPost("{id}/parts")]
        public async Task<ActionResult> AddPart(int id, [FromBody] AddPartRequest request)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _jobService.AddPartToJobAsync(id, request.InventoryItemId, request.Quantity, userId);
            return Ok(new { message = "Part added to job" });
        }
    }

    public class AddPartRequest
    {
        public int InventoryItemId { get; set; }
        public int Quantity { get; set; }
    }
}


using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class SafetyController : ControllerBase
    {
        private readonly ISafetyService _safetyService;

        public SafetyController(ISafetyService safetyService)
        {
            _safetyService = safetyService;
        }

        // ── DASHBOARD ─────────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/safety/stats
        /// Returns: ActivePermits, LotoApplied, PpeChecks, ClosedThisMonth, SuspendedPermits, CompliancePercent
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<SafetyDashboardStats>> GetStats()
            => Ok(await _safetyService.GetDashboardStatsAsync());

        // ── PERMITS TO WORK ───────────────────────────────────────────────────

        /// <summary>GET /api/safety/permits — All permits to work.</summary>
        [HttpGet("permits")]
        public async Task<ActionResult<List<PermitToWork>>> GetAll()
            => Ok(await _safetyService.GetAllPermitsAsync());

        /// <summary>GET /api/safety/permits/{id}</summary>
        [HttpGet("permits/{id}")]
        public async Task<ActionResult<PermitToWork>> GetById(int id)
        {
            var result = await _safetyService.GetPermitByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>GET /api/safety/permits/job/{jobId} — Permit linked to a specific job card.</summary>
        [HttpGet("permits/job/{jobId}")]
        public async Task<ActionResult<PermitToWork>> GetByJob(int jobId)
        {
            var result = await _safetyService.GetPermitByJobIdAsync(jobId);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>POST /api/safety/permits — Issue a new permit to work.</summary>
        [HttpPost("permits")]
        public async Task<ActionResult> Create([FromBody] PermitToWork permit)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _safetyService.CreatePermitAsync(permit, userId);
            return CreatedAtAction(nameof(GetById), new { id = permit.Id }, permit);
        }

        /// <summary>
        /// PATCH /api/safety/permits/{id}/status
        /// Body: { "status": 2, "closureNotes": "Work completed safely." }
        /// PermitStatus enum — refer to PermitStatus values in the model.
        /// </summary>
        [HttpPatch("permits/{id}/status")]
        public async Task<ActionResult> UpdateStatus(int id, [FromBody] UpdatePermitStatusRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _safetyService.UpdatePermitStatusAsync(id, req.Status, req.ClosureNotes, userId);
            return NoContent();
        }
    }

    public class UpdatePermitStatusRequest
    {
        public PermitStatus Status { get; set; }
        public string ClosureNotes { get; set; } = string.Empty;
    }
}

using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AnchorPro.Data;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SafetyController : ControllerBase
    {
        private readonly ISafetyService _safetyService;
        private readonly UserManager<ApplicationUser> _userManager;

        public SafetyController(ISafetyService safetyService, UserManager<ApplicationUser> userManager)
        {
            _safetyService = safetyService;
            _userManager = userManager;
        }

        [HttpGet("permits")]
        public async Task<ActionResult> GetAllPermits()
        {
            var permits = await _safetyService.GetAllPermitsAsync();
            return Ok(permits);
        }

        [HttpGet("permits/{id}")]
        public async Task<ActionResult> GetPermit(int id)
        {
            var permit = await _safetyService.GetPermitByIdAsync(id);
            if (permit == null) return NotFound();
            return Ok(permit);
        }

        [HttpGet("permits/job/{jobId}")]
        public async Task<ActionResult> GetPermitByJob(int jobId)
        {
            var permit = await _safetyService.GetPermitByJobIdAsync(jobId);
            if (permit == null) return NotFound();
            return Ok(permit);
        }

        [HttpPost("permits")]
        public async Task<ActionResult> CreatePermit([FromBody] PermitToWork permit)
        {
            var userId = _userManager.GetUserId(User) ?? "";
            await _safetyService.CreatePermitAsync(permit, userId);
            return Ok(new { message = "Permit created" });
        }

        [HttpPatch("permits/{id}/status")]
        public async Task<ActionResult> UpdatePermitStatus(int id, [FromBody] UpdatePermitStatusRequest request)
        {
            var userId = _userManager.GetUserId(User) ?? "";
            await _safetyService.UpdatePermitStatusAsync(id, request.Status, request.ClosureNotes ?? "", userId);
            return Ok(new { message = "Permit status updated" });
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult> GetSafetyDashboard()
        {
            var stats = await _safetyService.GetDashboardStatsAsync();
            return Ok(stats);
        }
    }

    public class UpdatePermitStatusRequest
    {
        public PermitStatus Status { get; set; }
        public string? ClosureNotes { get; set; }
    }
}

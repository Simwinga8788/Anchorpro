using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using AnchorPro.Data;
using AnchorPro.Services.Interfaces;

namespace AnchorPro.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CopilotController : ControllerBase
    {
        private readonly ICopilotService _copilotService;
        private readonly ICurrentTenantService _currentTenantService;
        private readonly UserManager<ApplicationUser> _userManager;

        public CopilotController(ICopilotService copilotService, ICurrentTenantService currentTenantService, UserManager<ApplicationUser> userManager)
        {
            _copilotService = copilotService;
            _currentTenantService = currentTenantService;
            _userManager = userManager;
        }

        public class ChatRequest
        {
            public string Message { get; set; } = string.Empty;
            public string? AudioData { get; set; } // Base64 encoded audio
            public string? AudioMimeType { get; set; } // e.g. "audio/webm"
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message) && string.IsNullOrWhiteSpace(request.AudioData))
            {
                return BadRequest("Message or audio must be provided.");
            }

            var userId = _userManager.GetUserId(User);
            var userName = User.Identity?.Name ?? User.Claims.FirstOrDefault(c => c.Type == "name" || c.Type == "FullName")?.Value ?? "Authenticated User";
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found.");
            }

            var tenantId = _currentTenantService.TenantId ?? 0;
            var isPlatformOwner = User.IsInRole("Admin") && !User.HasClaim(c => c.Type == "TenantId");
            if (tenantId == 0 && !isPlatformOwner)
            {
                return BadRequest("No active tenant found.");
            }

            var userRoles = User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();

            var result = await _copilotService.ProcessMessageAsync(request.Message, request.AudioData, request.AudioMimeType, userId, userName, tenantId, userRoles);

            return Ok(new
            {
                reply = result.Reply,
                action = result.Action,
                route = result.Route
            });
        }
    }
}

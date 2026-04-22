using AnchorPro.Services;
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
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;
        private readonly IDemoDataService _demoDataService;
        private readonly UserManager<ApplicationUser> _userManager;

        public SettingsController(
            ISettingsService settingsService,
            IDemoDataService demoDataService,
            UserManager<ApplicationUser> userManager)
        {
            _settingsService = settingsService;
            _demoDataService = demoDataService;
            _userManager = userManager;
        }

        // ─── Tenant Settings ────────────────────────────────────────────

        [HttpGet]
        public async Task<ActionResult> GetAllSettings()
        {
            var settings = await _settingsService.GetAllSettingsAsync();
            return Ok(settings);
        }

        [HttpGet("{key}")]
        public async Task<ActionResult> GetSetting(string key, [FromQuery] string defaultValue = "")
        {
            var value = await _settingsService.GetSettingAsync(key, defaultValue);
            return Ok(new { key, value });
        }

        [HttpPut("{key}")]
        public async Task<ActionResult> SetSetting(string key, [FromBody] SetSettingRequest request)
        {
            await _settingsService.SetSettingAsync(key, request.Value, request.Description ?? "", request.Group ?? "General");
            return Ok(new { message = "Setting saved" });
        }

        // ─── Demo Data Seeder ───────────────────────────────────────────

        [HttpPost("seed-demo")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> SeedDemoData()
        {
            var userId = _userManager.GetUserId(User) ?? "";
            try
            {
                await _demoDataService.GenerateDemoDataAsync(userId);
                return Ok(new { message = "Demo data generated successfully. Refresh your dashboard to see the results." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ─── Global / Platform Settings ─────────────────────────────────

        [HttpGet("global")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> GetGlobalSettings()
        {
            var settings = await _settingsService.GetGlobalSettingsAsync();
            return Ok(settings);
        }

        [HttpPut("global/{key}")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> SetGlobalSetting(string key, [FromBody] SetSettingRequest request)
        {
            await _settingsService.SetGlobalSettingAsync(key, request.Value, request.Description ?? "", request.Group ?? "Platform");
            return Ok(new { message = "Global setting saved" });
        }
    }

    public class SetSettingRequest
    {
        public string Value { get; set; } = "";
        public string? Description { get; set; }
        public string? Group { get; set; }
    }
}

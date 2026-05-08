using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Tenant and global system settings management.
    /// Tenant-level endpoints require Admin role; Global endpoints require PlatformOwner role.
    /// </summary>
    [Route("api/settings")]
    [ApiController]
    [Authorize(Roles = "Admin,PlatformOwner")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;

        public SettingsController(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        // ── TENANT SETTINGS ───────────────────────────────────────────────────

        /// <summary>
        /// GET /api/settings — All settings for the current tenant.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<SystemSetting>>> GetAll()
            => Ok(await _settingsService.GetAllSettingsAsync());

        /// <summary>
        /// GET /api/settings/{key} — Get a single setting by key.
        /// Example keys: "Notify.JobCompletion", "Invoice.DefaultTaxRate"
        /// </summary>
        [HttpGet("{key}")]
        public async Task<ActionResult<string>> GetByKey(string key)
        {
            var value = await _settingsService.GetSettingAsync(key);
            return Ok(new { key, value });
        }

        /// <summary>
        /// PUT /api/settings/{key} — Create or update a tenant-level setting.
        /// Body: { "value": "true", "description": "Send email when job completes", "group": "Notifications" }
        /// </summary>
        [HttpPut("{key}")]
        public async Task<ActionResult> Upsert(string key, [FromBody] UpsertSettingRequest req)
        {
            await _settingsService.SetSettingAsync(key, req.Value, req.Description, req.Group);
            return NoContent();
        }

        // ── GLOBAL / PLATFORM SETTINGS ────────────────────────────────────────

        /// <summary>
        /// GET /api/settings/global — All platform-level settings (PlatformOwner only).
        /// </summary>
        [HttpGet("global")]
        [Authorize(Roles = "PlatformOwner")]
        public async Task<ActionResult<List<SystemSetting>>> GetGlobal()
            => Ok(await _settingsService.GetGlobalSettingsAsync());

        /// <summary>
        /// GET /api/settings/global/{key}
        /// </summary>
        [HttpGet("global/{key}")]
        [Authorize(Roles = "PlatformOwner")]
        public async Task<ActionResult> GetGlobalByKey(string key)
        {
            var value = await _settingsService.GetGlobalSettingAsync(key);
            return Ok(new { key, value });
        }

        /// <summary>
        /// PUT /api/settings/global/{key} — Create or update a platform-level setting (PlatformOwner only).
        /// Body: { "value": "...", "description": "...", "group": "Platform" }
        /// </summary>
        [HttpPut("global/{key}")]
        [Authorize(Roles = "PlatformOwner")]
        public async Task<ActionResult> UpsertGlobal(string key, [FromBody] UpsertSettingRequest req)
        {
            await _settingsService.SetGlobalSettingAsync(key, req.Value, req.Description, req.Group);
            return NoContent();
        }
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public class UpsertSettingRequest
    {
        public string Value { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Group { get; set; } = "General";
    }
}

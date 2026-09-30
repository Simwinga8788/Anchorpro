using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Tenant and global system settings management.
    /// Tenant-level endpoints require Admin role; Global endpoints require PlatformOwner role.
    /// </summary>
    [Route("api/settings")]
    [ApiController]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public SettingsController(
            ISettingsService settingsService,
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _settingsService = settingsService;
            _context = context;
            _userManager = userManager;
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
        [Authorize(Roles = "Admin,PlatformOwner")]
        public async Task<ActionResult> Upsert(string key, [FromBody] UpsertSettingRequest req)
        {
            await _settingsService.SetSettingAsync(key, req.Value ?? string.Empty, req.Description ?? string.Empty, req.Group ?? "General");
            return NoContent();
        }

        /// <summary>
        /// PUT /api/settings/my-tenant — Update current tenant's profile (e.g. Logo, Name).
        /// </summary>
        [HttpPut("my-tenant")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateMyTenant([FromBody] UpdateMyTenantRequest req)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null || !user.TenantId.HasValue) return Unauthorized();

            _context.IgnoreTenantFilter = true;
            var tenant = await _context.Tenants.FindAsync(user.TenantId.Value);
            if (tenant == null) return NotFound();

            tenant.Name = req.Name;
            tenant.LogoUrl = req.LogoUrl;
            tenant.Address = req.Address;
            tenant.ContactEmail = req.ContactEmail;
            tenant.ContactPhone = req.ContactPhone;
            tenant.UpdatedAt = DateTime.UtcNow;
            tenant.UpdatedBy = user.Id;

            await _context.SaveChangesAsync();
            return Ok(tenant);
        }

        /// <summary>
        /// DELETE /api/settings/my-tenant — Soft-delete (deactivate) current tenant's workspace.
        /// </summary>
        [HttpDelete("my-tenant")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteMyTenant()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null || !user.TenantId.HasValue) return Unauthorized();

            _context.IgnoreTenantFilter = true;
            var tenant = await _context.Tenants.FindAsync(user.TenantId.Value);
            if (tenant == null) return NotFound();

            tenant.IsActive = false;
            tenant.UpdatedAt = DateTime.UtcNow;
            tenant.UpdatedBy = user.Id;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ── GLOBAL / PLATFORM SETTINGS ────────────────────────────────────────

        /// <summary>
        /// GET /api/settings/global — All platform-level settings (PlatformOwner only).
        /// </summary>
        [HttpGet("global")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult<List<SystemSetting>>> GetGlobal()
            => Ok(await _settingsService.GetGlobalSettingsAsync());

        /// <summary>
        /// GET /api/settings/global/{key}
        /// </summary>
        [HttpGet("global/{**key}")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult<string>> GetGlobalByKey(string key)
        {
            var value = await _settingsService.GetGlobalSettingAsync(key);
            return Ok(new { key, value });
        }

        /// <summary>
        /// PUT /api/settings/global/{key} — Create or update a platform-level setting (PlatformOwner only).
        /// Body: { "value": "...", "description": "...", "group": "Platform" }
        /// </summary>
        [HttpPut("global/{**key}")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> UpsertGlobal(string key, [FromBody] UpsertSettingRequest req)
        {
            await _settingsService.SetGlobalSettingAsync(key, req.Value ?? string.Empty, req.Description ?? string.Empty, req.Group ?? "General");
            return NoContent();
        }

        /// <summary>
        /// POST /api/settings/test-email — Send a test email to verify SMTP configuration.
        /// </summary>
        [HttpPost("test-email")]
        [Authorize]
        public async Task<ActionResult> SendTestEmail([FromBody] SendTestEmailRequest req, [FromServices] IEmailService emailService)
        {
            if (string.IsNullOrWhiteSpace(req.ToEmail))
            {
                return BadRequest("Recipient email address is required.");
            }

            var subject = req.Subject ?? "Anchor Pro — Test Email Notification";
            var body = req.Body ?? $"<h3>Anchor Pro Test Email</h3><p>This is a test notification sent at {DateTime.UtcNow:u}. Your email notifications are functioning properly!</p>";

            await emailService.SendEmailAsync(req.ToEmail, subject, body);
            return Ok(new { message = $"Test email queued/sent to {req.ToEmail}" });
        }
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public class UpsertSettingRequest
    {
        public string? Value { get; set; }
        public string? Description { get; set; } = string.Empty;
        public string? Group { get; set; } = "General";
    }

    public class UpdateMyTenantRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Address { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class SendTestEmailRequest
    {
        public string ToEmail { get; set; } = string.Empty;
        public string? Subject { get; set; }
        public string? Body { get; set; }
    }
}

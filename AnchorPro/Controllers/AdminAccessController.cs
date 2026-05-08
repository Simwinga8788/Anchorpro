using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using AnchorPro.Data.Entities;
using AnchorPro.Data;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Platform Owner impersonation — allows a PO to sign in AS a tenant admin
    /// without knowing their password, with a full audit trail.
    /// LOCKED TO PlatformOwner ONLY. Any other role receives 403.
    /// </summary>
    [Route("api/admin-access")]
    [ApiController]
    public class AdminAccessController : ControllerBase
    {
        // Session key used to remember the original PO identity during impersonation
        private const string ImpersonatorSessionKey = "ImpersonatorEmail";

        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public AdminAccessController(
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _context = context;
        }

        // ── IMPERSONATION ─────────────────────────────────────────────────────

        /// <summary>
        /// POST /api/admin-access/impersonate/{tenantId}
        /// Platform Owner signs in AS the admin of the specified tenant.
        /// The original PO email is stored in session so they can exit later.
        /// RESTRICTED: PlatformOwner only (TenantId == null AND role == Admin).
        /// </summary>
        [HttpPost("impersonate/{tenantId}")]
        [Authorize]
        public async Task<IActionResult> ImpersonateTenant(int tenantId)
        {
            // ── Guard: Must be a Platform Owner ──────────────────────────────
            var currentUser = await _userManager.GetUserAsync(User);
            if (currentUser == null)
                return Unauthorized();

            var currentRoles = await _userManager.GetRolesAsync(currentUser);
            var isPlatformOwner = currentUser.TenantId == null && currentRoles.Contains("Admin");

            if (!isPlatformOwner)
                return StatusCode(403, new { message = "Only Platform Owners can impersonate tenants." });

            // ── Guard: Cannot impersonate while already impersonating ─────────
            if (HttpContext.Session.GetString(ImpersonatorSessionKey) != null)
                return BadRequest(new { message = "Already in an impersonation session. Exit first via POST /api/admin-access/exit-impersonation." });

            // ── Find the tenant's admin user ──────────────────────────────────
            var tenantUsers = await _context.Users
                .Where(u => u.TenantId == tenantId)
                .OrderBy(u => u.CreatedAt)
                .ToListAsync();

            ApplicationUser? targetUser = null;
            foreach (var u in tenantUsers)
            {
                var roles = await _userManager.GetRolesAsync(u);
                if (roles.Contains("Admin"))
                {
                    targetUser = u;
                    break;
                }
            }

            // Fall back to first user if no explicit Admin found
            targetUser ??= tenantUsers.FirstOrDefault();

            if (targetUser == null)
                return NotFound(new { message = $"No users found for tenant {tenantId}." });

            // ── Store PO identity in session (for exit) ───────────────────────
            HttpContext.Session.SetString(ImpersonatorSessionKey, currentUser.Email!);

            // ── Write Audit Log ───────────────────────────────────────────────
            _context.SystemAuditLogs.Add(new SystemAuditLog
            {
                Action = "Impersonation.Start",
                Module = "Security",
                ChangedBy = currentUser.Email!,
                OldValue = $"PlatformOwner:{currentUser.Email}",
                NewValue = $"Impersonating:{targetUser.Email} (Tenant:{tenantId})",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                Timestamp = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = currentUser.Email!
            });
            await _context.SaveChangesAsync();

            // ── Perform session switch WITHOUT signing out the PO ─────────────
            // We do NOT call SignOutAsync — the PO session is preserved in the
            // ImpersonatorSessionKey. We just sign in the target user on top.
            await _signInManager.SignInAsync(targetUser, isPersistent: false);

            return Ok(new
            {
                message = $"Now impersonating {targetUser.Email} (Tenant {tenantId}). Use POST /api/admin-access/exit-impersonation to return.",
                impersonating = targetUser.Email,
                tenantId
            });
        }

        /// <summary>
        /// POST /api/admin-access/exit-impersonation
        /// Returns the Platform Owner back to their own session.
        /// Fails gracefully if not currently in an impersonation session.
        /// </summary>
        [HttpPost("exit-impersonation")]
        [Authorize]
        public async Task<IActionResult> ExitImpersonation()
        {
            var impersonatorEmail = HttpContext.Session.GetString(ImpersonatorSessionKey);

            if (string.IsNullOrEmpty(impersonatorEmail))
                return BadRequest(new { message = "Not currently in an impersonation session." });

            // ── Find the original PO ──────────────────────────────────────────
            var originalUser = await _userManager.FindByEmailAsync(impersonatorEmail);
            if (originalUser == null)
                return NotFound(new { message = "Original Platform Owner account not found." });

            // ── Get current (impersonated) user for audit ─────────────────────
            var currentUser = await _userManager.GetUserAsync(User);

            // ── Write Exit Audit Log ──────────────────────────────────────────
            _context.SystemAuditLogs.Add(new SystemAuditLog
            {
                Action = "Impersonation.Exit",
                Module = "Security",
                ChangedBy = impersonatorEmail,
                OldValue = $"Impersonating:{currentUser?.Email}",
                NewValue = $"Restored:{impersonatorEmail}",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                Timestamp = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = impersonatorEmail
            });
            await _context.SaveChangesAsync();

            // ── Clear session key and restore PO session ──────────────────────
            HttpContext.Session.Remove(ImpersonatorSessionKey);
            await _signInManager.SignInAsync(originalUser, isPersistent: false);

            return Ok(new
            {
                message = $"Session restored. You are now signed in as {originalUser.Email}.",
                email = originalUser.Email
            });
        }

        /// <summary>
        /// GET /api/admin-access/impersonation-status
        /// Returns whether the current session is an impersonation session and who the original PO is.
        /// </summary>
        [HttpGet("impersonation-status")]
        [Authorize]
        public IActionResult GetStatus()
        {
            var impersonatorEmail = HttpContext.Session.GetString(ImpersonatorSessionKey);
            var isImpersonating = !string.IsNullOrEmpty(impersonatorEmail);

            return Ok(new
            {
                isImpersonating,
                originalPlatformOwner = isImpersonating ? impersonatorEmail : null,
                currentUser = User.Identity?.Name
            });
        }

        // ── TENANT LISTING (PlatformOwner read-only) ──────────────────────────

        /// <summary>
        /// GET /api/admin-access/tenants — All tenants on the platform (PO only).
        /// Useful to find the tenantId to impersonate.
        /// </summary>
        [HttpGet("tenants")]
        [Authorize]
        public async Task<IActionResult> GetAllTenants()
        {
            var currentUser = await _userManager.GetUserAsync(User);
            var currentRoles = await _userManager.GetRolesAsync(currentUser!);
            if (currentUser?.TenantId != null || !currentRoles.Contains("Admin"))
                return StatusCode(403, new { message = "Platform Owner access required." });

            _context.IgnoreTenantFilter = true;
            var tenants = await _context.Tenants
                .OrderBy(t => t.Name)
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.ContactEmail,
                    t.ContactPhone,
                    t.IsActive,
                    t.CreatedAt
                })
                .ToListAsync();

            return Ok(tenants);
        }
    }
}

using AnchorPro.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AnchorPro.Data.Entities;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Read-only access to the SystemAuditLog table.
    /// Admins see their own tenant's logs. PlatformOwners see all logs.
    /// </summary>
    [Route("api/audit-log")]
    [ApiController]
    [Authorize(Roles = "Admin,PlatformOwner")]
    public class AuditLogController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public AuditLogController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        /// <summary>
        /// GET /api/audit-log?module=Security&amp;days=30&amp;page=1&amp;pageSize=50
        /// Returns paginated audit log entries. PlatformOwner sees all; Admin sees their tenant's.
        /// Filterable by module (Security, Billing, Integration) and time window.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult> GetLogs(
            [FromQuery] string? module = null,
            [FromQuery] int days = 30,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var user = await _userManager.GetUserAsync(User);
            var roles = await _userManager.GetRolesAsync(user!);
            var isPlatformOwner = user?.TenantId == null && roles.Contains("Admin");

            if (isPlatformOwner)
                _context.IgnoreTenantFilter = true;

            var cutoff = DateTime.UtcNow.AddDays(-days);

            var query = _context.SystemAuditLogs
                .Where(l => l.Timestamp >= cutoff);

            if (!string.IsNullOrEmpty(module))
                query = query.Where(l => l.Module == module);

            var total = await query.CountAsync();
            var logs = await query
                .OrderByDescending(l => l.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new
                {
                    l.Id,
                    l.Action,
                    l.Module,
                    l.ChangedBy,
                    l.OldValue,
                    l.NewValue,
                    l.IpAddress,
                    l.Timestamp
                })
                .ToListAsync();

            return Ok(new
            {
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize),
                logs
            });
        }

        /// <summary>
        /// GET /api/audit-log/security — Security-only audit entries (impersonation, login, role changes).
        /// Quick shortcut filtered to Module == "Security".
        /// </summary>
        [HttpGet("security")]
        public async Task<ActionResult> GetSecurityLogs([FromQuery] int days = 90)
        {
            var user = await _userManager.GetUserAsync(User);
            var roles = await _userManager.GetRolesAsync(user!);
            if (user?.TenantId == null && roles.Contains("Admin"))
                _context.IgnoreTenantFilter = true;

            var cutoff = DateTime.UtcNow.AddDays(-days);

            var logs = await _context.SystemAuditLogs
                .Where(l => l.Module == "Security" && l.Timestamp >= cutoff)
                .OrderByDescending(l => l.Timestamp)
                .Take(200)
                .Select(l => new
                {
                    l.Id,
                    l.Action,
                    l.ChangedBy,
                    l.OldValue,
                    l.NewValue,
                    l.IpAddress,
                    l.Timestamp
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}

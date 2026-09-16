using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RolesController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _db;
        private readonly ICurrentTenantService _tenantService;

        // The built-in roles that cannot be deleted
        private readonly string[] _systemRoles = new[] { 
            "Admin", "Supervisor", "Planner", "Technician", 
            "Purchasing", "Storeman", "HR", "Finance", "PlatformOwner" 
        };

        public RolesController(
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext db,
            ICurrentTenantService tenantService)
        {
            _roleManager = roleManager;
            _db = db;
            _tenantService = tenantService;
        }

        /// <summary>
        /// Gets all system roles + any custom roles defined by the tenant,
        /// along with their configured allowed routes.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult> GetAllRoles()
        {
            var tenantId = _tenantService.TenantId;

            // Get permissions defined by this tenant
            var permissions = await _db.TenantRolePermissions
                .Where(p => p.TenantId == tenantId)
                .ToListAsync();

            var permissionDict = permissions.ToDictionary(p => p.RoleName, p => p);

            // Get all roles currently in the database
            var allDbRoles = await _roleManager.Roles.Select(r => r.Name).ToListAsync();

            var result = new List<object>();

            // 1. Add System Roles
            foreach (var sysRole in _systemRoles)
            {
                if (sysRole == "PlatformOwner") continue; // Hide platform owner

                var allowed = new List<string>();
                if (permissionDict.TryGetValue(sysRole, out var p))
                {
                    allowed = JsonSerializer.Deserialize<List<string>>(p.AllowedRoutesJson) ?? new List<string>();
                }
                else
                {
                    // Fallback defaults for system roles if not configured
                    allowed = GetDefaultRoutesForRole(sysRole);
                }

                result.Add(new
                {
                    id = sysRole,
                    name = sysRole,
                    isSystemRole = true,
                    allowedRoutes = allowed
                });
            }

            // 2. Add Custom Roles created by this tenant
            var customRoles = permissionDict.Keys.Where(k => !_systemRoles.Contains(k)).ToList();
            foreach (var customRole in customRoles)
            {
                var p = permissionDict[customRole];
                var allowed = JsonSerializer.Deserialize<List<string>>(p.AllowedRoutesJson) ?? new List<string>();

                result.Add(new
                {
                    id = customRole,
                    name = customRole,
                    isSystemRole = false,
                    allowedRoutes = allowed
                });
            }

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult> CreateRole([FromBody] CreateRoleRequest req)
        {
            var tenantId = _tenantService.TenantId;
            if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Role name is required.");

            // 1. Ensure IdentityRole exists globally
            if (!await _roleManager.RoleExistsAsync(req.Name))
            {
                await _roleManager.CreateAsync(new IdentityRole(req.Name));
            }

            // 2. Save tenant-specific permission
            var existingPerm = await _db.TenantRolePermissions
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.RoleName == req.Name);

            if (existingPerm != null)
            {
                return BadRequest("This role is already configured for your workspace.");
            }

            var perm = new TenantRolePermission
            {
                RoleName = req.Name,
                AllowedRoutesJson = JsonSerializer.Serialize(req.AllowedRoutes),
                TenantId = tenantId
            };
            _db.TenantRolePermissions.Add(perm);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Role created." });
        }

        [HttpPut("{roleName}")]
        public async Task<ActionResult> UpdateRolePermissions(string roleName, [FromBody] UpdateRoleRequest req)
        {
            var tenantId = _tenantService.TenantId;

            var perm = await _db.TenantRolePermissions
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.RoleName == roleName);

            if (perm == null)
            {
                // Create it if it doesn't exist (e.g., they are customizing a system role for the first time)
                perm = new TenantRolePermission
                {
                    RoleName = roleName,
                    TenantId = tenantId
                };
                _db.TenantRolePermissions.Add(perm);
            }

            perm.AllowedRoutesJson = JsonSerializer.Serialize(req.AllowedRoutes);
            await _db.SaveChangesAsync();

            return Ok();
        }

        /// <summary>
        /// POST /api/roles/sync-defaults
        /// Patches any existing TenantRolePermission records so that routes
        /// present in the current hard-coded defaults but missing from the
        /// stored JSON are automatically added.  Safe to call repeatedly.
        /// </summary>
        [HttpPost("sync-defaults")]
        public async Task<ActionResult> SyncRoleDefaults()
        {
            var tenantId = _tenantService.TenantId;

            var perms = await _db.TenantRolePermissions
                .Where(p => p.TenantId == tenantId)
                .ToListAsync();

            bool anyChanged = false;

            foreach (var perm in perms)
            {
                var current = JsonSerializer.Deserialize<List<string>>(perm.AllowedRoutesJson) ?? new();
                var defaults = GetDefaultRoutesForRole(perm.RoleName);

                var missing = defaults.Where(d => !current.Contains(d)).ToList();
                if (missing.Count > 0)
                {
                    current.AddRange(missing);
                    perm.AllowedRoutesJson = JsonSerializer.Serialize(current);
                    anyChanged = true;
                }
            }

            if (anyChanged)
                await _db.SaveChangesAsync();

            return Ok(new { message = "Role permissions synced with current defaults.", anyChanged });
        }

        [HttpDelete("{roleName}")]
        public async Task<ActionResult> DeleteRole(string roleName)
        {
            if (_systemRoles.Contains(roleName))
            {
                return BadRequest("Cannot delete system roles.");
            }

            var tenantId = _tenantService.TenantId;
            var perm = await _db.TenantRolePermissions
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.RoleName == roleName);

            if (perm != null)
            {
                _db.TenantRolePermissions.Remove(perm);
                await _db.SaveChangesAsync();
            }

            // Note: We do not delete the global IdentityRole because other tenants might be using it.
            // By deleting the TenantRolePermission, we remove it from THIS tenant's workspace.

            return NoContent();
        }

        // Single source of truth lives in Services/DefaultRolePermissions.cs — also used by
        // AuthController as the fallback a brand-new tenant gets on login before anyone has
        // visited this page (which is what persists a TenantRolePermission row per role).
        private List<string> GetDefaultRoutesForRole(string roleName) => AnchorPro.Services.DefaultRolePermissions.GetDefaultRoutes(roleName);
    }

    public class CreateRoleRequest
    {
        public string Name { get; set; } = string.Empty;
        public List<string> AllowedRoutes { get; set; } = new List<string>();
    }

    public class UpdateRoleRequest
    {
        public List<string> AllowedRoutes { get; set; } = new List<string>();
    }
}

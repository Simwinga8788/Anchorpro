using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Tenant-scoped user management. Mirrors the logic in AdminUsers.razor.
    /// Requires Admin role.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ICurrentTenantService _tenantService;

        public UsersController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ICurrentTenantService tenantService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _tenantService = tenantService;
        }

        /// <summary>
        /// GET /api/users/me — Returns the currently authenticated user's profile.
        /// Safe for all roles — no admin required.
        /// </summary>
        [HttpGet("me")]
        [AllowAnonymous]
        public async Task<ActionResult> GetMe()
        {
            if (User.Identity?.IsAuthenticated != true)
                return Unauthorized(new { message = "Not logged in." });

            var user = await _userManager.FindByNameAsync(User.Identity.Name!);
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.EmployeeNumber,
                user.DepartmentId,
                user.HourlyRate,
                user.TenantId,
                user.CreatedAt,
                Role = roles.FirstOrDefault() ?? "No Role"
            });
        }

        /// <summary>
        /// GET /api/users — All users for the current tenant (excludes Platform Owner).
        /// Returns user list with their assigned role.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<object>>> GetAll()
        {
            var tenantId = _tenantService.TenantId;
            var users = _userManager.Users
                .Where(u => u.TenantId == tenantId)
                .OrderByDescending(u => u.CreatedAt)
                .ToList();

            var result = new List<object>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                result.Add(new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.EmployeeNumber,
                    user.DepartmentId,
                    user.HourlyRate,
                    user.TenantId,
                    user.CreatedAt,
                    Role = roles.FirstOrDefault() ?? "No Role"
                });
            }

            return Ok(result);
        }

        /// <summary>GET /api/users/{id}</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.EmployeeNumber,
                user.DepartmentId,
                user.HourlyRate,
                user.TenantId,
                user.CreatedAt,
                Role = roles.FirstOrDefault() ?? "No Role"
            });
        }

        /// <summary>
        /// POST /api/users — Create a new user within the current tenant.
        /// Body: { "email": "...", "firstName": "...", "lastName": "...", "employeeNumber": "...", "password": "...", "role": "Technician", "hourlyRate": 450 }
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CreateUserRequest req)
        {
            var tenantId = _tenantService.TenantId;

            var user = new ApplicationUser
            {
                UserName = req.Email,
                Email = req.Email,
                FirstName = req.FirstName,
                LastName = req.LastName,
                EmployeeNumber = req.EmployeeNumber,
                HourlyRate = req.HourlyRate,
                TenantId = tenantId,
                DepartmentId = req.DepartmentId,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = User.Identity?.Name ?? "API_User"
            };

            var result = await _userManager.CreateAsync(user, req.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            if (!string.IsNullOrWhiteSpace(req.Role))
            {
                if (!await _roleManager.RoleExistsAsync(req.Role))
                    return BadRequest($"Role '{req.Role}' does not exist.");
                await _userManager.AddToRoleAsync(user, req.Role);
            }

            return CreatedAtAction(nameof(GetById), new { id = user.Id }, new { user.Id, user.Email });
        }

        /// <summary>
        /// PUT /api/users/{id} — Update user profile and/or role.
        /// Body: { "firstName": "...", "lastName": "...", "employeeNumber": "...", "role": "Supervisor", "hourlyRate": 500, "departmentId": 2 }
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(string id, [FromBody] UpdateUserRequest req)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            user.FirstName = req.FirstName;
            user.LastName = req.LastName;
            user.EmployeeNumber = req.EmployeeNumber;
            user.HourlyRate = req.HourlyRate;
            user.DepartmentId = req.DepartmentId;
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedBy = User.Identity?.Name ?? "API_User";

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return BadRequest(updateResult.Errors.Select(e => e.Description));

            // Update role if provided
            if (!string.IsNullOrWhiteSpace(req.Role))
            {
                var currentRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!await _roleManager.RoleExistsAsync(req.Role))
                    return BadRequest($"Role '{req.Role}' does not exist.");
                await _userManager.AddToRoleAsync(user, req.Role);
            }

            return NoContent();
        }

        /// <summary>DELETE /api/users/{id} — Remove a user from the tenant.</summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            return NoContent();
        }

        /// <summary>
        /// POST /api/users/{id}/change-password
        /// Body: { "newPassword": "..." }
        /// Admin override — no current password required.
        /// </summary>
        [HttpPost("{id}/change-password")]
        public async Task<ActionResult> ChangePassword(string id, [FromBody] ChangePasswordRequest req)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, req.NewPassword);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            return NoContent();
        }

        /// <summary>
        /// PATCH /api/users/{id}/deactivate
        /// Locks out a user indefinitely.
        /// </summary>
        [HttpPatch("{id}/deactivate")]
        public async Task<ActionResult> DeactivateUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            await _userManager.SetLockoutEnabledAsync(user, true);
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
            return NoContent();
        }

        /// <summary>
        /// PATCH /api/users/{id}/activate
        /// Removes the lockout from a user.
        /// </summary>
        [HttpPatch("{id}/activate")]
        public async Task<ActionResult> ActivateUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            await _userManager.SetLockoutEndDateAsync(user, null);
            return NoContent();
        }
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public class CreateUserRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? EmployeeNumber { get; set; }
        public string? Role { get; set; }
        public decimal HourlyRate { get; set; } = 450;
        public int? DepartmentId { get; set; }
    }

    public class UpdateUserRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? EmployeeNumber { get; set; }
        public string? Role { get; set; }
        public decimal HourlyRate { get; set; }
        public int? DepartmentId { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string NewPassword { get; set; } = string.Empty;
    }
}

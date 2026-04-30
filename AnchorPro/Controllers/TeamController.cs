using AnchorPro.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [Route("api/team")]
    [ApiController]
    [Authorize]
    public class TeamController : ControllerBase
    {
        private readonly UserManager<AnchorPro.Data.ApplicationUser> _userManager;
        private readonly ApplicationDbContext _db;

        private static readonly HashSet<string> PlatformRoles =
            new(StringComparer.OrdinalIgnoreCase) { "PlatformOwner", "PlatformAdmin" };

        public TeamController(UserManager<AnchorPro.Data.ApplicationUser> userManager, ApplicationDbContext db)
        {
            _userManager = userManager;
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetTeam()
        {
            var caller = await _userManager.GetUserAsync(User);
            if (caller == null) return Unauthorized();

            // Require caller to have a tenant — platform owners can't use this endpoint
            if (!caller.TenantId.HasValue) return Forbid();

            // Pre-filter at DB level: only fetch users explicitly in this tenant
            var allUsers = await _db.Users
                .AsNoTracking()
                .Where(u => u.TenantId == caller.TenantId)
                .ToListAsync();

            var result = new List<object>();
            foreach (var u in allUsers)
            {
                var roles = await _userManager.GetRolesAsync(u);
                // Skip users who only have platform-level roles
                if (roles.Any() && roles.All(r => PlatformRoles.Contains(r))) continue;

                result.Add(new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.EmployeeNumber,
                    u.HourlyRate,
                    u.TenantId,
                    u.DepartmentId,
                    isActive = u.LockoutEnd == null || u.LockoutEnd < DateTimeOffset.UtcNow,
                    roles,
                });
            }
            return Ok(result);
        }

        [HttpPost("invite")]
        [Authorize(Roles = "Admin,PlatformOwner,PlatformAdmin")]
        public async Task<IActionResult> Invite([FromBody] InviteRequest req)
        {
            var caller = await _userManager.GetUserAsync(User);
            if (caller == null) return Unauthorized();

            if (req.Role != null && PlatformRoles.Contains(req.Role))
                return BadRequest(new { message = "Cannot assign platform-level roles via this endpoint." });

            var user = new AnchorPro.Data.ApplicationUser
            {
                UserName = req.Email,
                Email = req.Email,
                FirstName = req.FirstName,
                LastName = req.LastName,
                EmployeeNumber = req.EmployeeNumber,
                HourlyRate = req.HourlyRate ?? 450m,
                TenantId = caller.TenantId,
                DepartmentId = req.DepartmentId,
                CreatedBy = caller.Id,
            };

            var result = await _userManager.CreateAsync(user, req.Password ?? "Anchor@1234!");
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });

            if (!string.IsNullOrEmpty(req.Role))
                await _userManager.AddToRoleAsync(user, req.Role);

            return Ok(new { message = "User created.", userId = user.Id });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,PlatformOwner,PlatformAdmin")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateMemberRequest req)
        {
            var caller = await _userManager.GetUserAsync(User);
            var member = await _userManager.FindByIdAsync(id);
            if (member == null) return NotFound();
            if (member.TenantId != caller?.TenantId) return Forbid();

            if (req.FirstName  != null) member.FirstName    = req.FirstName;
            if (req.LastName   != null) member.LastName     = req.LastName;
            if (req.EmployeeNumber != null) member.EmployeeNumber = req.EmployeeNumber;
            if (req.HourlyRate.HasValue) member.HourlyRate  = req.HourlyRate.Value;
            if (req.DepartmentId.HasValue) member.DepartmentId = req.DepartmentId.Value;
            member.UpdatedAt = DateTime.UtcNow;
            member.UpdatedBy = caller?.Id;

            await _userManager.UpdateAsync(member);

            if (!string.IsNullOrEmpty(req.Role) && !PlatformRoles.Contains(req.Role))
            {
                var currentRoles = await _userManager.GetRolesAsync(member);
                var nonPlatformRoles = currentRoles.Where(r => !PlatformRoles.Contains(r)).ToList();
                if (nonPlatformRoles.Any())
                    await _userManager.RemoveFromRolesAsync(member, nonPlatformRoles);
                await _userManager.AddToRoleAsync(member, req.Role);
            }

            return Ok(new { message = "Member updated." });
        }

        [HttpPost("{id}/deactivate")]
        [Authorize(Roles = "Admin,PlatformOwner,PlatformAdmin")]
        public async Task<IActionResult> Deactivate(string id)
        {
            var caller = await _userManager.GetUserAsync(User);
            var member = await _userManager.FindByIdAsync(id);
            if (member == null) return NotFound();
            if (member.TenantId != caller?.TenantId) return Forbid();
            if (member.Id == caller?.Id) return BadRequest(new { message = "Cannot deactivate yourself." });

            member.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
            member.LockoutEnabled = true;
            await _userManager.UpdateAsync(member);
            return Ok(new { message = "Member deactivated." });
        }

        [HttpPost("{id}/reactivate")]
        [Authorize(Roles = "Admin,PlatformOwner,PlatformAdmin")]
        public async Task<IActionResult> Reactivate(string id)
        {
            var caller = await _userManager.GetUserAsync(User);
            var member = await _userManager.FindByIdAsync(id);
            if (member == null) return NotFound();
            if (member.TenantId != caller?.TenantId) return Forbid();

            member.LockoutEnd = null;
            await _userManager.UpdateAsync(member);
            return Ok(new { message = "Member reactivated." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,PlatformOwner,PlatformAdmin")]
        public async Task<IActionResult> Delete(string id)
        {
            var caller = await _userManager.GetUserAsync(User);
            var member = await _userManager.FindByIdAsync(id);
            if (member == null) return NotFound();
            if (member.TenantId != caller?.TenantId) return Forbid();
            if (member.Id == caller?.Id) return BadRequest(new { message = "Cannot delete yourself." });

            var roles = await _userManager.GetRolesAsync(member);
            if (roles.Any(r => PlatformRoles.Contains(r)))
                return BadRequest(new { message = "Cannot delete platform users." });

            await _userManager.DeleteAsync(member);
            return Ok(new { message = "Member removed." });
        }

        public record InviteRequest(string Email, string? FirstName, string? LastName,
            string? EmployeeNumber, decimal? HourlyRate, string? Role, string? Password, int? DepartmentId);
        public record UpdateMemberRequest(string? FirstName, string? LastName,
            string? EmployeeNumber, decimal? HourlyRate, string? Role, int? DepartmentId);
    }
}

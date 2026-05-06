using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using AnchorPro.Data.Entities;
using AnchorPro.Data;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [Route("api/admin-access")]
    [ApiController]
    [Authorize(Roles = "Admin")] // Strict security: Only Platform Admins
    public class AdminAccessController : ControllerBase
    {
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

        [HttpGet("login-as/{tenantId}")]
        public async Task<IActionResult> LoginAsTenantAdmin(int tenantId)
        {
            // 1. Verify the current user is actually the Platform Owner
            var currentUser = await _userManager.GetUserAsync(User);
            if (currentUser == null || currentUser.TenantId != null) 
            {
                return StatusCode(403, $"Only Platform Owners can perform this action. Debug: User={currentUser?.Email}, TenantId={currentUser?.TenantId}");
            }

            // 2. Find the Admin user for the target tenant
            // We assume the first user created or a user with 'Admin' role is the target
            var targetTenantUser = await _context.Users
                .Where(u => u.TenantId == tenantId)
                .OrderBy(u => u.CreatedAt) // Usually the first user is the admin
                .FirstOrDefaultAsync();

            if (targetTenantUser == null)
            {
                return NotFound("No users found for this tenant.");
            }

            // 3. Security: Log the action (Future: Write to Audit Log table)
            Console.WriteLine($"[AUDIT] Platform Owner {currentUser.Email} logged in as {targetTenantUser.Email} for Tenant {tenantId}");

            // 4. Perform the switch
            await _signInManager.SignOutAsync(); // Logout Platform Owner
            await _signInManager.SignInAsync(targetTenantUser, isPersistent: false); // Login Tenant Admin

            // 5. Redirect to the main app
            return Redirect("/");
        }
    }
}

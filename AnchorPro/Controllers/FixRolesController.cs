using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using System.Threading.Tasks;
using System.Linq;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FixRolesController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _db;

        public FixRolesController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext db)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult> FixAll()
        {
            if (!await _roleManager.RoleExistsAsync("Admin"))
            {
                await _roleManager.CreateAsync(new IdentityRole("Admin"));
            }

            int fixedCount = 0;
            int permFixedCount = 0;
            var users = await _userManager.Users.ToListAsync();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Count == 0)
                {
                    await _userManager.AddToRoleAsync(user, "Admin");
                    fixedCount++;
                }
            }

            var emptyPerms = await _db.TenantRolePermissions.Where(p => p.AllowedRoutesJson == "[]").ToListAsync();
            foreach (var perm in emptyPerms)
            {
                _db.TenantRolePermissions.Remove(perm);
                permFixedCount++;
            }
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Fixed {fixedCount} users (missing roles) and deleted {permFixedCount} empty permissions." });
        }
    }
}

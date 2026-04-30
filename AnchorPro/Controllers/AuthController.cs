using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AnchorPro.Data;
using AnchorPro.Data.Entities;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IDbContextFactory<ApplicationDbContext> _dbFactory;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IDbContextFactory<ApplicationDbContext> dbFactory)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _dbFactory = dbFactory;
        }

        /// <summary>
        /// Self-service registration: creates a new Tenant and an Admin user in one step.
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CompanyName))
                return BadRequest(new { message = "Company name is required." });
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });
            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                return BadRequest(new { message = "Password must be at least 8 characters." });

            var existing = await _userManager.FindByEmailAsync(request.Email);
            if (existing != null)
                return Conflict(new { message = "An account with this email already exists." });

            await using var db = await _dbFactory.CreateDbContextAsync();
            db.IgnoreTenantFilter = true;
            await using var transaction = await db.Database.BeginTransactionAsync();
            try
            {
                // 1. Create tenant
                var tenant = new Tenant
                {
                    Name         = request.CompanyName.Trim(),
                    ContactEmail = request.Email.Trim(),
                    IsActive     = true,
                    CreatedAt    = DateTime.UtcNow,
                };
                db.Tenants.Add(tenant);
                await db.SaveChangesAsync();

                // 2. Create admin user
                var user = new ApplicationUser
                {
                    UserName       = request.Email.Trim(),
                    Email          = request.Email.Trim(),
                    FirstName      = request.FirstName?.Trim(),
                    LastName       = request.LastName?.Trim(),
                    TenantId       = tenant.Id,
                    CreatedAt      = DateTime.UtcNow,
                    EmailConfirmed = true,
                };

                var result = await _userManager.CreateAsync(user, request.Password);
                if (!result.Succeeded)
                {
                    await transaction.RollbackAsync();
                    var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                    return BadRequest(new { message = errors });
                }

                // 3. Assign Admin role
                await _userManager.AddToRoleAsync(user, "Admin");

                // 4. Set tenant owner
                tenant.OwnerId = user.Id;
                await db.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new { message = "Registration successful.", tenantId = tenant.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Registration failed. Please try again.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Returns the currently authenticated user's profile and roles.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserProfileDto>> GetMe()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var roles = await _userManager.GetRolesAsync(user);
            var isPlatformOwner = !user.TenantId.HasValue && roles.Contains("Admin");

            return Ok(new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles.ToList(),
                TenantId = user.TenantId,
                IsPlatformOwner = isPlatformOwner
            });
        }

        /// <summary>
        /// Login endpoint for the React frontend (cookie-based).
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null) return Unauthorized(new { message = "Invalid credentials" });

            var result = await _signInManager.PasswordSignInAsync(user, request.Password, true, lockoutOnFailure: true);
            if (!result.Succeeded)
                return Unauthorized(new { message = result.IsLockedOut ? "Account locked" : "Invalid credentials" });

            var roles = await _userManager.GetRolesAsync(user);
            var isPlatformOwner = !user.TenantId.HasValue && roles.Contains("Admin");

            return Ok(new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Roles = roles.ToList(),
                TenantId = user.TenantId,
                IsPlatformOwner = isPlatformOwner
            });
        }

        /// <summary>
        /// Logout endpoint.
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok();
        }
    }

    public record LoginRequest(string Email, string Password);

    public record RegisterRequest(
        string CompanyName,
        string Email,
        string Password,
        string? FirstName,
        string? LastName,
        string? Industry,
        string? Size,
        string? Timezone,
        int PlanId
    );

    public class UserProfileDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public List<string> Roles { get; set; } = [];
        public int? TenantId { get; set; }
        public bool IsPlatformOwner { get; set; }
    }
}

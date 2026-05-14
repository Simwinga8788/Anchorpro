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
        private readonly ApplicationDbContext _db;

        public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, ApplicationDbContext db)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _db = db;
        }

        /// <summary>
        /// Returns the currently authenticated user's profile and roles.
        /// Used by the React frontend to determine what to show.
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
        /// Login endpoint for the React frontend (cookie-based, same as Blazor).
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

        /// <summary>
        /// POST /api/auth/forgot-password
        /// Generates a password reset token and returns it in the response.
        /// In production wire this to send an email via IEmailService instead.
        /// Body: { "email": "user@example.com" }
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
        {
            // Always return OK to avoid user enumeration attacks
            var user = await _userManager.FindByEmailAsync(req.Email);
            if (user == null) return Ok(new { message = "If that email exists, a reset link has been sent." });

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // TODO: Replace with IEmailService.SendPasswordResetAsync(user.Email, token)
            // For now, return token directly (development only)
            return Ok(new
            {
                message = "Password reset token generated. Use POST /api/auth/reset-password with this token.",
                email = user.Email,
                resetToken = token   // REMOVE in production — send via email instead
            });
        }

        /// <summary>
        /// POST /api/auth/reset-password
        /// Resets a user's password using a token from forgot-password.
        /// Body: { "email": "user@example.com", "token": "...", "newPassword": "NewPass!123" }
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
        {
            var user = await _userManager.FindByEmailAsync(req.Email);
            if (user == null) return BadRequest(new { message = "Invalid request." });

            var result = await _userManager.ResetPasswordAsync(user, req.Token, req.NewPassword);
            if (!result.Succeeded)
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

            return Ok(new { message = "Password reset successfully. You may now log in." });
        }

        /// <summary>
        /// POST /api/auth/register
        /// Creates a new tenant + admin user. Used by the self-service registration page
        /// and by platform owners creating new tenants.
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult> Register([FromBody] RegisterRequest req)
        {
            // Check email not already taken
            if (await _userManager.FindByEmailAsync(req.Email) != null)
                return Conflict(new { message = "An account with that email already exists." });

            // Create tenant
            _db.IgnoreTenantFilter = true;
            var tenant = new Tenant
            {
                Name         = req.CompanyName,
                ContactEmail = req.Email,
                IsActive     = true,
            };
            _db.Set<Tenant>().Add(tenant);
            await _db.SaveChangesAsync();

            // Create admin user linked to the tenant
            var user = new ApplicationUser
            {
                UserName          = req.Email,
                Email             = req.Email,
                FirstName         = req.FirstName,
                LastName          = req.LastName,
                TenantId          = tenant.Id,
                EmailConfirmed    = true, // skip email confirmation for self-service
            };

            var createResult = await _userManager.CreateAsync(user, req.Password);
            if (!createResult.Succeeded)
            {
                _db.Set<Tenant>().Remove(tenant);
                await _db.SaveChangesAsync();
                return BadRequest(new { errors = createResult.Errors.Select(e => e.Description) });
            }

            await _userManager.AddToRoleAsync(user, "Admin");

            // Update tenant owner
            tenant.OwnerId = user.Id;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Account created successfully.", tenantId = tenant.Id });
        }
    }

    public record LoginRequest(string Email, string Password);
    public record ForgotPasswordRequest(string Email);
    public record ResetPasswordRequest(string Email, string Token, string NewPassword);
    public record RegisterRequest(string CompanyName, string Email, string Password, string FirstName, string LastName, string? Industry = null, string? Size = null, string? Timezone = null, int? PlanId = null);

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

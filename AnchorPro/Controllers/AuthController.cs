using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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

        public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
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
    }

    public record LoginRequest(string Email, string Password);

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

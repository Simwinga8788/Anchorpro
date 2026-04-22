using System.Security.Claims;
using AnchorPro.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace AnchorPro.Services
{
    public class AnchorUserClaimsPrincipalFactory : UserClaimsPrincipalFactory<ApplicationUser, IdentityRole>
    {
        public AnchorUserClaimsPrincipalFactory(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IOptions<IdentityOptions> options)
            : base(userManager, roleManager, options)
        {
        }

        protected override async Task<ClaimsIdentity> GenerateClaimsAsync(ApplicationUser user)
        {
            var identity = await base.GenerateClaimsAsync(user);

            if (user.TenantId.HasValue && !string.Equals(user.Email, "simwinga8788@gmail.com", StringComparison.OrdinalIgnoreCase))
            {
                identity.AddClaim(new Claim("TenantId", user.TenantId.Value.ToString()));
            }

            return identity;
        }
    }
}

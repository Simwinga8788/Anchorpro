using AnchorPro.Data;
using AnchorPro.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [Route("api/billing")]
    [ApiController]
    [Authorize]
    public class BillingController : ControllerBase
    {
        private readonly StripeService _stripe;
        private readonly ApplicationDbContext _db;
        private readonly UserManager<AnchorPro.Data.Entities.ApplicationUser> _userManager;
        private readonly IConfiguration _config;

        public BillingController(StripeService stripe, ApplicationDbContext db,
            UserManager<AnchorPro.Data.Entities.ApplicationUser> userManager, IConfiguration config)
        {
            _stripe = stripe;
            _db = db;
            _userManager = userManager;
            _config = config;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> Overview()
        {
            var user = await _userManager.GetUserAsync(User);
            var tenantId = user?.TenantId;

            var stripeConfigured = await _stripe.IsConfiguredAsync();

            // Subscription info
            string? planName = null;
            string? planStatus = null;
            if (tenantId.HasValue)
            {
                var sub = await _db.TenantSubscriptions
                    .Include(s => s.SubscriptionPlan)
                    .Where(s => s.TenantId == tenantId && s.Status != "Cancelled")
                    .OrderByDescending(s => s.StartDate)
                    .FirstOrDefaultAsync();
                planName = sub?.SubscriptionPlan?.Name ?? "Free";
                planStatus = sub?.Status ?? "active";
            }

            // Usage counts
            var teamCount = tenantId.HasValue
                ? await _db.Users.CountAsync(u => u.TenantId == tenantId)
                : 0;
            var assetCount = tenantId.HasValue
                ? await _db.Equipment.CountAsync(e => e.TenantId == tenantId)
                : 0;
            var activeJobCount = tenantId.HasValue
                ? await _db.JobCards.CountAsync(j => j.TenantId == tenantId && j.Status != AnchorPro.Data.Enums.JobStatus.Completed && j.Status != AnchorPro.Data.Enums.JobStatus.Cancelled)
                : 0;

            return Ok(new
            {
                stripeConfigured,
                planName,
                planStatus,
                teamCount,
                assetCount,
                activeJobCount,
            });
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req)
        {
            if (!await _stripe.IsConfiguredAsync())
                return BadRequest(new { message = "Stripe is not configured." });

            var user = await _userManager.GetUserAsync(User);
            var tenantId = user?.TenantId?.ToString() ?? "unknown";
            var appUrl = _config["App:Url"] ?? "https://anchorpro-repo-anchor-pro-web.vercel.app";

            var url = await _stripe.CreateCheckoutSessionAsync(
                tenantId, req.PriceId,
                $"{appUrl}/dashboard/settings?billing=success",
                $"{appUrl}/dashboard/settings?billing=cancelled"
            );
            return Ok(new { url });
        }

        [HttpPost("portal")]
        public async Task<IActionResult> Portal()
        {
            if (!await _stripe.IsConfiguredAsync())
                return BadRequest(new { message = "Stripe is not configured." });

            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var tenantId = user.TenantId;
            string? customerId = null;
            if (tenantId.HasValue)
            {
                var sub = await _db.TenantSubscriptions
                    .Where(s => s.TenantId == tenantId && s.Status != "Cancelled")
                    .OrderByDescending(s => s.StartDate)
                    .FirstOrDefaultAsync();
                // StripeCustomerId not yet on entity — placeholder for future
                customerId = null;
            }

            if (string.IsNullOrEmpty(customerId))
                return BadRequest(new { message = "No active Stripe subscription found." });

            var appUrl = _config["App:Url"] ?? "https://anchorpro-repo-anchor-pro-web.vercel.app";
            var url = await _stripe.CreatePortalSessionAsync(customerId, $"{appUrl}/dashboard/settings");
            return Ok(new { url });
        }

        public record CheckoutRequest(string PriceId);
    }
}

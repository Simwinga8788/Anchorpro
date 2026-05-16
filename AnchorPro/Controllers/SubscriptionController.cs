using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Subscription plan management and lifecycle operations.
    /// Plan reads are open; lifecycle mutations (suspend, cancel, upgrade) require Admin or PlatformOwner.
    /// </summary>
    [Route("api/subscriptions")]
    [ApiController]
    public class SubscriptionController : ControllerBase
    {
        private readonly ISubscriptionService _subscriptionService;
        private readonly ISubscriptionLifecycleService _lifecycleService;

        public SubscriptionController(
            ISubscriptionService subscriptionService,
            ISubscriptionLifecycleService lifecycleService)
        {
            _subscriptionService = subscriptionService;
            _lifecycleService = lifecycleService;
        }

        // ── PLANS ─────────────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/subscriptions/plans — All available subscription plans (public).
        /// </summary>
        [HttpGet("plans")]
        [AllowAnonymous]
        public async Task<ActionResult> GetPlans()
            => Ok(await _subscriptionService.GetAllPlansAsync());

        /// <summary>
        /// GET /api/subscriptions/current — Current tenant's active subscription + plan.
        /// </summary>
        [HttpGet("current")]
        [Authorize]
        public async Task<ActionResult> GetCurrent()
        {
            var subscription = await _subscriptionService.GetCurrentSubscriptionAsync();
            var plan = await _subscriptionService.GetCurrentPlanAsync();
            var daysRemaining = await _subscriptionService.GetDaysRemainingAsync();
            var isTrialExpired = await _subscriptionService.IsTrialExpiredAsync();

            return Ok(new
            {
                subscription,
                plan,
                daysRemaining,
                isTrialExpired
            });
        }

        // ── UPGRADE ───────────────────────────────────────────────────────────

        /// <summary>
        /// POST /api/subscriptions/upgrade
        /// Body: { "newPlanId": 3 }
        /// Upgrades the current tenant to a new plan.
        /// </summary>
        [HttpPost("upgrade")]
        [Authorize(Roles = "Admin,PlatformOwner")]
        public async Task<ActionResult> Upgrade([FromBody] UpgradeRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            var success = await _subscriptionService.UpgradeSubscriptionAsync(1, req.NewPlanId, userId);
            return success ? Ok(new { message = "Subscription upgraded." }) : BadRequest("Upgrade failed.");
        }

        // ── FEATURE FLAGS ─────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/subscriptions/features/{featureName} — Check if a feature is enabled.
        /// Example feature names: "AdvancedReporting", "MultiTenant", "BulkImport"
        /// </summary>
        [HttpGet("features/{featureName}")]
        [Authorize]
        public async Task<ActionResult> CheckFeature(string featureName)
        {
            var enabled = await _subscriptionService.IsFeatureEnabledAsync(featureName);
            return Ok(new { featureName, enabled });
        }

        // ── LIFECYCLE (Platform Owner) ─────────────────────────────────────────

        /// <summary>
        /// GET /api/subscriptions/health/{subscriptionId} — Health status of a specific subscription.
        /// Returns: Active, Trial, GracePeriod, Suspended, Cancelled.
        /// </summary>
        [HttpGet("health/{subscriptionId}")]
        [Authorize(Roles = "PlatformOwner")]
        public async Task<ActionResult> GetHealth(int subscriptionId)
        {
            var status = await _lifecycleService.GetSubscriptionHealthStatusAsync(subscriptionId);
            var graceDays = await _lifecycleService.GetGracePeriodDaysRemainingAsync(subscriptionId);
            var trialDays = await _lifecycleService.GetTrialDaysRemainingAsync(subscriptionId);
            return Ok(new { status, graceDays, trialDays });
        }

        /// <summary>
        /// GET /api/subscriptions/requiring-action — Subscriptions needing attention (expired trials, overdue payments).
        /// </summary>
        [HttpGet("requiring-action")]
        [Authorize(Roles = "PlatformOwner")]
        public async Task<ActionResult> GetRequiringAction()
            => Ok(await _lifecycleService.GetSubscriptionsRequiringActionAsync());

        /// <summary>
        /// POST /api/subscriptions/{subscriptionId}/suspend
        /// Body: { "reason": "Payment overdue" }
        /// </summary>
        [HttpPost("{subscriptionId}/suspend")]
        [Authorize(Roles = "PlatformOwner")]
        public async Task<ActionResult> Suspend(int subscriptionId, [FromBody] LifecycleActionRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _lifecycleService.SuspendSubscriptionAsync(subscriptionId, req.Reason, userId);
            return NoContent();
        }

        /// <summary>
        /// POST /api/subscriptions/{subscriptionId}/reactivate
        /// Body: { "reason": "Payment received" }
        /// </summary>
        [HttpPost("{subscriptionId}/reactivate")]
        [Authorize(Roles = "PlatformOwner")]
        public async Task<ActionResult> Reactivate(int subscriptionId, [FromBody] LifecycleActionRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _lifecycleService.ReactivateSubscriptionAsync(subscriptionId, userId, req.Reason);
            return NoContent();
        }

        /// <summary>
        /// POST /api/subscriptions/{subscriptionId}/cancel
        /// Body: { "reason": "Customer churned" }
        /// </summary>
        [HttpPost("{subscriptionId}/cancel")]
        [Authorize(Roles = "PlatformOwner")]
        public async Task<ActionResult> Cancel(int subscriptionId, [FromBody] LifecycleActionRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _lifecycleService.CancelSubscriptionAsync(subscriptionId, req.Reason, userId);
            return NoContent();
        }

        /// <summary>
        /// POST /api/subscriptions/{subscriptionId}/convert-trial
        /// Body: { "newPlanId": 2 }
        /// Converts a trial to a paid plan.
        /// </summary>
        [HttpPost("{subscriptionId}/convert-trial")]
        [Authorize(Roles = "PlatformOwner")]
        public async Task<ActionResult> ConvertTrial(int subscriptionId, [FromBody] UpgradeRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _lifecycleService.ConvertTrialToPaidAsync(subscriptionId, req.NewPlanId, userId);
            return NoContent();
        }
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public class UpgradeRequest
    {
        public int NewPlanId { get; set; }
    }

    public class LifecycleActionRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
}

using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AnchorPro.Data;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly ISubscriptionService _subscriptionService;
        private readonly UserManager<ApplicationUser> _userManager;

        public SubscriptionController(ISubscriptionService subscriptionService, UserManager<ApplicationUser> userManager)
        {
            _subscriptionService = subscriptionService;
            _userManager = userManager;
        }

        [HttpGet("current")]
        public async Task<ActionResult> GetCurrentSubscription()
        {
            var sub = await _subscriptionService.GetCurrentSubscriptionAsync();
            return Ok(sub);
        }

        [HttpGet("current-plan")]
        public async Task<ActionResult> GetCurrentPlan()
        {
            var plan = await _subscriptionService.GetCurrentPlanAsync();
            return Ok(plan);
        }

        [HttpGet("plans")]
        public async Task<ActionResult> GetAllPlans()
        {
            var plans = await _subscriptionService.GetAllPlansAsync();
            return Ok(plans);
        }

        [HttpPost("upgrade/{planId}")]
        public async Task<ActionResult> Upgrade(int planId)
        {
            var userId = _userManager.GetUserId(User) ?? "";
            var result = await _subscriptionService.UpgradeSubscriptionAsync(1, planId, userId);
            if (!result) return BadRequest(new { message = "Upgrade failed or plan invalid." });
            return Ok(new { message = "Subscription upgraded successfully" });
        }

        [HttpGet("days-remaining")]
        public async Task<ActionResult> GetDaysRemaining()
        {
            var days = await _subscriptionService.GetDaysRemainingAsync();
            return Ok(new { daysRemaining = days });
        }
    }
}

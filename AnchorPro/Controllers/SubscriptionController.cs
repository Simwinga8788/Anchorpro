using System.Security.Claims;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        private readonly ApplicationDbContext _context;

        public SubscriptionController(
            ISubscriptionService subscriptionService,
            ISubscriptionLifecycleService lifecycleService,
            ApplicationDbContext context)
        {
            _subscriptionService = subscriptionService;
            _lifecycleService = lifecycleService;
            _context = context;
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

            // Resolve from the caller's own tenant context, not an existing subscription — a
            // tenant selecting a plan for the first time (no TenantSubscription row yet) is a
            // normal case, not an error. UpgradeSubscriptionAsync creates one if missing.
            var tenantId = _context.CurrentTenantId;
            if (tenantId == null) return BadRequest("No tenant context for this account.");

            var success = await _subscriptionService.UpgradeSubscriptionAsync(tenantId.Value, req.NewPlanId, userId);
            return success ? Ok(new { message = "Subscription updated." }) : BadRequest("Update failed.");
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
        [Authorize(Policy = "PlatformOwner")]
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
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> GetRequiringAction()
            => Ok(await _lifecycleService.GetSubscriptionsRequiringActionAsync());

        /// <summary>
        /// GET /api/subscriptions/mrr-trend — Monthly Recurring Revenue (MRR) trend.
        /// </summary>
        [HttpGet("mrr-trend")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> GetMrrTrend()
        {
            _context.IgnoreTenantFilter = true;
            var now = DateTime.UtcNow;
            var sixMonthsAgo = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-5);

            // Real cash collected per calendar month from verified subscription payments.
            // (InvoicePayments is Feligo's own client billing — a different revenue stream entirely
            // from what AnchorPro collects from tenants for their subscription.)
            var payments = await _context.PaymentTransactions
                .Where(p => p.Status == "Approved" && p.ApprovedAt.HasValue && p.ApprovedAt.Value >= sixMonthsAgo)
                .GroupBy(p => new { p.ApprovedAt!.Value.Year, p.ApprovedAt!.Value.Month })
                .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(p => p.Amount) })
                .ToListAsync();

            var trend = new List<object>();
            for (int i = 5; i >= 0; i--)
            {
                var monthDate = now.AddMonths(-i);
                var monthName = monthDate.ToString("MMM");
                var real = payments.FirstOrDefault(p => p.Year == monthDate.Year && p.Month == monthDate.Month);
                trend.Add(new { month = monthName, mrr = real?.Total ?? 0m });
            }

            return Ok(trend);
        }

        /// <summary>
        /// POST /api/subscriptions/{subscriptionId}/suspend
        /// Body: { "reason": "Payment overdue" }
        /// </summary>
        [HttpPost("{subscriptionId}/suspend")]
        [Authorize(Policy = "PlatformOwner")]
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
        [Authorize(Policy = "PlatformOwner")]
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
        [Authorize(Policy = "PlatformOwner")]
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
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> ConvertTrial(int subscriptionId, [FromBody] UpgradeRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _lifecycleService.ConvertTrialToPaidAsync(subscriptionId, req.NewPlanId, userId);
            return NoContent();
        }

        // ── PLAN MANAGEMENT (Platform Owner) ────────────────────────────────────

        /// <summary>
        /// GET /api/subscriptions/plans/admin — every plan including inactive ones, for the
        /// Platform Owner's own management page. GetPlans (tenant-facing) only shows active ones.
        /// </summary>
        [HttpGet("plans/admin")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> GetPlansForAdmin()
            => Ok(await _subscriptionService.GetAllPlansForAdminAsync());

        /// <summary>
        /// POST /api/subscriptions/plans — create a new plan.
        /// </summary>
        [HttpPost("plans")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> CreatePlan([FromBody] SavePlanRequest req)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            var plan = await _subscriptionService.CreatePlanAsync(req.ToEntity(), userId);
            return Ok(plan);
        }

        /// <summary>
        /// PUT /api/subscriptions/plans/{id} — update every field on an existing plan.
        /// </summary>
        [HttpPut("plans/{id}")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> UpdatePlan(int id, [FromBody] SavePlanRequest req)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            var plan = await _subscriptionService.UpdatePlanAsync(id, req.ToEntity(), userId);
            return plan == null ? NotFound("Plan not found.") : Ok(plan);
        }

        /// <summary>
        /// POST /api/subscriptions/plans/{id}/set-active
        /// Body: { "isActive": false } — deactivating hides it from tenants without deleting it
        /// (plans are referenced by existing subscriptions/payment records, so hard delete isn't safe).
        /// </summary>
        [HttpPost("plans/{id}/set-active")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> SetPlanActive(int id, [FromBody] SetPlanActiveRequest req)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            var success = await _subscriptionService.SetPlanActiveAsync(id, req.IsActive, userId);
            return success ? Ok(new { message = req.IsActive ? "Plan activated." : "Plan deactivated." }) : NotFound("Plan not found.");
        }

        // ── PAYMENT PROOFS (no payment gateway — every payment is manually verified) ────────────

        /// <summary>
        /// POST /api/subscriptions/payment-proof — a tenant Admin submits proof of having paid their
        /// subscription (bank transfer confirmation, mobile money receipt). Upload the file via
        /// /api/upload first and pass the returned URL here. Stays Pending until a Platform Owner
        /// approves or rejects it — nothing changes on the subscription until then.
        /// </summary>
        [HttpPost("payment-proof")]
        [Authorize(Roles = "Admin,PlatformOwner")]
        public async Task<ActionResult> SubmitPaymentProof([FromBody] SubmitPaymentProofRequest req)
        {
            // No existing subscription yet is a normal case — a tenant choosing their first plan
            // still has to go through proof + approval, same as a renewal or a plan change.
            var tenantId = _context.CurrentTenantId;
            if (tenantId == null) return BadRequest("No tenant context for this account.");

            var subscription = await _subscriptionService.GetCurrentSubscriptionAsync();

            if (string.IsNullOrWhiteSpace(req.ProofUrl))
                return BadRequest("A proof document (receipt/screenshot) is required.");

            SubscriptionPlan? requestedPlan = null;
            if (req.RequestedPlanId.HasValue)
            {
                requestedPlan = await _context.SubscriptionPlans.FindAsync(req.RequestedPlanId.Value);
                if (requestedPlan == null) return BadRequest("The selected plan was not found.");
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "API_User";

            var transaction = new PaymentTransaction
            {
                TenantId = tenantId,
                TenantSubscriptionId = subscription?.Id,
                RequestedPlanId = req.RequestedPlanId,
                Amount = req.Amount,
                Currency = requestedPlan?.Currency ?? subscription?.SubscriptionPlan?.Currency ?? "ZMW",
                PaymentMethod = string.IsNullOrWhiteSpace(req.PaymentMethod) ? "Bank Transfer" : req.PaymentMethod,
                TransactionReference = req.TransactionReference,
                Status = "Pending",
                ProofDocumentUrl = req.ProofUrl,
                Notes = req.Notes,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId
            };

            _context.PaymentTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment proof submitted — a Platform Owner will review it shortly.", id = transaction.Id });
        }

        /// <summary>
        /// GET /api/subscriptions/payment-proofs?status=Pending — Platform Owner review queue.
        /// Omit status to see all.
        /// </summary>
        [HttpGet("payment-proofs")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> GetPaymentProofs([FromQuery] string? status = null)
        {
            _context.IgnoreTenantFilter = true;
            var query = _context.PaymentTransactions
                .Include(p => p.Tenant)
                .Include(p => p.TenantSubscription!).ThenInclude(s => s!.SubscriptionPlan)
                .Include(p => p.RequestedPlan)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(p => p.Status == status);

            var results = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.Amount,
                    p.Currency,
                    p.PaymentMethod,
                    p.TransactionReference,
                    p.Status,
                    p.ProofDocumentUrl,
                    p.Notes,
                    p.CreatedAt,
                    p.ApprovedAt,
                    RequestedPlanName = p.RequestedPlan != null ? p.RequestedPlan.Name : null,
                    IsNewSubscription = p.TenantSubscriptionId == null,
                    TenantName = p.Tenant != null ? p.Tenant.Name : null,
                    CurrentPlanName = p.TenantSubscription != null ? p.TenantSubscription.SubscriptionPlan!.Name : null
                })
                .ToListAsync();

            return Ok(results);
        }

        /// <summary>
        /// POST /api/subscriptions/payment-proofs/{id}/approve
        /// Confirms the payment: records it (feeds the MRR trend), extends the subscription's next
        /// billing date by a month, resets any suspension/grace-period/dunning state back to Active,
        /// and converts a trial to paid.
        /// </summary>
        [HttpPost("payment-proofs/{id}/approve")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> ApprovePaymentProof(int id)
        {
            _context.IgnoreTenantFilter = true;
            var transaction = await _context.PaymentTransactions
                .Include(p => p.TenantSubscription)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (transaction == null) return NotFound();
            if (transaction.Status != "Pending") return BadRequest($"This proof was already {transaction.Status.ToLower()}.");
            if (transaction.TenantId == null) return BadRequest("This proof has no tenant attached.");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            var now = DateTime.UtcNow;

            transaction.Status = "Approved";
            transaction.ApprovedAt = now;
            transaction.ApprovedByUserId = userId;
            await _context.SaveChangesAsync();

            if (transaction.RequestedPlanId.HasValue)
            {
                // Plan change (or first-ever plan selection) — creates the subscription if the
                // tenant didn't have one yet, or switches the existing one to the requested plan.
                await _subscriptionService.UpgradeSubscriptionAsync(transaction.TenantId.Value, transaction.RequestedPlanId.Value, userId);
            }
            else if (transaction.TenantSubscription != null)
            {
                // Plain renewal on the current plan — just confirm payment and extend billing.
                var subscription = transaction.TenantSubscription;
                subscription.LastPaymentDate = now;
                subscription.NextBillingDate = now.AddMonths(1);
                subscription.PaymentRetryCount = 0;

                if (subscription.IsTrial)
                {
                    subscription.IsTrial = false;
                    subscription.ConvertedFromTrial = true;
                    subscription.TrialConvertedAt = now;
                    subscription.TrialEndDate = null;
                }

                if (subscription.Status is "Suspended" or "GracePeriod" or "PastDue" or "Trial")
                {
                    subscription.Status = "Active";
                    subscription.SuspendedAt = null;
                    subscription.SuspensionReason = null;
                    subscription.GracePeriodStartDate = null;
                    subscription.GracePeriodEndDate = null;
                    subscription.ReactivatedAt = now;
                    subscription.ReactivatedByUserId = userId;
                    subscription.ReactivationNotes = "Reactivated on payment proof approval";
                }

                subscription.UpdatedAt = now;
                subscription.UpdatedBy = userId;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Payment confirmed and subscription updated." });
        }

        /// <summary>
        /// POST /api/subscriptions/payment-proofs/{id}/reject
        /// Body: { "reason": "Amount doesn't match the plan price" }
        /// </summary>
        [HttpPost("payment-proofs/{id}/reject")]
        [Authorize(Policy = "PlatformOwner")]
        public async Task<ActionResult> RejectPaymentProof(int id, [FromBody] LifecycleActionRequest req)
        {
            _context.IgnoreTenantFilter = true;
            var transaction = await _context.PaymentTransactions.FirstOrDefaultAsync(p => p.Id == id);
            if (transaction == null) return NotFound();
            if (transaction.Status != "Pending") return BadRequest($"This proof was already {transaction.Status.ToLower()}.");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "API_User";

            transaction.Status = "Rejected";
            transaction.ApprovedAt = DateTime.UtcNow;
            transaction.ApprovedByUserId = userId;
            transaction.Notes = string.IsNullOrWhiteSpace(transaction.Notes)
                ? $"Rejected: {req.Reason}"
                : $"{transaction.Notes}\n[Rejected: {req.Reason}]";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Payment proof rejected." });
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

    public class SavePlanRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal MonthlyPrice { get; set; }
        public decimal AnnualPrice { get; set; }
        public string Currency { get; set; } = "ZMW";
        public int MaxTechnicians { get; set; }
        public int MaxEquipment { get; set; }
        public int MaxActiveJobs { get; set; }
        public int StorageLimitMB { get; set; }
        public bool AllowExports { get; set; }
        public bool AllowPredictiveEngine { get; set; }
        public bool AllowMobileAccess { get; set; }

        public SubscriptionPlan ToEntity() => new()
        {
            Name = Name,
            Description = Description,
            MonthlyPrice = MonthlyPrice,
            AnnualPrice = AnnualPrice,
            Currency = Currency,
            MaxTechnicians = MaxTechnicians,
            MaxEquipment = MaxEquipment,
            MaxActiveJobs = MaxActiveJobs,
            StorageLimitMB = StorageLimitMB,
            AllowExports = AllowExports,
            AllowPredictiveEngine = AllowPredictiveEngine,
            AllowMobileAccess = AllowMobileAccess,
            IsActive = true
        };
    }

    public class SetPlanActiveRequest
    {
        public bool IsActive { get; set; }
    }

    public class SubmitPaymentProofRequest
    {
        public decimal Amount { get; set; }
        public string ProofUrl { get; set; } = string.Empty;
        public string? PaymentMethod { get; set; }
        public string? TransactionReference { get; set; }
        public string? Notes { get; set; }
        /// <summary>Set when this proof is for choosing a new plan (first selection or a change),
        /// not just renewing the current one.</summary>
        public int? RequestedPlanId { get; set; }
    }
}

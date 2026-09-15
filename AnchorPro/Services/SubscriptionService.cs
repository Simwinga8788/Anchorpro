using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public SubscriptionService(ApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<TenantSubscription?> GetCurrentSubscriptionAsync(int? tenantId = null)
    {
        var effectiveTenantId = tenantId ?? _context.CurrentTenantId;
        if (effectiveTenantId == null) return null;

        // A tenant can accumulate multiple subscription rows over its lifetime (trial, then
        // upgrades) — only cancelled/superseded ones stay behind, so the newest row is current.
        return await _context.TenantSubscriptions
            .Include(s => s.SubscriptionPlan)
            .Include(s => s.Tenant)
            .Where(s => s.TenantId == effectiveTenantId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<SubscriptionPlan?> GetCurrentPlanAsync(int? tenantId = null)
    {
        var subscription = await GetCurrentSubscriptionAsync(tenantId);
        return subscription?.SubscriptionPlan;
    }

    public async Task<List<SubscriptionPlan>> GetAllPlansAsync()
    {
        return await _context.SubscriptionPlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.MonthlyPrice)
            .ToListAsync();
    }

    public async Task<List<SubscriptionPlan>> GetAllPlansForAdminAsync()
    {
        return await _context.SubscriptionPlans
            .OrderBy(p => p.MonthlyPrice)
            .ToListAsync();
    }

    public async Task<SubscriptionPlan> CreatePlanAsync(SubscriptionPlan plan, string userId)
    {
        plan.TenantId = null; // Plans are global, not tied to any one tenant.
        plan.CreatedAt = DateTime.UtcNow;
        plan.CreatedBy = userId;
        _context.SubscriptionPlans.Add(plan);
        await _context.SaveChangesAsync();
        return plan;
    }

    public async Task<SubscriptionPlan?> UpdatePlanAsync(int planId, SubscriptionPlan updated, string userId)
    {
        var plan = await _context.SubscriptionPlans.FindAsync(planId);
        if (plan == null) return null;

        plan.Name = updated.Name;
        plan.Description = updated.Description;
        plan.MonthlyPrice = updated.MonthlyPrice;
        plan.AnnualPrice = updated.AnnualPrice;
        plan.Currency = updated.Currency;
        plan.MaxTechnicians = updated.MaxTechnicians;
        plan.MaxEquipment = updated.MaxEquipment;
        plan.MaxActiveJobs = updated.MaxActiveJobs;
        plan.StorageLimitMB = updated.StorageLimitMB;
        plan.AllowExports = updated.AllowExports;
        plan.AllowPredictiveEngine = updated.AllowPredictiveEngine;
        plan.AllowMobileAccess = updated.AllowMobileAccess;
        plan.UpdatedAt = DateTime.UtcNow;
        plan.UpdatedBy = userId;

        await _context.SaveChangesAsync();
        return plan;
    }

    public async Task<bool> SetPlanActiveAsync(int planId, bool isActive, string userId)
    {
        var plan = await _context.SubscriptionPlans.FindAsync(planId);
        if (plan == null) return false;

        plan.IsActive = isActive;
        plan.UpdatedAt = DateTime.UtcNow;
        plan.UpdatedBy = userId;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpgradeSubscriptionAsync(int tenantId, int newPlanId, string userId)
    {
        var subscription = await GetCurrentSubscriptionAsync(tenantId);

        var newPlan = await _context.SubscriptionPlans.FindAsync(newPlanId);
        if (newPlan == null) return false;

        var oldPlanName = subscription?.SubscriptionPlan?.Name;
        var isNewSubscription = subscription == null;

        if (subscription == null)
        {
            // A tenant selecting a plan for the first time — no TenantSubscription row exists yet.
            subscription = new TenantSubscription
            {
                TenantId = tenantId,
                SubscriptionPlanId = newPlanId,
                Status = "Active",
                IsTrial = false,
                StartDate = DateTime.UtcNow,
                NextBillingDate = DateTime.UtcNow.AddMonths(1),
                AutoRenew = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId
            };
            _context.TenantSubscriptions.Add(subscription);
        }
        else
        {
            subscription.SubscriptionPlanId = newPlanId;
            subscription.Status = "Active";
            subscription.IsTrial = false;
            subscription.TrialEndDate = null;
            subscription.NextBillingDate = DateTime.UtcNow.AddMonths(1);
            subscription.UpdatedAt = DateTime.UtcNow;
            subscription.UpdatedBy = userId;
        }

        // Log the change
        var auditLog = new SystemAuditLog
        {
            Action = isNewSubscription ? "Subscription Created" : "Subscription Upgrade",
            Module = "Billing",
            ChangedBy = userId,
            OldValue = oldPlanName,
            NewValue = newPlan.Name,
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.SystemAuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();

        // Send email notification to Platform Owner
        var configuredEmail = await _context.SystemSettings
            .IgnoreQueryFilters()
            .Where(s => s.Key == "Platform.OwnerEmail" && s.TenantId == null)
            .Select(s => s.Value)
            .FirstOrDefaultAsync();

        var ownerEmail = configuredEmail;

        if (string.IsNullOrWhiteSpace(ownerEmail))
        {
            // There is no "PlatformOwner" Identity role — a Platform Owner is an Admin-role user
            // with no TenantId (see AuthorizationOptions "PlatformOwner" policy in Program.cs).
            var adminRoleId = await _context.Roles
                .Where(r => r.Name == "Admin")
                .Select(r => r.Id)
                .FirstOrDefaultAsync();

            ownerEmail = await _context.Users
                .Where(u => u.TenantId == null && _context.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == adminRoleId))
                .Select(u => u.Email)
                .FirstOrDefaultAsync();
        }

        ownerEmail ??= "platform@anchorpro.com";

        var tenantName = subscription.Tenant?.Name ?? $"Tenant #{tenantId}";
        var subject = isNewSubscription ? $"New Subscription: {tenantName}" : $"Subscription Upgraded: {tenantName}";
        var body = $@"
            <h3>{(isNewSubscription ? "New Subscription" : "Subscription Upgrade")} Notification</h3>
            <p><strong>{tenantName}</strong> has just {(isNewSubscription ? "subscribed to" : "upgraded")} their Anchor Pro plan.</p>
            <ul>
                <li><strong>Old Plan:</strong> {oldPlanName ?? "None"}</li>
                <li><strong>New Plan:</strong> {newPlan.Name}</li>
                <li><strong>Monthly Price:</strong> K {newPlan.MonthlyPrice:N2}</li>
                <li><strong>Upgraded By:</strong> {userId}</li>
            </ul>
            <p>This change has been automatically applied to their MRR and limits.</p>
        ";
        await _emailService.SendEmailAsync(ownerEmail, subject, body);

        return true;
    }

    public async Task<bool> IsFeatureEnabledAsync(string featureName, int? tenantId = null)
    {
        var plan = await GetCurrentPlanAsync(tenantId);
        if (plan == null) return false;

        return featureName.ToLower() switch
        {
            "exports" => plan.AllowExports,
            "predictive" => plan.AllowPredictiveEngine,
            "mobile" => plan.AllowMobileAccess,
            _ => false
        };
    }

    public async Task<bool> CheckLimitAsync(string limitType, int currentCount, int? tenantId = null)
    {
        var plan = await GetCurrentPlanAsync(tenantId);
        if (plan == null) return false;

        var limit = limitType.ToLower() switch
        {
            "technicians" => plan.MaxTechnicians,
            "equipment" => plan.MaxEquipment,
            "jobs" => plan.MaxActiveJobs,
            _ => int.MaxValue
        };

        return currentCount < limit;
    }

    public async Task<bool> IsTrialExpiredAsync(int? tenantId = null)
    {
        var subscription = await GetCurrentSubscriptionAsync(tenantId);
        if (subscription == null || !subscription.IsTrial) return false;

        return subscription.TrialEndDate.HasValue &&
               subscription.TrialEndDate.Value < DateTime.UtcNow;
    }

    public async Task<int> GetDaysRemainingAsync(int? tenantId = null)
    {
        var subscription = await GetCurrentSubscriptionAsync(tenantId);
        if (subscription == null) return 0;

        if (subscription.IsTrial && subscription.TrialEndDate.HasValue)
        {
            var remaining = (subscription.TrialEndDate.Value - DateTime.UtcNow).Days;
            return Math.Max(0, remaining);
        }

        if (subscription.NextBillingDate.HasValue)
        {
            var remaining = (subscription.NextBillingDate.Value - DateTime.UtcNow).Days;
            return Math.Max(0, remaining);
        }

        return 0;
    }

}

using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly ApplicationDbContext _context;

    public SubscriptionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TenantSubscription?> GetCurrentSubscriptionAsync(int tenantId = 1)
    {
        return await _context.TenantSubscriptions
            .Include(s => s.SubscriptionPlan)
            .FirstOrDefaultAsync(s => s.TenantId == tenantId);
    }

    public async Task<SubscriptionPlan?> GetCurrentPlanAsync(int tenantId = 1)
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

    public async Task<bool> UpgradeSubscriptionAsync(int tenantId, int newPlanId, string userId)
    {
        var subscription = await GetCurrentSubscriptionAsync(tenantId);
        if (subscription == null) return false;

        var newPlan = await _context.SubscriptionPlans.FindAsync(newPlanId);
        if (newPlan == null) return false;

        // Update subscription
        subscription.SubscriptionPlanId = newPlanId;
        subscription.Status = "Active";
        subscription.IsTrial = false;
        subscription.TrialEndDate = null;
        subscription.NextBillingDate = DateTime.UtcNow.AddMonths(1);
        subscription.UpdatedAt = DateTime.UtcNow;
        subscription.UpdatedBy = userId;

        // Log the change
        var auditLog = new SystemAuditLog
        {
            Action = "Subscription Upgrade",
            Module = "Billing",
            ChangedBy = userId,
            OldValue = subscription.SubscriptionPlan?.Name,
            NewValue = newPlan.Name,
            Timestamp = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.SystemAuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> IsFeatureEnabledAsync(string featureName, int tenantId = 1)
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

    public async Task<bool> CheckLimitAsync(string limitType, int currentCount, int tenantId = 1)
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

    public async Task<bool> IsTrialExpiredAsync(int tenantId = 1)
    {
        var subscription = await GetCurrentSubscriptionAsync(tenantId);
        if (subscription == null || !subscription.IsTrial) return false;

        return subscription.TrialEndDate.HasValue && 
               subscription.TrialEndDate.Value < DateTime.UtcNow;
    }

    public async Task<int> GetDaysRemainingAsync(int tenantId = 1)
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

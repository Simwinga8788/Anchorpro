using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces;

public interface ISubscriptionService
{
    // tenantId: null resolves to the current request's tenant (ApplicationDbContext.CurrentTenantId).
    // Pass explicitly only from background/system contexts that have no ambient tenant.
    Task<TenantSubscription?> GetCurrentSubscriptionAsync(int? tenantId = null);
    Task<SubscriptionPlan?> GetCurrentPlanAsync(int? tenantId = null);
    Task<List<SubscriptionPlan>> GetAllPlansAsync();
    // Platform Owner plan management — includes inactive plans, unlike GetAllPlansAsync (tenant-facing).
    Task<List<SubscriptionPlan>> GetAllPlansForAdminAsync();
    Task<SubscriptionPlan> CreatePlanAsync(SubscriptionPlan plan, string userId);
    Task<SubscriptionPlan?> UpdatePlanAsync(int planId, SubscriptionPlan updated, string userId);
    Task<bool> SetPlanActiveAsync(int planId, bool isActive, string userId);
    Task<bool> UpgradeSubscriptionAsync(int tenantId, int newPlanId, string userId);
    Task<bool> IsFeatureEnabledAsync(string featureName, int? tenantId = null);
    Task<bool> CheckLimitAsync(string limitType, int currentCount, int? tenantId = null);
    Task<bool> IsTrialExpiredAsync(int? tenantId = null);
    Task<int> GetDaysRemainingAsync(int? tenantId = null);
}

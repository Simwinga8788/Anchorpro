using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces;

public interface ISubscriptionService
{
    // tenantId: null resolves to the current request's tenant (ApplicationDbContext.CurrentTenantId).
    // Pass explicitly only from background/system contexts that have no ambient tenant.
    Task<TenantSubscription?> GetCurrentSubscriptionAsync(int? tenantId = null);
    Task<SubscriptionPlan?> GetCurrentPlanAsync(int? tenantId = null);
    Task<List<SubscriptionPlan>> GetAllPlansAsync();
    Task<bool> UpgradeSubscriptionAsync(int tenantId, int newPlanId, string userId);
    Task<bool> IsFeatureEnabledAsync(string featureName, int? tenantId = null);
    Task<bool> CheckLimitAsync(string limitType, int currentCount, int? tenantId = null);
    Task<bool> IsTrialExpiredAsync(int? tenantId = null);
    Task<int> GetDaysRemainingAsync(int? tenantId = null);
    Task<bool> UpdatePlanPriceAsync(int planId, decimal monthlyPrice);
}

using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces;

public interface ISubscriptionService
{
    Task<TenantSubscription?> GetCurrentSubscriptionAsync(int tenantId = 1);
    Task<SubscriptionPlan?> GetCurrentPlanAsync(int tenantId = 1);
    Task<List<SubscriptionPlan>> GetAllPlansAsync();
    Task<bool> UpgradeSubscriptionAsync(int tenantId, int newPlanId, string userId);
    Task<bool> IsFeatureEnabledAsync(string featureName, int tenantId = 1);
    Task<bool> CheckLimitAsync(string limitType, int currentCount, int tenantId = 1);
    Task<bool> IsTrialExpiredAsync(int tenantId = 1);
    Task<int> GetDaysRemainingAsync(int tenantId = 1);
}

using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface ISubscriptionLifecycleService
    {
        // Grace Period Management
        Task EnterGracePeriodAsync(int subscriptionId, string reason);
        Task<bool> IsInGracePeriodAsync(int subscriptionId);
        Task<int> GetGracePeriodDaysRemainingAsync(int subscriptionId);
        
        // Suspension
        Task SuspendSubscriptionAsync(int subscriptionId, string reason, string? userId = null);
        Task<bool> IsSuspendedAsync(int subscriptionId);
        
        // Reactivation
        Task ReactivateSubscriptionAsync(int subscriptionId, string? userId = null, string? notes = null);
        
        // Trial Conversion
        Task ConvertTrialToPaidAsync(int subscriptionId, int newPlanId, string? userId = null);
        Task<bool> IsTrialExpiredAsync(int subscriptionId);
        Task<int> GetTrialDaysRemainingAsync(int subscriptionId);
        
        // Dunning (Payment Retry)
        Task RecordPaymentRetryAsync(int subscriptionId);
        Task<bool> HasExceededMaxRetriesAsync(int subscriptionId);
        Task ResetPaymentRetriesAsync(int subscriptionId);
        
        // Cancellation
        Task CancelSubscriptionAsync(int subscriptionId, string reason, string? userId = null);
        
        // Auto-Processing (Background Jobs)
        Task ProcessExpiredTrialsAsync();
        Task ProcessExpiredGracePeriodsAsync();
        Task ProcessOverduePaymentsAsync();
        
        // Status Checks
        Task<string> GetSubscriptionHealthStatusAsync(int subscriptionId);
        Task<List<TenantSubscription>> GetSubscriptionsRequiringActionAsync();
    }
}

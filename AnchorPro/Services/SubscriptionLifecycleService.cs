using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class SubscriptionLifecycleService : ISubscriptionLifecycleService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;
        private readonly ILogger<SubscriptionLifecycleService> _logger;
        private readonly IEmailService _emailService;

        public SubscriptionLifecycleService(
            IDbContextFactory<ApplicationDbContext> contextFactory,
            ILogger<SubscriptionLifecycleService> logger,
            IEmailService emailService)
        {
            _contextFactory = contextFactory;
            _logger = logger;
            _emailService = emailService;
        }

        private async Task SendNotificationEmailAsync(int subscriptionId, string subject, string messageBody)
        {
            try 
            {
                using var context = _contextFactory.CreateDbContext();
                var sub = await context.TenantSubscriptions
                    .Include(s => s.Tenant)
                    .FirstOrDefaultAsync(s => s.Id == subscriptionId);

                if (sub?.Tenant?.ContactEmail != null)
                {
                    await _emailService.SendEmailAsync(sub.Tenant.ContactEmail, subject, messageBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email notif for sub {Id}", subscriptionId);
            }
        }

        #region Grace Period Management

        public async Task EnterGracePeriodAsync(int subscriptionId, string reason)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null)
                throw new InvalidOperationException($"Subscription {subscriptionId} not found");

            subscription.Status = "GracePeriod";
            subscription.GracePeriodStartDate = DateTime.UtcNow;
            subscription.GracePeriodEndDate = DateTime.UtcNow.AddDays(subscription.GracePeriodDays);
            subscription.SuspensionReason = reason;
            subscription.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            
            _logger.LogInformation("Subscription {SubscriptionId} entered grace period. Reason: {Reason}", 
                subscriptionId, reason);

            await SendNotificationEmailAsync(subscriptionId, 
                "Action Required: Subscription Payment Issue", 
                $"Your subscription has entered a grace period due to: {reason}. Please update your payment method immediately to avoid suspension.");
        }

        public async Task<bool> IsInGracePeriodAsync(int subscriptionId)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null) return false;
            
            return subscription.Status == "GracePeriod" && 
                   subscription.GracePeriodEndDate.HasValue && 
                   subscription.GracePeriodEndDate.Value > DateTime.UtcNow;
        }

        public async Task<int> GetGracePeriodDaysRemainingAsync(int subscriptionId)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null || !subscription.GracePeriodEndDate.HasValue)
                return 0;
            
            var remaining = (subscription.GracePeriodEndDate.Value - DateTime.UtcNow).Days;
            return Math.Max(0, remaining);
        }

        #endregion

        #region Suspension

        public async Task SuspendSubscriptionAsync(int subscriptionId, string reason, string? userId = null)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null)
                throw new InvalidOperationException($"Subscription {subscriptionId} not found");

            subscription.Status = "Suspended";
            subscription.SuspendedAt = DateTime.UtcNow;
            subscription.SuspensionReason = reason;
            subscription.SuspendedByUserId = userId;
            subscription.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            
            _logger.LogWarning("Subscription {SubscriptionId} suspended. Reason: {Reason}", 
                subscriptionId, reason);

            await SendNotificationEmailAsync(subscriptionId, 
                "Account Suspended", 
                $"Your account has been suspended due to: {reason}. Please contact support or update your billing details to restore access.");
        }

        public async Task<bool> IsSuspendedAsync(int subscriptionId)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            return subscription?.Status == "Suspended";
        }

        #endregion

        #region Reactivation

        public async Task ReactivateSubscriptionAsync(int subscriptionId, string? userId = null, string? notes = null)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null)
                throw new InvalidOperationException($"Subscription {subscriptionId} not found");

            subscription.Status = "Active";
            subscription.ReactivatedAt = DateTime.UtcNow;
            subscription.ReactivatedByUserId = userId;
            subscription.ReactivationNotes = notes;
            
            // Clear suspension data
            subscription.SuspendedAt = null;
            subscription.SuspensionReason = null;
            subscription.GracePeriodStartDate = null;
            subscription.GracePeriodEndDate = null;
            
            // Reset payment retries
            subscription.PaymentRetryCount = 0;
            subscription.LastPaymentRetryDate = null;
            
            subscription.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            
            _logger.LogInformation("Subscription {SubscriptionId} reactivated by {UserId}", 
                subscriptionId, userId ?? "System");

            await SendNotificationEmailAsync(subscriptionId, 
                "Account Reactivated", 
                "Your subscription has been successfully reactivated. Thank you for your payment!");
        }

        #endregion

        #region Trial Conversion

        public async Task ConvertTrialToPaidAsync(int subscriptionId, int newPlanId, string? userId = null)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions
                .Include(s => s.SubscriptionPlan)
                .FirstOrDefaultAsync(s => s.Id == subscriptionId);
            
            if (subscription == null)
                throw new InvalidOperationException($"Subscription {subscriptionId} not found");

            if (!subscription.IsTrial)
                throw new InvalidOperationException("Subscription is not a trial");

            // Store original trial plan
            subscription.OriginalTrialPlanId = subscription.SubscriptionPlanId;
            subscription.TrialConvertedAt = DateTime.UtcNow;
            subscription.ConvertedFromTrial = true;
            
            // Update to paid plan
            subscription.SubscriptionPlanId = newPlanId;
            subscription.IsTrial = false;
            subscription.Status = "Active";
            subscription.TrialEndDate = null;
            
            // Set billing dates
            subscription.StartDate = DateTime.UtcNow;
            subscription.NextBillingDate = DateTime.UtcNow.AddMonths(1);
            
            subscription.UpdatedAt = DateTime.UtcNow;
            subscription.UpdatedBy = userId;

            await context.SaveChangesAsync();
            
            _logger.LogInformation("Trial subscription {SubscriptionId} converted to paid plan {PlanId}", 
                subscriptionId, newPlanId);

            await SendNotificationEmailAsync(subscriptionId, 
                "Welcome to Anchor Pro Premium!", 
                "Your account has been upgraded to the professional plan. Using efficient tools leads to optimal uptime!");
        }

        public async Task<bool> IsTrialExpiredAsync(int subscriptionId)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null || !subscription.IsTrial) return false;
            
            return subscription.TrialEndDate.HasValue && 
                   subscription.TrialEndDate.Value < DateTime.UtcNow;
        }

        public async Task<int> GetTrialDaysRemainingAsync(int subscriptionId)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null || !subscription.IsTrial || !subscription.TrialEndDate.HasValue)
                return 0;
            
            var remaining = (subscription.TrialEndDate.Value - DateTime.UtcNow).Days;
            return Math.Max(0, remaining);
        }

        #endregion

        #region Dunning (Payment Retry)

        public async Task RecordPaymentRetryAsync(int subscriptionId)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null)
                throw new InvalidOperationException($"Subscription {subscriptionId} not found");

            subscription.PaymentRetryCount++;
            subscription.LastPaymentRetryDate = DateTime.UtcNow;
            subscription.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            
            _logger.LogInformation("Payment retry {RetryCount} recorded for subscription {SubscriptionId}", 
                subscription.PaymentRetryCount, subscriptionId);
        }

        public async Task<bool> HasExceededMaxRetriesAsync(int subscriptionId)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null) return false;
            
            return subscription.PaymentRetryCount >= subscription.MaxPaymentRetries;
        }

        public async Task ResetPaymentRetriesAsync(int subscriptionId)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null) return;

            subscription.PaymentRetryCount = 0;
            subscription.LastPaymentRetryDate = null;
            subscription.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
        }

        #endregion

        #region Cancellation

        public async Task CancelSubscriptionAsync(int subscriptionId, string reason, string? userId = null)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null)
                throw new InvalidOperationException($"Subscription {subscriptionId} not found");

            subscription.Status = "Cancelled";
            subscription.CancelledAt = DateTime.UtcNow;
            subscription.CancellationReason = reason;
            subscription.CancelledByUserId = userId;
            subscription.EndDate = DateTime.UtcNow;
            subscription.AutoRenew = false;
            subscription.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            
            _logger.LogWarning("Subscription {SubscriptionId} cancelled. Reason: {Reason}", 
                subscriptionId, reason);
        }

        #endregion

        #region Auto-Processing

        public async Task ProcessExpiredTrialsAsync()
        {
            using var context = _contextFactory.CreateDbContext();
            
            var expiredTrials = await context.TenantSubscriptions
                .Where(s => s.IsTrial && 
                           s.TrialEndDate.HasValue && 
                           s.TrialEndDate.Value < DateTime.UtcNow &&
                           s.Status == "Trial")
                .ToListAsync();

            foreach (var subscription in expiredTrials)
            {
                await EnterGracePeriodAsync(subscription.Id, "TrialExpired");
            }
            
            _logger.LogInformation("Processed {Count} expired trials", expiredTrials.Count);
        }

        public async Task ProcessExpiredGracePeriodsAsync()
        {
            using var context = _contextFactory.CreateDbContext();
            
            var expiredGracePeriods = await context.TenantSubscriptions
                .Where(s => s.Status == "GracePeriod" &&
                           s.GracePeriodEndDate.HasValue &&
                           s.GracePeriodEndDate.Value < DateTime.UtcNow)
                .ToListAsync();

            foreach (var subscription in expiredGracePeriods)
            {
                await SuspendSubscriptionAsync(subscription.Id, "GracePeriodExpired", "System");
            }
            
            _logger.LogInformation("Processed {Count} expired grace periods", expiredGracePeriods.Count);
        }

        public async Task ProcessOverduePaymentsAsync()
        {
            using var context = _contextFactory.CreateDbContext();
            
            var overdueSubscriptions = await context.TenantSubscriptions
                .Where(s => s.Status == "Active" &&
                           s.NextBillingDate.HasValue &&
                           s.NextBillingDate.Value < DateTime.UtcNow.AddDays(-1)) // 1 day overdue
                .ToListAsync();

            foreach (var subscription in overdueSubscriptions)
            {
                if (!await HasExceededMaxRetriesAsync(subscription.Id))
                {
                    await RecordPaymentRetryAsync(subscription.Id);
                }
                else
                {
                    await EnterGracePeriodAsync(subscription.Id, "PaymentOverdue");
                }
            }
            
            _logger.LogInformation("Processed {Count} overdue payments", overdueSubscriptions.Count);
        }

        #endregion

        #region Status Checks

        public async Task<string> GetSubscriptionHealthStatusAsync(int subscriptionId)
        {
            using var context = _contextFactory.CreateDbContext();
            var subscription = await context.TenantSubscriptions.FindAsync(subscriptionId);
            
            if (subscription == null) return "Unknown";
            
            if (subscription.Status == "Cancelled") return "Cancelled";
            if (subscription.Status == "Suspended") return "Suspended";
            
            if (subscription.IsTrial)
            {
                var daysRemaining = await GetTrialDaysRemainingAsync(subscriptionId);
                if (daysRemaining <= 0) return "TrialExpired";
                if (daysRemaining <= 3) return "TrialExpiringSoon";
                return "TrialActive";
            }
            
            if (subscription.Status == "GracePeriod")
            {
                var graceDaysRemaining = await GetGracePeriodDaysRemainingAsync(subscriptionId);
                if (graceDaysRemaining <= 0) return "GracePeriodExpired";
                if (graceDaysRemaining <= 2) return "GracePeriodCritical";
                return "InGracePeriod";
            }
            
            if (subscription.NextBillingDate.HasValue)
            {
                var daysUntilBilling = (subscription.NextBillingDate.Value - DateTime.UtcNow).Days;
                if (daysUntilBilling < 0) return "PaymentOverdue";
                if (daysUntilBilling <= 3) return "PaymentDueSoon";
            }
            
            return "Healthy";
        }

        public async Task<List<TenantSubscription>> GetSubscriptionsRequiringActionAsync()
        {
            using var context = _contextFactory.CreateDbContext();
            
            var now = DateTime.UtcNow;
            
            return await context.TenantSubscriptions
                .Include(s => s.Tenant)
                .Include(s => s.SubscriptionPlan)
                .Where(s => 
                    // Trials expiring in 3 days
                    (s.IsTrial && s.TrialEndDate.HasValue && s.TrialEndDate.Value <= now.AddDays(3)) ||
                    // Grace periods expiring in 2 days
                    (s.Status == "GracePeriod" && s.GracePeriodEndDate.HasValue && s.GracePeriodEndDate.Value <= now.AddDays(2)) ||
                    // Overdue payments
                    (s.Status == "Active" && s.NextBillingDate.HasValue && s.NextBillingDate.Value < now) ||
                    // Suspended subscriptions
                    (s.Status == "Suspended"))
                .OrderBy(s => s.Status == "Suspended" ? 0 : 
                             s.Status == "GracePeriod" ? 1 : 
                             s.IsTrial ? 2 : 3)
                .ToListAsync();
        }

        #endregion
    }
}

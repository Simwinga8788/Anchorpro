using AnchorPro.Services.Interfaces;

namespace AnchorPro.Services
{
    /// <summary>
    /// Runs the subscription lifecycle checks that ISubscriptionLifecycleService defines but nothing
    /// was ever calling automatically: expiring trials into a grace period, suspending subscriptions
    /// whose grace period has run out, and retrying/escalating overdue payments. Without this, those
    /// transitions only ever happened if a Platform Owner triggered them by hand.
    /// </summary>
    public class SubscriptionLifecycleWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SubscriptionLifecycleWorker> _logger;
        private static readonly TimeSpan Interval = TimeSpan.FromHours(6);

        public SubscriptionLifecycleWorker(IServiceScopeFactory scopeFactory, ILogger<SubscriptionLifecycleWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Subscription Lifecycle Worker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var lifecycleService = scope.ServiceProvider.GetRequiredService<ISubscriptionLifecycleService>();

                    await lifecycleService.ProcessExpiredTrialsAsync();
                    await lifecycleService.ProcessExpiredGracePeriodsAsync();
                    await lifecycleService.ProcessOverduePaymentsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing subscription lifecycle transitions.");
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }
    }
}

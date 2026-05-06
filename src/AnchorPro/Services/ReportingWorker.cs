using AnchorPro.Services.Interfaces;

namespace AnchorPro.Services
{
    public class ReportingWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ReportingWorker> _logger;

        public ReportingWorker(IServiceScopeFactory scopeFactory, ILogger<ReportingWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Reporting Worker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var reportingService = scope.ServiceProvider.GetRequiredService<IReportingService>();
                        await reportingService.ProcessDueReportsAsync();

                        var alertService = scope.ServiceProvider.GetRequiredService<IAlertService>();
                        await alertService.CheckForLowMarginJobsAsync();
                        await alertService.CheckForOverdueJobsAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing reports.");
                }

                // Check every hour
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}

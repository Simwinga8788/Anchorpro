using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

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
                        await reportingService.SendConstructionDailyDigestAsync();

                        var alertService = scope.ServiceProvider.GetRequiredService<IAlertService>();
                        await alertService.CheckForLowMarginJobsAsync();
                        await alertService.CheckForOverdueJobsAsync();
                        await alertService.CheckForOverdueActivitiesAsync();

                        // Idempotency records only need to outlive how long a device might realistically
                        // sit offline before reconnecting — 48h comfortably covers a weekend-long outage
                        // while keeping the table from growing forever.
                        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var cutoff = DateTime.UtcNow.AddHours(-48);
                        await db.IdempotencyRecords.Where(r => r.CreatedAt < cutoff).ExecuteDeleteAsync(stoppingToken);
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

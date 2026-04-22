using AnchorPro.Data;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class AlertService : IAlertService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly IEmailService _emailService;

        public AlertService(IDbContextFactory<ApplicationDbContext> factory, IEmailService emailService)
        {
            _factory = factory;
            _emailService = emailService;
        }

        public async Task CheckForLowMarginJobsAsync()
        {
            using var context = _factory.CreateDbContext();
            // A "Low Margin" job is completed with < 15% margin
            var lowMarginJobs = await context.JobCards
                .Where(j => j.Status == JobStatus.Completed && j.ProfitMarginPercent < 15 && j.ActualEndDate > DateTime.UtcNow.AddDays(-1))
                .ToListAsync();

            foreach (var job in lowMarginJobs)
            {
                await _emailService.SendEmailAsync("management@anchorpro.com", 
                    $"⚠️ Low Margin Alert: Job #{job.JobNumber}",
                    $"Job #{job.JobNumber} completed with a margin of {job.ProfitMarginPercent}%. Action may be required to review labor or pricing.");
            }
        }

        public async Task CheckForOverdueJobsAsync()
        {
            using var context = _factory.CreateDbContext();
            var overdue = await context.JobCards
                .Where(j => j.Status != JobStatus.Completed && j.Status != JobStatus.Cancelled && j.ScheduledEndDate < DateTime.UtcNow)
                .ToListAsync();

            if (overdue.Any())
            {
                await _emailService.SendEmailAsync("ops@anchorpro.com",
                    $"🚨 Backlog Alert: {overdue.Count} Overdue Jobs",
                    $"There are currently {overdue.Count} jobs past their scheduled completion date. Efficiency is dropping.");
            }
        }

        public async Task NotifyTechnicianDelayAsync(string jobNumber, string technicianName, string reason)
        {
            await _emailService.SendEmailAsync("ops@anchorpro.com",
                $"🚨 Active Delay Reported: Job #{jobNumber}",
                $"Technician {technicianName} has reported a block on Job #{jobNumber}. Reason: {reason}. Please investigate immediately to minimize downtime.");
        }
    }
}

using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class AlertService : IAlertService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly IEmailService _emailService;
        private readonly ICurrentTenantService _tenantService;

        public AlertService(
            IDbContextFactory<ApplicationDbContext> factory,
            IEmailService emailService,
            ICurrentTenantService tenantService)
        {
            _factory = factory;
            _emailService = emailService;
            _tenantService = tenantService;
        }

        // ── Background checks (now also persist to DB) ────────────────────────

        public async Task CheckForLowMarginJobsAsync()
        {
            using var context = _factory.CreateDbContext();
            var lowMarginJobs = await context.JobCards
                .Where(j => j.Status == JobStatus.Completed
                         && j.ProfitMarginPercent < 15
                         && j.ActualEndDate > DateTime.UtcNow.AddDays(-1))
                .ToListAsync();

            foreach (var job in lowMarginJobs)
            {
                await CreateAlertAsync(
                    title: $"Low Margin: Job #{job.JobNumber}",
                    message: $"Job #{job.JobNumber} completed with {job.ProfitMarginPercent}% margin.",
                    severity: "Warning",
                    category: "LowMargin",
                    jobCardId: job.Id);

                // Fetch tenant admins / supervisors
                var tenantId = job.TenantId;
                string? recipient = null;
                if (tenantId.HasValue)
                {
                    var emails = await (from u in context.Users
                                         join ur in context.UserRoles on u.Id equals ur.UserId
                                         join r in context.Roles on ur.RoleId equals r.Id
                                         where u.TenantId == tenantId && (r.Name == "Admin" || r.Name == "Supervisor")
                                         select u.Email).ToListAsync();
                    recipient = emails.FirstOrDefault(e => !string.IsNullOrEmpty(e));
                    if (string.IsNullOrEmpty(recipient))
                    {
                        var tenant = await context.Tenants.FindAsync(tenantId.Value);
                        recipient = tenant?.ContactEmail;
                    }
                }
                recipient ??= "management@anchorpro.com";

                await _emailService.SendEmailAsync(recipient,
                    $"Low Margin Alert: Job #{job.JobNumber}",
                    $"Job #{job.JobNumber} completed with a margin of {job.ProfitMarginPercent}%.");
            }
        }

        public async Task CheckForOverdueJobsAsync()
        {
            using var context = _factory.CreateDbContext();
            var overdue = await context.JobCards
                .Where(j => j.Status != JobStatus.Completed
                         && j.Status != JobStatus.Cancelled
                         && j.ScheduledEndDate < DateTime.UtcNow)
                .ToListAsync();

            if (overdue.Any())
            {
                // Group overdue jobs by TenantId to email their respective tenant managers
                var overdueGroups = overdue.GroupBy(j => j.TenantId);
                foreach (var group in overdueGroups)
                {
                    var tenantId = group.Key;
                    var tenantJobs = group.ToList();

                    await CreateAlertAsync(
                        title: $"{tenantJobs.Count} Overdue Jobs",
                        message: $"There are {tenantJobs.Count} jobs past their scheduled completion date.",
                        severity: "Critical",
                        category: "OverdueJob");

                    string? recipient = null;
                    if (tenantId.HasValue)
                    {
                        var emails = await (from u in context.Users
                                             join ur in context.UserRoles on u.Id equals ur.UserId
                                             join r in context.Roles on ur.RoleId equals r.Id
                                             where u.TenantId == tenantId && (r.Name == "Admin" || r.Name == "Planner" || r.Name == "Supervisor")
                                             select u.Email).ToListAsync();
                        recipient = emails.FirstOrDefault(e => !string.IsNullOrEmpty(e));
                        if (string.IsNullOrEmpty(recipient))
                        {
                            var tenant = await context.Tenants.FindAsync(tenantId.Value);
                            recipient = tenant?.ContactEmail;
                        }
                    }
                    recipient ??= "ops@anchorpro.com";

                    await _emailService.SendEmailAsync(recipient,
                        $"Backlog Alert: {tenantJobs.Count} Overdue Jobs",
                        $"There are currently {tenantJobs.Count} jobs past their scheduled completion date.");
                }
            }
        }

        public async Task NotifyTechnicianDelayAsync(string jobNumber, string technicianName, string reason)
        {
            await CreateAlertAsync(
                title: $"Delay Reported: Job #{jobNumber}",
                message: $"Technician {technicianName} reported a block. Reason: {reason}",
                severity: "Warning",
                category: "TechnicianDelay");

            var tenantId = _tenantService.TenantId;
            string? recipient = null;
            using var context = _factory.CreateDbContext();
            if (tenantId.HasValue)
            {
                var emails = await (from u in context.Users
                                     join ur in context.UserRoles on u.Id equals ur.UserId
                                     join r in context.Roles on ur.RoleId equals r.Id
                                     where u.TenantId == tenantId && (r.Name == "Admin" || r.Name == "Planner" || r.Name == "Supervisor")
                                     select u.Email).ToListAsync();
                recipient = emails.FirstOrDefault(e => !string.IsNullOrEmpty(e));
                if (string.IsNullOrEmpty(recipient))
                {
                    var tenant = await context.Tenants.FindAsync(tenantId.Value);
                    recipient = tenant?.ContactEmail;
                }
            }
            recipient ??= "ops@anchorpro.com";

            await _emailService.SendEmailAsync(recipient,
                $"Active Delay Reported: Job #{jobNumber}",
                $"Technician {technicianName} reported a block on Job #{jobNumber}. Reason: {reason}.");
        }

        // ── Persistent alert CRUD ─────────────────────────────────────────────

        public async Task<List<Alert>> GetAlertsAsync(
            bool? isRead = null,
            string? category = null,
            int page = 1,
            int pageSize = 50)
        {
            using var context = _factory.CreateDbContext();
            var q = context.Alerts.AsQueryable();

            if (isRead.HasValue)
                q = q.Where(a => a.IsRead == isRead.Value);

            if (!string.IsNullOrEmpty(category))
                q = q.Where(a => a.Category == category);

            return await q
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Alerts.CountAsync(a => !a.IsRead);
        }

        public async Task<Alert> CreateAlertAsync(
            string title, string message, string severity, string category,
            int? jobCardId = null, int? customerId = null)
        {
            using var context = _factory.CreateDbContext();
            var alert = new Alert
            {
                TenantId = _tenantService.TenantId,
                Title = title,
                Message = message,
                Severity = severity,
                Category = category,
                JobCardId = jobCardId,
                CustomerId = customerId,
                CreatedAt = DateTime.UtcNow
            };
            context.Alerts.Add(alert);
            await context.SaveChangesAsync();
            return alert;
        }

        public async Task MarkAsReadAsync(int alertId, string userId)
        {
            using var context = _factory.CreateDbContext();
            var alert = await context.Alerts.FindAsync(alertId);
            if (alert == null) return;

            alert.IsRead = true;
            alert.ReadAt = DateTime.UtcNow;
            alert.ReadByUserId = userId;
            await context.SaveChangesAsync();
        }

        public async Task DismissAllAsync(string userId)
        {
            using var context = _factory.CreateDbContext();
            var unread = await context.Alerts.Where(a => !a.IsRead).ToListAsync();
            var now = DateTime.UtcNow;
            foreach (var alert in unread)
            {
                alert.IsRead = true;
                alert.ReadAt = now;
                alert.ReadByUserId = userId;
            }
            await context.SaveChangesAsync();
        }
    }
}

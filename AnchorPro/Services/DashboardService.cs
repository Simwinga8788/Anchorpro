using AnchorPro.Data;
using AnchorPro.Data.Enums;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Models;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly ICurrentTenantService _tenant;

        public DashboardService(IDbContextFactory<ApplicationDbContext> factory, ICurrentTenantService tenant)
        {
            _factory = factory;
            _tenant  = tenant;
        }

        private int? TenantId => _tenant.TenantId;

        public async Task<DashboardStats> GetDashboardStatsAsync()
        {
            using var context = _factory.CreateDbContext();
            var today = DateTime.UtcNow.Date;

            // Run these efficiently
            var stats = new DashboardStats();

            stats.JobsScheduledToday = await context.JobCards
                .CountAsync(j => j.TenantId == TenantId && j.Status == JobStatus.Scheduled && j.ScheduledStartDate.HasValue && j.ScheduledStartDate.Value.Date == today);

            stats.JobsInProgress = await context.JobCards
                .CountAsync(j => j.TenantId == TenantId && j.Status == JobStatus.InProgress);

            stats.JobsCompletedToday = await context.JobCards
                .CountAsync(j => j.TenantId == TenantId && j.Status == JobStatus.Completed && j.UpdatedAt.HasValue && j.UpdatedAt.Value.Date == today);

            // Active Techs: Technicians who have at least one InProgress job
            stats.ActiveTechnicians = await context.JobCards
                .Where(j => j.TenantId == TenantId && j.Status == JobStatus.InProgress && j.AssignedTechnicianId != null)
                .Select(j => j.AssignedTechnicianId)
                .Distinct()
                .CountAsync();

            stats.OverdueJobs = await context.JobCards
                .CountAsync(j => j.TenantId == TenantId && j.Status != JobStatus.Completed && j.Status != JobStatus.Cancelled
                                 && j.ScheduledEndDate.HasValue && j.ScheduledEndDate.Value < DateTime.UtcNow);

            // 3.2 Delayed Job: Status is OnHold OR has active (open-ended) DowntimeEntry
            stats.DelayedJobs = await context.JobCards
                .CountAsync(j => j.TenantId == TenantId && (j.Status == JobStatus.OnHold ||
                                 j.JobTasks.Any(t => t.DowntimeEntries.Any(d => !d.EndTime.HasValue))));

            stats.RecentActivity = await context.JobCards
                .Where(j => j.TenantId == TenantId)
                .Include(j => j.JobType)
                .Include(j => j.Equipment)
                .Include(j => j.AssignedTechnician)
                .OrderByDescending(j => j.UpdatedAt)
                .Take(5)
                .AsNoTracking()
                .ToListAsync();

            var distribution = await context.JobCards
                .Where(j => j.TenantId == TenantId)
                .Include(j => j.JobType)
                .GroupBy(j => j.JobType != null ? j.JobType.Name : "Unassigned")
                .Select(g => new JobTypeStat { JobTypeName = g.Key, Count = g.Count() })
                .ToListAsync();

            stats.JobTypeDistribution = distribution;

            stats.TotalJobs = await context.JobCards.CountAsync(j => j.TenantId == TenantId);
            stats.CompletedJobs = await context.JobCards.CountAsync(j => j.TenantId == TenantId && j.Status == JobStatus.Completed);

            // Fetch Active Breakdowns (Corrective, Emergency, or Repair that are not completed)
            stats.ActiveBreakdowns = await context.JobCards
                .Where(j => j.TenantId == TenantId && j.Status != JobStatus.Completed && j.Status != JobStatus.Cancelled)
                .Include(j => j.JobType)
                .Include(j => j.Equipment)
                .Where(j => j.JobType.Name.Contains("Corrective") || j.JobType.Name.Contains("Emergency") || j.JobType.Name.Contains("Repair"))
                .OrderByDescending(j => j.CreatedAt)
                .ToListAsync();
            
            stats.ActiveBreakdownsCount = stats.ActiveBreakdowns.Count;

            return stats;
        }

        public async Task<PerformanceMetrics> GetPerformanceMetricsAsync(int days = 30)
        {
            using var context = _factory.CreateDbContext();
            var startDate = DateTime.UtcNow.AddDays(-days);

            // Fetch completed jobs in the period with related tasks and downtime for Net Calculation
            var completedJobs = await context.JobCards
                .Where(j => j.TenantId == TenantId && j.Status == JobStatus.Completed && j.ActualEndDate >= startDate)
                .Select(j => new 
                {
                    j.JobNumber,
                    j.Description,
                    j.CreatedAt,
                    j.ActualStartDate,
                    j.ScheduledStartDate,
                    j.ScheduledEndDate,
                    j.ActualEndDate,
                    AssignedTechnician = j.AssignedTechnician != null ? new { j.AssignedTechnician.UserName } : null,
                    Equipment = j.Equipment != null ? new { j.Equipment.Name } : null,
                    JobType = j.JobType != null ? new { j.JobType.Name } : null,
                    DowntimeMinutes = j.JobTasks.SelectMany(t => t.DowntimeEntries).Sum(d => d.DurationMinutes)
                })
                .ToListAsync();

            var metrics = new PerformanceMetrics
            {
                CompletedJobsInPeriod = completedJobs.Count,
                ActiveJobsCount = await context.JobCards.CountAsync(j => j.TenantId == TenantId && j.Status == JobStatus.InProgress),
                OverdueJobsCount = await context.JobCards.CountAsync(j => j.TenantId == TenantId && j.Status != JobStatus.Completed && j.Status != JobStatus.Cancelled
                                              && j.ScheduledEndDate.HasValue && j.ScheduledEndDate.Value < DateTime.UtcNow)
            };

            if (completedJobs.Any())
            {
                // 1.3 Total Lead Time (Gross Duration)
                var grossLeadTimes = completedJobs
                    .Where(j => j.ActualStartDate.HasValue && j.ActualEndDate.HasValue)
                    .Select(j => (j.ActualEndDate.Value - j.ActualStartDate.Value).TotalHours)
                    .ToList();

                if (grossLeadTimes.Any())
                    metrics.AvgLeadTimeHours = Math.Round(grossLeadTimes.Average(), 1);

                // On-Time Calculation (ActualEndDate <= ScheduledEndDate)
                var onTimeCount = completedJobs.Count(j => j.ScheduledEndDate.HasValue && j.ActualEndDate.HasValue
                                                           && j.ActualEndDate.Value <= j.ScheduledEndDate.Value);

                metrics.OnTimeCompletionPercentage = Math.Round((double)onTimeCount / completedJobs.Count * 100, 1);

                // 1.1 Job Duration (Net Processing Time)
                metrics.JobTimings = completedJobs
                    .Where(j => j.ActualEndDate.HasValue)
                    .OrderByDescending(j => j.ActualEndDate)
                    .Take(50)
                    .Select(j => 
                    {
                        var start = j.ActualStartDate ?? j.ScheduledStartDate ?? j.CreatedAt;
                        var grossDuration = (j.ActualEndDate!.Value - start).TotalHours;
                        var netDuration = Math.Max(0, grossDuration - (j.DowntimeMinutes / 60.0));

                        return new JobTimingData
                        {
                            JobNumber = j.JobNumber,
                            Description = j.Description,
                            CompletedAt = j.ActualEndDate!.Value,
                            ActualDurationHours = Math.Round(netDuration, 1), // Net as defined in 1.1
                            PlannedDurationHours = j.ScheduledStartDate.HasValue && j.ScheduledEndDate.HasValue
                                ? Math.Round((j.ScheduledEndDate.Value - j.ScheduledStartDate.Value).TotalHours, 1)
                                : 0,
                            LeadTimeHours = Math.Round(grossDuration, 1) // Gross as defined in 1.3
                        };
                    })
                    .ToList();

                // 2.1 Technician Utilization (Based on Job Duration - Net)
                var techGroups = completedJobs
                    .Where(j => j.AssignedTechnician != null && j.ActualEndDate.HasValue)
                    .GroupBy(j => j.AssignedTechnician!.UserName);

                foreach (var group in techGroups)
                {
                    double totalNetHours = group.Sum(j => 
                    {
                        var start = j.ActualStartDate ?? j.ScheduledStartDate ?? j.CreatedAt;
                        var gross = (j.ActualEndDate!.Value - start).TotalHours;
                        var net = gross - (j.DowntimeMinutes / 60.0);
                        return net > 0 ? net : 0.5; // Floor at 0.5h if clean net is tiny
                    });

                    double availableHours = days * 8.0; // Standard 8h shift per definition 2.1

                    metrics.TechnicianStats.Add(new TechnicianStat
                    {
                        TechnicianName = group.Key ?? "Unknown",
                        JobsCompleted = group.Count(),
                        TotalHoursWorked = Math.Round(totalNetHours, 1),
                        AvgJobTimeHours = Math.Round(totalNetHours / group.Count(), 1),
                        UtilizationPercentage = Math.Round((totalNetHours / availableHours) * 100, 1)
                    });
                }

                // 2.2 Equipment Utilization
                var equipGroups = completedJobs
                    .Where(j => j.Equipment != null && j.ActualEndDate.HasValue)
                    .GroupBy(j => j.Equipment!.Name);

                double periodHours = days * 8.0; // Per definition 2.2: Context defaults to 8-hour shift unless specified

                foreach (var group in equipGroups)
                {
                    double totalNetMaintHours = group.Sum(j => 
                    {
                        var start = j.ActualStartDate ?? j.ScheduledStartDate ?? j.CreatedAt;
                        var gross = (j.ActualEndDate!.Value - start).TotalHours;
                        return Math.Max(0, gross - (j.DowntimeMinutes / 60.0));
                    });

                    // Identify breakdowns per 3.1 context
                    var breakdowns = group.Where(j => j.JobType?.Name.Contains("Corrective", StringComparison.OrdinalIgnoreCase) == true
                                                    || j.JobType?.Name.Contains("Emergency", StringComparison.OrdinalIgnoreCase) == true
                                                    || j.JobType?.Name.Contains("Repair", StringComparison.OrdinalIgnoreCase) == true).ToList();

                    double mtbf = 0;
                    double mttr = 0;
                    DateTime? nextFailureDate = null;

                    if (breakdowns.Any())
                    {
                        mttr = breakdowns.Average(j => 
                        {
                             var start = j.ActualStartDate ?? j.ScheduledStartDate ?? j.CreatedAt;
                             return (j.ActualEndDate!.Value - start).TotalHours;
                        });
                        
                        double operatingHours = Math.Max(0, (days * 24.0) - group.Sum(j => (j.ActualEndDate!.Value - (j.ActualStartDate ?? j.CreatedAt)).TotalHours));
                        if (breakdowns.Count > 0)
                        {
                            mtbf = operatingHours / breakdowns.Count;
                            var lastFailure = breakdowns.OrderByDescending(j => j.ActualEndDate).FirstOrDefault();
                            if (lastFailure != null && mtbf > 0) nextFailureDate = lastFailure.ActualEndDate!.Value.AddHours(mtbf);
                        }
                    }

                    metrics.EquipmentStats.Add(new EquipmentStat
                    {
                        EquipmentName = group.Key,
                        MaintenanceJobsCount = group.Count(),
                        TotalMaintenanceHours = Math.Round(totalNetMaintHours, 1),
                        BreakdownCount = breakdowns.Count,
                        MTTR_Hours = Math.Round(mttr, 1),
                        MTBF_Hours = Math.Round(mtbf, 1),
                        PredictedNextFailure = nextFailureDate,
                        UtilizationPercentage = Math.Round((totalNetMaintHours / periodHours) * 100, 1)
                    });
                }

                // Calculate Daily Trends
                var trendGroups = completedJobs
                    .GroupBy(j => j.ActualEndDate!.Value.Date)
                    .OrderBy(g => g.Key);

                for (int i = 0; i < days; i++)
                {
                    var d = startDate.AddDays(i).Date;
                    var count = trendGroups.FirstOrDefault(g => g.Key == d)?.Count() ?? 0;
                    metrics.CompletionTrend.Add(new DailyJobTrend { Date = d, CompletedCount = count });
                }

                // 1.2 Downtime Duration
                var allDowntime = await context.DowntimeEntries
                    .Where(d => d.StartTime >= startDate && d.JobTask!.JobCard!.TenantId == TenantId)
                    .Include(d => d.DowntimeCategory)
                    .AsNoTracking()
                    .ToListAsync();

                var downtimeGroups = allDowntime
                    .Where(d => d.DowntimeCategory != null)
                    .GroupBy(d => d.DowntimeCategory!.Name);

                foreach (var group in downtimeGroups)
                {
                    double totalHours = group.Sum(d => d.DurationMinutes) / 60.0;
                    metrics.GlobalDowntime.Add(new DowntimeBreakdown
                    {
                        Category = group.Key,
                        OccurrenceCount = group.Count(),
                        TotalDurationHours = Math.Round(totalHours, 1) // Def 1.2
                    });
                }
            }

            return metrics;
        }

        public async Task<EquipmentStat?> GetEquipmentPerformanceAsync(int equipmentId, int days = 30)
        {
            var metrics = await GetPerformanceMetricsAsync(days);
            using var context = _factory.CreateDbContext();
            var equipment = await context.Equipment.FindAsync(equipmentId);
            if (equipment == null) return null;

            return metrics.EquipmentStats.FirstOrDefault(e => e.EquipmentName == equipment.Name);
        }

        public async Task<SystemHealth> GetSystemHealthAsync()
        {
            var health = new SystemHealth();
            
            try
            {
                var process = System.Diagnostics.Process.GetCurrentProcess();
                health.MemoryUsageMB = Math.Round(process.WorkingSet64 / 1024.0 / 1024.0, 2);
                health.Uptime = DateTime.Now - process.StartTime;
                health.OSVersion = Environment.OSVersion.ToString();
                health.ProcessorCount = Environment.ProcessorCount;
                health.ServerTime = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC");

                using var context = _factory.CreateDbContext();
                health.DatabaseConnection = await context.Database.CanConnectAsync();

                health.EntityCounts.Add("Equipment", await context.Equipment.CountAsync());
                health.EntityCounts.Add("JobCards", await context.JobCards.CountAsync());
                health.EntityCounts.Add("JobTasks", await context.JobTasks.CountAsync());
                health.EntityCounts.Add("Users", await context.Users.CountAsync());
                health.EntityCounts.Add("InventoryItems", await context.InventoryItems.CountAsync());
                health.EntityCounts.Add("DowntimeEntries", await context.DowntimeEntries.CountAsync());
            }
            catch (Exception ex)
            {
                health.DatabaseConnection = false;
                // Log elsewhere
            }

            return health;
        }
        public async Task<ExecutiveSnapshot> GetExecutiveSnapshotAsync()
        {
            using var context = _factory.CreateDbContext();
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1);

            var snapshot = new ExecutiveSnapshot();

            // 🟢 1. Revenue & Outstanding (Financial Layer)
            var currentMonthInvoices = await context.Invoices
                .Where(i => i.TenantId == TenantId && i.InvoiceDate >= monthStart)
                .AsNoTracking()
                .ToListAsync();

            snapshot.RevenueMTD = currentMonthInvoices.Sum(i => i.Total);

            var allOutstanding = await context.Invoices
                .Where(i => i.TenantId == TenantId && i.Balance > 0)
                .SumAsync(i => i.Balance);
            snapshot.OutstandingInvoices = allOutstanding;

            // 🔵 2. Gross Margin (Estimated)
            var completedJobsMonth = await context.JobCards
                .Where(j => j.TenantId == TenantId && j.Status == JobStatus.Completed && j.ActualEndDate >= monthStart)
                .Select(j => new { j.TotalCost, j.InvoiceAmount, j.LaborCost, j.PartsCost, j.DirectPurchaseCost, j.SubcontractingCost, j.ActualStartDate, j.ActualEndDate, j.CreatedAt, j.ScheduledStartDate, DowntimeMinutes = j.JobTasks.SelectMany(t => t.DowntimeEntries).Sum(d => d.DurationMinutes) })
                .AsNoTracking()
                .ToListAsync();

            decimal totalCost = completedJobsMonth.Sum(j => j.TotalCost);
            decimal totalRevenueFromJobs = completedJobsMonth.Sum(j => j.InvoiceAmount);
            
            if (totalRevenueFromJobs > 0)
            {
                snapshot.GrossMarginPercent = Math.Round(((totalRevenueFromJobs - totalCost) / totalRevenueFromJobs) * 100, 1);
            }

            snapshot.LaborCostTotal = completedJobsMonth.Sum(j => j.LaborCost);
            snapshot.PartsCostTotal = completedJobsMonth.Sum(j => j.PartsCost);
            snapshot.DirectPurchaseCostTotal = completedJobsMonth.Sum(j => j.DirectPurchaseCost);
            snapshot.SubcontractingCostTotal = completedJobsMonth.Sum(j => j.SubcontractingCost);

            // 📦 3. Operational MTTR (Definition 1.1 - Net)
            var netDurations = completedJobsMonth
                .Where(j => j.ActualEndDate.HasValue)
                .Select(j => {
                    var start = j.ActualStartDate ?? j.ScheduledStartDate ?? j.CreatedAt;
                    var gross = (j.ActualEndDate!.Value - start).TotalHours;
                    return Math.Max(0, gross - (j.DowntimeMinutes / 60.0));
                })
                .ToList();

            if (netDurations.Any())
                snapshot.AverageMTTR = Math.Round(netDurations.Average(), 1);

            var topDowntimeAsset = await context.DowntimeEntries
                .Where(d => d.StartTime >= monthStart && d.JobTask!.JobCard!.TenantId == TenantId)
                .Select(d => new { 
                    EquipName = d.JobTask != null && d.JobTask.JobCard != null && d.JobTask.JobCard.Equipment != null 
                        ? d.JobTask.JobCard.Equipment.Name 
                        : "Unknown", 
                    Dur = d.DurationMinutes 
                })
                .GroupBy(x => x.EquipName)
                .Select(g => new { Name = g.Key, TotalMins = g.Sum(x => x.Dur) })
                .OrderByDescending(x => x.TotalMins)
                .FirstOrDefaultAsync();

            snapshot.HighestDowntimeAsset = topDowntimeAsset?.Name ?? "None";

            // 👥 4. Technician Utilization (Definition 2.1)
            var techCount = await context.Users.CountAsync(u => u.TenantId == TenantId);
            if (techCount > 0)
            {
                double totalNetHoursWorked = netDurations.Sum();
                double availableHours = 30 * 8.0 * techCount;
                snapshot.TechnicianUtilization = Math.Round((totalNetHoursWorked / availableHours) * 100, 1);
            }

            snapshot.ActiveJobs = await context.JobCards.CountAsync(j => j.TenantId == TenantId && j.Status == JobStatus.InProgress);
            snapshot.SafetyIncidents = await context.PermitsToWork.CountAsync(p => p.TenantId == TenantId && p.Status == PermitStatus.Suspended);

            return snapshot;
        }

        public async Task<List<DepartmentalSnapshot>> GetDepartmentalSnapshotAsync()
        {
            using var context = _factory.CreateDbContext();
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1);

            // Fetch departments with their equipment and related jobs
            var depts = await context.Departments
                .AsNoTracking()
                .ToListAsync();

            var snapshots = new List<DepartmentalSnapshot>();

            foreach (var d in depts)
            {
                var jobData = await context.JobCards
                    .Where(j => j.TenantId == TenantId && j.Equipment != null && j.Equipment.DepartmentId == d.Id && j.CreatedAt >= monthStart)
                    .Select(j => new 
                    { 
                        j.Status, 
                        j.TotalCost, 
                        j.ActualStartDate, 
                        j.ActualEndDate, 
                        PermitStatus = j.PermitToWork != null ? (PermitStatus?)j.PermitToWork.Status : null 
                    })
                    .ToListAsync();

                var completed = jobData.Where(j => j.Status == JobStatus.Completed && j.ActualStartDate.HasValue && j.ActualEndDate.HasValue).ToList();
                
                var snapshot = new DepartmentalSnapshot
                {
                    DepartmentName = d.Name,
                    JobCount = jobData.Count,
                    TotalCost = jobData.Sum(j => j.TotalCost),
                    SafetyFlags = jobData.Count(j => j.PermitStatus == PermitStatus.Suspended),
                    AverageResolutionTime = completed.Any() 
                        ? Math.Round(completed.Average(j => (j.ActualEndDate!.Value - j.ActualStartDate!.Value).TotalHours), 1) 
                        : 0
                };

                snapshots.Add(snapshot);
            }

            return snapshots.OrderByDescending(s => s.JobCount).ToList();
        }
    }
}

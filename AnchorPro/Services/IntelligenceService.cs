using AnchorPro.Data;
using AnchorPro.Data.Enums;
using AnchorPro.Data.Models.Intelligence;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class IntelligenceService : IIntelligenceService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public IntelligenceService(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        public async Task<List<JobProfitabilityReport>> GetProfitabilityReportAsync(DateTime startDate, DateTime endDate)
        {
            using var context = _factory.CreateDbContext();
            return await context.JobCards
                .Where(j => j.Status == JobStatus.Completed && j.ActualEndDate >= startDate && j.ActualEndDate <= endDate)
                .Include(j => j.Customer)
                .Select(j => new JobProfitabilityReport
                {
                    JobId = j.Id,
                    JobNumber = j.JobNumber,
                    Description = j.Description,
                    CustomerName = j.Customer != null ? j.Customer.Name : "Walk-in/Unknown",
                    Revenue = j.InvoiceAmount,
                    TotalCost = j.TotalCost,
                    Profit = j.Profit,
                    MarginPercent = j.ProfitMarginPercent,
                    CompletedAt = j.ActualEndDate ?? DateTime.UtcNow
                })
                .OrderByDescending(r => r.Profit)
                .ToListAsync();
        }

        public async Task<List<TechUtilizationReport>> GetTechnicianUtilizationAsync(DateTime startDate, DateTime endDate)
        {
            using var context = _factory.CreateDbContext();
            
            // Note: In a real system, we'd have a shift table. Here we assume 8h/day excluding weekends.
            var daysCount = (endDate - startDate).TotalDays;
            if (daysCount < 1) daysCount = 1;
            var availableHours = daysCount * 8.0;

            // Fetch summary data to memory to avoid translation issues with TotalHours calculation in SQL
            var data = await context.JobCards
                .Where(j => j.Status == JobStatus.Completed && j.ActualEndDate >= startDate && j.ActualEndDate <= endDate)
                .Select(j => new
                {
                    j.AssignedTechnicianId,
                    FirstName = j.AssignedTechnician != null ? j.AssignedTechnician.FirstName : "Unassigned",
                    LastName = j.AssignedTechnician != null ? j.AssignedTechnician.LastName : "",
                    j.ActualStartDate,
                    j.ActualEndDate,
                    j.LaborCost
                })
                .ToListAsync();

            var stats = data
                .GroupBy(j => new { j.AssignedTechnicianId, TechName = j.FirstName + (string.IsNullOrEmpty(j.LastName) ? "" : " " + j.LastName) })
                .Select(g => new TechUtilizationReport
                {
                    TechnicianId = g.Key.AssignedTechnicianId ?? "Unknown",
                    TechnicianName = g.Key.TechName ?? "Unknown",
                    TotalJobs = g.Count(),
                    HoursWorked = g.Sum(j => j.ActualStartDate.HasValue && j.ActualEndDate.HasValue ? (j.ActualEndDate.Value - j.ActualStartDate.Value).TotalHours : 0),
                    TotalLaborCost = g.Sum(j => j.LaborCost)
                })
                .ToList();

            foreach (var s in stats)
            {
                s.UtilizationPercent = Math.Round((decimal)(s.HoursWorked / availableHours) * 100, 2);
            }

            return stats;
        }

        public async Task<List<RevenueByCustomerReport>> GetRevenueByCustomerAsync(DateTime startDate, DateTime endDate)
        {
            using var context = _factory.CreateDbContext();
            var totalRevenue = await context.JobCards
                .Where(j => j.Status == JobStatus.Completed && j.ActualEndDate >= startDate && j.ActualEndDate <= endDate)
                .SumAsync(j => j.InvoiceAmount);

            var report = await context.JobCards
                .Where(j => j.Status == JobStatus.Completed && j.ActualEndDate >= startDate && j.ActualEndDate <= endDate)
                .Include(j => j.Customer)
                .GroupBy(j => j.Customer != null ? j.Customer.Name : "Walk-in/Internal")
                .Select(g => new RevenueByCustomerReport
                {
                    CustomerName = g.Key,
                    JobCount = g.Count(),
                    TotalRevenue = g.Sum(j => j.InvoiceAmount),
                    TotalCost = g.Sum(j => j.TotalCost),
                    TotalProfit = g.Sum(j => j.Profit)
                })
                .OrderByDescending(r => r.TotalRevenue)
                .ToListAsync();

            if (totalRevenue > 0)
            {
                foreach (var r in report)
                {
                    r.ConcentrationPercent = Math.Round((r.TotalRevenue / totalRevenue) * 100, 2);
                }
            }

            return report;
        }

        public async Task<List<AssetPerformanceReport>> GetAssetPerformanceAsync(DateTime startDate, DateTime endDate)
        {
            using var context = _factory.CreateDbContext();
            var periodHours = (endDate - startDate).TotalHours;

            // Fetch to memory to handle complex calculations and string filtering
            var data = await context.JobCards
                .Where(j => j.Status == JobStatus.Completed && j.ActualEndDate >= startDate && j.ActualEndDate <= endDate)
                .Select(j => new
                {
                    j.EquipmentId,
                    EquipmentName = j.Equipment != null ? j.Equipment.Name : "Unknown",
                    TypeName = j.JobType != null ? j.JobType.Name : "",
                    j.ActualStartDate,
                    j.ActualEndDate,
                    j.TotalCost
                })
                .ToListAsync();

            var report = data
                .GroupBy(j => new { j.EquipmentId, j.EquipmentName })
                .Select(g => new AssetPerformanceReport
                {
                    EquipmentId = g.Key.EquipmentId,
                    EquipmentName = g.Key.EquipmentName,
                    TotalMaintenanceCost = g.Sum(j => j.TotalCost),
                    FailureCount = g.Count(j => j.TypeName.Contains("Corrective") || j.TypeName.Contains("Emergency")),
                    MTTR = g.Any() ? g.Average(j => j.ActualStartDate.HasValue && j.ActualEndDate.HasValue ? (j.ActualEndDate.Value - j.ActualStartDate.Value).TotalHours : 0) : 0
                })
                .ToList();

            // Calculate Downtime % (approximated from job duration)
            foreach (var r in report)
            {
                var totalDowntimeHours = await context.DowntimeEntries
                    .Where(d => d.JobTask!.JobCard!.EquipmentId == r.EquipmentId && d.StartTime >= startDate)
                    .SumAsync(d => d.DurationMinutes) / 60.0;
                
                r.DowntimePercent = Math.Round((totalDowntimeHours / periodHours) * 100, 2);
            }

            return report;
        }

        public async Task<List<InventoryConsumptionReport>> GetInventoryConsumptionAsync(DateTime startDate, DateTime endDate)
        {
            using var context = _factory.CreateDbContext();
            
            var data = await context.JobCardParts
                .Where(p => p.JobCard!.Status == JobStatus.Completed && p.JobCard.ActualEndDate >= startDate && p.JobCard.ActualEndDate <= endDate)
                .Select(p => new
                {
                    PartName = p.InventoryItem != null ? p.InventoryItem.Name : "Unknown Item",
                    p.QuantityUsed,
                    p.UnitCostSnapshot,
                    p.JobCardId
                })
                .ToListAsync();

            return data
                .GroupBy(p => p.PartName)
                .Select(g => new InventoryConsumptionReport
                {
                    PartName = g.Key,
                    QuantityUsed = g.Sum(p => p.QuantityUsed),
                    TotalConsumptionCost = g.Sum(p => p.QuantityUsed * p.UnitCostSnapshot),
                    JobsImpacted = g.Select(p => p.JobCardId).Distinct().Count(),
                    AvgUnitCost = g.Any() ? g.Average(p => p.UnitCostSnapshot) : 0
                })
                .OrderByDescending(r => r.TotalConsumptionCost)
                .ToList();
        }

        public async Task<ExecutiveKpiSummary> GetExecutiveSummaryAsync()
        {
            using var context = _factory.CreateDbContext();
            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            
            var completedThisMonth = await context.JobCards
                .Where(j => j.Status == JobStatus.Completed && j.ActualEndDate >= startOfMonth)
                .ToListAsync();

            var summary = new ExecutiveKpiSummary
            {
                MonthlyRevenue = completedThisMonth.Sum(j => j.InvoiceAmount),
                MonthlyProfit = completedThisMonth.Sum(j => j.Profit),
                ActiveJobsCount = await context.JobCards.CountAsync(j => j.Status == JobStatus.InProgress),
                OverdueJobsCount = await context.JobCards.CountAsync(j => j.Status != JobStatus.Completed && j.Status != JobStatus.Cancelled && j.ScheduledEndDate < DateTime.UtcNow)
            };

            if (summary.MonthlyRevenue > 0)
            {
                summary.AvgMarginPercent = Math.Round((summary.MonthlyProfit / summary.MonthlyRevenue) * 100, 2);
            }

            if (completedThisMonth.Any())
            {
                summary.AvgCompletionTimeHours = Math.Round(completedThisMonth.Average(j => 
                    j.ActualStartDate.HasValue && j.ActualEndDate.HasValue ? (j.ActualEndDate.Value - j.ActualStartDate.Value).TotalHours : 0), 1);
            }

            return summary;
        }

        public async Task<List<SubcontractorDependencyReport>> GetSubcontractorDependencyAsync(DateTime startDate, DateTime endDate)
        {
            using var context = _factory.CreateDbContext();

            // Total operational cost during period
            var totalSpend = await context.JobCards
                .Where(j => j.Status == JobStatus.Completed && j.ActualEndDate >= startDate && j.ActualEndDate <= endDate)
                .SumAsync(j => j.TotalCost);

            var rawData = await context.JobCards
                .Where(j => j.Status == JobStatus.Completed && j.ActualEndDate >= startDate && j.ActualEndDate <= endDate && j.SubcontractingCost > 0)
                // Note: Assuming supplier is tracked via PurchaseOrders or a specific Supplier table. If not explicitly linked in JobCard natively, 
                // we'll group them as "External Subcontractors".
                .Select(j => new
                {
                    j.Id,
                    j.SubcontractingCost,
                    // Note: If you want to link specific suppliers, we need PurchaseOrders tied to the JobCard.
                    // For now we assume a general tracking of "SubcontractingCost"
                })
                .ToListAsync();

            var report = new SubcontractorDependencyReport
            {
                SupplierName = "All External Subcontractors",
                TotalSubcontractingSpend = rawData.Sum(x => x.SubcontractingCost),
                JobCount = rawData.Count,
                PercentageOfTotalSpend = totalSpend > 0 ? Math.Round((rawData.Sum(x => x.SubcontractingCost) / totalSpend) * 100, 2) : 0
            };

            return new List<SubcontractorDependencyReport> { report };
        }

        public async Task<List<DowntimeBottleneckReport>> GetDowntimeBottlenecksAsync(DateTime startDate, DateTime endDate)
        {
            using var context = _factory.CreateDbContext();
            
            var downtimeEntries = await context.DowntimeEntries
                .Include(d => d.DowntimeCategory)
                .Where(d => d.StartTime >= startDate && d.StartTime <= endDate)
                .ToListAsync();

            var totalDowntimeMinutes = downtimeEntries.Sum(d => d.DurationMinutes);

            return downtimeEntries
                .GroupBy(d => d.DowntimeCategory != null ? d.DowntimeCategory.Name : "Uncategorized")
                .Select(g => new DowntimeBottleneckReport
                {
                    CategoryName = g.Key,
                    TotalDowntimeHours = Math.Round(g.Sum(d => d.DurationMinutes) / 60.0, 2),
                    Occurrences = g.Count(),
                    PercentageOfTotalDowntime = totalDowntimeMinutes > 0 ? Math.Round((decimal)g.Sum(d => d.DurationMinutes) / (decimal)totalDowntimeMinutes * 100, 2) : 0
                })
                .OrderByDescending(r => r.TotalDowntimeHours)
                .ToList();
        }
    }
}

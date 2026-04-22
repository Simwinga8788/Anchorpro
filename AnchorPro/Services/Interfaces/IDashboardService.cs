using AnchorPro.Data.Models;

namespace AnchorPro.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardStats> GetDashboardStatsAsync();
        Task<PerformanceMetrics> GetPerformanceMetricsAsync(int days = 30);
        Task<EquipmentStat?> GetEquipmentPerformanceAsync(int equipmentId, int days = 30);
        Task<SystemHealth> GetSystemHealthAsync();
        Task<ExecutiveSnapshot> GetExecutiveSnapshotAsync();
        Task<List<DepartmentalSnapshot>> GetDepartmentalSnapshotAsync();
    }

    public class ExecutiveSnapshot
    {
        public decimal RevenueMTD { get; set; }
        public decimal GrossMarginPercent { get; set; }
        public decimal OutstandingInvoices { get; set; }
        public double AverageMTTR { get; set; } // Hours
        public string? HighestDowntimeAsset { get; set; }
        public double TechnicianUtilization { get; set; } // Percentage
        public int ActiveJobs { get; set; }
        public int SafetyIncidents { get; set; }

        // Cost Trinity Breakdown
        public decimal LaborCostTotal { get; set; }
        public decimal PartsCostTotal { get; set; }
        public decimal DirectPurchaseCostTotal { get; set; }
        public decimal SubcontractingCostTotal { get; set; }
    }

    public class DepartmentalSnapshot
    {
        public string DepartmentName { get; set; } = string.Empty;
        public int JobCount { get; set; }
        public decimal TotalCost { get; set; }
        public double AverageResolutionTime { get; set; }
        public int SafetyFlags { get; set; }
    }
}

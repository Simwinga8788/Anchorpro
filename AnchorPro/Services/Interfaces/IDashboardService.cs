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
        Task<ProjectDashboardSnapshot?> GetProjectSnapshotAsync(int projectId);
    }

    /// <summary>
    /// Construction-specific project snapshot — cost, progress, certificate and safety status —
    /// rolled up from BOQ/Certificate/Variation/Schedule/Safety data rather than generic job costing.
    /// </summary>
    public class ProjectDashboardSnapshot
    {
        public int ProjectId { get; set; }
        public decimal ContractSum { get; set; }
        public decimal GrossValuationToDate { get; set; }
        public decimal NetCertifiedPayable { get; set; }
        public decimal PercentComplete { get; set; }
        public string? LatestCertificateNumber { get; set; }
        public string? LatestCertificateStatus { get; set; }
        public int OpenVariationsCount { get; set; }
        public int ActivePermitsCount { get; set; }
        public decimal PermitCompliancePercent { get; set; }
        public string? NextMilestoneTitle { get; set; }
        public DateTime? NextMilestoneDate { get; set; }
        public int SafetyIncidentsThisMonth { get; set; }
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

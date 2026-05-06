using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class ReportDefinition : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public ReportType Type { get; set; }

        [Required]
        [MaxLength(50)]
        public string CronSchedule { get; set; } = "0 8 1 * *"; // Default: 1st of month at 8am

        [Required]
        public string Recipients { get; set; } = string.Empty; // Comma separated emails

        public DateTime? LastRun { get; set; }
        public DateTime? NextRun { get; set; }

        public bool IsEnabled { get; set; } = true;

        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }
    }

    public enum ReportType
    {
        MonthlyMaintenanceSummary,
        AssetPerformance,
        TechnicianProductivity,
        CostAnalysis,
        ProcurementSummary,
        DepartmentalAudit
    }
}

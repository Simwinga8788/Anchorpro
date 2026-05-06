using System;

namespace AnchorPro.Data.Models.Intelligence
{
    public class JobProfitabilityReport
    {
        public int JobId { get; set; }
        public string JobNumber { get; set; } = "";
        public string CustomerName { get; set; } = "Generic";
        public string Description { get; set; } = "";
        public decimal Revenue { get; set; }
        public decimal TotalCost { get; set; }
        public decimal Profit { get; set; }
        public decimal MarginPercent { get; set; }
        public DateTime CompletedAt { get; set; }
    }

    public class TechUtilizationReport
    {
        public string TechnicianId { get; set; } = "";
        public string TechnicianName { get; set; } = "";
        public int TotalJobs { get; set; }
        public double HoursWorked { get; set; }
        public decimal TotalLaborCost { get; set; }
        public decimal UtilizationPercent { get; set; }
    }

    public class RevenueByCustomerReport
    {
        public string CustomerName { get; set; } = "";
        public int JobCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCost { get; set; }
        public decimal TotalProfit { get; set; }
        public decimal ConcentrationPercent { get; set; }
    }

    public class AssetPerformanceReport
    {
        public int EquipmentId { get; set; }
        public string EquipmentName { get; set; } = "";
        public double DowntimePercent { get; set; }
        public decimal TotalMaintenanceCost { get; set; }
        public int FailureCount { get; set; }
        public double MTTR { get; set; } // Mean Time To Repair
    }

    public class InventoryConsumptionReport
    {
        public string PartName { get; set; } = "";
        public int QuantityUsed { get; set; }
        public decimal TotalConsumptionCost { get; set; }
        public decimal AvgUnitCost { get; set; }
        public int JobsImpacted { get; set; }
    }

    public class ExecutiveKpiSummary
    {
        public decimal MonthlyRevenue { get; set; }
        public decimal MonthlyProfit { get; set; }
        public decimal AvgMarginPercent { get; set; }
        public int ActiveJobsCount { get; set; }
        public int OverdueJobsCount { get; set; }
        public double AvgCompletionTimeHours { get; set; }
    }
}

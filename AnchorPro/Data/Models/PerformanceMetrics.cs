namespace AnchorPro.Data.Models
{
    public class PerformanceMetrics
    {
        public double AvgLeadTimeHours { get; set; }
        public double OnTimeCompletionPercentage { get; set; }
        public int ActiveJobsCount { get; set; }
        public int OverdueJobsCount { get; set; }
        public int CompletedJobsInPeriod { get; set; } // e.g. last 30 days

        public List<JobTimingData> JobTimings { get; set; } = new();
        public List<TechnicianStat> TechnicianStats { get; set; } = new();
        public List<EquipmentStat> EquipmentStats { get; set; } = new();
        public List<DailyJobTrend> CompletionTrend { get; set; } = new();
        public List<DowntimeBreakdown> GlobalDowntime { get; set; } = new();
    }

    public class JobTimingData
    {
        public string JobNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CompletedAt { get; set; }
        public double PlannedDurationHours { get; set; }
        public double ActualDurationHours { get; set; }
        public double LeadTimeHours { get; set; }
    }

    public class TechnicianStat
    {
        public string TechnicianName { get; set; } = string.Empty;
        public int JobsCompleted { get; set; }
        public double TotalHoursWorked { get; set; }
        public double UtilizationPercentage { get; set; }
        public double AvgJobTimeHours { get; set; }
    }

    public class EquipmentStat
    {
        public string EquipmentName { get; set; } = string.Empty;
        public int MaintenanceJobsCount { get; set; }
        public double TotalMaintenanceHours { get; set; }
        public double MTTR_Hours { get; set; }
        public int BreakdownCount { get; set; }
        public double UtilizationPercentage { get; set; }
        public double MTBF_Hours { get; set; }
        public DateTime? PredictedNextFailure { get; set; }
    }

    public class DailyJobTrend
    {
        public DateTime Date { get; set; }
        public int CompletedCount { get; set; }
    }

    public class DowntimeBreakdown
    {
        public string Category { get; set; } = string.Empty;
        public int OccurrenceCount { get; set; }
        public double TotalDurationHours { get; set; }
    }
}

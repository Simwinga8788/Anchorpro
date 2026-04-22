using AnchorPro.Data.Entities;

namespace AnchorPro.Data.Models
{
    public class DashboardStats
    {
        public int JobsScheduledToday { get; set; }
        public int JobsInProgress { get; set; }
        public int JobsCompletedToday { get; set; }
        public int ActiveTechnicians { get; set; }
        public int OverdueJobs { get; set; }
        public int DelayedJobs { get; set; }

        public List<JobCard> RecentActivity { get; set; } = new();
        public List<JobTypeStat> JobTypeDistribution { get; set; } = new();

        public int TotalJobs { get; set; }
        public int CompletedJobs { get; set; }
        public int ActiveBreakdownsCount { get; set; }
        public List<JobCard> ActiveBreakdowns { get; set; } = new();
    }

    public class JobTypeStat
    {
        public string JobTypeName { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}

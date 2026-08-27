using System;
using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public enum MilestoneStatus
    {
        NotStarted,
        InProgress,
        Complete,
        Delayed
    }

    /// <summary>
    /// A native schedule activity/milestone for a project — a manually-maintained baseline
    /// (planned dates) tracked against actual progress. Not a CPM engine: dates are set directly
    /// by the user, not auto-calculated from a dependency graph.
    /// </summary>
    public class ProjectMilestone : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Trade { get; set; }

        public DateTime PlannedStartDate { get; set; }
        public DateTime PlannedEndDate { get; set; }

        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }

        /// <summary>0-100. Manually maintained by the site/QS team, not auto-computed.</summary>
        public int ProgressPercentage { get; set; }

        public MilestoneStatus Status { get; set; } = MilestoneStatus.NotStarted;

        public int DisplayOrder { get; set; }

        /// <summary>Optional reference to another activity this one follows — display/reference only, no auto-rescheduling.</summary>
        public int? PredecessorMilestoneId { get; set; }
        public ProjectMilestone? PredecessorMilestone { get; set; }
    }
}

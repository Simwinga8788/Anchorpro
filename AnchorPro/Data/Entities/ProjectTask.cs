using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public enum ProjectTaskStatus
    {
        ToDo,
        InProgress,
        Review,
        Done
    }

    public enum ProjectTaskPriority
    {
        Low,
        Normal,
        High,
        Urgent
    }

    public class ProjectTask : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public ProjectTaskStatus Status { get; set; } = ProjectTaskStatus.ToDo;
        public ProjectTaskPriority Priority { get; set; } = ProjectTaskPriority.Normal;

        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal EstimatedHours { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ActualHours { get; set; }

        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        [MaxLength(85)]
        public string? AssignedToId { get; set; }
        public ApplicationUser? AssignedTo { get; set; }
    }
}

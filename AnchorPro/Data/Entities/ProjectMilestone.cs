using System;
using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class ProjectMilestone : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public DateTime Date { get; set; }

        public bool IsCompleted { get; set; }
    }
}

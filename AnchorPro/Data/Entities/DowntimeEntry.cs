using System;
using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class DowntimeEntry : BaseEntity
    {
        public int? JobTaskId { get; set; }
        public JobTask? JobTask { get; set; }

        public int? JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        public int DowntimeCategoryId { get; set; }
        public DowntimeCategory? DowntimeCategory { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; } // Null if currently active

        public int DurationMinutes { get; set; } // Calculated when resolved

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}

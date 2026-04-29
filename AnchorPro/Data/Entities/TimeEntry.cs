using System;
using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    /// <summary>Tracks actual time punched in/out by a technician on a specific job card.</summary>
    public class TimeEntry : BaseEntity
    {
        public int JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        [Required]
        [MaxLength(85)]
        public string TechnicianId { get; set; } = string.Empty;
        public ApplicationUser? Technician { get; set; }

        public DateTime ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }

        /// <summary>Calculated duration in minutes. 0 while clocked in.</summary>
        public int DurationMinutes { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}

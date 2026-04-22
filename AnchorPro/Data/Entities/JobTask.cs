using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public class JobTask : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty; // e.g. "Inspect Hydraulics"

        public string? Instructions { get; set; }

        public int Sequence { get; set; }

        public int JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        // Time Tracking (Stored in Minutes)
        public int EstimatedDurationMinutes { get; set; }
        public int ActualDurationMinutes { get; set; } // Derived or directly logged? Usually accumulated.

        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }

        // Navigation
        public ICollection<DowntimeEntry> DowntimeEntries { get; set; } = new List<DowntimeEntry>();
    }
}

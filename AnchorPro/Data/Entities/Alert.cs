using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class Alert : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Message { get; set; } = string.Empty;

        /// <summary>Info | Warning | Critical</summary>
        [MaxLength(20)]
        public string Severity { get; set; } = "Info";

        /// <summary>General | LowMargin | OverdueJob | TechnicianDelay | PaymentOverdue</summary>
        [MaxLength(50)]
        public string Category { get; set; } = "General";

        // Optional links to the entity that triggered this alert
        public int? JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        public int? CustomerId { get; set; }
        public Customer? Customer { get; set; }

        // Read tracking
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }

        [MaxLength(85)]
        public string? ReadByUserId { get; set; }
    }
}

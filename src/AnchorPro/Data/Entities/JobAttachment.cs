using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class JobAttachment : BaseEntity
    {
        public int JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string FilePath { get; set; } = string.Empty; // Relative path or Storage URL

        [MaxLength(50)]
        public string ContentType { get; set; } = string.Empty;

        public long FileSizeBytes { get; set; }

        // e.g. "ProofOfWork", "DamageReport", "Invoice"
        [MaxLength(50)]
        public string Category { get; set; } = "General";
    }
}

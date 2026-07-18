using System;
using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class ProjectDocument : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string FileUrl { get; set; } = string.Empty;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public string? UploadedById { get; set; }
        public ApplicationUser? UploadedBy { get; set; }
    }
}

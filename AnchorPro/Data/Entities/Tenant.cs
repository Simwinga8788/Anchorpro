using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class Tenant
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? ContactEmail { get; set; }

        [MaxLength(50)]
        public string? ContactPhone { get; set; }

        // The user who owns this tenant/company
        [MaxLength(450)]
        public string? OwnerId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [MaxLength(450)]
        public string? CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }
        [MaxLength(450)]
        public string? UpdatedBy { get; set; }
        
        public bool IsActive { get; set; } = true;
    }
}

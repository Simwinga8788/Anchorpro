using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class JobType : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty; // e.g. "Preventative Maintenance", "Breakdown"

        [MaxLength(200)]
        public string? Description { get; set; }
    }
}

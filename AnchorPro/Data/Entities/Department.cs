using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class Department : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string? CostCode { get; set; }       // Optional cost centre reference

        // Navigation
        public ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();
    }
}

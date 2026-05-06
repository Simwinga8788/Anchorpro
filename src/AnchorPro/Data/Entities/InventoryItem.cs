using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public class InventoryItem : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string PartNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public int QuantityOnHand { get; set; }

        public int ReorderLevel { get; set; } = 5;

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitCost { get; set; }

        [MaxLength(50)]
        public string? LocationBin { get; set; }
    }
}

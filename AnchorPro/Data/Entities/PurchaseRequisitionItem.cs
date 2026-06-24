using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public class PurchaseRequisitionItem : BaseEntity
    {
        public int PurchaseRequisitionId { get; set; }
        public PurchaseRequisition? PurchaseRequisition { get; set; }

        public int? InventoryItemId { get; set; }
        public InventoryItem? InventoryItem { get; set; }

        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty; // Free-text or Stock name

        public int QuantityRequested { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal EstimatedUnitCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; }
    }
}

using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public class JobCardPart : BaseEntity
    {
        public int JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        public int InventoryItemId { get; set; }
        public InventoryItem? InventoryItem { get; set; }

        public int QuantityUsed { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitCostSnapshot { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalCost => QuantityUsed * UnitCostSnapshot;
    }
}

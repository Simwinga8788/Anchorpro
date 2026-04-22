using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    /// <summary>
    /// Defines the commercial intent of a Purchase Order.
    /// This is the key data tag that powers the "Cost Trinity" model.
    /// </summary>
    public enum PurchaseOrderType
    {
        /// <summary>Bulk buying to replenish the warehouse. Cost flows to Inventory.</summary>
        InventoryReplenishment,

        /// <summary>
        /// A non-stock item bought for one specific job (e.g. a custom hydraulic pump).
        /// Cost flows DIRECTLY to the Job Card as "Direct Purchase Cost."
        /// </summary>
        DirectPurchase,

        /// <summary>
        /// Hiring an external company for labor or expertise (e.g. motor rewind specialist).
        /// Cost flows to the Job Card as "Subcontracting Cost."
        /// </summary>
        Subcontracting
    }

    public class PurchaseOrder : BaseEntity
    {
        [Required]
        [MaxLength(30)]
        public string PoNumber { get; set; } = string.Empty;    // e.g. PO-2026-0001

        public int SupplierId { get; set; }
        public Supplier? Supplier { get; set; }

        /// <summary>The commercial intent of this PO — what is the money being spent on?</summary>
        public PurchaseOrderType PoType { get; set; } = PurchaseOrderType.InventoryReplenishment;

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? ReceivedDate { get; set; }

        public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;

        [MaxLength(500)]
        public string? Notes { get; set; }

        [MaxLength(100)]
        public string? RaisedBy { get; set; }
        [MaxLength(100)]
        public string? ApprovedBy { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }

        // Job Card link — required for DirectPurchase and Subcontracting types
        public int? JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        // Navigation
        public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    }

    public class PurchaseOrderItem : BaseEntity
    {
        public int PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }

        public int? InventoryItemId { get; set; }
        public InventoryItem? InventoryItem { get; set; }

        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;    // Free-text if no inventory link

        public int QuantityOrdered { get; set; }
        public int QuantityReceived { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; }
    }

    public enum PurchaseOrderStatus
    {
        Draft,
        Submitted,      // Sent to supplier
        PartiallyReceived,
        Received,       // All items received
        Cancelled
    }
}

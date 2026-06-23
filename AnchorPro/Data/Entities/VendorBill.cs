using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public class VendorBill : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string BillNumber { get; set; } = string.Empty;

        public int SupplierId { get; set; }
        public Supplier? Supplier { get; set; }

        public int? PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountPaid { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance => TotalAmount - AmountPaid;

        public DateTime BillDate { get; set; } = DateTime.UtcNow;
        public DateTime DueDate { get; set; }

        public VendorBillStatus Status { get; set; } = VendorBillStatus.Unpaid;

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public enum VendorBillStatus
    {
        Unpaid,
        Partial,
        Paid,
        Cancelled
    }
}

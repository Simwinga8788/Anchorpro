using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public class Invoice : BaseEntity
    {
        [Required]
        [MaxLength(30)]
        public string InvoiceNumber { get; set; } = string.Empty;   // e.g. INV-2026-0001

        // Link to the originating job (nullable for ad-hoc invoices)
        public int? JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        // Billed to
        public int? CustomerId { get; set; }
        public Customer? Customer { get; set; }

        // Link to active service contract (if any)
        public int? ContractId { get; set; }
        public Contract? Contract { get; set; }

        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
        public DateTime? DueDate { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        // Financials
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal TaxRate { get; set; } = 16.00m;     // Default VAT % (16% for Zambia)

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountPaid { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; }

        public InvoicePaymentStatus PaymentStatus { get; set; } = InvoicePaymentStatus.Unpaid;

        // Navigation
        public ICollection<InvoicePayment> Payments { get; set; } = new List<InvoicePayment>();
    }

    public enum InvoicePaymentStatus
    {
        Unpaid,
        Partial,
        Paid,
        Overdue,
        Cancelled
    }
}

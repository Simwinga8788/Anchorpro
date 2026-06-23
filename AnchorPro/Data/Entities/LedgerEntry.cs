using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public class LedgerEntry : BaseEntity
    {
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        public LedgerTransactionType Type { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } // Always positive; Type defines Cash In vs Cash Out

        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty; // e.g., "Revenue - Services", "Payroll", "Inventory Purchases"

        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        // Foreign keys to trace the origin of this ledger entry
        public int? InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }

        public int? VendorBillId { get; set; }
        public VendorBill? VendorBill { get; set; }

        public int? PayrollRunId { get; set; }
        public PayrollRun? PayrollRun { get; set; }

        public int? ExpenseId { get; set; }
        public Expense? Expense { get; set; }

        [MaxLength(100)]
        public string? RecordedBy { get; set; }
    }

    public enum LedgerTransactionType
    {
        Income,   // Money In
        Expense   // Money Out
    }
}

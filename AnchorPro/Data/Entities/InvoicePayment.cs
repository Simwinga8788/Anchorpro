using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public class InvoicePayment : BaseEntity
    {
        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        public PaymentMethod Method { get; set; } = PaymentMethod.BankTransfer;

        [MaxLength(100)]
        public string? ReferenceNumber { get; set; }    // Bank ref, cheque number etc.

        [MaxLength(300)]
        public string? Notes { get; set; }

        [MaxLength(100)]
        public string RecordedBy { get; set; } = string.Empty;
    }

    public enum PaymentMethod
    {
        BankTransfer,
        Cash,
        Cheque,
        MobileMoney,
        Card,
        Other
    }
}

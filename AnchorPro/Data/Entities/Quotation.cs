using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AnchorPro.Data.Enums;

namespace AnchorPro.Data.Entities
{
    public class Quotation : BaseEntity
    {
        [Required]
        [MaxLength(30)]
        public string QuotationNumber { get; set; } = string.Empty;

        public int JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        public int? CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public DateTime QuoteDate { get; set; } = DateTime.UtcNow;
        public DateTime ExpiryDate { get; set; } = DateTime.UtcNow.AddDays(30);

        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal TaxRate { get; set; } = 16.00m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        public QuotationStatus Status { get; set; } = QuotationStatus.Draft;

        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}

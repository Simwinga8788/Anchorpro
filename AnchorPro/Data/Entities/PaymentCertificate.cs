using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public enum CertificateStatus
    {
        Draft,
        SubmittedToConsultant,
        Queried,
        Approved,
        Issued,
        Paid
    }

    public class PaymentCertificate : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public int? BillOfQuantitiesId { get; set; }
        public BillOfQuantities? BillOfQuantities { get; set; }

        [Required]
        [MaxLength(50)]
        public string CertificateNumber { get; set; } = "IPC-01"; // Interim Payment Certificate #1

        public DateTime PeriodStartDate { get; set; }
        public DateTime PeriodEndDate { get; set; }

        public CertificateStatus Status { get; set; } = CertificateStatus.Draft;

        /// <summary>Total cumulative value of completed BOQ work and variations to date</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal GrossValuationToDate { get; set; }

        /// <summary>Retention percentage, typically 5% or 10% under JBCC/FIDIC</summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal RetentionPercentage { get; set; } = 5.00m;

        /// <summary>Total retention deducted to date</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal RetentionDeductionToDate { get; set; }

        /// <summary>Total value certified and paid on all previous certificates</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal PreviousCertificatesPaid { get; set; }

        /// <summary>Net amount payable on this certificate = (GrossValuation - Retention) - PreviousCertificatesPaid</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetAmountDue { get; set; }

        [MaxLength(150)]
        public string? ConsultantName { get; set; }

        public string? ConsultantNotes { get; set; }

        public DateTime? ApprovedAt { get; set; }

        [MaxLength(85)]
        public string? ApprovedById { get; set; }
        public ApplicationUser? ApprovedBy { get; set; }

        public ICollection<PaymentCertificateItem> Items { get; set; } = new List<PaymentCertificateItem>();
        public ICollection<PaymentCertificateVariation> Variations { get; set; } = new List<PaymentCertificateVariation>();
    }

    /// <summary>Links an approved Variation into the certificate it was first certified on, with the value carried at inclusion time.</summary>
    public class PaymentCertificateVariation : BaseEntity
    {
        public int PaymentCertificateId { get; set; }
        public PaymentCertificate? PaymentCertificate { get; set; }

        public int VariationId { get; set; }
        public Variation? Variation { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ValuedAmount { get; set; }
    }

    public class PaymentCertificateItem : BaseEntity
    {
        public int PaymentCertificateId { get; set; }
        public PaymentCertificate? PaymentCertificate { get; set; }

        public int BoqItemId { get; set; }
        public BoqItem? BoqItem { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal PreviousQuantity { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal CurrentQuantityCompleted { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal CumulativeQuantityCompleted { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CumulativeValueCompleted { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal PercentageComplete { get; set; }

        public string? Notes { get; set; }
    }

    public enum VariationStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public class Variation : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        [Required]
        [MaxLength(50)]
        public string VariationNumber { get; set; } = "VO-01"; // Variation Order #1

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string? Reason { get; set; }

        public VariationStatus Status { get; set; } = VariationStatus.Pending;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public int? BoqItemId { get; set; }
        public BoqItem? BoqItem { get; set; }

        public DateTime? ApprovedAt { get; set; }

        [MaxLength(85)]
        public string? ApprovedById { get; set; }
        public ApplicationUser? ApprovedBy { get; set; }

        public ICollection<VariationStatusHistory> StatusHistory { get; set; } = new List<VariationStatusHistory>();
        public ICollection<PaymentCertificateVariation> CertificateVariations { get; set; } = new List<PaymentCertificateVariation>();
    }

    /// <summary>Audit trail entry for a Variation status change. CreatedBy/CreatedAt (from BaseEntity) record who made the change and when.</summary>
    public class VariationStatusHistory : BaseEntity
    {
        public int VariationId { get; set; }
        public Variation? Variation { get; set; }

        public VariationStatus Status { get; set; }

        public string? Notes { get; set; }
    }
}

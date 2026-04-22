using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public class PaymentTransaction : BaseEntity
    {
        // Id and TenantId inherited from BaseEntity

        public int? TenantSubscriptionId { get; set; }
        [ForeignKey("TenantSubscriptionId")]
        public TenantSubscription? TenantSubscription { get; set; }
        
        // Tenant navigation property for nullable TenantId from BaseEntity
        [ForeignKey("TenantId")]
        public Tenant? Tenant { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public string Currency { get; set; } = "USD";

        // CreatedAt inherited from BaseEntity replaces TransactionDate

        [Required]
        public string PaymentMethod { get; set; } = "Bank Transfer"; // Renamed from Method

        public string? TransactionReference { get; set; } // Renamed from Reference

        public string Status { get; set; } = "Pending";

        public string? ProofDocumentUrl { get; set; }

        public string? Notes { get; set; }

        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedByUserId { get; set; }
    }
}

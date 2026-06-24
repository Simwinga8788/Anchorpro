using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public enum PurchaseRequisitionStatus
    {
        Draft,
        PendingApproval,
        Approved,
        Rejected,
        ConvertedToPO,
        Cancelled
    }

    public class PurchaseRequisition : BaseEntity
    {
        [Required]
        [MaxLength(30)]
        public string RequisitionNumber { get; set; } = "TEMP"; // e.g., PR-2026-0001

        // Optional: Link to a Job Card if raised for an operational maintenance job
        public int? JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        // Optional: Link to the requesting Department (for overhead/non-ops tracking)
        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }

        [Required]
        [MaxLength(85)]
        public string RequestedById { get; set; } = "TEMP";
        public ApplicationUser? RequestedBy { get; set; }

        public DateTime RequiredDate { get; set; } = DateTime.UtcNow.AddDays(7);
        public PurchaseRequisitionStatus Status { get; set; } = PurchaseRequisitionStatus.Draft;

        [MaxLength(85)]
        public string? ApprovedById { get; set; }
        public ApplicationUser? ApprovedBy { get; set; }
        public DateTime? ApprovedDate { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalEstimatedAmount { get; set; }

        public ICollection<PurchaseRequisitionItem> Items { get; set; } = new List<PurchaseRequisitionItem>();
    }
}

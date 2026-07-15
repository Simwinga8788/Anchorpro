using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    /// <summary>
    /// Universal cost ledger row that any work document type can write to.
    /// Finance reads from this table regardless of which document type generated the cost.
    /// </summary>
    public class WorkDocumentCostEntry : BaseEntity
    {
        /// <summary>ID of the originating work document (JobCard.Id, ShiftProductionLog.Id, etc.).</summary>
        public int WorkDocumentId { get; set; }

        /// <summary>Type of work document that generated this cost entry.</summary>
        public OperationMode WorkDocumentType { get; set; }

        /// <summary>Cost category: Labor, Parts, DirectPurchase, Fuel, Equipment, Subcontract, Other.</summary>
        [MaxLength(50)]
        public string CostCategory { get; set; } = "Other";

        [MaxLength(500)]
        public string? Description { get; set; }

        public decimal Amount { get; set; }

        /// <summary>Optional reference to the source document (PO number, inventory issue ID, etc.).</summary>
        [MaxLength(100)]
        public string? SourceReference { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public enum BoqStatus
    {
        Draft,
        UnderReview,
        Approved,
        Revised
    }

    public class BillOfQuantities : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        [Required]
        [MaxLength(150)]
        public string Title { get; set; } = "Bill of Quantities";

        public int VersionNumber { get; set; } = 1;

        public BoqStatus Status { get; set; } = BoqStatus.Draft;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalContractSum { get; set; }

        public string? Notes { get; set; }

        public DateTime? ApprovedAt { get; set; }
        
        [MaxLength(85)]
        public string? ApprovedById { get; set; }
        public ApplicationUser? ApprovedBy { get; set; }

        public ICollection<BoqSection> Sections { get; set; } = new List<BoqSection>();
    }

    public class BoqSection : BaseEntity
    {
        public int BillOfQuantitiesId { get; set; }
        public BillOfQuantities? BillOfQuantities { get; set; }

        [Required]
        [MaxLength(30)]
        public string SectionCode { get; set; } = "A"; // e.g. "Section 1", "Earthworks", "Substructure"

        [Required]
        [MaxLength(200)]
        public string SectionName { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        public int DisplayOrder { get; set; }

        public ICollection<BoqItem> Items { get; set; } = new List<BoqItem>();
    }

    public class BoqItem : BaseEntity
    {
        public int BoqSectionId { get; set; }
        public BoqSection? BoqSection { get; set; }

        [Required]
        [MaxLength(50)]
        public string ItemNumber { get; set; } = "1.1"; // e.g. "2.1.3", "A.1"

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string UnitOfMeasure { get; set; } = "m3"; // m3, m2, m, kg, t, nr, sum, item, hrs

        [Column(TypeName = "decimal(18,3)")]
        public decimal Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Rate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public string? Notes { get; set; }

        public int DisplayOrder { get; set; }
    }
}

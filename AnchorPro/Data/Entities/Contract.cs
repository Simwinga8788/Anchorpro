using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    /// <summary>Defines the nature of the contract relationship.</summary>
    public enum ContractPartyType
    {
        Client              = 0, // Default — invoice-generating client contract
        BlastingContractor  = 1, // Mining blasting contractor (per-blast billing)
        OreTransport        = 2, // Ore/material haulage contractor (per-ton/load billing)
        SupportContractor   = 3, // General support, labour or services contractor
    }

    public class Contract : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string ContractNumber { get; set; } = string.Empty;

        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public ContractStatus Status { get; set; } = ContractStatus.Draft;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Value { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyFee { get; set; }

        public int SLAHours { get; set; } // Resolution time target in hours

        [Column(TypeName = "decimal(18,2)")]
        public decimal? UnitRate { get; set; }

        [MaxLength(30)]
        public string? UnitOfMeasure { get; set; } // e.g. Tons, BCM

        /// <summary>Distinguishes client contracts from mining contractor agreements.</summary>
        public ContractPartyType ContractPartyType { get; set; } = ContractPartyType.Client;

        /// <summary>For mining contractors: e.g. "Per Ton", "Per Load", "Per Blast", "Per Day".</summary>
        [MaxLength(50)]
        public string? RateType { get; set; }

        /// <summary>For blasting contractors: specific blasting zone or mining area.</summary>
        [MaxLength(200)]
        public string? WorkingArea { get; set; }

        [MaxLength(1000)]
        public string? Terms { get; set; }

        // Navigation
        public ICollection<JobCard> JobCards { get; set; } = new List<JobCard>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }

    public enum ContractStatus
    {
        Draft,
        Active,
        Expired,
        Cancelled,
        OnHold
    }
}

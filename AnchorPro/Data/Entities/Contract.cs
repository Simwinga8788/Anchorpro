using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
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

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public class Expense : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        public ExpenseCategory Category { get; set; } = ExpenseCategory.Other;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string? ReceiptUrl { get; set; }

        public int? JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        [MaxLength(100)]
        public string? RecordedBy { get; set; }
    }

    public enum ExpenseCategory
    {
        OfficeSupplies,
        Utilities,
        Rent,
        Travel,
        Meals,
        SoftwareSubscriptions,
        Marketing,
        VehicleMaintenance,
        PettyCash,
        Other
    }
}

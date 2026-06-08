using System.ComponentModel.DataAnnotations;
using AnchorPro.Data.Enums;

namespace AnchorPro.Data.Entities;

public class Tool : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string ToolTag { get; set; } = string.Empty;

    public ToolStatus Status { get; set; } = ToolStatus.Available;

    public ToolCondition Condition { get; set; } = ToolCondition.Good;

    public DateTime ReceivedDate { get; set; } = DateTime.UtcNow;

    // Optional fields for tracking purchase details if needed later
    public DateTime? PurchaseDate { get; set; }
    public decimal? PurchaseCost { get; set; }
    
    // Navigation property for history
    public virtual ICollection<ToolTransaction> Transactions { get; set; } = new List<ToolTransaction>();
}

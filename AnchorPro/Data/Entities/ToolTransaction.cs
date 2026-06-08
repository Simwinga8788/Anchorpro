using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AnchorPro.Data.Enums;

namespace AnchorPro.Data.Entities;

public class ToolTransaction : BaseEntity
{
    public int ToolId { get; set; }
    
    [ForeignKey("ToolId")]
    public virtual Tool Tool { get; set; } = null!;

    [Required]
    [MaxLength(85)]
    public string AssignedToUserId { get; set; } = string.Empty;

    [ForeignKey("AssignedToUserId")]
    public virtual ApplicationUser AssignedToUser { get; set; } = null!;

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(85)]
    public string IssuedByUserId { get; set; } = string.Empty;

    [ForeignKey("IssuedByUserId")]
    public virtual ApplicationUser IssuedByUser { get; set; } = null!;

    public ToolCondition ConditionOnIssue { get; set; }

    public DateTime? ExpectedReturnDate { get; set; }

    public DateTime? ReturnedAt { get; set; }

    [MaxLength(85)]
    public string? ReceivedByUserId { get; set; }

    [ForeignKey("ReceivedByUserId")]
    public virtual ApplicationUser? ReceivedByUser { get; set; }

    public ToolCondition? ConditionOnReturn { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

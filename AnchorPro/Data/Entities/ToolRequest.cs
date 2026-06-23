using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AnchorPro.Data.Enums;

namespace AnchorPro.Data.Entities;

public class ToolRequest : BaseEntity
{
    [Required]
    [MaxLength(85)]
    public string RequestedByUserId { get; set; } = string.Empty;

    [ForeignKey("RequestedByUserId")]
    public virtual ApplicationUser RequestedByUser { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string RequestedToolName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public ToolRequestStatus Status { get; set; } = ToolRequestStatus.Pending;

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ResolvedAt { get; set; }

    public int? IssuedToolTransactionId { get; set; }

    [ForeignKey("IssuedToolTransactionId")]
    public virtual ToolTransaction? IssuedToolTransaction { get; set; }
}

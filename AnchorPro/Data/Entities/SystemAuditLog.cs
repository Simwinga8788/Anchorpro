namespace AnchorPro.Data.Entities;

public class SystemAuditLog : BaseEntity
{
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty; // Billing, Security, Integration
    public string ChangedBy { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

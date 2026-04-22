using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities;

public class SystemSetting
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Key { get; set; } = string.Empty;

    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Group { get; set; } = "General";

    public int? TenantId { get; set; } // Nullable for Platform Defaults
}

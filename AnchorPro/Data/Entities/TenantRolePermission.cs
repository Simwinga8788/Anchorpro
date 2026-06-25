using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities;

public class TenantRolePermission : BaseEntity
{
    [Required]
    public string RoleName { get; set; } = string.Empty;
    
    // JSON array of route prefixes, e.g. ["/dashboard/hr", "/dashboard/procurement"]
    public string AllowedRoutesJson { get; set; } = "[]";
}

using Microsoft.AspNetCore.Identity;

namespace AnchorPro.Data;

// Add profile data for application users by adding properties to the ApplicationUser class
public class ApplicationUser : IdentityUser
{
    [PersonalData]
    public string? FirstName { get; set; }

    [PersonalData]
    public string? LastName { get; set; }
    
    public string? EmployeeNumber { get; set; }

    public int? TenantId { get; set; }

    public int? DepartmentId { get; set; }
    public Entities.Department? Department { get; set; }

    public decimal HourlyRate { get; set; } = 450.00m; // Default for ZMW region

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}


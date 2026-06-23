using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities;

public class EmployeeProfile
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    // Personal Details
    public DateTime? DateOfBirth { get; set; }
    [MaxLength(20)]
    public string? Gender { get; set; }
    [MaxLength(100)]
    public string? Nationality { get; set; }
    [MaxLength(50)]
    public string? NationalIdNumber { get; set; }
    [MaxLength(30)]
    public string? MaritalStatus { get; set; } // Single, Married, Divorced, Widowed

    // Contact Details
    [MaxLength(20)]
    public string? PersonalPhone { get; set; }
    [MaxLength(200)]
    public string? PersonalEmail { get; set; }
    [MaxLength(500)]
    public string? HomeAddress { get; set; }

    // Emergency Contact
    [MaxLength(150)]
    public string? EmergencyContactName { get; set; }
    [MaxLength(50)]
    public string? EmergencyContactRelation { get; set; }
    [MaxLength(20)]
    public string? EmergencyContactPhone { get; set; }

    // Bank Details (sensitive — access restricted to Admin/HR)
    [MaxLength(100)]
    public string? BankName { get; set; }
    [MaxLength(100)]
    public string? BankBranch { get; set; }
    [MaxLength(30)]
    public string? BankAccountNumber { get; set; }  // masked on display
    [MaxLength(30)]
    public string? BankAccountType { get; set; }  // Savings, Cheque, Current

    // Employment Details
    [MaxLength(150)]
    public string? JobTitle { get; set; }
    public EmploymentType EmploymentType { get; set; } = EmploymentType.FullTime;
    public DateTime? EmploymentStartDate { get; set; }

    // Documents
    [MaxLength(500)]
    public string? ProfilePhotoUrl { get; set; }
    [MaxLength(500)]
    public string? IdDocumentUrl { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public enum EmploymentType
{
    FullTime,
    PartTime,
    Contract,
    Casual
}

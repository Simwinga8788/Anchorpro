using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities;

public class EmploymentContract : BaseEntity
{

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    [Required]
    [MaxLength(150)]
    public string JobTitle { get; set; } = string.Empty;

    public EmploymentContractType ContractType { get; set; } = EmploymentContractType.Permanent;
    public EmploymentContractStatus Status { get; set; } = EmploymentContractStatus.Draft;

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; } // null = permanent

    [Column(TypeName = "decimal(18,2)")]
    public decimal AgreedMonthlySalary { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal HourlyRate { get; set; }

    public int NoticePeriodDays { get; set; } = 30;

    [MaxLength(500)]
    public string? DocumentUrl { get; set; } // Uploaded contract PDF

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(500)]
    public string? TerminationReason { get; set; }

}

public enum EmploymentContractType
{
    Permanent,
    FixedTerm,
    Probation,
    Casual
}

public enum EmploymentContractStatus
{
    Draft,
    Active,
    Expired,
    Terminated
}

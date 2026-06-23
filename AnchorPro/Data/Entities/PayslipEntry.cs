using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities;

public class PayslipEntry
{
    [Key]
    public int Id { get; set; }

    public int PayrollRunId { get; set; }
    public PayrollRun? PayrollRun { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    // Earnings
    [Column(TypeName = "decimal(18,2)")]
    public decimal BasicSalary { get; set; }

    public decimal OvertimeHours { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal OvertimeRate { get; set; }  // e.g. 1.5x hourly rate

    [Column(TypeName = "decimal(18,2)")]
    public decimal OvertimePay { get; set; }  // OvertimeHours × OvertimeRate

    [Column(TypeName = "decimal(18,2)")]
    public decimal TransportAllowance { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal HousingAllowance { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal OtherAllowances { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal GrossPay { get; set; }  // BasicSalary + OvertimePay + Allowances

    // Deductions — Zambia statutory
    [Column(TypeName = "decimal(18,2)")]
    public decimal PayeTax { get; set; }  // Progressive PAYE bands

    [Column(TypeName = "decimal(18,2)")]
    public decimal NapsaEmployee { get; set; }  // 5% of gross (capped at ZMW 1,221)

    [Column(TypeName = "decimal(18,2)")]
    public decimal NapsaEmployer { get; set; }  // 5% employer contribution (tracked, not deducted from employee)

    [Column(TypeName = "decimal(18,2)")]
    public decimal NhimaContribution { get; set; }  // 1% of gross

    [Column(TypeName = "decimal(18,2)")]
    public decimal OtherDeductions { get; set; }  // Loans, advances, etc.

    [MaxLength(500)]
    public string? OtherDeductionsNote { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalDeductions { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NetPay { get; set; }  // GrossPay - TotalDeductions

    public PayslipStatus Status { get; set; } = PayslipStatus.Pending;

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public enum PayslipStatus
{
    Pending,
    Approved,
    Paid
}

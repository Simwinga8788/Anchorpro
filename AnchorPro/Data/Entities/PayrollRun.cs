using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities;

public class PayrollRun
{
    [Key]
    public int Id { get; set; }

    public int PeriodMonth { get; set; }  // 1–12
    public int PeriodYear { get; set; }

    public DateTime RunDate { get; set; } = DateTime.UtcNow;
    public PayrollRunStatus Status { get; set; } = PayrollRunStatus.Draft;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalGross { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalDeductions { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalNet { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalEmployerNapsa { get; set; } // Employer NAPSA (5%) — not deducted from employee

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime? FinalisedAt { get; set; }
    public string? FinalisedBy { get; set; }

    public DateTime? PaidAt { get; set; }
    public string? PaidBy { get; set; }

    // Navigation
    public ICollection<PayslipEntry> PayslipEntries { get; set; } = new List<PayslipEntry>();

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public enum PayrollRunStatus
{
    Draft,
    Finalised,
    Paid
}

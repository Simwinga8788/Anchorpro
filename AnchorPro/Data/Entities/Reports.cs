using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public enum WeeklyReportStatus
    {
        Draft,
        Issued
    }

    /// <summary>
    /// Auto-aggregated weekly site progress report, built from the week's Site Diary entries.
    /// Numeric fields are recomputed on generation; narrative fields are user-edited before issuing.
    /// </summary>
    public class WeeklyReport : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public int ReportNumber { get; set; }

        public DateTime PeriodStartDate { get; set; }
        public DateTime PeriodEndDate { get; set; }

        public WeeklyReportStatus Status { get; set; } = WeeklyReportStatus.Draft;

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalManHours { get; set; }

        [Column(TypeName = "decimal(6,2)")]
        public decimal AverageDailyWorkforce { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalPlantHours { get; set; }

        public int WeatherDowntimeDays { get; set; }

        public int SafetyIncidentsCount { get; set; }

        public int NearMissesCount { get; set; }

        /// <summary>Editable narrative summarising key works executed — auto-seeded from diary entries on generation.</summary>
        public string KeyWorksNarrative { get; set; } = string.Empty;

        /// <summary>Editable two-week lookahead narrative — authored by the user, no automated source exists yet.</summary>
        public string? LookaheadNarrative { get; set; }

        public DateTime? IssuedAt { get; set; }

        [MaxLength(85)]
        public string? IssuedById { get; set; }
        public ApplicationUser? IssuedBy { get; set; }
    }

    public enum MonthlyReportStatus
    {
        Draft,
        Approved,
        Issued
    }

    /// <summary>
    /// Monthly client/consultant report rolling up progress, cost-to-date, safety stats, and a narrative
    /// built from the month's issued weekly reports. One row per project per calendar month.
    /// </summary>
    public class MonthlyReport : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public int ReportYear { get; set; }
        public int ReportMonth { get; set; } // 1-12

        public MonthlyReportStatus Status { get; set; } = MonthlyReportStatus.Draft;

        [Column(TypeName = "decimal(18,2)")]
        public decimal OriginalContractSum { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrossValuationToDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal NetCertifiedPayable { get; set; }

        [MaxLength(50)]
        public string? LatestCertificateNumber { get; set; }

        public int SafetyIncidentsCount { get; set; }

        public int NearMissesCount { get; set; }

        /// <summary>Editable narrative — auto-seeded by rolling up the month's issued weekly report narratives.</summary>
        public string Narrative { get; set; } = string.Empty;

        public DateTime? ApprovedAt { get; set; }

        [MaxLength(85)]
        public string? ApprovedById { get; set; }
        public ApplicationUser? ApprovedBy { get; set; }

        public DateTime? IssuedAt { get; set; }

        [MaxLength(85)]
        public string? IssuedById { get; set; }
        public ApplicationUser? IssuedBy { get; set; }
    }
}

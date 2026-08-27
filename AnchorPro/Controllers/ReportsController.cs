using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public ReportsController(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        // ─── Weekly Reports ──────────────────────────────────────────────

        /// <summary>
        /// GET /api/reports/weekly/project/{projectId}
        /// Version history — every weekly report ever generated for this project, newest first.
        /// </summary>
        [HttpGet("weekly/project/{projectId}")]
        public async Task<IActionResult> GetWeeklyByProject(int projectId)
        {
            using var db = _factory.CreateDbContext();
            var reports = await db.WeeklyReports
                .Where(r => r.ProjectId == projectId)
                .OrderByDescending(r => r.PeriodStartDate)
                .ToListAsync();

            return Ok(reports);
        }

        /// <summary>
        /// GET /api/reports/weekly/{id}
        /// </summary>
        [HttpGet("weekly/{id}")]
        public async Task<IActionResult> GetWeeklyById(int id)
        {
            using var db = _factory.CreateDbContext();
            var report = await db.WeeklyReports
                .Include(r => r.Project)
                .Include(r => r.IssuedBy)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (report == null) return NotFound();
            return Ok(report);
        }

        /// <summary>
        /// POST /api/reports/weekly/generate
        /// Auto-aggregates the given period's Site Diary entries into a draft weekly report.
        /// Idempotent for a Draft report already covering the exact same period (refreshes the
        /// auto-computed numbers without touching any narrative the user has already edited);
        /// an Issued report for that period is left untouched.
        /// </summary>
        [HttpPost("weekly/generate")]
        public async Task<IActionResult> GenerateWeekly([FromBody] GenerateWeeklyReportDto dto)
        {
            using var db = _factory.CreateDbContext();

            var project = await db.Projects.FindAsync(dto.ProjectId);
            if (project == null) return NotFound("Project not found.");

            var periodStart = dto.PeriodStartDate.Date;
            var periodEnd = dto.PeriodEndDate.Date;

            var existing = await db.WeeklyReports.FirstOrDefaultAsync(r =>
                r.ProjectId == dto.ProjectId && r.PeriodStartDate == periodStart && r.PeriodEndDate == periodEnd);

            if (existing != null && existing.Status == WeeklyReportStatus.Issued)
                return Ok(existing);

            var diaryEntries = await db.SiteDiaryEntries
                .Include(d => d.LabourHeadcounts)
                .Include(d => d.PlantUsages)
                .Include(d => d.SafetyLogs)
                .Where(d => d.ProjectId == dto.ProjectId && d.DiaryDate >= periodStart && d.DiaryDate <= periodEnd)
                .OrderBy(d => d.DiaryDate)
                .ToListAsync();

            decimal totalManHours = diaryEntries.Sum(d => d.LabourHeadcounts.Sum(l => l.Headcount * l.HoursWorked));
            decimal avgWorkforce = diaryEntries.Count > 0
                ? Math.Round(diaryEntries.Sum(d => d.LabourHeadcounts.Sum(l => l.Headcount)) / (decimal)diaryEntries.Count, 1)
                : 0;
            decimal totalPlantHours = diaryEntries.Sum(d => d.PlantUsages.Sum(p => p.OperatingHours));
            int weatherDowntimeDays = diaryEntries.Count(d =>
                d.WeatherCondition.Contains("Rain", StringComparison.OrdinalIgnoreCase) ||
                d.WeatherCondition.Contains("Storm", StringComparison.OrdinalIgnoreCase));
            int safetyIncidents = diaryEntries.Sum(d => d.SafetyLogs.Sum(s => s.IncidentsReported));
            int nearMisses = diaryEntries.Sum(d => d.SafetyLogs.Sum(s => s.NearMissesCount));

            var autoNarrative = diaryEntries.Count > 0
                ? string.Join("\n", diaryEntries
                    .Where(d => !string.IsNullOrWhiteSpace(d.WorkPerformedSummary))
                    .Select(d => $"{d.DiaryDate:dd MMM}: {d.WorkPerformedSummary}"))
                : "No Site Diary entries were logged for this period.";

            if (existing != null)
            {
                existing.TotalManHours = totalManHours;
                existing.AverageDailyWorkforce = avgWorkforce;
                existing.TotalPlantHours = totalPlantHours;
                existing.WeatherDowntimeDays = weatherDowntimeDays;
                existing.SafetyIncidentsCount = safetyIncidents;
                existing.NearMissesCount = nearMisses;

                await db.SaveChangesAsync();
                return Ok(existing);
            }

            int nextNumber = await db.WeeklyReports.CountAsync(r => r.ProjectId == dto.ProjectId) + 1;

            var report = new WeeklyReport
            {
                ProjectId = dto.ProjectId,
                ReportNumber = nextNumber,
                PeriodStartDate = periodStart,
                PeriodEndDate = periodEnd,
                Status = WeeklyReportStatus.Draft,
                TotalManHours = totalManHours,
                AverageDailyWorkforce = avgWorkforce,
                TotalPlantHours = totalPlantHours,
                WeatherDowntimeDays = weatherDowntimeDays,
                SafetyIncidentsCount = safetyIncidents,
                NearMissesCount = nearMisses,
                KeyWorksNarrative = autoNarrative
            };

            db.WeeklyReports.Add(report);
            await db.SaveChangesAsync();

            return Ok(report);
        }

        /// <summary>
        /// PUT /api/reports/weekly/{id}
        /// Edit the narrative sections before issuing. Draft only.
        /// </summary>
        [HttpPut("weekly/{id}")]
        public async Task<IActionResult> UpdateWeeklyNarrative(int id, [FromBody] UpdateWeeklyNarrativeDto dto)
        {
            using var db = _factory.CreateDbContext();
            var report = await db.WeeklyReports.FindAsync(id);
            if (report == null) return NotFound();
            if (report.Status != WeeklyReportStatus.Draft)
                return BadRequest("Only a Draft weekly report can be edited.");

            report.KeyWorksNarrative = dto.KeyWorksNarrative;
            report.LookaheadNarrative = dto.LookaheadNarrative;

            await db.SaveChangesAsync();
            return Ok(report);
        }

        /// <summary>
        /// POST /api/reports/weekly/{id}/issue
        /// </summary>
        [HttpPost("weekly/{id}/issue")]
        public async Task<IActionResult> IssueWeekly(int id)
        {
            using var db = _factory.CreateDbContext();
            var report = await db.WeeklyReports.FindAsync(id);
            if (report == null) return NotFound();
            if (report.Status != WeeklyReportStatus.Draft)
                return BadRequest("Only a Draft weekly report can be issued.");

            report.Status = WeeklyReportStatus.Issued;
            report.IssuedAt = DateTime.UtcNow;
            report.IssuedById = User.FindFirstValue(ClaimTypes.NameIdentifier);

            await db.SaveChangesAsync();
            return Ok(report);
        }

        // ─── Monthly Reports ─────────────────────────────────────────────

        /// <summary>
        /// GET /api/reports/monthly/project/{projectId}
        /// Version history — every monthly report ever generated for this project, newest first.
        /// </summary>
        [HttpGet("monthly/project/{projectId}")]
        public async Task<IActionResult> GetMonthlyByProject(int projectId)
        {
            using var db = _factory.CreateDbContext();
            var reports = await db.MonthlyReports
                .Where(r => r.ProjectId == projectId)
                .OrderByDescending(r => r.ReportYear).ThenByDescending(r => r.ReportMonth)
                .ToListAsync();

            return Ok(reports);
        }

        /// <summary>
        /// GET /api/reports/monthly/{id}
        /// Includes a live-computed trade-section progress breakdown (BOQ budget vs. certified value to date) —
        /// derived data, not snapshotted onto the report row.
        /// </summary>
        [HttpGet("monthly/{id}")]
        public async Task<IActionResult> GetMonthlyById(int id)
        {
            using var db = _factory.CreateDbContext();
            var report = await db.MonthlyReports
                .Include(r => r.Project)
                .Include(r => r.ApprovedBy)
                .Include(r => r.IssuedBy)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (report == null) return NotFound();

            var sectionBreakdown = await BuildSectionBreakdownAsync(db, report.ProjectId);

            return Ok(new
            {
                report.Id,
                report.ProjectId,
                Project = report.Project,
                report.ReportYear,
                report.ReportMonth,
                report.Status,
                report.OriginalContractSum,
                report.GrossValuationToDate,
                report.NetCertifiedPayable,
                report.LatestCertificateNumber,
                report.SafetyIncidentsCount,
                report.NearMissesCount,
                report.ActivePermitsCount,
                report.PermitCompliancePercent,
                report.Narrative,
                report.ApprovedAt,
                ApprovedBy = report.ApprovedBy,
                report.IssuedAt,
                IssuedBy = report.IssuedBy,
                SectionBreakdown = sectionBreakdown
            });
        }

        /// <summary>
        /// POST /api/reports/monthly/generate
        /// Rolls up the month's cost/progress (from the latest Payment Certificate), safety stats and
        /// narrative (from the month's Issued weekly reports) into a draft monthly report. Idempotent
        /// for an existing Draft covering the same month; an Approved/Issued one is left untouched.
        /// </summary>
        [HttpPost("monthly/generate")]
        public async Task<IActionResult> GenerateMonthly([FromBody] GenerateMonthlyReportDto dto)
        {
            using var db = _factory.CreateDbContext();

            var project = await db.Projects.FindAsync(dto.ProjectId);
            if (project == null) return NotFound("Project not found.");

            var existing = await db.MonthlyReports.FirstOrDefaultAsync(r =>
                r.ProjectId == dto.ProjectId && r.ReportYear == dto.Year && r.ReportMonth == dto.Month);

            if (existing != null && existing.Status != MonthlyReportStatus.Draft)
                return Ok(existing);

            var latestCert = await db.PaymentCertificates
                .Where(c => c.ProjectId == dto.ProjectId && c.Status != CertificateStatus.Draft)
                .OrderByDescending(c => c.PeriodEndDate)
                .FirstOrDefaultAsync();

            var monthStart = new DateTime(dto.Year, dto.Month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var issuedWeeklyReports = await db.WeeklyReports
                .Where(r => r.ProjectId == dto.ProjectId
                    && r.Status == WeeklyReportStatus.Issued
                    && r.PeriodStartDate >= monthStart && r.PeriodStartDate <= monthEnd)
                .OrderBy(r => r.PeriodStartDate)
                .ToListAsync();

            int safetyIncidents = issuedWeeklyReports.Sum(r => r.SafetyIncidentsCount);
            int nearMisses = issuedWeeklyReports.Sum(r => r.NearMissesCount);

            var narrative = issuedWeeklyReports.Count > 0
                ? string.Join("\n\n", issuedWeeklyReports.Select(r => $"Week of {r.PeriodStartDate:dd MMM}:\n{r.KeyWorksNarrative}"))
                : "No weekly reports were issued for this project during this month.";

            var projectPermits = await db.PermitsToWork
                .Where(p => p.ProjectId == dto.ProjectId)
                .ToListAsync();
            int activePermits = projectPermits.Count(p => p.Status == PermitStatus.Active);
            int compliantPermits = projectPermits.Count(p =>
                p.IsIsolated && p.IsLotoApplied && p.IsAreaSecure && p.IsPpeChecked);
            decimal permitCompliance = projectPermits.Count == 0
                ? 100m
                : Math.Round((decimal)compliantPermits / projectPermits.Count * 100, 1);

            if (existing != null)
            {
                existing.OriginalContractSum = project.Budget;
                existing.GrossValuationToDate = latestCert?.GrossValuationToDate ?? 0;
                existing.NetCertifiedPayable = latestCert?.NetAmountDue ?? 0;
                existing.LatestCertificateNumber = latestCert?.CertificateNumber;
                existing.SafetyIncidentsCount = safetyIncidents;
                existing.NearMissesCount = nearMisses;
                existing.ActivePermitsCount = activePermits;
                existing.PermitCompliancePercent = permitCompliance;

                await db.SaveChangesAsync();
                return Ok(existing);
            }

            var report = new MonthlyReport
            {
                ProjectId = dto.ProjectId,
                ReportYear = dto.Year,
                ReportMonth = dto.Month,
                Status = MonthlyReportStatus.Draft,
                OriginalContractSum = project.Budget,
                GrossValuationToDate = latestCert?.GrossValuationToDate ?? 0,
                NetCertifiedPayable = latestCert?.NetAmountDue ?? 0,
                LatestCertificateNumber = latestCert?.CertificateNumber,
                SafetyIncidentsCount = safetyIncidents,
                NearMissesCount = nearMisses,
                ActivePermitsCount = activePermits,
                PermitCompliancePercent = permitCompliance,
                Narrative = narrative
            };

            db.MonthlyReports.Add(report);
            await db.SaveChangesAsync();

            return Ok(report);
        }

        /// <summary>
        /// PUT /api/reports/monthly/{id}
        /// Edit the narrative before approval. Draft only.
        /// </summary>
        [HttpPut("monthly/{id}")]
        public async Task<IActionResult> UpdateMonthlyNarrative(int id, [FromBody] UpdateMonthlyNarrativeDto dto)
        {
            using var db = _factory.CreateDbContext();
            var report = await db.MonthlyReports.FindAsync(id);
            if (report == null) return NotFound();
            if (report.Status != MonthlyReportStatus.Draft)
                return BadRequest("Only a Draft monthly report can be edited.");

            report.Narrative = dto.Narrative;

            await db.SaveChangesAsync();
            return Ok(report);
        }

        /// <summary>
        /// POST /api/reports/monthly/{id}/approve
        /// Director/delegate review sign-off, per FR-3.2.
        /// </summary>
        [HttpPost("monthly/{id}/approve")]
        public async Task<IActionResult> ApproveMonthly(int id)
        {
            using var db = _factory.CreateDbContext();
            var report = await db.MonthlyReports.FindAsync(id);
            if (report == null) return NotFound();
            if (report.Status != MonthlyReportStatus.Draft)
                return BadRequest("Only a Draft monthly report can be approved.");

            report.Status = MonthlyReportStatus.Approved;
            report.ApprovedAt = DateTime.UtcNow;
            report.ApprovedById = User.FindFirstValue(ClaimTypes.NameIdentifier);

            await db.SaveChangesAsync();
            return Ok(report);
        }

        /// <summary>
        /// POST /api/reports/monthly/{id}/issue
        /// Issue the approved report as the branded, print-ready client/consultant document.
        /// </summary>
        [HttpPost("monthly/{id}/issue")]
        public async Task<IActionResult> IssueMonthly(int id)
        {
            using var db = _factory.CreateDbContext();
            var report = await db.MonthlyReports.FindAsync(id);
            if (report == null) return NotFound();
            if (report.Status != MonthlyReportStatus.Approved)
                return BadRequest("Only an approved monthly report can be issued.");

            report.Status = MonthlyReportStatus.Issued;
            report.IssuedAt = DateTime.UtcNow;
            report.IssuedById = User.FindFirstValue(ClaimTypes.NameIdentifier);

            await db.SaveChangesAsync();
            return Ok(report);
        }

        private static async Task<List<object>> BuildSectionBreakdownAsync(ApplicationDbContext db, int projectId)
        {
            // Derive the breakdown from the latest certificate's own line items rather than the
            // project's current BOQ — a BOQ revision creates entirely new BoqItem rows, so a
            // certificate raised against an earlier version would never match the current one.
            var latestCert = await db.PaymentCertificates
                .Include(c => c.Items)
                    .ThenInclude(i => i.BoqItem!)
                        .ThenInclude(b => b.BoqSection)
                .Where(c => c.ProjectId == projectId && c.Status != CertificateStatus.Draft)
                .OrderByDescending(c => c.PeriodEndDate)
                .FirstOrDefaultAsync();

            if (latestCert == null)
            {
                // No certificate raised yet — show the current BOQ's budget with zero valuation.
                var boq = await db.BillsOfQuantities
                    .Include(b => b.Sections)
                    .Where(b => b.ProjectId == projectId)
                    .OrderByDescending(b => b.VersionNumber)
                    .FirstOrDefaultAsync();

                if (boq == null) return new List<object>();

                return boq.Sections
                    .OrderBy(s => s.DisplayOrder)
                    .Select(section => (object)new
                    {
                        SectionCode = section.SectionCode,
                        SectionName = section.SectionName,
                        Budget = section.Subtotal,
                        ValuedToDate = 0m,
                        PercentComplete = 0
                    }).ToList();
            }

            return latestCert.Items
                .Where(i => i.BoqItem?.BoqSection != null)
                .GroupBy(i => i.BoqItem!.BoqSection!)
                .OrderBy(g => g.Key.DisplayOrder)
                .Select(g =>
                {
                    decimal budget = g.Key.Subtotal;
                    decimal valuedToDate = g.Sum(i => i.CumulativeValueCompleted);
                    return (object)new
                    {
                        SectionCode = g.Key.SectionCode,
                        SectionName = g.Key.SectionName,
                        Budget = budget,
                        ValuedToDate = valuedToDate,
                        PercentComplete = budget > 0 ? Math.Round(valuedToDate / budget * 100, 1) : 0
                    };
                })
                .ToList();
        }
    }

    public class GenerateWeeklyReportDto
    {
        public int ProjectId { get; set; }
        public DateTime PeriodStartDate { get; set; }
        public DateTime PeriodEndDate { get; set; }
    }

    public class UpdateWeeklyNarrativeDto
    {
        public string KeyWorksNarrative { get; set; } = string.Empty;
        public string? LookaheadNarrative { get; set; }
    }

    public class GenerateMonthlyReportDto
    {
        public int ProjectId { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
    }

    public class UpdateMonthlyNarrativeDto
    {
        public string Narrative { get; set; } = string.Empty;
    }
}

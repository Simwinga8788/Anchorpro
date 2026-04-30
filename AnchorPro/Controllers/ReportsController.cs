using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportingService _reportingService;
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public ReportsController(IReportingService reportingService, IDbContextFactory<ApplicationDbContext> factory)
        {
            _reportingService = reportingService;
            _factory = factory;
        }

        // ─── Analytics Endpoints ──────────────────────────────────────────

        [HttpGet]
        public async Task<ActionResult> GetAll()
        {
            var reports = await _reportingService.GetScheduledReportsAsync();
            return Ok(reports);
        }

        [HttpGet("job-completion")]
        public async Task<ActionResult> GetJobCompletion([FromQuery] int days = 30)
        {
            using var ctx = await _factory.CreateDbContextAsync();
            var since = DateTime.UtcNow.AddDays(-days);
            var jobs = await ctx.JobCards
                .Where(j => j.CreatedAt >= since)
                .Include(j => j.JobType)
                .ToListAsync();

            var total = jobs.Count;
            var completed = jobs.Count(j => j.Status == JobStatus.Completed);
            var overdue = jobs.Count(j => j.Status != JobStatus.Completed
                && j.ScheduledStartDate.HasValue && j.ScheduledStartDate < DateTime.UtcNow);

            var trend = jobs
                .Where(j => j.Status == JobStatus.Completed)
                .GroupBy(j => j.CreatedAt.Date)
                .OrderBy(g => g.Key)
                .Select(g => new { date = g.Key.ToString("yyyy-MM-dd"), completedCount = g.Count() })
                .ToList();

            var byType = jobs
                .GroupBy(j => j.JobType?.Name ?? "Unclassified")
                .Select(g => new { jobTypeName = g.Key, count = g.Count() })
                .OrderByDescending(x => x.count)
                .ToList();

            return Ok(new {
                totalJobs = total,
                completedJobs = completed,
                overdueJobs = overdue,
                completionRate = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0.0,
                completionTrend = trend,
                jobTypeBreakdown = byType
            });
        }

        [HttpGet("technician-performance")]
        public async Task<ActionResult> GetTechnicianPerformance([FromQuery] int days = 30)
        {
            using var ctx = await _factory.CreateDbContextAsync();
            var since = DateTime.UtcNow.AddDays(-days);
            var jobs = await ctx.JobCards
                .Where(j => j.CreatedAt >= since && j.AssignedTechnicianId != null)
                .Include(j => j.AssignedTechnician)
                .ToListAsync();

            var stats = jobs
                .GroupBy(j => new {
                    j.AssignedTechnicianId,
                    Name = ((j.AssignedTechnician?.FirstName ?? "") + " " + (j.AssignedTechnician?.LastName ?? "")).Trim()
                })
                .Select(g => new {
                    technicianName = string.IsNullOrWhiteSpace(g.Key.Name) ? g.Key.AssignedTechnicianId : g.Key.Name,
                    jobsAssigned = g.Count(),
                    jobsCompleted = g.Count(j => j.Status == JobStatus.Completed),
                    totalCost = g.Sum(j => j.TotalCost)
                })
                .OrderByDescending(x => x.jobsCompleted)
                .ToList();

            return Ok(new { technicianStats = stats, periodDays = days });
        }

        [HttpGet("downtime-analysis")]
        public async Task<ActionResult> GetDowntimeAnalysis([FromQuery] int days = 30)
        {
            using var ctx = await _factory.CreateDbContextAsync();
            var since = DateTime.UtcNow.AddDays(-days);
            var entries = await ctx.DowntimeEntries
                .Where(d => d.StartTime >= since)
                .Include(d => d.DowntimeCategory)
                .ToListAsync();

            var byCategory = entries
                .GroupBy(d => d.DowntimeCategory?.Name ?? "Uncategorised")
                .Select(g => new {
                    category = g.Key,
                    occurrenceCount = g.Count(),
                    totalDurationHours = Math.Round(g.Sum(d =>
                        d.EndTime.HasValue
                            ? (d.EndTime.Value - d.StartTime).TotalHours
                            : (DateTime.UtcNow - d.StartTime).TotalHours), 2),
                    activeCount = g.Count(d => !d.EndTime.HasValue)
                })
                .OrderByDescending(x => x.totalDurationHours)
                .ToList();

            return Ok(new {
                totalIncidents = entries.Count,
                activeIncidents = entries.Count(d => !d.EndTime.HasValue),
                byCategory,
                periodDays = days
            });
        }

        [HttpGet("export/{type}")]
        public async Task<ActionResult> Export(string type)
        {
            if (!Enum.TryParse<ReportType>(type, true, out var reportType))
                return BadRequest(new { message = $"Unknown report type: {type}" });
            var bytes = await _reportingService.GenerateReportExcelAsync(reportType, null, null);
            if (bytes == null || bytes.Length == 0)
                return NotFound(new { message = "No data available for this report" });
            var fileName = $"AnchorPro_{type}_{DateTime.UtcNow:yyyyMMdd}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        // ─── Scheduled Reports ────────────────────────────────────────────

        [HttpGet("scheduled")]
        public async Task<ActionResult> GetScheduledReports()
        {
            var reports = await _reportingService.GetScheduledReportsAsync();
            return Ok(reports);
        }

        [HttpPost("scheduled")]
        public async Task<ActionResult> SaveReportDefinition([FromBody] ReportDefinition report)
        {
            await _reportingService.SaveReportDefinitionAsync(report);
            return Ok(new { message = "Report definition saved" });
        }

        [HttpDelete("scheduled/{id}")]
        public async Task<ActionResult> DeleteReportDefinition(int id)
        {
            await _reportingService.DeleteReportDefinitionAsync(id);
            return NoContent();
        }

        [HttpPost("scheduled/{id}/run")]
        public async Task<ActionResult> RunReport(int id)
        {
            try { await _reportingService.RunReportAsync(id); return Ok(new { message = "Report sent successfully" }); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        // ─── Download / Preview ───────────────────────────────────────────

        [HttpGet("download/excel")]
        public async Task<ActionResult> DownloadExcel([FromQuery] ReportType type, [FromQuery] int? departmentId = null)
        {
            var bytes = await _reportingService.GenerateReportExcelAsync(type, null, departmentId);
            if (bytes == null || bytes.Length == 0) return NotFound(new { message = "No data available" });
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"AnchorPro_{type}_{DateTime.UtcNow:yyyyMMdd}.xlsx");
        }

        [HttpGet("preview/html")]
        public async Task<ActionResult> PreviewHtml([FromQuery] ReportType type, [FromQuery] int? departmentId = null)
        {
            var html = await _reportingService.GenerateReportHtmlAsync(type, null, departmentId);
            return Content(html, "text/html");
        }
    }
}

using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Scheduled and on-demand report management.
    /// Requires Admin or Supervisor role.
    /// </summary>
    [Route("api/reporting")]
    [ApiController]
    [Authorize(Roles = "Admin,Supervisor,PlatformOwner")]
    public class ReportingController : ControllerBase
    {
        private readonly IReportingService _reportingService;

        public ReportingController(IReportingService reportingService)
        {
            _reportingService = reportingService;
        }

        // ── SCHEDULED REPORT DEFINITIONS ──────────────────────────────────────

        /// <summary>
        /// GET /api/reporting/schedules — All scheduled report definitions for this tenant.
        /// </summary>
        [HttpGet("schedules")]
        public async Task<ActionResult<List<ReportDefinition>>> GetSchedules()
            => Ok(await _reportingService.GetScheduledReportsAsync());

        /// <summary>
        /// POST /api/reporting/schedules — Create a new scheduled report.
        /// Body: { "name": "Monthly Maintenance", "type": 0, "cronSchedule": "0 8 1 * *",
        ///         "recipients": "manager@co.zm,cfo@co.zm", "isEnabled": true }
        /// Type: 0=MonthlyMaintenanceSummary, 1=AssetPerformance, 2=TechnicianProductivity,
        ///       3=CostAnalysis, 4=ProcurementSummary, 5=DepartmentalAudit
        /// </summary>
        [HttpPost("schedules")]
        public async Task<ActionResult> CreateSchedule([FromBody] ReportDefinition report)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            report.CreatedAt = DateTime.UtcNow;
            report.CreatedBy = userId;
            await _reportingService.SaveReportDefinitionAsync(report);
            return Ok(report);
        }

        /// <summary>
        /// DELETE /api/reporting/schedules/{id} — Remove a scheduled report.
        /// </summary>
        [HttpDelete("schedules/{id}")]
        public async Task<ActionResult> DeleteSchedule(int id)
        {
            await _reportingService.DeleteReportDefinitionAsync(id);
            return NoContent();
        }

        // ── ON-DEMAND GENERATION ──────────────────────────────────────────────

        /// <summary>
        /// POST /api/reporting/run/{reportId} — Manually trigger a scheduled report immediately.
        /// </summary>
        [HttpPost("run/{reportId}")]
        public async Task<ActionResult> RunNow(int reportId)
        {
            await _reportingService.RunReportAsync(reportId);
            return Ok(new { message = $"Report {reportId} triggered. Recipients will receive email shortly." });
        }

        /// <summary>
        /// GET /api/reporting/preview/html?type=0&amp;departmentId=2
        /// Returns the raw HTML preview of a report without emailing it.
        /// Type: 0=MonthlyMaintenanceSummary ... 5=DepartmentalAudit
        /// </summary>
        [HttpGet("preview/html")]
        public async Task<ActionResult> PreviewHtml(
            [FromQuery] ReportType type,
            [FromQuery] int? departmentId = null)
        {
            var html = await _reportingService.GenerateReportHtmlAsync(type, departmentId: departmentId);
            return Content(html, "text/html");
        }

        /// <summary>
        /// GET /api/reporting/preview/excel?type=0
        /// Downloads the Excel version of a report.
        /// </summary>
        [HttpGet("preview/excel")]
        public async Task<IActionResult> PreviewExcel(
            [FromQuery] ReportType type,
            [FromQuery] int? departmentId = null)
        {
            var bytes = await _reportingService.GenerateReportExcelAsync(type, departmentId: departmentId);
            return File(bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"report-{type}-{DateTime.UtcNow:yyyyMMdd}.xlsx");
        }
    }
}

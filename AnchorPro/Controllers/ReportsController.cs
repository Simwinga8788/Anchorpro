using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportingService _reportingService;

        public ReportsController(IReportingService reportingService)
        {
            _reportingService = reportingService;
        }

        /// <summary>
        /// Get all scheduled report definitions for the current tenant
        /// </summary>
        [HttpGet("scheduled")]
        public async Task<ActionResult> GetScheduledReports()
        {
            var reports = await _reportingService.GetScheduledReportsAsync();
            return Ok(reports);
        }

        /// <summary>
        /// Create or update a report definition
        /// </summary>
        [HttpPost("scheduled")]
        public async Task<ActionResult> SaveReportDefinition([FromBody] ReportDefinition report)
        {
            await _reportingService.SaveReportDefinitionAsync(report);
            return Ok(new { message = "Report definition saved" });
        }

        /// <summary>
        /// Delete a report definition
        /// </summary>
        [HttpDelete("scheduled/{id}")]
        public async Task<ActionResult> DeleteReportDefinition(int id)
        {
            await _reportingService.DeleteReportDefinitionAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Manually trigger a scheduled report (sends email)
        /// </summary>
        [HttpPost("scheduled/{id}/run")]
        public async Task<ActionResult> RunReport(int id)
        {
            try
            {
                await _reportingService.RunReportAsync(id);
                return Ok(new { message = "Report sent successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Download an Excel report directly
        /// </summary>
        [HttpGet("download/excel")]
        public async Task<ActionResult> DownloadExcel([FromQuery] ReportType type, [FromQuery] int? departmentId = null)
        {
            var bytes = await _reportingService.GenerateReportExcelAsync(type, null, departmentId);
            if (bytes == null || bytes.Length == 0)
                return NotFound(new { message = "No data available for this report" });

            var fileName = $"AnchorPro_{type}_{DateTime.UtcNow:yyyyMMdd}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        /// <summary>
        /// Preview a report as HTML
        /// </summary>
        [HttpGet("preview/html")]
        public async Task<ActionResult> PreviewHtml([FromQuery] ReportType type, [FromQuery] int? departmentId = null)
        {
            var html = await _reportingService.GenerateReportHtmlAsync(type, null, departmentId);
            return Content(html, "text/html");
        }
    }
}

using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Data export endpoints — returns files (CSV / Excel) for offline analysis.
    /// </summary>
    [Route("api/export")]
    [ApiController]
    [Authorize(Roles = "Admin,Supervisor,PlatformOwner")]
    public class ExportController : ControllerBase
    {
        private readonly IExportService _exportService;
        private readonly IJobCardService _jobCardService;
        private readonly IDashboardService _dashboardService;

        public ExportController(IExportService exportService, IJobCardService jobCardService, IDashboardService dashboardService)
        {
            _exportService = exportService;
            _jobCardService = jobCardService;
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// GET /api/export/jobs/csv — Download all job cards for the tenant as a CSV file.
        /// </summary>
        [HttpGet("jobs/csv")]
        public async Task<IActionResult> ExportJobsCsv()
        {
            var jobs = await _jobCardService.GetAllJobCardsAsync();
            var csvBytes = _exportService.GenerateJobHistoryCsv(jobs);
            return File(csvBytes, "text/csv", $"job-export-{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        /// <summary>
        /// GET /api/export/performance/excel?days=30
        /// Downloads an Excel workbook with performance metrics for the given period.
        /// </summary>
        [HttpGet("performance/excel")]
        public async Task<IActionResult> ExportPerformanceExcel([FromQuery] int days = 30)
        {
            var metrics = await _dashboardService.GetPerformanceMetricsAsync(days);
            var excelBytes = _exportService.GeneratePerformanceExcel(metrics);
            return File(excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"performance-{DateTime.UtcNow:yyyyMMdd}.xlsx");
        }
    }
}

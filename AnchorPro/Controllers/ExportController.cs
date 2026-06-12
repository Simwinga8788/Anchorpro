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
    [Authorize(Roles = "Admin,Supervisor,Planner,PlatformOwner")]
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
        /// GET /api/export/jobs/excel — Download all job cards for the tenant as a styled Excel file.
        /// </summary>
        [HttpGet("jobs/excel")]
        public async Task<IActionResult> ExportJobsExcel()
        {
            var jobs = await _jobCardService.GetAllJobCardsAsync();
            var excelBytes = _exportService.GenerateJobHistoryExcel(jobs);
            return File(excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"job-export-{DateTime.UtcNow:yyyyMMdd}.xlsx");
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

        /// <summary>
        /// GET /api/export/jobs/template — Download the professional Excel import template.
        /// </summary>
        [HttpGet("jobs/template")]
        public IActionResult GetImportTemplate()
        {
            var excelBytes = _exportService.GenerateJobImportTemplate();
            return File(excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "job-import-template.xlsx");
        }

        /// <summary>
        /// GET /api/export/equipment/excel — Download all equipment for the tenant as a styled Excel file.
        /// </summary>
        [HttpGet("equipment/excel")]
        public async Task<IActionResult> ExportEquipmentExcel([FromServices] IEquipmentService equipmentService)
        {
            var equip = await equipmentService.GetAllEquipmentAsync();
            var excelBytes = _exportService.GenerateEquipmentExcel(equip);
            return File(excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"equipment-export-{DateTime.UtcNow:yyyyMMdd}.xlsx");
        }

        /// <summary>
        /// GET /api/export/equipment/template — Download the equipment import template.
        /// </summary>
        [HttpGet("equipment/template")]
        public async Task<IActionResult> GetEquipmentTemplate([FromServices] IOrgService orgService)
        {
            var depts = await orgService.GetAllDepartmentsAsync();
            var deptNames = depts.Select(d => d.Name).ToList();
            var excelBytes = _exportService.GenerateEquipmentImportTemplate(deptNames);
            return File(excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "equipment-import-template.xlsx");
        }

        /// <summary>
        /// GET /api/export/inventory/excel — Download all inventory for the tenant as a styled Excel file.
        /// </summary>
        [HttpGet("inventory/excel")]
        public async Task<IActionResult> ExportInventoryExcel([FromServices] IInventoryService inventoryService)
        {
            var items = await inventoryService.GetAllItemsAsync();
            var excelBytes = _exportService.GenerateInventoryExcel(items);
            return File(excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"inventory-export-{DateTime.UtcNow:yyyyMMdd}.xlsx");
        }

        /// <summary>
        /// GET /api/export/inventory/template — Download the inventory import template.
        /// </summary>
        [HttpGet("inventory/template")]
        public IActionResult GetInventoryTemplate()
        {
            var excelBytes = _exportService.GenerateInventoryImportTemplate();
            return File(excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "inventory-import-template.xlsx");
        }

        /// <summary>
        /// GET /api/export/tools/excel — Download all tools for the tenant as a styled Excel file.
        /// </summary>
        [HttpGet("tools/excel")]
        public async Task<IActionResult> ExportToolsExcel([FromServices] IToolService toolService)
        {
            var tools = await toolService.GetAllToolsAsync();
            var excelBytes = _exportService.GenerateToolsExcel(tools);
            return File(excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"tools-export-{DateTime.UtcNow:yyyyMMdd}.xlsx");
        }

        /// <summary>
        /// GET /api/export/tools/template — Download the tools import template.
        /// </summary>
        [HttpGet("tools/template")]
        public IActionResult GetToolsTemplate()
        {
            var excelBytes = _exportService.GenerateToolsImportTemplate();
            return File(excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "tools-import-template.xlsx");
        }
    }
}

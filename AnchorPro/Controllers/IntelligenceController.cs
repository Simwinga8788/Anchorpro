using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Business Intelligence reports: profitability, utilization, revenue breakdown, asset health.
    /// All date ranges are UTC. Format: 2025-01-01T00:00:00Z
    /// </summary>
    [Route("api/intelligence")]
    [ApiController]
    public class IntelligenceController : ControllerBase
    {
        private readonly IIntelligenceService _intelligenceService;

        public IntelligenceController(IIntelligenceService intelligenceService)
        {
            _intelligenceService = intelligenceService;
        }

        // ── EXECUTIVE SUMMARY ─────────────────────────────────────────────────

        /// <summary>
        /// GET /api/intelligence/summary
        /// Returns high-level KPIs: total revenue, active jobs, completion rate,
        /// avg job margin, top-performing tech, best-revenue customer.
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult> GetExecutiveSummary()
            => Ok(await _intelligenceService.GetExecutiveSummaryAsync());

        // ── JOB PROFITABILITY ─────────────────────────────────────────────────

        /// <summary>
        /// GET /api/intelligence/profitability?startDate=2025-01-01&amp;endDate=2025-12-31
        /// Returns per-job profitability report: cost, invoice amount, profit margin.
        /// </summary>
        [HttpGet("profitability")]
        public async Task<ActionResult> GetProfitability(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
            => Ok(await _intelligenceService.GetProfitabilityReportAsync(
                DateTime.SpecifyKind(startDate, DateTimeKind.Utc),
                DateTime.SpecifyKind(endDate, DateTimeKind.Utc)));

        // ── TECHNICIAN UTILIZATION ────────────────────────────────────────────

        /// <summary>
        /// GET /api/intelligence/technician-utilization?startDate=...&amp;endDate=...
        /// Returns per-technician stats: jobs assigned, completed, avg hours, efficiency %.
        /// </summary>
        [HttpGet("technician-utilization")]
        public async Task<ActionResult> GetTechnicianUtilization(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
            => Ok(await _intelligenceService.GetTechnicianUtilizationAsync(
                DateTime.SpecifyKind(startDate, DateTimeKind.Utc),
                DateTime.SpecifyKind(endDate, DateTimeKind.Utc)));

        // ── REVENUE BY CUSTOMER ───────────────────────────────────────────────

        /// <summary>
        /// GET /api/intelligence/revenue-by-customer?startDate=...&amp;endDate=...
        /// Returns total revenue per customer, sorted highest first.
        /// </summary>
        [HttpGet("revenue-by-customer")]
        public async Task<ActionResult> GetRevenueByCustomer(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
            => Ok(await _intelligenceService.GetRevenueByCustomerAsync(
                DateTime.SpecifyKind(startDate, DateTimeKind.Utc),
                DateTime.SpecifyKind(endDate, DateTimeKind.Utc)));

        // ── ASSET PERFORMANCE ─────────────────────────────────────────────────

        /// <summary>
        /// GET /api/intelligence/asset-performance?startDate=...&amp;endDate=...
        /// Returns per-equipment stats: total jobs, downtime hours, MTTR, revenue generated.
        /// </summary>
        [HttpGet("asset-performance")]
        public async Task<ActionResult> GetAssetPerformance(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
            => Ok(await _intelligenceService.GetAssetPerformanceAsync(
                DateTime.SpecifyKind(startDate, DateTimeKind.Utc),
                DateTime.SpecifyKind(endDate, DateTimeKind.Utc)));

        // ── INVENTORY CONSUMPTION ─────────────────────────────────────────────

        /// <summary>
        /// GET /api/intelligence/inventory-consumption?startDate=...&amp;endDate=...
        /// Returns parts consumed per period: item name, quantity used, total cost.
        /// </summary>
        [HttpGet("inventory-consumption")]
        public async Task<ActionResult> GetInventoryConsumption(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
            => Ok(await _intelligenceService.GetInventoryConsumptionAsync(
                DateTime.SpecifyKind(startDate, DateTimeKind.Utc),
                DateTime.SpecifyKind(endDate, DateTimeKind.Utc)));
    }
}

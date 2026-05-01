using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class IntelligenceController : ControllerBase
    {
        private readonly IIntelligenceService _intelligenceService;
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly ICurrentTenantService _tenantService;

        public IntelligenceController(
            IIntelligenceService intelligenceService,
            IDbContextFactory<ApplicationDbContext> factory,
            ICurrentTenantService tenantService)
        {
            _intelligenceService = intelligenceService;
            _factory = factory;
            _tenantService = tenantService;
        }

        [HttpGet("profitability")]
        public async Task<ActionResult> GetProfitability([FromQuery] int days = 30)
        {
            var end = DateTime.UtcNow;
            var start = end.AddDays(-days);
            var data = await _intelligenceService.GetProfitabilityReportAsync(start, end);
            return Ok(data);
        }

        [HttpGet("technicians")]
        public async Task<ActionResult> GetTechnicianUtilization([FromQuery] int days = 30)
        {
            var end = DateTime.UtcNow;
            var start = end.AddDays(-days);
            var data = await _intelligenceService.GetTechnicianUtilizationAsync(start, end);
            return Ok(data);
        }

        [HttpGet("revenue")]
        public async Task<ActionResult> GetRevenueByCustomer([FromQuery] int days = 30)
        {
            var end = DateTime.UtcNow;
            var start = end.AddDays(-days);
            var data = await _intelligenceService.GetRevenueByCustomerAsync(start, end);
            return Ok(data);
        }

        [HttpGet("assets")]
        public async Task<ActionResult> GetAssetPerformance([FromQuery] int days = 30)
        {
            var end = DateTime.UtcNow;
            var start = end.AddDays(-days);
            var data = await _intelligenceService.GetAssetPerformanceAsync(start, end);
            return Ok(data);
        }

        [HttpGet("inventory")]
        public async Task<ActionResult> GetInventoryConsumption([FromQuery] int days = 30)
        {
            var end = DateTime.UtcNow;
            var start = end.AddDays(-days);
            var data = await _intelligenceService.GetInventoryConsumptionAsync(start, end);
            return Ok(data);
        }

        [HttpGet("executive")]
        public async Task<ActionResult> GetExecutiveSummary()
        {
            var data = await _intelligenceService.GetExecutiveSummaryAsync();
            return Ok(data);
        }

        /// <summary>
        /// Real-time alerts derived from live DB data:
        /// overdue jobs, low stock, jobs with no technician assigned.
        /// </summary>
        [HttpGet("alerts")]
        public async Task<ActionResult> GetAlerts()
        {
            using var ctx = _factory.CreateDbContext();
            ctx.IgnoreTenantFilter = true;
            var tid = _tenantService.TenantId;
            var now = DateTime.UtcNow;
            var alerts = new List<object>();

            // ── Overdue jobs (not completed/cancelled and past deadline) ──
            var overdueJobs = await ctx.JobCards
                .Where(j => j.TenantId == tid
                    && j.ScheduledEndDate != null
                    && j.ScheduledEndDate < now
                    && (int)j.Status < 3) // not Completed or Cancelled
                .OrderBy(j => j.ScheduledEndDate)
                .Take(5)
                .Select(j => new { j.Id, j.JobNumber, j.Description, j.ScheduledEndDate, j.Priority })
                .ToListAsync();

            foreach (var job in overdueJobs)
            {
                var hoursOver = Math.Round((now - job.ScheduledEndDate!.Value).TotalHours, 0);
                alerts.Add(new
                {
                    id = $"overdue-{job.Id}",
                    title = $"Overdue Job — {job.JobNumber}",
                    message = $"{job.Description} is {hoursOver}h past its deadline.",
                    severity = (int)job.Priority >= 2 ? "critical" : "warning",
                    createdAt = job.ScheduledEndDate,
                    isRead = false,
                });
            }

            // ── Unassigned high-priority jobs ──
            var unassigned = await ctx.JobCards
                .Where(j => j.TenantId == tid
                    && j.AssignedTechnicianId == null
                    && (int)j.Priority >= 2
                    && (int)j.Status < 3)
                .Take(3)
                .Select(j => new { j.Id, j.JobNumber, j.Description, j.Priority, j.CreatedAt })
                .ToListAsync();

            foreach (var job in unassigned)
            {
                alerts.Add(new
                {
                    id = $"unassigned-{job.Id}",
                    title = $"Unassigned High-Priority Job",
                    message = $"{job.JobNumber}: {job.Description} has no technician assigned.",
                    severity = "warning",
                    createdAt = job.CreatedAt,
                    isRead = false,
                });
            }

            // ── Low stock inventory ──
            var lowStock = await ctx.InventoryItems
                .Where(i => i.TenantId == tid && i.QuantityOnHand <= i.ReorderLevel)
                .Take(5)
                .Select(i => new { i.Id, i.Name, i.QuantityOnHand, i.ReorderLevel, i.UpdatedAt })
                .ToListAsync();

            foreach (var item in lowStock)
            {
                alerts.Add(new
                {
                    id = $"stock-{item.Id}",
                    title = "Low Stock Alert",
                    message = $"{item.Name} is at {item.QuantityOnHand} units (reorder at {item.ReorderLevel}).",
                    severity = item.QuantityOnHand == 0 ? "critical" : "warning",
                    createdAt = item.UpdatedAt ?? now,
                    isRead = false,
                });
            }

            return Ok(alerts.OrderByDescending(a => ((dynamic)a).severity == "critical" ? 1 : 0).ToList());
        }
    }
}


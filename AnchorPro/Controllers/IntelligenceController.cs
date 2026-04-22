using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class IntelligenceController : ControllerBase
    {
        private readonly IIntelligenceService _intelligenceService;

        public IntelligenceController(IIntelligenceService intelligenceService)
        {
            _intelligenceService = intelligenceService;
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
    }
}

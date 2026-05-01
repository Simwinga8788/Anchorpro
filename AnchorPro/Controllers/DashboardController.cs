using AnchorPro.Data.Models;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<DashboardStats>> GetStats()
        {
            var stats = await _dashboardService.GetDashboardStatsAsync();
            return Ok(stats);
        }

        [HttpGet("activity")]
        public async Task<ActionResult> GetActivity()
        {
            var stats = await _dashboardService.GetDashboardStatsAsync();
            return Ok(stats.RecentActivity);
        }

        [HttpGet("performance")]
        public async Task<ActionResult<PerformanceMetrics>> GetPerformance([FromQuery] int days = 30)
        {
            var metrics = await _dashboardService.GetPerformanceMetricsAsync(days);
            return Ok(metrics);
        }

        [HttpGet("health")]
        public async Task<ActionResult<SystemHealth>> GetHealth()
        {
            var health = await _dashboardService.GetSystemHealthAsync();
            return Ok(health);
        }
        
        [HttpGet("executive")]
        public async Task<ActionResult<ExecutiveSnapshot>> GetExecutiveSnapshot()
        {
            var snapshot = await _dashboardService.GetExecutiveSnapshotAsync();
            return Ok(snapshot);
        }

        [HttpGet("departments")]
        public async Task<ActionResult<List<DepartmentalSnapshot>>> GetDepartments()
        {
            var departments = await _dashboardService.GetDepartmentalSnapshotAsync();
            return Ok(departments);
        }
    }
}

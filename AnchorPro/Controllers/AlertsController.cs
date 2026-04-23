using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AlertsController : ControllerBase
    {
        private readonly IAlertService _alertService;

        public AlertsController(IAlertService alertService)
        {
            _alertService = alertService;
        }

        [HttpPost("check")]
        public async Task<ActionResult> TriggerChecks()
        {
            // Trigger background alert checks manually
            await Task.WhenAll(
                _alertService.CheckForLowMarginJobsAsync(),
                _alertService.CheckForOverdueJobsAsync()
            );
            return Ok(new { message = "Alert checks triggered successfully." });
        }
    }
}

using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/alerts")]
    [ApiController]
    public class AlertsController : ControllerBase
    {
        private readonly IAlertService _alertService;

        public AlertsController(IAlertService alertService)
        {
            _alertService = alertService;
        }

        /// <summary>
        /// GET /api/alerts
        /// Returns paginated alerts for the current tenant, newest first.
        /// Query params:
        ///   ?isRead=false           — unread only (omit for all)
        ///   ?category=OverdueJob    — filter by category
        ///   ?page=1&pageSize=50     — pagination
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<Alert>>> GetAll(
            [FromQuery] bool? isRead = null,
            [FromQuery] string? category = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
            => Ok(await _alertService.GetAlertsAsync(isRead, category, page, pageSize));

        /// <summary>
        /// GET /api/alerts/unread-count
        /// Returns the total number of unread alerts for the current tenant.
        /// Use this to drive the notification badge on the UI.
        /// </summary>
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
            => Ok(await _alertService.GetUnreadCountAsync());

        /// <summary>
        /// PATCH /api/alerts/{id}/read
        /// Marks a single alert as read by the currently authenticated user.
        /// </summary>
        [HttpPatch("{id}/read")]
        public async Task<ActionResult> MarkAsRead(int id)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _alertService.MarkAsReadAsync(id, userId);
            return Ok(new { message = $"Alert {id} marked as read." });
        }

        /// <summary>
        /// PATCH /api/alerts/dismiss-all
        /// Marks all unread alerts for the current tenant as read.
        /// Use this for the "Clear all notifications" button on the UI.
        /// </summary>
        [HttpPatch("dismiss-all")]
        public async Task<ActionResult> DismissAll()
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _alertService.DismissAllAsync(userId);
            return Ok(new { message = "All alerts dismissed." });
        }

        /// <summary>
        /// POST /api/alerts
        /// Manually creates an alert (e.g. from a Blazor component or admin action).
        /// Body: { "title": "...", "message": "...", "severity": "Warning", "category": "General" }
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Alert>> Create([FromBody] CreateAlertRequest req)
        {
            var alert = await _alertService.CreateAlertAsync(
                req.Title, req.Message, req.Severity, req.Category,
                req.JobCardId, req.CustomerId);
            return CreatedAtAction(nameof(GetAll), new { }, alert);
        }
    }

    public class CreateAlertRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "Info";    // Info | Warning | Critical
        public string Category { get; set; } = "General"; // General | LowMargin | OverdueJob | TechnicianDelay | PaymentOverdue
        public int? JobCardId { get; set; }
        public int? CustomerId { get; set; }
    }
}

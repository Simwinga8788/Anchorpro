using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class DowntimeController : ControllerBase
    {
        private readonly IDowntimeService _downtimeService;

        public DowntimeController(IDowntimeService downtimeService)
        {
            _downtimeService = downtimeService;
        }

        /// <summary>GET /api/downtime — Full downtime history (used in DowntimeHistory page).</summary>
        [HttpGet]
        public async Task<ActionResult<List<DowntimeEntry>>> GetAll()
            => Ok(await _downtimeService.GetAllDowntimeAsync());

        /// <summary>GET /api/downtime/task/{taskId} — All downtime entries for a specific task.</summary>
        [HttpGet("task/{taskId}")]
        public async Task<ActionResult<List<DowntimeEntry>>> GetForTask(int taskId)
            => Ok(await _downtimeService.GetDowntimeForTaskAsync(taskId));

        /// <summary>
        /// GET /api/downtime/active?userId=...
        /// Returns the currently open (EndTime == null) downtime entry for a technician.
        /// Used by TaskExecution to auto-close when resuming a job.
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<DowntimeEntry>> GetActive([FromQuery] string userId)
        {
            var result = await _downtimeService.GetActiveDowntimeAsync(userId);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>
        /// POST /api/downtime — Start a downtime event (pauses job timer).
        /// Body: { "jobTaskId": 5, "downtimeCategoryId": 1, "notes": "...", "startTime": "..." }
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] DowntimeEntry entry)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _downtimeService.CreateDowntimeEntryAsync(entry, userId);
            return Ok(entry);
        }

        /// <summary>
        /// PUT /api/downtime/{id} — Update a downtime entry (set EndTime + DurationMinutes to close it).
        /// Used when resuming a job.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] DowntimeEntry entry)
        {
            if (id != entry.Id) return BadRequest("ID mismatch.");
            var userId = User.Identity?.Name ?? "API_User";
            await _downtimeService.UpdateDowntimeEntryAsync(entry, userId);
            return NoContent();
        }

        /// <summary>DELETE /api/downtime/{id}</summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _downtimeService.DeleteDowntimeEntryAsync(id);
            return NoContent();
        }
    }
}

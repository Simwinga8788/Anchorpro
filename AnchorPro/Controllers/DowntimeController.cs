using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DowntimeController : ControllerBase
    {
        private readonly IDowntimeService _downtimeService;

        public DowntimeController(IDowntimeService downtimeService)
        {
            _downtimeService = downtimeService;
        }

        [HttpGet("task/{taskId}")]
        public async Task<ActionResult<List<DowntimeEntry>>> GetForTask(int taskId)
        {
            var result = await _downtimeService.GetDowntimeForTaskAsync(taskId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] DowntimeEntry entry)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _downtimeService.CreateDowntimeEntryAsync(entry, userId);
            return Ok(entry);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] DowntimeEntry entry)
        {
            if (id != entry.Id) return BadRequest();
            var userId = User.Identity?.Name ?? "API_User";
            await _downtimeService.UpdateDowntimeEntryAsync(entry, userId);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _downtimeService.DeleteDowntimeEntryAsync(id);
            return NoContent();
        }
    }
}

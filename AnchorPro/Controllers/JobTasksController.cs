using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class JobTasksController : ControllerBase
    {
        private readonly IJobTaskService _taskService;

        public JobTasksController(IJobTaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpGet("job/{jobId}")]
        public async Task<ActionResult<List<JobTask>>> GetByJobId(int jobId)
        {
            var result = await _taskService.GetTasksForJobCardAsync(jobId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<JobTask>> GetById(int id)
        {
            var result = await _taskService.GetTaskByIdAsync(id);
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] JobTask task)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _taskService.CreateTaskAsync(task, userId);
            return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] JobTask task)
        {
            if (id != task.Id)
            {
                return BadRequest("ID mismatch");
            }
            var userId = User.Identity?.Name ?? "API_User";
            await _taskService.UpdateTaskAsync(task, userId);
            return NoContent();
        }

        [HttpPost("{id}/complete")]
        public async Task<ActionResult> Complete(int id)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _taskService.CompleteTaskAsync(id, userId);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _taskService.DeleteTaskAsync(id);
            return NoContent();
        }
    }
}

using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobCardsController : ControllerBase
    {
        private readonly IJobCardService _jobService;
        private readonly IJobTaskService _taskService;

        public JobCardsController(IJobCardService jobService, IJobTaskService taskService)
        {
            _jobService = jobService;
            _taskService = taskService;
        }

        [HttpGet]
        public async Task<ActionResult<List<JobCard>>> GetAll()
        {
            var result = await _jobService.GetAllJobCardsAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<JobCard>> GetById(int id)
        {
            var result = await _jobService.GetJobCardByIdAsync(id);
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpGet("technician/{technicianId}")]
        public async Task<ActionResult<List<JobCard>>> GetByTechnician(string technicianId)
        {
            var result = await _jobService.GetJobCardsByTechnicianAsync(technicianId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] JobCard jobCard)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _jobService.CreateJobCardAsync(jobCard, userId);
            return CreatedAtAction(nameof(GetById), new { id = jobCard.Id }, jobCard);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] JobCard jobCard)
        {
            if (id != jobCard.Id)
            {
                return BadRequest("ID mismatch");
            }

            var userId = User.Identity?.Name ?? "API_User";
            await _jobService.UpdateJobCardAsync(jobCard, userId);
            return NoContent();
        }

        [HttpPatch("{id}/status")]
        public async Task<ActionResult> UpdateStatus(int id, [FromBody] JobStatus status)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _jobService.UpdateJobStatusAsync(id, status, userId);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _jobService.DeleteJobCardAsync(id);
            return NoContent();
        }
    }
}

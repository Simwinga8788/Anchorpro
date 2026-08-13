using System;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace AnchorPro.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectTasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectTasksController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyTasks()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var myTasks = await _context.ProjectTasks
                .Include(t => t.Project)
                .Where(t => t.AssignedToId == userId)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Description,
                    Status = t.Status.ToString(),
                    Priority = t.Priority.ToString(),
                    t.StartDate,
                    t.DueDate,
                    t.EstimatedHours,
                    t.ActualHours,
                    ProjectName = t.Project != null ? t.Project.Name : "Unknown Project"
                })
                .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
                .ToListAsync();

            return Ok(myTasks);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask(ProjectTaskDto dto)
        {
            var task = new ProjectTask
            {
                ProjectId = dto.ProjectId,
                Title = dto.Title,
                Description = dto.Description,
                Status = Enum.Parse<ProjectTaskStatus>(dto.Status ?? "ToDo"),
                Priority = Enum.Parse<ProjectTaskPriority>(dto.Priority ?? "Normal"),
                StartDate = dto.StartDate,
                DueDate = dto.DueDate,
                EstimatedHours = dto.EstimatedHours,
                AssignedToId = dto.AssignedToId
            };

            _context.ProjectTasks.Add(task);
            await _context.SaveChangesAsync();
            return Ok(task);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, ProjectTaskDto dto)
        {
            var task = await _context.ProjectTasks.FindAsync(id);
            if (task == null) return NotFound();

            if (!string.IsNullOrEmpty(dto.Title)) task.Title = dto.Title;
            if (dto.Description != null && dto.Description != "") task.Description = dto.Description;
            if (!string.IsNullOrEmpty(dto.Status)) task.Status = Enum.Parse<ProjectTaskStatus>(dto.Status);
            if (!string.IsNullOrEmpty(dto.Priority)) task.Priority = Enum.Parse<ProjectTaskPriority>(dto.Priority);
            
            // Only update dates if provided (this prevents status updates from clearing dates)
            if (dto.StartDate.HasValue) task.StartDate = dto.StartDate;
            if (dto.DueDate.HasValue) task.DueDate = dto.DueDate;
            if (dto.EstimatedHours > 0) task.EstimatedHours = dto.EstimatedHours;
            if (dto.ActualHours > 0) task.ActualHours = dto.ActualHours;
            if (!string.IsNullOrEmpty(dto.AssignedToId)) task.AssignedToId = dto.AssignedToId;

            await _context.SaveChangesAsync();
            return Ok(task);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.ProjectTasks.FindAsync(id);
            if (task == null) return NotFound();

            _context.ProjectTasks.Remove(task);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }

    public class ProjectTaskDto
    {
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal EstimatedHours { get; set; }
        public decimal ActualHours { get; set; }
        public string? AssignedToId { get; set; }
    }
}

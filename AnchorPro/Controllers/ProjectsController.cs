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
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var projects = await _context.Projects
                .Include(p => p.Customer)
                .Include(p => p.Manager)
                .Include(p => p.JobCards)
                .Include(p => p.ShiftLogs)
                    .ThenInclude(s => s.CostEntries)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Description,
                    Status = p.Status.ToString(),
                    p.StartDate,
                    p.EndDate,
                    p.Budget,
                    CustomerName = p.Customer != null ? p.Customer.Name : null,
                    ManagerName = p.Manager != null ? p.Manager.FirstName + " " + p.Manager.LastName : null,
                    OperationsCount = p.JobCards.Count + p.ShiftLogs.Count,
                    // Roll up costs from both Job Cards and Shift Logs
                    TotalCost = p.JobCards.Sum(j => j.TotalCost) + p.ShiftLogs.SelectMany(s => s.CostEntries).Sum(c => c.Amount)
                })
                .ToListAsync();

            return Ok(projects);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            var project = await _context.Projects
                .Include(p => p.Customer)
                .Include(p => p.Manager)
                .Include(p => p.JobCards)
                    .ThenInclude(j => j.AssignedTechnician)
                .Include(p => p.ShiftLogs)
                    .ThenInclude(s => s.CostEntries)
                .Include(p => p.ShiftLogs)
                    .ThenInclude(s => s.Equipment)
                .Include(p => p.JobCards)
                    .ThenInclude(j => j.Equipment)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null) return NotFound();

            var projectTasks = await _context.ProjectTasks
                .Include(t => t.AssignedTo)
                .Where(t => t.ProjectId == id)
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
                    AssignedToName = t.AssignedTo != null ? t.AssignedTo.FirstName + " " + t.AssignedTo.LastName : null
                })
                .ToListAsync();

            return Ok(new
            {
                project.Id,
                project.Name,
                project.Description,
                Status = project.Status.ToString(),
                project.StartDate,
                project.EndDate,
                project.Budget,
                project.CustomerId,
                CustomerName = project.Customer?.Name,
                project.ManagerId,
                ManagerName = project.Manager != null ? project.Manager.FirstName + " " + project.Manager.LastName : null,
                
                // Rollups
                TotalCost = (project.JobCards?.Sum(j => j.TotalCost) ?? 0) + (project.ShiftLogs?.SelectMany(s => s.CostEntries ?? new List<CostEntry>()).Sum(c => c.Amount) ?? 0),
                
                // Workshop Mode Links
                JobCards = project.JobCards?.Select(j => new
                {
                    j.Id,
                    j.JobNumber,
                    j.Description,
                    Status = j.Status.ToString(),
                    j.TotalCost,
                    TechnicianName = j.AssignedTechnician != null ? j.AssignedTechnician.FirstName + " " + j.AssignedTechnician.LastName : null,
                    EquipmentName = j.Equipment?.Name
                }),
                
                // Mining Mode Links
                ShiftLogs = project.ShiftLogs?.Select(s => new
                {
                    s.Id,
                    s.LogNumber,
                    ShiftDate = s.ShiftDate,
                    Shift = s.Shift.ToString(),
                    Status = s.Status.ToString(),
                    s.QuantityProduced,
                    s.UnitOfMeasure,
                    TotalCost = s.CostEntries?.Sum(c => c.Amount) ?? 0,
                    EquipmentName = s.Equipment?.Name
                }),

                // Kanban Tasks
                Tasks = projectTasks
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateProject(ProjectDto dto)
        {
            var project = new Project
            {
                Name = dto.Name,
                Description = dto.Description,
                Status = Enum.Parse<ProjectStatus>(dto.Status ?? "Draft"),
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Budget = dto.Budget,
                CustomerId = dto.CustomerId,
                ManagerId = dto.ManagerId
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            return Ok(project);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, ProjectDto dto)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            project.Name = dto.Name;
            project.Description = dto.Description;
            if (!string.IsNullOrEmpty(dto.Status)) project.Status = Enum.Parse<ProjectStatus>(dto.Status);
            project.StartDate = dto.StartDate;
            project.EndDate = dto.EndDate;
            project.Budget = dto.Budget;
            project.CustomerId = dto.CustomerId;
            project.ManagerId = dto.ManagerId;

            await _context.SaveChangesAsync();
            return Ok(project);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }

    public class ProjectDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal Budget { get; set; }
        public int? CustomerId { get; set; }
        public string? ManagerId { get; set; }
    }
}

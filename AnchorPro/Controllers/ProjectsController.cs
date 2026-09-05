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
                .Include(p => p.Expenses)
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
                    // Roll up costs from Job Cards, Shift Logs, Direct Expenses, and Vendor Bills (materials/subcontractors billed against this project's Purchase Orders)
                    TotalCost = p.JobCards.Sum(j => j.TotalCost) + p.ShiftLogs.SelectMany(s => s.CostEntries).Sum(c => c.Amount) + p.Expenses.Sum(e => e.Amount)
                        + _context.VendorBills.Where(vb => vb.PurchaseOrder != null && vb.PurchaseOrder.ProjectId == p.Id).Sum(vb => (decimal?)vb.TotalAmount) ?? 0
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
                .Include(p => p.Members)
                    .ThenInclude(m => m.User)
                .Include(p => p.Expenses)
                .Include(p => p.Invoices)
                .Include(p => p.Documents)
                    .ThenInclude(d => d.UploadedBy)
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

            // Materials/subcontractor costs billed against this project's Purchase Orders — not a direct
            // navigation on Project, so queried separately rather than via an Include above.
            var vendorBillsTotal = await _context.VendorBills
                .Where(vb => vb.PurchaseOrder != null && vb.PurchaseOrder.ProjectId == id)
                .SumAsync(vb => (decimal?)vb.TotalAmount) ?? 0;

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
                TotalCost = (project.JobCards?.Sum(j => j.TotalCost) ?? 0) + (project.ShiftLogs?.SelectMany(s => s.CostEntries ?? new List<WorkDocumentCostEntry>()).Sum(c => c.Amount) ?? 0) + (project.Expenses?.Sum(e => e.Amount) ?? 0) + vendorBillsTotal,
                
                Invoices = project.Invoices?.Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    i.InvoiceDate,
                    i.DueDate,
                    i.Total,
                    PaymentStatus = i.PaymentStatus.ToString()
                }),
                Documents = project.Documents?.Select(d => new
                {
                    d.Id,
                    d.FileName,
                    d.FileUrl,
                    d.UploadedAt,
                    d.Category,
                    d.RevisionNumber,
                    d.BoqSectionId,
                    UploadedBy = new {
                        d.UploadedBy?.FirstName,
                        d.UploadedBy?.LastName
                    }
                }),

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
                Tasks = projectTasks,
                
                // Team Members
                Members = project.Members?.Select(m => new
                {
                    m.Id,
                    m.UserId,
                    UserName = m.User != null ? m.User.FirstName + " " + m.User.LastName : null,
                    m.ProjectRole
                }),

                // Direct Expenses
                DirectExpenses = project.Expenses?.Select(e => new
                {
                    e.Id,
                    e.Description,
                    e.Amount,
                    e.ExpenseDate,
                    Category = e.Category.ToString(),
                    e.RecordedBy
                }).OrderByDescending(e => e.ExpenseDate)
            });
        }

        [HttpPost("{id}/expenses")]
        public async Task<IActionResult> AddExpense(int id, ExpenseDto dto)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            var expense = new Expense
            {
                ProjectId = id,
                Description = dto.Description,
                Amount = dto.Amount,
                Category = Enum.TryParse<ExpenseCategory>(dto.Category, out var cat) ? cat : ExpenseCategory.Other,
                ExpenseDate = dto.ExpenseDate ?? DateTime.UtcNow,
                RecordedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User"
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();
            return Ok(expense);
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

        private const long MaxDocumentUploadBytes = 50 * 1024 * 1024; // 50MB

        private static readonly HashSet<string> AllowedDocumentExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".doc", ".docx", ".xls", ".xlsx",   // documents, specs, contracts
            ".dwg", ".dxf",                              // CAD drawings
            ".jpg", ".jpeg", ".png", ".heic", ".webp",   // photos / scanned pages
        };

        [HttpPost("{id}/documents")]
        [RequestSizeLimit(MaxDocumentUploadBytes)]
        public async Task<IActionResult> UploadDocument(
            int id,
            IFormFile file,
            [FromForm] ProjectDocumentCategory category = ProjectDocumentCategory.Other,
            [FromForm] string? revisionNumber = null,
            [FromForm] int? boqSectionId = null)
        {
            if (file == null || file.Length == 0) return BadRequest("No file provided");

            if (file.Length > MaxDocumentUploadBytes)
                return BadRequest($"File exceeds the {MaxDocumentUploadBytes / 1024 / 1024}MB upload limit.");

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(extension) || !AllowedDocumentExtensions.Contains(extension))
                return BadRequest($"File type '{extension}' is not allowed. Accepted types: {string.Join(", ", AllowedDocumentExtensions.OrderBy(e => e))}.");

            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var doc = new ProjectDocument
            {
                ProjectId = id,
                FileName = file.FileName,
                FileUrl = $"/uploads/{fileName}",
                UploadedById = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
                Category = category,
                RevisionNumber = string.IsNullOrWhiteSpace(revisionNumber) ? null : revisionNumber.Trim(),
                BoqSectionId = boqSectionId
            };

            _context.ProjectDocuments.Add(doc);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                doc.Id,
                doc.FileName,
                doc.FileUrl,
                doc.UploadedAt,
                doc.Category,
                doc.RevisionNumber,
                doc.BoqSectionId
            });
        }

        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddMember(int id, ProjectMemberDto dto)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            var member = new ProjectMember
            {
                ProjectId = id,
                UserId = dto.UserId,
                ProjectRole = dto.ProjectRole
            };

            _context.ProjectMembers.Add(member);
            await _context.SaveChangesAsync();
            return Ok(member);
        }

        [HttpDelete("{id}/members/{userId}")]
        public async Task<IActionResult> RemoveMember(int id, string userId)
        {
            var member = await _context.ProjectMembers
                .FirstOrDefaultAsync(m => m.ProjectId == id && m.UserId == userId);
            
            if (member == null) return NotFound();

            _context.ProjectMembers.Remove(member);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }

    public class ProjectMemberDto
    {
        public string UserId { get; set; } = string.Empty;
        public string ProjectRole { get; set; } = "Viewer";
    }

    public class ExpenseDto
    {
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Category { get; set; } = "Other";
        public DateTime? ExpenseDate { get; set; }
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

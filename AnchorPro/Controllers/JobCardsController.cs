using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]  // All job card endpoints require authentication
    public class JobCardsController : ControllerBase
    {
        private readonly IJobCardService _jobService;
        private readonly IJobTaskService _taskService;

        public JobCardsController(IJobCardService jobService, IJobTaskService taskService)
        {
            _jobService = jobService;
            _taskService = taskService;
        }

        // ── LIST / GET ────────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/jobcards — All job cards for the current tenant.
        /// Optional filter: ?status=2 (0=Unscheduled,1=Scheduled,2=InProgress,3=Completed,4=Cancelled,5=OnHold)
        /// Optional filter: ?priority=2 (0=Low,1=Normal,2=High,3=Critical)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<JobCard>>> GetAll(
            [FromQuery] JobStatus? status = null,
            [FromQuery] int? priority = null)
        {
            var all = await _jobService.GetAllJobCardsAsync();
            if (status.HasValue)
                all = all.Where(j => j.Status == status.Value).ToList();
            if (priority.HasValue)
                all = all.Where(j => (int)j.Priority == priority.Value).ToList();
            return Ok(all);
        }

        /// <summary>GET /api/jobcards/{id}</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<JobCard>> GetById(int id)
        {
            var result = await _jobService.GetJobCardByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>GET /api/jobcards/{id}/history</summary>
        [HttpGet("{id}/history")]
        public async Task<ActionResult<List<SystemAuditLog>>> GetHistory(int id)
        {
            var result = await _jobService.GetJobHistoryAsync(id);
            return Ok(result);
        }

        /// <summary>GET /api/jobcards/technician/{technicianId}</summary>
        [HttpGet("technician/{technicianId}")]
        public async Task<ActionResult<List<JobCard>>> GetByTechnician(string technicianId)
            => Ok(await _jobService.GetJobCardsByTechnicianAsync(technicianId));

        // ── CREATE / UPDATE / DELETE ──────────────────────────────────────────

        /// <summary>POST /api/jobcards — Create a new job card.</summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Supervisor,Planner")]
        public async Task<ActionResult> Create([FromBody] JobCard jobCard)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _jobService.CreateJobCardAsync(jobCard, userId);
            return CreatedAtAction(nameof(GetById), new { id = jobCard.Id }, jobCard);
        }

        /// <summary>PUT /api/jobcards/{id} — Update a job card's basic fields.</summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Supervisor,Planner")]
        public async Task<ActionResult> Update(int id, [FromBody] JobCard jobCard)
        {
            if (id != jobCard.Id) return BadRequest("ID mismatch.");
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _jobService.UpdateJobCardAsync(jobCard, userId);
            return NoContent();
        }

        /// <summary>DELETE /api/jobcards/{id}</summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Delete(int id)
        {
            await _jobService.DeleteJobCardAsync(id);
            return NoContent();
        }

        // ── STATUS & ASSIGNMENT ───────────────────────────────────────────────

        /// <summary>
        /// PATCH /api/jobcards/{id}/status
        /// Body: integer enum value  (0=Unscheduled, 1=Scheduled, 2=InProgress, 3=Completed, 4=Cancelled, 5=OnHold)
        /// Completing a job triggers full financial-trinity calculation + inventory deduction.
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<ActionResult> UpdateStatus(int id, [FromBody] JobStatus status)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _jobService.UpdateJobStatusAsync(id, status, userId);
            return NoContent();
        }

        /// <summary>
        /// POST /api/jobcards/{id}/assign
        /// Body: { "technicianId": "...", "scheduledStart": "2025-01-01T08:00:00", "scheduledEnd": "2025-01-01T17:00:00" }
        /// </summary>
        [HttpPost("{id}/assign")]
        public async Task<ActionResult> AssignTechnician(int id, [FromBody] AssignTechnicianRequest req)
        {
            await _jobService.AssignTechnicianAsync(id, req.TechnicianId, req.ScheduledStart, req.ScheduledEnd);
            return NoContent();
        }

        /// <summary>
        /// GET /api/jobcards/{id}/conflicts?technicianId=...&startDate=...&endDate=...
        /// Returns scheduling conflict details for the given technician + time window.
        /// </summary>
        [HttpGet("{id}/conflicts")]
        public async Task<ActionResult> CheckConflicts(int id,
            [FromQuery] string technicianId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime? endDate)
        {
            var result = await _jobService.CheckScheduleConflictsAsync(id, technicianId, startDate, endDate);
            return Ok(result);
        }

        // ── PARTS (INVENTORY) ─────────────────────────────────────────────────

        /// <summary>
        /// POST /api/jobcards/{id}/parts
        /// Body: { "inventoryItemId": 5, "quantity": 2 }
        /// Withdraws stock and creates a JobCardPart entry.
        /// </summary>
        [HttpPost("{id}/parts")]
        public async Task<ActionResult> AddPart(int id, [FromBody] AddPartRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _jobService.AddPartToJobAsync(id, req.InventoryItemId, req.Quantity, userId);
            return Ok();
        }

        /// <summary>DELETE /api/jobcards/parts/{jobCardPartId} — Remove a part line from a job.</summary>
        [HttpDelete("parts/{jobCardPartId}")]
        public async Task<ActionResult> RemovePart(int jobCardPartId)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _jobService.RemovePartFromJobAsync(jobCardPartId, userId);
            return NoContent();
        }

        /// <summary>GET /api/jobcards/parts/requests — Get all pending parts requests.</summary>
        [HttpGet("parts/requests")]
        [Authorize(Roles = "Admin,Supervisor,Storeman")]
        public async Task<ActionResult<List<JobCardPart>>> GetPendingPartsRequests()
        {
            var requests = await _jobService.GetPendingPartsRequestsAsync();
            return Ok(requests);
        }

        /// <summary>POST /api/jobcards/parts/{jobCardPartId}/issue — Issue requested parts.</summary>
        [HttpPost("parts/{jobCardPartId}/issue")]
        [Authorize(Roles = "Admin,Supervisor,Storeman")]
        public async Task<ActionResult> IssuePart(int jobCardPartId)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            try
            {
                await _jobService.IssuePartAsync(jobCardPartId, userId);
                return Ok();
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ── ATTACHMENTS ───────────────────────────────────────────────────────

        /// <summary>
        /// POST /api/jobcards/{id}/attachments
        /// Body: { "fileName": "photo.jpg", "filePath": "/uploads/...", "contentType": "image/jpeg", "fileSizeBytes": 204800 }
        /// Links an already-uploaded file to a job card.
        /// </summary>
        [HttpPost("{id}/attachments")]
        public async Task<ActionResult> AddAttachment(int id, [FromBody] JobAttachment attachment)
        {
            attachment.JobCardId = id;
            attachment.CreatedAt = DateTime.UtcNow;
            attachment.CreatedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _jobService.AddAttachmentAsync(attachment);
            return Ok(attachment);
        }

        /// <summary>DELETE /api/jobcards/attachments/{attachmentId} — Remove a file attachment from a job.</summary>
        [HttpDelete("attachments/{attachmentId}")]
        public async Task<ActionResult> RemoveAttachment(int attachmentId)
        {
            await _jobService.RemoveAttachmentAsync(attachmentId);
            return NoContent();
        }

        // ── PERMIT TO WORK ────────────────────────────────────────────────────

        /// <summary>
        /// POST /api/jobcards/{id}/permit
        /// Issues a Permit to Work for the job before starting.
        /// Body: { "jobCardId": 1, "authorizedBy": "John", "isIsolated": true, "isLotoApplied": true, "isAreaSecure": true, "isPpeChecked": true, "toolboxTalkCompleted": true, "workScope": "...", "hazardsIdentified": "..." }
        /// </summary>
        [HttpPost("{id}/permit")]
        public async Task<ActionResult> CreatePermit(int id, [FromBody] JobAttachmentPermitRequest req)
        {
            req.Permit.JobCardId = id;
            req.Permit.AuthorizedAt = DateTime.UtcNow;
            await _jobService.CreatePermitAsync(req.Permit);
            return Ok(req.Permit);
        }

        // ── TASKS ─────────────────────────────────────────────────────────────

        /// <summary>GET /api/jobcards/{id}/tasks — All tasks belonging to this job card.</summary>
        [HttpGet("{id}/tasks")]
        public async Task<ActionResult<List<JobTask>>> GetTasks(int id)
            => Ok(await _taskService.GetTasksForJobCardAsync(id));

        // ── ATTACHMENTS (READ) ────────────────────────────────────────────────

        /// <summary>
        /// GET /api/jobcards/{id}/attachments
        /// Lists all file attachments (photos, PDFs, etc.) linked to this job.
        /// Use the returned FilePath to build the download URL:
        ///   GET http://server{filePath}  e.g. /uploads/jobs/12/abc123_photo.jpg
        /// </summary>
        [HttpGet("{id}/attachments")]
        public async Task<ActionResult<List<JobAttachment>>> GetAttachments(int id)
        {
            var job = await _jobService.GetJobCardByIdAsync(id);
            if (job == null) return NotFound();
            return Ok(job.JobAttachments);
        }

        // ── PARTS (READ) ──────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/jobcards/{id}/parts
        /// Lists all inventory parts that have been issued against this job card.
        /// </summary>
        [HttpGet("{id}/parts")]
        public async Task<ActionResult<List<JobCardPart>>> GetParts(int id)
        {
            var job = await _jobService.GetJobCardByIdAsync(id);
            if (job == null) return NotFound();
            return Ok(job.JobCardParts);
        }

        /// <summary>
        /// POST /api/jobcards/import
        /// Form-data: "file" (CSV file)
        /// Imports job cards in bulk.
        /// </summary>
        [HttpPost("import")]
        [Authorize(Roles = "Admin,Supervisor,Planner")]
        public async Task<ActionResult> ImportCsv(Microsoft.AspNetCore.Http.IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded." });
            }

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            try
            {
                string csvContent;
                var fileExtension = System.IO.Path.GetExtension(file.FileName).ToLower();

                if (fileExtension == ".xlsx")
                {
                    using var workbook = new ClosedXML.Excel.XLWorkbook(file.OpenReadStream());
                    var worksheet = workbook.Worksheets.First();
                    var lastCol = worksheet.LastColumnUsed()?.ColumnNumber() ?? 10;
                    var rows = worksheet.RowsUsed();
                    var csvBuilder = new System.Text.StringBuilder();

                    foreach (var row in rows)
                    {
                        var rowValues = new List<string>();
                        for (int col = 1; col <= lastCol; col++)
                        {
                            var cellValue = row.Cell(col).Value.ToString() ?? "";
                            if (cellValue.Contains(",") || cellValue.Contains("\"") || cellValue.Contains("\n") || cellValue.Contains("\r"))
                            {
                                cellValue = $"\"{cellValue.Replace("\"", "\"\"")}\"";
                            }
                            rowValues.Add(cellValue);
                        }
                        csvBuilder.AppendLine(string.Join(",", rowValues));
                    }
                    csvContent = csvBuilder.ToString();
                }
                else
                {
                    using var reader = new System.IO.StreamReader(file.OpenReadStream());
                    csvContent = await reader.ReadToEndAsync();
                }

                var result = await _jobService.ImportJobCardsFromCsvAsync(csvContent, userId);
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
                return BadRequest(new { message = msg });
            }
        }
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public class AssignTechnicianRequest
    {
        public string? TechnicianId { get; set; }
        public DateTime? ScheduledStart { get; set; }
        public DateTime? ScheduledEnd { get; set; }
    }

    public class AddPartRequest
    {
        public int InventoryItemId { get; set; }
        public int Quantity { get; set; }
    }

    public class JobAttachmentPermitRequest
    {
        public PermitToWork Permit { get; set; } = new();
    }
}

using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TimeTrackingController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public TimeTrackingController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        /// <summary>Get all time entries for a job card.</summary>
        [HttpGet("job/{jobCardId}")]
        public async Task<ActionResult> GetForJob(int jobCardId)
        {
            var entries = await _db.TimeEntries
                .Where(t => t.JobCardId == jobCardId)
                .Include(t => t.Technician)
                .OrderByDescending(t => t.ClockIn)
                .Select(t => new {
                    t.Id, t.JobCardId, t.TechnicianId,
                    technicianName = t.Technician != null
                        ? t.Technician.FirstName + " " + t.Technician.LastName
                        : t.TechnicianId,
                    clockIn = t.ClockIn,
                    clockOut = t.ClockOut,
                    t.DurationMinutes,
                    t.Notes,
                    t.CreatedAt,
                })
                .ToListAsync();
            return Ok(entries);
        }

        /// <summary>Get all time entries for current user (my timelog).</summary>
        [HttpGet("my")]
        public async Task<ActionResult> GetMine()
        {
            var userId = _userManager.GetUserId(User) ?? "";
            var entries = await _db.TimeEntries
                .Where(t => t.TechnicianId == userId)
                .Include(t => t.JobCard)
                .OrderByDescending(t => t.ClockIn)
                .Select(t => new {
                    t.Id, t.JobCardId,
                    jobNumber = t.JobCard != null ? t.JobCard.JobNumber : "",
                    jobDescription = t.JobCard != null ? t.JobCard.Description : "",
                    t.ClockIn, t.ClockOut, t.DurationMinutes, t.Notes,
                })
                .ToListAsync();
            return Ok(entries);
        }

        /// <summary>Get all time entries across all jobs (for managers).</summary>
        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] int? jobCardId = null, [FromQuery] string? technicianId = null)
        {
            var q = _db.TimeEntries.Include(t => t.Technician).Include(t => t.JobCard).AsQueryable();
            if (jobCardId.HasValue) q = q.Where(t => t.JobCardId == jobCardId.Value);
            if (!string.IsNullOrEmpty(technicianId)) q = q.Where(t => t.TechnicianId == technicianId);

            var entries = await q.OrderByDescending(t => t.ClockIn)
                .Select(t => new {
                    t.Id, t.JobCardId,
                    jobNumber = t.JobCard != null ? t.JobCard.JobNumber : "",
                    t.TechnicianId,
                    technicianName = t.Technician != null
                        ? t.Technician.FirstName + " " + t.Technician.LastName
                        : t.TechnicianId,
                    t.ClockIn, t.ClockOut, t.DurationMinutes, t.Notes,
                })
                .ToListAsync();
            return Ok(entries);
        }

        /// <summary>Clock in to a job. Returns error if already clocked in.</summary>
        [HttpPost("clock-in")]
        public async Task<ActionResult> ClockIn([FromBody] ClockInRequest req)
        {
            var userId = _userManager.GetUserId(User) ?? "";

            var open = await _db.TimeEntries.FirstOrDefaultAsync(t => t.TechnicianId == userId && t.ClockOut == null);
            if (open != null)
                return Conflict(new { message = $"You are already clocked in to job #{open.JobCardId}. Clock out first." });

            var entry = new TimeEntry
            {
                JobCardId = req.JobCardId,
                TechnicianId = userId,
                ClockIn = DateTime.UtcNow,
                Notes = req.Notes,
                CreatedBy = userId,
            };
            _db.TimeEntries.Add(entry);
            await _db.SaveChangesAsync();
            return Ok(entry);
        }

        /// <summary>Clock out of the current open entry.</summary>
        [HttpPost("clock-out")]
        public async Task<ActionResult> ClockOut([FromBody] ClockOutRequest req)
        {
            var userId = _userManager.GetUserId(User) ?? "";
            TimeEntry? entry = null;

            if (req.EntryId.HasValue)
                entry = await _db.TimeEntries.FirstOrDefaultAsync(t => t.Id == req.EntryId && t.TechnicianId == userId);
            else
                entry = await _db.TimeEntries.FirstOrDefaultAsync(t => t.TechnicianId == userId && t.ClockOut == null);

            if (entry == null) return NotFound(new { message = "No open time entry found." });

            entry.ClockOut = DateTime.UtcNow;
            entry.DurationMinutes = (int)(entry.ClockOut.Value - entry.ClockIn).TotalMinutes;
            if (!string.IsNullOrEmpty(req.Notes)) entry.Notes = req.Notes;
            entry.UpdatedBy = userId;
            entry.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(entry);
        }

        /// <summary>Delete a time entry (admin correction).</summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var entry = await _db.TimeEntries.FindAsync(id);
            if (entry == null) return NotFound();
            _db.TimeEntries.Remove(entry);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        public record ClockInRequest(int JobCardId, string? Notes);
        public record ClockOutRequest(int? EntryId, string? Notes);
    }
}

using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class DowntimeService : IDowntimeService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly IAlertService _alertService;

        public DowntimeService(IDbContextFactory<ApplicationDbContext> factory, IAlertService alertService)
        {
            _factory = factory;
            _alertService = alertService;
        }

        public async Task<List<DowntimeEntry>> GetDowntimeForTaskAsync(int taskId)
        {
            using var context = _factory.CreateDbContext();
            return await context.DowntimeEntries
                .Where(d => d.JobTaskId == taskId)
                .Include(d => d.DowntimeCategory)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<DowntimeEntry?> GetActiveDowntimeAsync(string userId)
        {
            using var context = _factory.CreateDbContext();
            return await context.DowntimeEntries
                .Where(d => d.CreatedBy == userId && d.EndTime == null)
                .OrderByDescending(d => d.StartTime)
                .FirstOrDefaultAsync();
        }

        public async Task CreateDowntimeEntryAsync(DowntimeEntry entry, string userId)
        {
            using var context = _factory.CreateDbContext();
            
            // Resolve TenantId and Author
            var user = await context.Users.FindAsync(userId);
            entry.TenantId = user?.TenantId;
            entry.CreatedAt = DateTime.UtcNow;
            entry.CreatedBy = userId;

            // Force UTC for PostgreSQL
            entry.StartTime = DateTime.SpecifyKind(entry.StartTime, DateTimeKind.Utc);
            if (entry.EndTime.HasValue)
                entry.EndTime = DateTime.SpecifyKind(entry.EndTime.Value, DateTimeKind.Utc);

            context.DowntimeEntries.Add(entry);
            await context.SaveChangesAsync();

            // Trigger Alert for Delay
            string jobNumber = "Unknown";
            if (entry.JobTaskId.HasValue && entry.JobTaskId.Value > 0)
            {
                var task = await context.JobTasks.Include(t => t.JobCard).FirstOrDefaultAsync(t => t.Id == entry.JobTaskId);
                jobNumber = task?.JobCard?.JobNumber ?? "Unknown";
            }
            else if (entry.JobCardId.HasValue && entry.JobCardId.Value > 0)
            {
                var job = await context.JobCards.FindAsync(entry.JobCardId);
                jobNumber = job?.JobNumber ?? "Unknown";
            }

            var category = await context.DowntimeCategories.FindAsync(entry.DowntimeCategoryId);
            var reason = category?.Name ?? "General Delay";
            var fullNotes = string.IsNullOrEmpty(entry.Notes) ? reason : $"{reason} - {entry.Notes}";
            await _alertService.NotifyTechnicianDelayAsync(jobNumber, userId, fullNotes);
        }

        public async Task UpdateDowntimeEntryAsync(DowntimeEntry entry, string userId)
        {
            using var context = _factory.CreateDbContext();
            var existing = await context.DowntimeEntries
                .Include(d => d.DowntimeCategory)
                .FirstOrDefaultAsync(d => d.Id == entry.Id);

            if (existing != null)
            {
                bool wasOpen = existing.EndTime == null;
                bool isNowResolved = wasOpen && entry.EndTime != null;

                existing.DowntimeCategoryId = entry.DowntimeCategoryId;
                existing.StartTime = entry.StartTime;
                existing.EndTime = entry.EndTime;

                if (isNowResolved)
                {
                    var duration = (int)(entry.EndTime!.Value - existing.StartTime).TotalMinutes;
                    existing.DurationMinutes = duration > 0 ? duration : 1;
                }
                else
                {
                    existing.DurationMinutes = entry.DurationMinutes;
                }

                existing.Notes = entry.Notes;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;

                await context.SaveChangesAsync();

                // Auto-create a TimeEntry when a breakdown is resolved
                if (isNowResolved)
                {
                    var jobTask = await context.JobTasks
                        .Include(t => t.JobCard)
                        .FirstOrDefaultAsync(t => t.Id == existing.JobTaskId);

                    if (jobTask?.JobCard != null)
                    {
                        var category = existing.DowntimeCategory
                            ?? await context.DowntimeCategories.FindAsync(existing.DowntimeCategoryId);
                        var categoryName = category?.Name ?? "Downtime";
                        var noteText = string.IsNullOrWhiteSpace(existing.Notes)
                            ? $"Downtime resolved: {categoryName}"
                            : $"Downtime resolved: {categoryName} — {existing.Notes}";

                        var technicianId = !string.IsNullOrEmpty(existing.CreatedBy) ? existing.CreatedBy : userId;

                        context.TimeEntries.Add(new TimeEntry
                        {
                            JobCardId = jobTask.JobCard.Id,
                            TechnicianId = technicianId,
                            ClockIn = existing.StartTime,
                            ClockOut = existing.EndTime,
                            DurationMinutes = existing.DurationMinutes,
                            Notes = noteText,
                            CreatedBy = userId,
                            CreatedAt = DateTime.UtcNow,
                        });
                        await context.SaveChangesAsync();
                    }
                }
            }
        }

        public async Task DeleteDowntimeEntryAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var item = await context.DowntimeEntries.FindAsync(id);
            if (item != null)
            {
                context.DowntimeEntries.Remove(item);
                await context.SaveChangesAsync();
            }
        }

        public async Task<List<DowntimeEntry>> GetAllDowntimeAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.DowntimeEntries
                .Include(d => d.DowntimeCategory)
                .OrderByDescending(d => d.StartTime)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}

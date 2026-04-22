using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class JobTaskService : IJobTaskService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public JobTaskService(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        public async Task<List<JobTask>> GetTasksForJobCardAsync(int jobCardId)
        {
            using var context = _factory.CreateDbContext();
            return await context.JobTasks
                .Where(t => t.JobCardId == jobCardId)
                .OrderBy(t => t.Id) // Often task order matters, Id or created date is a proxy
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<JobTask?> GetTaskByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.JobTasks.FindAsync(id);
        }

        public async Task CreateTaskAsync(JobTask jobTask, string userId)
        {
            using var context = _factory.CreateDbContext();
            
            // Inherit TenantId from JobCard
            var job = await context.JobCards.FindAsync(jobTask.JobCardId);
            jobTask.TenantId = job?.TenantId;

            jobTask.CreatedAt = DateTime.UtcNow;
            jobTask.CreatedBy = userId;
            context.JobTasks.Add(jobTask);
            await context.SaveChangesAsync();
        }

        public async Task UpdateTaskAsync(JobTask jobTask, string userId)
        {
            using var context = _factory.CreateDbContext();
            var existing = await context.JobTasks.FindAsync(jobTask.Id);
            if (existing != null)
            {
                existing.Name = jobTask.Name;
                existing.Instructions = jobTask.Instructions;
                existing.EstimatedDurationMinutes = jobTask.EstimatedDurationMinutes;
                existing.ActualDurationMinutes = jobTask.ActualDurationMinutes;

                // Sync status
                existing.IsCompleted = jobTask.IsCompleted;
                if (jobTask.IsCompleted && existing.CompletedAt == null)
                {
                    existing.CompletedAt = DateTime.UtcNow;
                }
                else if (!jobTask.IsCompleted)
                {
                    existing.CompletedAt = null;
                }

                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;

                await context.SaveChangesAsync();
            }
        }

        public async Task CompleteTaskAsync(int taskId, string userId)
        {
            using var context = _factory.CreateDbContext();
            var task = await context.JobTasks.FindAsync(taskId);
            if (task != null)
            {
                task.IsCompleted = true;
                task.CompletedAt = DateTime.UtcNow;
                task.UpdatedAt = DateTime.UtcNow;
                task.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteTaskAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var task = await context.JobTasks.FindAsync(id);
            if (task != null)
            {
                context.JobTasks.Remove(task);
                await context.SaveChangesAsync();
            }
        }

        public async Task<List<JobTask>> GetAllTasksAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.JobTasks
                .OrderByDescending(t => t.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}

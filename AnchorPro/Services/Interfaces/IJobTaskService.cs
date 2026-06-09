using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IJobTaskService
    {
        Task<List<JobTask>> GetTasksForJobCardAsync(int jobCardId);
        Task<JobTask?> GetTaskByIdAsync(int id);
        Task CreateTaskAsync(JobTask jobTask, string userId);
        Task UpdateTaskAsync(JobTask jobTask, string userId);
        Task DeleteTaskAsync(int id);
        Task CompleteTaskAsync(int taskId, string userId, bool isCompleted = true);
        Task<List<JobTask>> GetAllTasksAsync();
        Task UpdateTaskPhotoAsync(int taskId, string? photoPath, string userId);
    }
}

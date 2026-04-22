using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IDowntimeService
    {
        Task<List<DowntimeEntry>> GetDowntimeForTaskAsync(int taskId);
        Task<DowntimeEntry?> GetActiveDowntimeAsync(string userId);
        Task CreateDowntimeEntryAsync(DowntimeEntry entry, string userId);
        Task UpdateDowntimeEntryAsync(DowntimeEntry entry, string userId);
        Task DeleteDowntimeEntryAsync(int id);
        Task<List<DowntimeEntry>> GetAllDowntimeAsync();
    }
}

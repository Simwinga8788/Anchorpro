using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;

namespace AnchorPro.Services.Interfaces
{
    public interface IJobCardService
    {
        Task<List<JobCard>> GetAllJobCardsAsync();
        Task<JobCard?> GetJobCardByIdAsync(int id);
        Task<List<JobCard>> GetJobCardsByTechnicianAsync(string technicianId);
        Task CreateJobCardAsync(JobCard jobCard, string userId);
        Task UpdateJobCardAsync(JobCard jobCard, string userId);
        Task DeleteJobCardAsync(int id);
        Task UpdateJobStatusAsync(int jobCardId, JobStatus status, string userId);
        Task AssignTechnicianAsync(int jobCardId, string technicianId, DateTime? scheduledStart = null, DateTime? scheduledEnd = null);
        Task<AnchorPro.Data.Models.SchedulingConflict> CheckScheduleConflictsAsync(int jobCardId, string technicianId, DateTime startDate, DateTime? endDate);

        // Parts
        Task AddPartToJobAsync(int jobCardId, int inventoryItemId, int quantity, string userId);
        Task RemovePartFromJobAsync(int jobCardPartId);

        // Attachments
        Task AddAttachmentAsync(AnchorPro.Data.Entities.JobAttachment attachment);
        Task RemoveAttachmentAsync(int attachmentId);

        // Compliance
        Task CreatePermitAsync(AnchorPro.Data.Entities.PermitToWork permit);
    }
}

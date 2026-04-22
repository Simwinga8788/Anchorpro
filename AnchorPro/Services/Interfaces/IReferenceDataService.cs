using AnchorPro.Data.Entities;
using AnchorPro.Data;

namespace AnchorPro.Services.Interfaces
{
    public interface IReferenceDataService
    {
        Task<List<JobType>> GetJobTypesAsync();
        Task<List<DowntimeCategory>> GetDowntimeCategoriesAsync();
        Task<List<Equipment>> GetEquipmentAsync();
        Task<List<Customer>> GetCustomersAsync();
        Task<List<Contract>> GetContractsAsync();
        Task<List<ApplicationUser>> GetTechniciansAsync();

        Task CreateJobTypeAsync(JobType jobType, string userId);
        Task CreateDowntimeCategoryAsync(DowntimeCategory category, string userId);

        Task DeleteJobTypeAsync(int id);
        Task DeleteDowntimeCategoryAsync(int id);
    }
}

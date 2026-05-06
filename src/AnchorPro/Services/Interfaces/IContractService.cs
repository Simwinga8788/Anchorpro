using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IContractService
    {
        Task<List<Contract>> GetAllContractsAsync();
        Task<Contract?> GetContractByIdAsync(int id);
        Task<List<Contract>> GetContractsByCustomerIdAsync(int customerId);
        Task CreateContractAsync(Contract contract, string userId);
        Task UpdateContractAsync(Contract contract, string userId);
        Task CancelContractAsync(int id, string userId);
        
        // SLA Reporting
        Task<SLAPerformance> GetSLAPerformanceAsync(int contractId);
    }

    public class SLAPerformance
    {
        public int TotalJobs { get; set; }
        public int JobsWithinSLA { get; set; }
        public int JobsBreachedSLA { get; set; }
        public double ComplianceRate { get; set; } // Percentage
        public double AverageResolutionTime { get; set; } // Hours
    }
}

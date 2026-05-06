using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface ICustomerService
    {
        Task<List<Customer>> GetAllCustomersAsync();
        Task<Customer?> GetCustomerByIdAsync(int id);
        Task<Customer?> GetCustomerWithJobsAsync(int id);
        Task CreateCustomerAsync(Customer customer, string userId);
        Task UpdateCustomerAsync(Customer customer, string userId);
        Task DeleteCustomerAsync(int id);
        Task<CustomerStats> GetCustomerStatsAsync(int customerId);
    }

    public class CustomerStats
    {
        public int TotalJobs { get; set; }
        public int CompletedJobs { get; set; }
        public int OpenJobs { get; set; }
        public decimal TotalRevenue { get; set; }
        public DateTime? LastServiceDate { get; set; }
    }
}

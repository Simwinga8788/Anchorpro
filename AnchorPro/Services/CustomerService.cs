using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public CustomerService(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        public async Task<List<Customer>> GetAllCustomersAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Customers
                .Include(c => c.JobCards)
                .OrderBy(c => c.Name)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Customer?> GetCustomerByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.Customers.FindAsync(id);
        }

        public async Task<Customer?> GetCustomerWithJobsAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.Customers
                .Include(c => c.JobCards)
                    .ThenInclude(j => j.Equipment)
                .Include(c => c.JobCards)
                    .ThenInclude(j => j.AssignedTechnician)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<CustomerStats> GetCustomerStatsAsync(int customerId)
        {
            using var context = _factory.CreateDbContext();
            var jobs = await context.JobCards
                .Where(j => j.CustomerId == customerId)
                .AsNoTracking()
                .ToListAsync();

            var completed = jobs.Where(j => j.Status == JobStatus.Completed).ToList();
            return new CustomerStats
            {
                TotalJobs = jobs.Count,
                CompletedJobs = completed.Count,
                OpenJobs = jobs.Count(j => j.Status != JobStatus.Completed && j.Status != JobStatus.Cancelled),
                TotalRevenue = completed.Sum(j => j.InvoiceAmount),
                LastServiceDate = completed.OrderByDescending(j => j.ActualEndDate).FirstOrDefault()?.ActualEndDate
            };
        }

        public async Task CreateCustomerAsync(Customer customer, string userId)
        {
            using var context = _factory.CreateDbContext();
            customer.CreatedAt = DateTime.UtcNow;
            customer.CreatedBy = userId;
            context.Customers.Add(customer);
            await context.SaveChangesAsync();
        }

        public async Task UpdateCustomerAsync(Customer customer, string userId)
        {
            using var context = _factory.CreateDbContext();
            var existing = await context.Customers.FindAsync(customer.Id);
            if (existing != null)
            {
                existing.Name = customer.Name;
                existing.Email = customer.Email;
                existing.Phone = customer.Phone;
                existing.Address = customer.Address;
                existing.Notes = customer.Notes;
                existing.ContactPerson = customer.ContactPerson;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteCustomerAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var customer = await context.Customers.FindAsync(id);
            if (customer != null)
            {
                context.Customers.Remove(customer);
                await context.SaveChangesAsync();
            }
        }
    }
}

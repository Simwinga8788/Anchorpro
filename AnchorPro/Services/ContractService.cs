using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class ContractService : IContractService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public ContractService(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        public async Task<List<Contract>> GetAllContractsAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Contracts
                .Include(c => c.Customer)
                .OrderByDescending(c => c.StartDate)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Contract?> GetContractByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.Contracts
                .Include(c => c.Customer)
                .Include(c => c.JobCards)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<List<Contract>> GetContractsByCustomerIdAsync(int customerId)
        {
            using var context = _factory.CreateDbContext();
            return await context.Contracts
                .Where(c => c.CustomerId == customerId)
                .OrderByDescending(c => c.StartDate)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task CreateContractAsync(Contract contract, string userId)
        {
            using var context = _factory.CreateDbContext();
            contract.CreatedAt = DateTime.UtcNow;
            contract.CreatedBy = userId;
            context.Contracts.Add(contract);
            await context.SaveChangesAsync();
        }

        public async Task UpdateContractAsync(Contract contract, string userId)
        {
            using var context = _factory.CreateDbContext();
            var existing = await context.Contracts.FindAsync(contract.Id);
            if (existing != null)
            {
                existing.Title = contract.Title;
                existing.StartDate = contract.StartDate;
                existing.EndDate = contract.EndDate;
                existing.Status = contract.Status;
                existing.MonthlyFee = contract.MonthlyFee;
                existing.SLAHours = contract.SLAHours;
                existing.Terms = contract.Terms;
                existing.Value = contract.Value;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task CancelContractAsync(int id, string userId)
        {
            using var context = _factory.CreateDbContext();
            var contract = await context.Contracts.FindAsync(id);
            if (contract != null)
            {
                contract.Status = ContractStatus.Cancelled;
                contract.UpdatedAt = DateTime.UtcNow;
                contract.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task<SLAPerformance> GetSLAPerformanceAsync(int contractId)
        {
            using var context = _factory.CreateDbContext();
            var contract = await context.Contracts
                .Include(c => c.JobCards)
                .FirstOrDefaultAsync(c => c.Id == contractId);

            if (contract == null) return new SLAPerformance();

            var completedJobs = contract.JobCards
                .Where(j => j.Status == JobStatus.Completed && j.ActualStartDate.HasValue && j.ActualEndDate.HasValue)
                .ToList();

            if (!completedJobs.Any()) return new SLAPerformance();

            int withinSLA = 0;
            double totalHours = 0;

            foreach (var job in completedJobs)
            {
                var duration = (job.ActualEndDate.Value - job.ActualStartDate.Value).TotalHours;
                totalHours += duration;
                if (duration <= contract.SLAHours) withinSLA++;
            }

            return new SLAPerformance
            {
                TotalJobs = completedJobs.Count,
                JobsWithinSLA = withinSLA,
                JobsBreachedSLA = completedJobs.Count - withinSLA,
                ComplianceRate = Math.Round((double)withinSLA / completedJobs.Count * 100, 1),
                AverageResolutionTime = Math.Round(totalHours / completedJobs.Count, 1)
            };
        }
    }
}

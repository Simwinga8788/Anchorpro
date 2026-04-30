using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class ReferenceDataService : IReferenceDataService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly ICurrentTenantService _tenantService;

        public ReferenceDataService(IDbContextFactory<ApplicationDbContext> factory, ICurrentTenantService tenantService)
        {
            _factory = factory;
            _tenantService = tenantService;
        }

        public async Task<List<JobType>> GetJobTypesAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.JobTypes.AsNoTracking().ToListAsync();
        }

        public async Task<List<DowntimeCategory>> GetDowntimeCategoriesAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.DowntimeCategories.AsNoTracking().ToListAsync();
        }

        public async Task<List<Equipment>> GetEquipmentAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Equipment.AsNoTracking().ToListAsync();
        }

        public async Task<List<Customer>> GetCustomersAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Customers.AsNoTracking().ToListAsync();
        }

        public async Task<List<Contract>> GetContractsAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Contracts.AsNoTracking().ToListAsync();
        }

        public async Task<List<ApplicationUser>> GetTechniciansAsync()
        {
            using var context = _factory.CreateDbContext();
            var tenantId = _tenantService.TenantId;
            // Only return users that explicitly belong to the current tenant
            return await context.Users
                .AsNoTracking()
                .Where(u => u.TenantId.HasValue && u.TenantId == tenantId)
                .ToListAsync();
        }

        public async Task CreateJobTypeAsync(JobType jobType, string userId)
        {
            using var context = _factory.CreateDbContext();
            jobType.CreatedAt = DateTime.UtcNow;
            jobType.CreatedBy = userId;
            context.JobTypes.Add(jobType);
            await context.SaveChangesAsync();
        }

        public async Task CreateDowntimeCategoryAsync(DowntimeCategory category, string userId)
        {
            using var context = _factory.CreateDbContext();
            category.CreatedAt = DateTime.UtcNow;
            category.CreatedBy = userId;
            context.DowntimeCategories.Add(category);
            await context.SaveChangesAsync();
        }

        public async Task DeleteJobTypeAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var item = await context.JobTypes.FindAsync(id);
            if (item != null)
            {
                context.JobTypes.Remove(item);
                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteDowntimeCategoryAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var item = await context.DowntimeCategories.FindAsync(id);
            if (item != null)
            {
                context.DowntimeCategories.Remove(item);
                await context.SaveChangesAsync();
            }
        }
    }
}

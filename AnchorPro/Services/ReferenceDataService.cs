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
            var tenantId = _tenantService.TenantId;
            // Include tenant-specific types AND legacy null-tenanted global types
            return await context.JobTypes
                .Where(j => j.TenantId == tenantId || j.TenantId == null)
                .AsNoTracking().ToListAsync();
        }

        public async Task<List<DowntimeCategory>> GetDowntimeCategoriesAsync()
        {
            using var context = _factory.CreateDbContext();
            var tenantId = _tenantService.TenantId;
            return await context.DowntimeCategories
                .Where(d => d.TenantId == tenantId)
                .AsNoTracking().ToListAsync();
        }

        public async Task<List<Equipment>> GetEquipmentAsync()
        {
            using var context = _factory.CreateDbContext();
            var tenantId = _tenantService.TenantId;
            return await context.Equipment
                .Where(e => e.TenantId == tenantId)
                .AsNoTracking().ToListAsync();
        }

        public async Task<List<Customer>> GetCustomersAsync()
        {
            using var context = _factory.CreateDbContext();
            var tenantId = _tenantService.TenantId;
            return await context.Customers
                .Where(c => c.TenantId == tenantId)
                .AsNoTracking().ToListAsync();
        }

        public async Task<List<Contract>> GetContractsAsync()
        {
            using var context = _factory.CreateDbContext();
            var tenantId = _tenantService.TenantId;
            return await context.Contracts
                .Where(c => c.TenantId == tenantId)
                .AsNoTracking().ToListAsync();
        }

        public async Task<List<ApplicationUser>> GetTechniciansAsync()
        {
            using var context = _factory.CreateDbContext();
            var tenantId = _tenantService.TenantId;
            // Filter by tenant AND exclude platform-level roles (PlatformOwner, PlatformAdmin)
            var tenantUsers = context.Users
                .Where(u => u.TenantId == tenantId)
                .AsNoTracking()
                .ToList();
            var result = new List<ApplicationUser>();
            foreach (var u in tenantUsers)
            {
                var roles = await context.UserRoles
                    .Where(ur => ur.UserId == u.Id)
                    .Join(context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                    .ToListAsync();
                if (!roles.Any(r => r == "PlatformOwner" || r == "PlatformAdmin"))
                    result.Add(u);
            }
            return result;
        }

        public async Task CreateJobTypeAsync(JobType jobType, string userId)
        {
            using var context = _factory.CreateDbContext();
            jobType.TenantId = _tenantService.TenantId;
            jobType.CreatedAt = DateTime.UtcNow;
            jobType.CreatedBy = userId;
            context.JobTypes.Add(jobType);
            await context.SaveChangesAsync();
        }

        public async Task CreateDowntimeCategoryAsync(DowntimeCategory category, string userId)
        {
            using var context = _factory.CreateDbContext();
            category.TenantId = _tenantService.TenantId;
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

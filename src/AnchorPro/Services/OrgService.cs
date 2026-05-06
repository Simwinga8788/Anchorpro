using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class OrgService : IOrgService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public OrgService(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        public async Task<List<Department>> GetAllDepartmentsAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Departments
                .OrderBy(d => d.Name)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Department?> GetDepartmentByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.Departments.FindAsync(id);
        }

        public async Task CreateDepartmentAsync(Department department, string userId)
        {
            using var context = _factory.CreateDbContext();
            department.CreatedAt = DateTime.UtcNow;
            department.CreatedBy = userId;
            context.Departments.Add(department);
            await context.SaveChangesAsync();
        }

        public async Task UpdateDepartmentAsync(Department department, string userId)
        {
            using var context = _factory.CreateDbContext();
            var existing = await context.Departments.FindAsync(department.Id);
            if (existing != null)
            {
                existing.Name = department.Name;
                existing.Description = department.Description;
                existing.CostCode = department.CostCode;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteDepartmentAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var dept = await context.Departments.FindAsync(id);
            if (dept != null)
            {
                context.Departments.Remove(dept);
                await context.SaveChangesAsync();
            }
        }
    }
}

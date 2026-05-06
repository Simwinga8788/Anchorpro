using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class SafetyService : ISafetyService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public SafetyService(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        public async Task<List<PermitToWork>> GetAllPermitsAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.PermitsToWork
                .Include(p => p.JobCard)
                    .ThenInclude(j => j!.Equipment)
                .OrderByDescending(p => p.AuthorizedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<PermitToWork?> GetPermitByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.PermitsToWork
                .Include(p => p.JobCard)
                    .ThenInclude(j => j!.Equipment)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<PermitToWork?> GetPermitByJobIdAsync(int jobId)
        {
            using var context = _factory.CreateDbContext();
            return await context.PermitsToWork
                .FirstOrDefaultAsync(p => p.JobCardId == jobId);
        }

        public async Task CreatePermitAsync(PermitToWork permit, string userId)
        {
            using var context = _factory.CreateDbContext();
            permit.CreatedAt = DateTime.UtcNow;
            permit.CreatedBy = userId;
            permit.AuthorizedAt = DateTime.UtcNow;
            permit.Status = PermitStatus.Active;
            context.PermitsToWork.Add(permit);
            await context.SaveChangesAsync();
        }

        public async Task UpdatePermitStatusAsync(int permitId, PermitStatus status, string closureNotes, string userId)
        {
            using var context = _factory.CreateDbContext();
            var permit = await context.PermitsToWork.FindAsync(permitId);
            if (permit != null)
            {
                permit.Status = status;
                permit.ClosureNotes = closureNotes;
                if (status == PermitStatus.Closed)
                    permit.ClosedAt = DateTime.UtcNow;
                permit.UpdatedAt = DateTime.UtcNow;
                permit.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task<SafetyDashboardStats> GetDashboardStatsAsync()
        {
            using var context = _factory.CreateDbContext();
            var permits = await context.PermitsToWork.AsNoTracking().ToListAsync();
            var thisMonth = DateTime.UtcNow.Month;
            var thisYear = DateTime.UtcNow.Year;

            var active = permits.Where(p => p.Status == PermitStatus.Active).ToList();
            var total = permits.Count;

            // Compliance = % of active permits that have all 4 safety checks ticked
            var compliant = total == 0 ? 0 : permits.Count(p =>
                p.IsIsolated && p.IsLotoApplied && p.IsAreaSecure && p.IsPpeChecked);

            return new SafetyDashboardStats
            {
                ActivePermits = active.Count,
                SuspendedPermits = permits.Count(p => p.Status == PermitStatus.Suspended),
                LotoApplied = permits.Count(p => p.IsLotoApplied),
                PpeChecks = permits.Count(p => p.IsPpeChecked),
                ClosedThisMonth = permits.Count(p =>
                    p.Status == PermitStatus.Closed &&
                    p.ClosedAt.HasValue &&
                    p.ClosedAt.Value.Month == thisMonth &&
                    p.ClosedAt.Value.Year == thisYear),
                CompliancePercent = total == 0 ? 100m : Math.Round((decimal)compliant / total * 100, 1)
            };
        }
    }
}

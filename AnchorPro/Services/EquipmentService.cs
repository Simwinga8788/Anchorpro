using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class EquipmentService : IEquipmentService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly ISubscriptionService _subscriptionService;

        public EquipmentService(
            IDbContextFactory<ApplicationDbContext> factory,
            ISubscriptionService subscriptionService)
        {
            _factory = factory;
            _subscriptionService = subscriptionService;
        }

        public async Task<List<Equipment>> GetAllEquipmentAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Equipment
                .Include(e => e.Department)
                .OrderByDescending(e => e.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Equipment?> GetEquipmentByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.Equipment
                .Include(e => e.Department)
                .Include(e => e.JobCards)
                    .ThenInclude(j => j.JobType)
                .Include(e => e.JobCards)
                    .ThenInclude(j => j.AssignedTechnician)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task CreateEquipmentAsync(Equipment equipment, string userId)
        {
            using var context = _factory.CreateDbContext();

            // Check subscription limits
            var currentCount = await context.Equipment.CountAsync();
            var canAdd = await _subscriptionService.CheckLimitAsync("equipment", currentCount);
            
            if (!canAdd)
            {
                var plan = await _subscriptionService.GetCurrentPlanAsync();
                throw new InvalidOperationException(
                    $"Equipment limit reached. Your current plan allows {plan?.MaxEquipment} equipment. Upgrade your subscription to add more.");
            }

            // Set Audit Fields
            var user = await context.Users.FindAsync(userId);
            equipment.TenantId = user?.TenantId;

            equipment.CreatedAt = DateTime.UtcNow;
            equipment.CreatedBy = userId;

            context.Equipment.Add(equipment);
            await context.SaveChangesAsync();
        }

        public async Task UpdateEquipmentAsync(Equipment equipment, string userId)
        {
            using var context = _factory.CreateDbContext();

            // In a disconnected scenario (like a web form), it's safer to fetch, update, and save
            // to avoid overwriting fields we didn't include in the form or concurrency issues.
            var existing = await context.Equipment.FindAsync(equipment.Id);

            if (existing != null)
            {
                // Map properties (AutoMapper could replace this in larger apps)
                existing.Name = equipment.Name;
                existing.SerialNumber = equipment.SerialNumber;
                existing.ModelNumber = equipment.ModelNumber;
                existing.Manufacturer = equipment.Manufacturer;
                existing.Location = equipment.Location;
                existing.DepartmentId = equipment.DepartmentId;

                // Audit Update
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;

                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteEquipmentAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var equipment = await context.Equipment.FindAsync(id);
            if (equipment != null)
            {
                context.Equipment.Remove(equipment);
                await context.SaveChangesAsync();
            }
        }

        public async Task<List<JobCard>> GetEquipmentHistoryAsync(int equipmentId)
        {
            using var context = _factory.CreateDbContext();
            return await context.JobCards
                .Include(j => j.JobType)
                .Include(j => j.AssignedTechnician)
                .Where(j => j.EquipmentId == equipmentId && (j.Status == Data.Enums.JobStatus.Completed || j.Status == Data.Enums.JobStatus.Cancelled))
                .OrderByDescending(j => j.ActualEndDate ?? j.UpdatedAt ?? j.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}

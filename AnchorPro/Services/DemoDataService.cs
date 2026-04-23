using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;

namespace AnchorPro.Services
{
    public interface IDemoDataService
    {
        Task GenerateDemoDataAsync(string currentUserId);
    }

    public class DemoDataService : IDemoDataService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly ICurrentTenantService _tenantService;

        public DemoDataService(IDbContextFactory<ApplicationDbContext> factory, ICurrentTenantService tenantService)
        {
            _factory = factory;
            _tenantService = tenantService;
        }

        public async Task GenerateDemoDataAsync(string currentUserId)
        {
            using var context = _factory.CreateDbContext();

            // Manually propagate the tenant from the HTTP request context
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue)
            {
                throw new InvalidOperationException("Cannot generate demo data without a tenant context.");
            }

            // Set the tenant filter so all queries/inserts are scoped correctly
            context.IgnoreTenantFilter = false;
            // Use TenantId from the service - inject it into inserted entities manually
            int tid = tenantId.Value;

            // 1. Create Job Types (if not exist)
            var jobTypes = await EnsureJobTypes(context, currentUserId, tid);

            // 2. Create Equipment
            var equipmentList = await CreateDemoEquipment(context, currentUserId, tid);

            // 3. Create Jobs (Past & Present)
            await CreateDemoJobs(context, currentUserId, jobTypes, equipmentList, tid);

            await context.SaveChangesAsync();
        }

        private async Task<List<JobType>> EnsureJobTypes(ApplicationDbContext context, string userId, int tenantId)
        {
            context.IgnoreTenantFilter = true;
            var types = await context.JobTypes.ToListAsync();
            context.IgnoreTenantFilter = false;
            if (!types.Any())
            {
                var defaults = new[] { "Preventive Maintenance", "Corrective Repair", "Emergency Breakdown", "Inspection", "Project Work" };
                foreach (var name in defaults)
                {
                    context.JobTypes.Add(new JobType { Name = name, TenantId = tenantId, CreatedBy = userId, CreatedAt = DateTime.UtcNow });
                }
                await context.SaveChangesAsync();
                context.IgnoreTenantFilter = true;
                types = await context.JobTypes.ToListAsync();
                context.IgnoreTenantFilter = false;
            }
            return types;
        }

        private async Task<List<Equipment>> CreateDemoEquipment(ApplicationDbContext context, string userId, int tenantId)
        {
            context.IgnoreTenantFilter = true;
            var existing = await context.Equipment.Where(e => e.TenantId == tenantId).ToListAsync();
            context.IgnoreTenantFilter = false;
            if (existing.Count >= 5) return existing;

            var newEquipment = new List<Equipment>
            {
                new() { Name = "CAT 797F Dump Truck", SerialNumber = "TRK-001", ModelNumber = "797F", Manufacturer = "Caterpillar", TenantId = tenantId, CreatedBy = userId },
                new() { Name = "Komatsu Excavator PC8000", SerialNumber = "EXC-042", ModelNumber = "PC8000-6", Manufacturer = "Komatsu", TenantId = tenantId, CreatedBy = userId },
                new() { Name = "Atlas Copco Drill Rig", SerialNumber = "DRL-105", ModelNumber = "SmartROC D65", Manufacturer = "Atlas Copco", TenantId = tenantId, CreatedBy = userId },
                new() { Name = "Main Conveyor Belt 01", SerialNumber = "CV-01-A", ModelNumber = "1200mm", Manufacturer = "Fenner Dunlop", TenantId = tenantId, CreatedBy = userId },
                new() { Name = "Diesel Generator Set A", SerialNumber = "GEN-500", ModelNumber = "C32", Manufacturer = "Caterpillar", TenantId = tenantId, CreatedBy = userId }
            };

            context.Equipment.AddRange(newEquipment);
            await context.SaveChangesAsync();

            existing.AddRange(newEquipment);
            return existing;
        }

        private async Task CreateDemoJobs(ApplicationDbContext context, string userId, List<JobType> types, List<Equipment> equipment, int tenantId)
        {
            var rnd = new Random();
            var jobs = new List<JobCard>();

            // Get a technician (or use current user if none found)
            context.IgnoreTenantFilter = true;
            var techUser = await context.Users
                .Where(u => (u.Email != null && u.Email.ToLower().Contains("tech")) ||
                            (u.UserName != null && u.UserName.ToLower().Contains("tech")))
                .FirstOrDefaultAsync();
            context.IgnoreTenantFilter = false;
            string techId = techUser?.Id ?? userId;

            // PREV WEEK (Completed)
            for (int i = 0; i < 15; i++)
            {
                var eq = equipment[rnd.Next(equipment.Count)];
                var type = types[rnd.Next(types.Count)];
                var date = DateTime.UtcNow.AddDays(-rnd.Next(1, 30));
                
                jobs.Add(new JobCard
                {
                    JobNumber = $"JOB-{date:yyMM}-{rnd.Next(1000, 9999)}",
                    Description = $"Routine {type.Name} for {eq.Name}. Checked oil levels and belts.",
                    Status = JobStatus.Completed,
                    Priority = (JobPriority)rnd.Next(0, 3),
                    EquipmentId = eq.Id,
                    JobTypeId = type.Id,
                    AssignedTechnicianId = techId,
                    TenantId = tenantId,
                    ScheduledStartDate = date.AddHours(-4),
                    ScheduledEndDate = date,
                    ActualStartDate = date.AddHours(-3),
                    ActualEndDate = date,
                    CreatedAt = date.AddHours(-24),
                    CreatedBy = userId,
                    UpdatedAt = date
                });
            }

            // CURRENT (Active/Overdue)
            jobs.Add(new JobCard 
            {
                JobNumber = $"JOB-{DateTime.UtcNow:yyMM}-NEW1",
                Description = "Hydraulic Leak Investigation",
                Status = JobStatus.InProgress,
                Priority = JobPriority.Critical,
                EquipmentId = equipment.FirstOrDefault(e => e.Name.Contains("Excavator"))?.Id ?? equipment[0].Id,
                JobTypeId = types.FirstOrDefault(t => t.Name.Contains("Corrective"))?.Id ?? types[0].Id,
                AssignedTechnicianId = techId,
                TenantId = tenantId,
                ScheduledStartDate = DateTime.UtcNow.AddHours(-2),
                CreatedAt = DateTime.UtcNow.AddHours(-4),
                CreatedBy = userId
            });

            jobs.Add(new JobCard 
            {
                JobNumber = $"JOB-{DateTime.UtcNow:yyMM}-OVR1",
                Description = "Generator 500hr Service (Overdue)",
                Status = JobStatus.Scheduled,
                Priority = JobPriority.High,
                EquipmentId = equipment.FirstOrDefault(e => e.Name.Contains("Generator"))?.Id ?? equipment[0].Id,
                JobTypeId = types.FirstOrDefault(t => t.Name.Contains("Preventive"))?.Id ?? types[0].Id,
                AssignedTechnicianId = techId,
                TenantId = tenantId,
                ScheduledStartDate = DateTime.UtcNow.AddDays(-2),
                ScheduledEndDate = DateTime.UtcNow.AddDays(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                CreatedBy = userId
            });

            context.JobCards.AddRange(jobs);
        }
    }
}

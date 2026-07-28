using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class ShiftPlanService(IDbContextFactory<ApplicationDbContext> factory) : IShiftPlanService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory = factory;

        public async Task<List<ShiftPlan>> GetAllAsync()
        {
            using var ctx = _factory.CreateDbContext();
            return await ctx.ShiftPlans
                .Include(p => p.MineCaptain)
                .Include(p => p.ShiftBoss)
                .Include(p => p.Tasks).ThenInclude(t => t.Equipment)
                .Include(p => p.Tasks).ThenInclude(t => t.Operator)
                .AsNoTracking()
                .OrderByDescending(p => p.PlanDate)
                .ThenBy(p => p.Shift)
                .ToListAsync();
        }

        public async Task<ShiftPlan?> GetByIdAsync(int id)
        {
            using var ctx = _factory.CreateDbContext();
            return await ctx.ShiftPlans
                .Include(p => p.MineCaptain)
                .Include(p => p.ShiftBoss)
                .Include(p => p.Tasks).ThenInclude(t => t.Equipment)
                .Include(p => p.Tasks).ThenInclude(t => t.Operator)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<ShiftPlan> CreateAsync(ShiftPlan plan, string userId)
        {
            using var ctx = _factory.CreateDbContext();
            
            plan.Status = 0; // Draft
            plan.CreatedAt = DateTime.UtcNow;
            plan.CreatedBy = userId;

            ctx.ShiftPlans.Add(plan);
            await ctx.SaveChangesAsync();
            return plan;
        }

        public async Task UpdateAsync(ShiftPlan plan, string userId)
        {
            using var ctx = _factory.CreateDbContext();
            var existing = await ctx.ShiftPlans
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == plan.Id)
                ?? throw new KeyNotFoundException($"ShiftPlan {plan.Id} not found.");

            existing.PlanDate = plan.PlanDate;
            existing.Shift = plan.Shift;
            existing.MineCaptainId = plan.MineCaptainId;
            existing.ShiftBossId = plan.ShiftBossId;
            existing.OverallTargetTonnage = plan.OverallTargetTonnage;
            existing.Notes = plan.Notes;
            existing.Status = plan.Status;
            
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = userId;

            // Sync Tasks
            ctx.ShiftPlanTasks.RemoveRange(existing.Tasks);
            if (plan.Tasks != null)
            {
                foreach (var t in plan.Tasks)
                {
                    t.Id = 0;
                    existing.Tasks.Add(t);
                }
            }

            await ctx.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            using var ctx = _factory.CreateDbContext();
            var existing = await ctx.ShiftPlans.FindAsync(id);
            if (existing != null)
            {
                ctx.ShiftPlans.Remove(existing);
                await ctx.SaveChangesAsync();
            }
        }

        public async Task<ShiftProductionLog> GenerateActualsAsync(int shiftPlanId, string userId)
        {
            using var ctx = _factory.CreateDbContext();
            var plan = await ctx.ShiftPlans
                .Include(p => p.MineCaptain)
                .Include(p => p.ShiftBoss)
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == shiftPlanId)
                ?? throw new KeyNotFoundException($"ShiftPlan {shiftPlanId} not found.");

            // Create a matching ShiftProductionLog
            var count = await ctx.ShiftProductionLogs.CountAsync();
            var log = new ShiftProductionLog
            {
                LogNumber = $"SPL-{DateTime.UtcNow:yyyyMM}-{count + 1:D4}",
                ShiftDate = plan.PlanDate,
                Shift = plan.Shift,
                Status = ShiftLogStatus.Draft,
                SupervisorName = $"Captain: {plan.MineCaptain?.FirstName} {plan.MineCaptain?.LastName} | Boss: {plan.ShiftBoss?.FirstName} {plan.ShiftBoss?.LastName}",
                TargetQuantity = plan.OverallTargetTonnage,
                UnitOfMeasure = "Tons",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                Remarks = "Generated from Shift Plan #" + plan.Id,
                Resources = new List<ShiftResource>()
            };

            foreach (var task in plan.Tasks)
            {
                log.Resources.Add(new ShiftResource
                {
                    EquipmentId = task.EquipmentId,
                    OperatorId = task.OperatorId,
                    Role = task.ActivityCategory,
                    QuantityUnit = task.TargetPrimaryUnit
                });
            }

            plan.Status = 1; // Active/Executed
            
            ctx.ShiftProductionLogs.Add(log);
            await ctx.SaveChangesAsync();

            return log;
        }
    }
}

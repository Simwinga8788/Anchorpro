using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
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
            existing.OverallTargetSecondary = plan.OverallTargetSecondary;
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
                LogNumber        = $"SPL-{DateTime.UtcNow:yyyyMM}-{count + 1:D4}",
                ShiftDate        = plan.PlanDate,
                Shift            = plan.Shift,
                Status           = ShiftLogStatus.Draft,
                SupervisorName   = $"Captain: {plan.MineCaptain?.FirstName} {plan.MineCaptain?.LastName} | Boss: {plan.ShiftBoss?.FirstName} {plan.ShiftBoss?.LastName}",
                TargetQuantity   = plan.OverallTargetSecondary,
                UnitOfMeasure    = "Tons",
                CreatedAt        = DateTime.UtcNow,
                CreatedBy        = userId,
                Remarks          = $"Generated from Shift Plan #{plan.Id}",
                ShiftPlanId      = plan.Id,   // ← link back to originating plan
                Resources        = new List<ShiftResource>()
            };

            foreach (var task in plan.Tasks)
            {
                log.Resources.Add(new ShiftResource
                {
                    EquipmentId     = task.EquipmentId,
                    OperatorId      = task.OperatorId,
                    Role            = task.ActivityCategory,
                    PlannedQuantity = task.TargetPrimary,      // ← planned target per resource
                    ActualQuantity  = task.ActualQuantity ?? 0, // ← actual checked quantity
                    QuantityUnit    = task.TargetPrimaryUnit,
                });

                if (task.EquipmentId.HasValue && !string.IsNullOrEmpty(task.OperatorId))
                {
                    var jobType = await ctx.JobTypes.FirstOrDefaultAsync(t => t.Name == "Project Work") 
                        ?? await ctx.JobTypes.FirstOrDefaultAsync();

                    var job = new JobCard
                    {
                        JobNumber = $"SP-{plan.Id}-{task.Id}",
                        Description = $"{task.ActivityCategory} - {task.Location ?? "Site"}",
                        EquipmentId = task.EquipmentId.Value,
                        JobTypeId = jobType?.Id ?? 1,
                        ProjectId = plan.ProjectId,
                        ShiftPlanTaskId = task.Id,
                        TenantId = plan.TenantId,
                        Status = JobStatus.Scheduled,
                        Priority = JobPriority.High,
                        ScheduledStartDate = plan.PlanDate,
                        AssignedTechnicianId = task.OperatorId,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = userId
                    };
                    ctx.JobCards.Add(job);
                }
            }

            plan.Status = 1; // Active/Executed

            ctx.ShiftProductionLogs.Add(log);
            await ctx.SaveChangesAsync();

            return log;
        }

        public async Task<ShiftPlanTask> ToggleTaskCompletionAsync(
            int planId, int taskId, bool isCompleted, decimal? actualQuantity, string? photoUrl, string? completionNotes, string userId, string userName)
        {
            using var ctx = _factory.CreateDbContext();
            var task = await ctx.ShiftPlanTasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ShiftPlanId == planId)
                ?? throw new KeyNotFoundException($"ShiftPlanTask {taskId} for Plan {planId} not found.");

            task.IsCompleted = isCompleted;
            if (isCompleted)
            {
                task.CompletedByUserId = userId;
                task.CompletedByName = userName;
                task.CompletedAt = DateTime.UtcNow;
            }
            else
            {
                task.CompletedByUserId = null;
                task.CompletedByName = null;
                task.CompletedAt = null;
            }

            if (actualQuantity.HasValue)
            {
                task.ActualQuantity = actualQuantity.Value;
            }

            if (!string.IsNullOrWhiteSpace(photoUrl))
            {
                task.PhotoUrl = photoUrl;
            }

            if (!string.IsNullOrWhiteSpace(completionNotes))
            {
                task.CompletionNotes = completionNotes;
            }

            await ctx.SaveChangesAsync();
            return task;
        }

    }
}

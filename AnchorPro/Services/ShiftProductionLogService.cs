using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class ShiftProductionLogService(IDbContextFactory<ApplicationDbContext> factory) : IShiftProductionLogService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory = factory;

        public async Task<List<ShiftProductionLog>> GetAllAsync()
        {
            using var ctx = _factory.CreateDbContext();
            return await ctx.ShiftProductionLogs
                .Include(s => s.Equipment)
                .Include(s => s.CostEntries)
                .AsNoTracking()
                .OrderByDescending(s => s.ShiftDate)
                .ThenBy(s => s.Shift)
                .ToListAsync();
        }

        public async Task<ShiftProductionLog?> GetByIdAsync(int id)
        {
            using var ctx = _factory.CreateDbContext();
            return await ctx.ShiftProductionLogs
                .Include(s => s.Equipment)
                .Include(s => s.CostEntries)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<ShiftProductionLog> CreateAsync(ShiftProductionLog log, string userId)
        {
            using var ctx = _factory.CreateDbContext();

            // Auto-generate log number: SPL-YYYYMM-NNNN
            var count = await ctx.ShiftProductionLogs.CountAsync();
            log.LogNumber = $"SPL-{DateTime.UtcNow:yyyyMM}-{count + 1:D4}";
            log.Status    = ShiftLogStatus.Draft;
            log.CreatedAt = DateTime.UtcNow;
            log.CreatedBy = userId;

            ctx.ShiftProductionLogs.Add(log);
            await ctx.SaveChangesAsync();
            return log;
        }

        public async Task UpdateAsync(ShiftProductionLog log, string userId)
        {
            using var ctx = _factory.CreateDbContext();
            var existing = await ctx.ShiftProductionLogs.FindAsync(log.Id)
                ?? throw new KeyNotFoundException($"ShiftProductionLog {log.Id} not found.");

            if (existing.Status != ShiftLogStatus.Draft)
                throw new InvalidOperationException("Only Draft shift logs can be edited.");

            existing.ShiftDate           = log.ShiftDate;
            existing.Shift               = log.Shift;
            existing.EquipmentId         = log.EquipmentId;
            existing.QuantityProduced    = log.QuantityProduced;
            existing.TargetQuantity      = log.TargetQuantity;
            existing.UnitOfMeasure       = log.UnitOfMeasure;
            existing.FuelConsumedLitres  = log.FuelConsumedLitres;
            existing.OperatingHours      = log.OperatingHours;
            existing.DowntimeHours       = log.DowntimeHours;
            existing.OperatorName        = log.OperatorName;
            existing.SupervisorName      = log.SupervisorName;
            existing.CrewCount           = log.CrewCount;
            existing.Location            = log.Location;
            existing.ActivityType        = log.ActivityType;
            existing.Remarks             = log.Remarks;
            existing.UpdatedAt           = DateTime.UtcNow;
            existing.UpdatedBy           = userId;

            await ctx.SaveChangesAsync();
        }

        public async Task SubmitForApprovalAsync(int id, string userId)
        {
            using var ctx = _factory.CreateDbContext();
            var log = await ctx.ShiftProductionLogs.FindAsync(id)
                ?? throw new KeyNotFoundException($"ShiftProductionLog {id} not found.");

            if (log.Status != ShiftLogStatus.Draft)
                throw new InvalidOperationException("Only Draft shift logs can be submitted.");

            log.Status    = ShiftLogStatus.Submitted;
            log.UpdatedAt = DateTime.UtcNow;
            log.UpdatedBy = userId;
            await ctx.SaveChangesAsync();
        }

        public async Task ApproveAsync(int id, string approvedByUserId)
        {
            using var ctx = _factory.CreateDbContext();
            var log = await ctx.ShiftProductionLogs.FindAsync(id)
                ?? throw new KeyNotFoundException($"ShiftProductionLog {id} not found.");

            if (log.Status != ShiftLogStatus.Submitted)
                throw new InvalidOperationException("Only Submitted shift logs can be approved.");

            log.Status      = ShiftLogStatus.Approved;
            log.ApprovedBy  = approvedByUserId;
            log.ApprovedAt  = DateTime.UtcNow;
            log.UpdatedAt   = DateTime.UtcNow;
            log.UpdatedBy   = approvedByUserId;
            await ctx.SaveChangesAsync();
        }

        public async Task RejectAsync(int id, string reason, string userId)
        {
            using var ctx = _factory.CreateDbContext();
            var log = await ctx.ShiftProductionLogs.FindAsync(id)
                ?? throw new KeyNotFoundException($"ShiftProductionLog {id} not found.");

            log.Status          = ShiftLogStatus.Rejected;
            log.RejectionReason = reason;
            log.UpdatedAt       = DateTime.UtcNow;
            log.UpdatedBy       = userId;
            await ctx.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            using var ctx = _factory.CreateDbContext();
            var log = await ctx.ShiftProductionLogs.FindAsync(id)
                ?? throw new KeyNotFoundException($"ShiftProductionLog {id} not found.");

            if (log.Status == ShiftLogStatus.Approved)
                throw new InvalidOperationException("Approved shift logs cannot be deleted.");

            ctx.ShiftProductionLogs.Remove(log);
            await ctx.SaveChangesAsync();
        }

        public async Task<List<ShiftProductionLog>> GetByEquipmentAsync(int equipmentId)
        {
            using var ctx = _factory.CreateDbContext();
            return await ctx.ShiftProductionLogs
                .Where(s => s.EquipmentId == equipmentId)
                .Include(s => s.Equipment)
                .AsNoTracking()
                .OrderByDescending(s => s.ShiftDate)
                .ToListAsync();
        }

        public async Task<ShiftProductionSummary> GetSummaryAsync(DateTime from, DateTime to)
        {
            using var ctx = _factory.CreateDbContext();
            var logs = await ctx.ShiftProductionLogs
                .Where(s => s.Status != ShiftLogStatus.Rejected
                         && s.ShiftDate >= from
                         && s.ShiftDate <= to)
                .Include(s => s.CostEntries)
                .AsNoTracking()
                .ToListAsync();

            var totalQty          = logs.Sum(l => l.QuantityProduced);
            var totalFuel         = logs.Sum(l => l.FuelConsumedLitres);
            var totalOpHours      = logs.Sum(l => l.OperatingHours);
            var totalDowntime     = logs.Sum(l => l.DowntimeHours);
            var totalCost         = logs.SelectMany(l => l.CostEntries).Sum(c => c.Amount);
            var unitOfMeasure     = logs.FirstOrDefault()?.UnitOfMeasure ?? "Units";
            var costPerUnit       = totalQty > 0 ? totalCost / totalQty : 0;

            return new ShiftProductionSummary(
                totalQty, unitOfMeasure, totalFuel,
                totalOpHours, totalDowntime, logs.Count, costPerUnit
            );
        }
    }
}

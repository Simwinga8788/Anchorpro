using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IShiftProductionLogService
    {
        Task<List<ShiftProductionLog>> GetAllAsync();
        Task<ShiftProductionLog?> GetByIdAsync(int id);
        Task<ShiftProductionLog> CreateAsync(ShiftProductionLog log, string userId);
        Task UpdateAsync(ShiftProductionLog log, string userId);
        Task SubmitForApprovalAsync(int id, string userId);
        Task ApproveAsync(int id, string approvedByUserId);
        Task RejectAsync(int id, string reason, string userId);
        Task DeleteAsync(int id);
        Task<List<ShiftProductionLog>> GetByEquipmentAsync(int equipmentId);
        Task<ShiftProductionSummary> GetSummaryAsync(DateTime from, DateTime to);
        Task<List<ShiftProductionLog>> GetUnbilledAsync();
        Task<List<ShiftProductionChartData>> GetChartDataAsync(int days);
    }

    public record ShiftProductionSummary(
        decimal TotalQuantityProduced,
        decimal TotalTargetQuantity,
        string UnitOfMeasure,
        decimal TotalFuelConsumedLitres,
        decimal TotalOperatingHours,
        decimal TotalDowntimeHours,
        int TotalShifts,
        decimal CostPerUnit
    );

    public record ShiftProductionChartData(
        string Date,
        decimal Actual,
        decimal Target
    );
}

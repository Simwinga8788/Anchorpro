using System.Collections.Generic;
using System.Threading.Tasks;
using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IShiftPlanService
    {
        Task<List<ShiftPlan>> GetAllAsync();
        Task<ShiftPlan?> GetByIdAsync(int id);
        Task<ShiftPlan> CreateAsync(ShiftPlan plan, string userId);
        Task UpdateAsync(ShiftPlan plan, string userId);
        Task DeleteAsync(int id);
        Task<ShiftProductionLog> GenerateActualsAsync(int shiftPlanId, string userId);
    }
}

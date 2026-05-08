using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IEquipmentService
    {
        Task<List<Equipment>> GetAllEquipmentAsync();
        Task<Equipment?> GetEquipmentByIdAsync(int id);
        Task CreateEquipmentAsync(Equipment equipment, string userId);
        Task UpdateEquipmentAsync(Equipment equipment, string userId);
        Task DeleteEquipmentAsync(int id);
        Task<List<JobCard>> GetEquipmentHistoryAsync(int equipmentId);
    }
}

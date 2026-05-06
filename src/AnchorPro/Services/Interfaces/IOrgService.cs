using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IOrgService
    {
        Task<List<Department>> GetAllDepartmentsAsync();
        Task<Department?> GetDepartmentByIdAsync(int id);
        Task CreateDepartmentAsync(Department department, string userId);
        Task UpdateDepartmentAsync(Department department, string userId);
        Task DeleteDepartmentAsync(int id);
    }
}

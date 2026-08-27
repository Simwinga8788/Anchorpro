using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface ISafetyService
    {
        Task<List<PermitToWork>> GetAllPermitsAsync();
        Task<PermitToWork?> GetPermitByIdAsync(int id);
        Task<PermitToWork?> GetPermitByJobIdAsync(int jobId);
        Task<List<PermitToWork>> GetByProjectAsync(int projectId);
        Task CreatePermitAsync(PermitToWork permit, string userId);
        Task UpdatePermitStatusAsync(int permitId, PermitStatus status, string closureNotes, string userId);
        Task<SafetyDashboardStats> GetDashboardStatsAsync();
        Task<ProjectSafetyStats> GetProjectStatsAsync(int projectId);
    }

    public class SafetyDashboardStats
    {
        public int ActivePermits { get; set; }
        public int LotoApplied { get; set; }
        public int PpeChecks { get; set; }
        public int ClosedThisMonth { get; set; }
        public int SuspendedPermits { get; set; }
        public decimal CompliancePercent { get; set; }
    }

    public class ProjectSafetyStats
    {
        public int TotalPermits { get; set; }
        public int ActivePermits { get; set; }
        public decimal CompliancePercent { get; set; }
    }
}

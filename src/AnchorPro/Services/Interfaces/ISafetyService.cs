using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface ISafetyService
    {
        Task<List<PermitToWork>> GetAllPermitsAsync();
        Task<PermitToWork?> GetPermitByIdAsync(int id);
        Task<PermitToWork?> GetPermitByJobIdAsync(int jobId);
        Task CreatePermitAsync(PermitToWork permit, string userId);
        Task UpdatePermitStatusAsync(int permitId, PermitStatus status, string closureNotes, string userId);
        Task<SafetyDashboardStats> GetDashboardStatsAsync();
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
}

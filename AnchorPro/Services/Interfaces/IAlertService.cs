using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IAlertService
    {
        // ── Background fire-and-forget checks ─────────────────────────────────
        Task CheckForLowMarginJobsAsync();
        Task CheckForOverdueJobsAsync();
        Task NotifyTechnicianDelayAsync(string jobNumber, string technicianName, string reason);

        // ── Persistent alert read/write ────────────────────────────────────────

        /// <summary>Returns alerts for the current tenant, newest first. Pass isRead=false for unread only.</summary>
        Task<List<Alert>> GetAlertsAsync(bool? isRead = null, string? category = null, int page = 1, int pageSize = 50);

        /// <summary>Total unread alert count for the badge on the UI.</summary>
        Task<int> GetUnreadCountAsync();

        /// <summary>Creates and persists a new alert to the database.</summary>
        Task<Alert> CreateAlertAsync(string title, string message, string severity, string category,
                                     int? jobCardId = null, int? customerId = null);

        /// <summary>Marks a single alert as read by the current user.</summary>
        Task MarkAsReadAsync(int alertId, string userId);

        /// <summary>Marks ALL unread alerts for the current tenant as read.</summary>
        Task DismissAllAsync(string userId);
    }
}

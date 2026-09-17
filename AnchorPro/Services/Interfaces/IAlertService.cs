using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IAlertService
    {
        // ── Background fire-and-forget checks ─────────────────────────────────
        Task CheckForLowMarginJobsAsync();
        Task CheckForOverdueJobsAsync();
        Task CheckForOverdueActivitiesAsync();
        Task NotifyTechnicianDelayAsync(string jobNumber, string technicianName, string reason);

        // ── Persistent alert read/write ────────────────────────────────────────

        /// <summary>Returns alerts for the current tenant, newest first. Pass isRead=false for unread only.</summary>
        Task<List<Alert>> GetAlertsAsync(bool? isRead = null, string? category = null, int page = 1, int pageSize = 50);

        /// <summary>Total unread alert count for the badge on the UI.</summary>
        Task<int> GetUnreadCountAsync();

        /// <summary>
        /// Creates and persists a new alert to the database. Pass <paramref name="tenantId"/>
        /// explicitly when calling from a background loop iterating multiple tenants (there is
        /// no ambient tenant context there) — omitting it falls back to the current request's
        /// tenant, which is only correct for calls made within an HTTP request.
        /// </summary>
        Task<Alert> CreateAlertAsync(string title, string message, string severity, string category,
                                     int? jobCardId = null, int? customerId = null, int? tenantId = null);

        /// <summary>Marks a single alert as read by the current user.</summary>
        Task MarkAsReadAsync(int alertId, string userId);

        /// <summary>Marks ALL unread alerts for the current tenant as read.</summary>
        Task DismissAllAsync(string userId);
    }
}

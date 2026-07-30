using System.Collections.Generic;
using System.Threading.Tasks;

namespace AnchorPro.Services.Interfaces
{
    public interface ICopilotService
    {
        Task<(string Reply, string Action, string Route)> ProcessMessageAsync(string message, string? audioData, string? audioMimeType, string userId, string userName, int tenantId, IList<string> userRoles);
    }
}

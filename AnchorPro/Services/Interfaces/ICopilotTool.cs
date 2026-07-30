using System.Text.Json;
using System.Threading.Tasks;

namespace AnchorPro.Services.Interfaces
{
    public interface ICopilotTool
    {
        string Name { get; }
        string Description { get; }
        string[]? AllowedRoles { get; } // If null, allowed for everyone. Otherwise, user must have one of these roles.
        object Parameters { get; }
        Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId);
    }
}

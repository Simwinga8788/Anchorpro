using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Services.Interfaces;

namespace AnchorPro.Services.CopilotTools
{
    public class NavigateTool : ICopilotTool
    {
        public string Name => "navigate";
        public string Description => "Navigates the user to a specific route in the application dashboard";
        public string[]? AllowedRoles => null;
        
        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>
            {
                { "route", new { type = "STRING", description = "The route to navigate to (e.g., /dashboard/jobs)" } }
            },
            required = new[] { "route" }
        };

        public Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var route = args.GetProperty("route").GetString() ?? "";
            return Task.FromResult(($"Navigating you to {route}...", "navigate", route));
        }
    }
}

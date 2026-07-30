using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services.CopilotTools
{
    public class GetActiveProjectsTool : ICopilotTool
    {
        private readonly ApplicationDbContext _db;

        public GetActiveProjectsTool(ApplicationDbContext db)
        {
            _db = db;
        }

        public string Name => "get_active_projects";
        public string Description => "Returns a summary of the currently active construction projects";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>(),
            required = new string[] { }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var activeProjects = await _db.Projects
                .Where(p => p.TenantId == tenantId && p.Status == ProjectStatus.Active)
                .ToListAsync();

            if (!activeProjects.Any()) return ("There are currently no active projects.", "", "");

            var responseText = $"You have {activeProjects.Count} active projects:\n" +
                               string.Join("\n", activeProjects.Select(p => $"- {p.Name} (Value: {p.Budget})"));
            return (responseText, "", "");
        }
    }
}

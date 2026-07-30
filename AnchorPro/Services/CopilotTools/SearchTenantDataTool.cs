using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services.CopilotTools
{
    public class SearchTenantDataTool : ICopilotTool
    {
        private readonly ApplicationDbContext _db;

        public SearchTenantDataTool(ApplicationDbContext db)
        {
            _db = db;
        }

        public string Name => "search_tenant_data";
        public string Description => "Searches across multiple major entities (Projects, Equipment, JobCards, Employees) by keyword to find information for the user.";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>
            {
                { "query", new { type = "STRING", description = "The search term or keyword to look for." } }
            },
            required = new[] { "query" }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var query = args.GetProperty("query").GetString()?.ToLower() ?? "";
            
            if (string.IsNullOrWhiteSpace(query))
            {
                return ("Please provide a search term.", "", "");
            }

            var replyText = $"Search results for '{query}':\n\n";
            bool foundAnything = false;

            // Search Projects
            var projects = await _db.Projects
                .Where(p => p.TenantId == tenantId && (p.Name.ToLower().Contains(query) || p.Description.ToLower().Contains(query)))
                .Take(3)
                .ToListAsync();

            if (projects.Any())
            {
                foundAnything = true;
                replyText += "**Projects:**\n";
                foreach (var p in projects) replyText += $"- {p.Name} (Status: {p.Status})\n";
                replyText += "\n";
            }

            // Search Equipment
            var equipment = await _db.Equipment
                .Where(e => e.TenantId == tenantId && (e.Name.ToLower().Contains(query) || e.SerialNumber.ToLower().Contains(query)))
                .Take(3)
                .ToListAsync();

            if (equipment.Any())
            {
                foundAnything = true;
                replyText += "**Equipment:**\n";
                foreach (var e in equipment) replyText += $"- {e.Name} (S/N: {e.SerialNumber})\n";
                replyText += "\n";
            }

            // Search JobCards
            var jobs = await _db.JobCards
                .Where(j => j.TenantId == tenantId && (j.JobNumber.ToLower().Contains(query) || j.Description.ToLower().Contains(query)))
                .Take(3)
                .ToListAsync();

            if (jobs.Any())
            {
                foundAnything = true;
                replyText += "**Job Cards:**\n";
                foreach (var j in jobs) replyText += $"- {j.JobNumber}: {j.Description}\n";
                replyText += "\n";
            }

            if (!foundAnything)
            {
                replyText = $"I couldn't find anything matching '{query}' in your Projects, Equipment, or Job Cards.";
            }

            return (replyText, "", "");
        }
    }
}

using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services.CopilotTools
{
    public class GetJobCardsSummaryTool : ICopilotTool
    {
        private readonly ApplicationDbContext _db;

        public GetJobCardsSummaryTool(ApplicationDbContext db)
        {
            _db = db;
        }

        public string Name => "get_job_cards_summary";
        public string Description => "Returns the total number of job cards (jobs) and a breakdown of their current statuses (e.g., Unscheduled, In Progress). Use this to answer how many jobs exist.";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>(),
            required = new string[] { }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            if (tenantId == 0)
            {
                return ("You must be logged into a tenant workspace to view job cards.", "", "");
            }

            var jobs = await _db.JobCards
                .Where(j => j.TenantId == tenantId)
                .ToListAsync();

            var total = jobs.Count;
            if (total == 0)
            {
                return ("There are currently 0 jobs in the system.", "", "");
            }

            var summary = $"You have a total of {total} jobs.\n";
            var byStatus = jobs.GroupBy(j => j.Status).Select(g => $"- {g.Key}: {g.Count()}");
            
            summary += string.Join("\n", byStatus);

            return (summary, "", "");
        }
    }
}

using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services.CopilotTools
{
    public class GetTechnicianWorkloadTool : ICopilotTool
    {
        private readonly ApplicationDbContext _db;

        public GetTechnicianWorkloadTool(ApplicationDbContext db)
        {
            _db = db;
        }

        public string Name => "get_technician_workload";
        public string Description => "Finds out what technicians are currently working on and who is free.";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>(),
            required = new string[] { }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var activeJobs = await _db.JobCards
                .Include(j => j.AssignedTechnician)
                .Where(j => j.TenantId == tenantId && j.Status == AnchorPro.Data.Enums.JobStatus.InProgress && j.AssignedTechnicianId != null)
                .ToListAsync();

            if (!activeJobs.Any())
            {
                return ("No technicians are currently assigned to active (In Progress) jobs.", "", "");
            }

            var grouped = activeJobs.GroupBy(j => j.AssignedTechnician?.UserName ?? "Unknown");

            var reply = $"Here is the current technician workload:\n\n";
            foreach (var g in grouped)
            {
                reply += $"- **{g.Key}**: {g.Count()} active jobs.\n";
            }

            return (reply, "navigate", "/dashboard/planning");
        }
    }
}

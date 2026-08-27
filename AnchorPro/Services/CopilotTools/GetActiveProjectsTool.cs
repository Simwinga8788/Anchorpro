using System;
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

            var projectIds = activeProjects.Select(p => p.Id).ToList();

            var latestCerts = await _db.PaymentCertificates
                .Where(c => projectIds.Contains(c.ProjectId) && c.Status != CertificateStatus.Draft)
                .GroupBy(c => c.ProjectId)
                .Select(g => g.OrderByDescending(c => c.PeriodEndDate).First())
                .ToListAsync();

            var lines = activeProjects.Select(p =>
            {
                var cert = latestCerts.FirstOrDefault(c => c.ProjectId == p.Id);
                var progress = cert != null && p.Budget > 0
                    ? $", {Math.Round(cert.GrossValuationToDate / p.Budget * 100, 1)}% certified, latest cert {cert.CertificateNumber} ({cert.Status})"
                    : ", no certificates raised yet";
                return $"- {p.Name} (Budget: {p.Budget:N2}{progress})";
            });

            var responseText = $"You have {activeProjects.Count} active projects:\n" + string.Join("\n", lines);
            return (responseText, "", "");
        }
    }
}

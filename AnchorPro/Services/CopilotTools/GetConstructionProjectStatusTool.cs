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
    public class GetConstructionProjectStatusTool : ICopilotTool
    {
        private readonly ApplicationDbContext _db;

        public GetConstructionProjectStatusTool(ApplicationDbContext db)
        {
            _db = db;
        }

        public string Name => "get_construction_project_status";
        public string Description => "Returns the BOQ contract sum, certified valuation progress, latest payment certificate status, and open variations for a named construction project. Use this to answer questions about a specific project's financial or certification status.";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>
            {
                { "projectName", new { type = "STRING", description = "The name (or part of the name) of the project to look up." } }
            },
            required = new[] { "projectName" }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var projectName = args.GetProperty("projectName").GetString() ?? "";

            var project = await _db.Projects
                .Where(p => p.TenantId == tenantId && p.Name.Contains(projectName))
                .FirstOrDefaultAsync();

            if (project == null)
            {
                var names = await _db.Projects.Where(p => p.TenantId == tenantId).Select(p => p.Name).ToListAsync();
                var available = names.Any() ? string.Join(", ", names) : "none on record";
                return ($"I couldn't find a project matching '{projectName}'. Projects on record: {available}.", "", "");
            }

            var contractSum = await _db.BillsOfQuantities
                .Where(b => b.ProjectId == project.Id)
                .OrderByDescending(b => b.VersionNumber)
                .Select(b => (decimal?)b.TotalContractSum)
                .FirstOrDefaultAsync() ?? project.Budget;

            var latestCert = await _db.PaymentCertificates
                .Where(c => c.ProjectId == project.Id && c.Status != CertificateStatus.Draft)
                .OrderByDescending(c => c.PeriodEndDate)
                .FirstOrDefaultAsync();

            var openVariations = await _db.Variations
                .CountAsync(v => v.ProjectId == project.Id && v.Status == VariationStatus.Pending);

            var approvedVariationsValue = await _db.Variations
                .Where(v => v.ProjectId == project.Id && v.Status == VariationStatus.Approved)
                .SumAsync(v => v.Amount);

            var reply = $"**{project.Name}**\n" +
                        $"- BOQ Contract Sum: {contractSum:N2}\n" +
                        (latestCert != null
                            ? $"- Latest Certificate: {latestCert.CertificateNumber} ({latestCert.Status}), valued {latestCert.GrossValuationToDate:N2} ({(contractSum > 0 ? Math.Round(latestCert.GrossValuationToDate / contractSum * 100, 1) : 0)}% of contract), net payable {latestCert.NetAmountDue:N2}\n"
                            : "- No payment certificates raised yet\n") +
                        $"- Open Variations Awaiting Approval: {openVariations}\n" +
                        $"- Approved Variations Value: {approvedVariationsValue:N2}";

            return (reply, "navigate", $"/dashboard/projects/{project.Id}");
        }
    }
}

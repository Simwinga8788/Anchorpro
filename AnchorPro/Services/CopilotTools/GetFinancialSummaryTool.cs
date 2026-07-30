using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services.CopilotTools
{
    public class GetFinancialSummaryTool : ICopilotTool
    {
        private readonly ApplicationDbContext _db;

        public GetFinancialSummaryTool(ApplicationDbContext db)
        {
            _db = db;
        }

        public string Name => "get_financial_summary";
        public string Description => "Gets a high-level financial summary of the business, including total revenue, job card costs, and active project budgets.";
        public string[]? AllowedRoles => new[] { "Admin", "Manager" };

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>(),
            required = new string[] { }
        };

        public async Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var totalProjectBudget = await _db.Projects
                .Where(p => p.TenantId == tenantId && p.Status == AnchorPro.Data.Entities.ProjectStatus.Active)
                .SumAsync(p => p.Budget);

            var totalJobInvoices = await _db.JobCards
                .Where(j => j.TenantId == tenantId && j.Status == AnchorPro.Data.Enums.JobStatus.Completed)
                .SumAsync(j => j.InvoiceAmount);
                
            var totalJobCosts = await _db.JobCards
                .Where(j => j.TenantId == tenantId && j.Status == AnchorPro.Data.Enums.JobStatus.Completed)
                .SumAsync(j => j.TotalCost);

            var reply = $"Here is your financial summary:\n\n" +
                        $"- **Active Projects Total Budget:** ${totalProjectBudget:N2}\n" +
                        $"- **Total Invoiced (Completed Jobs):** ${totalJobInvoices:N2}\n" +
                        $"- **Total Costs (Completed Jobs):** ${totalJobCosts:N2}\n" +
                        $"- **Estimated Profit:** ${(totalJobInvoices - totalJobCosts):N2}";

            return (reply, "navigate", "/dashboard/financials");
        }
    }
}

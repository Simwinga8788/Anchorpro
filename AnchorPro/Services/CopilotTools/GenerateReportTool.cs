using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using AnchorPro.Services.Interfaces;

namespace AnchorPro.Services.CopilotTools
{
    public class GenerateReportTool : ICopilotTool
    {
        public string Name => "generate_report";
        public string Description => "Generates or navigates to a system report based on the user's request (e.g., downtime report, financial report, production report).";
        public string[]? AllowedRoles => null;

        public object Parameters => new
        {
            type = "OBJECT",
            properties = new Dictionary<string, object>
            {
                { "reportType", new { type = "STRING", description = "The type of report the user wants (e.g., 'financial', 'downtime', 'production')" } }
            },
            required = new[] { "reportType" }
        };

        public Task<(string Reply, string Action, string Route)> ExecuteAsync(JsonElement args, string userId, int tenantId)
        {
            var reportType = args.GetProperty("reportType").GetString()?.ToLower() ?? "";

            string route = "/dashboard/reports";
            string reply = "I am taking you to the reporting dashboard where you can view and export this data.";

            if (reportType.Contains("finance") || reportType.Contains("financial"))
            {
                route = "/dashboard/financials";
            }
            else if (reportType.Contains("downtime") || reportType.Contains("equipment"))
            {
                route = "/dashboard/equipment";
            }
            else if (reportType.Contains("production") || reportType.Contains("shift"))
            {
                route = "/dashboard/shifts/reports";
            }

            return Task.FromResult((reply, "navigate", route));
        }
    }
}

using System.Text;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Models;
using AnchorPro.Services.Interfaces;

namespace AnchorPro.Services
{
    public class CsvExportService : IExportService
    {
        public byte[] GenerateJobHistoryCsv(List<JobCard> jobs)
        {
            var sb = new StringBuilder();
            
            // Header
            sb.AppendLine("Job Number,Type,Description,Priority,Status,Equipment,Technician,Created Date,Completed Date,Labor Cost (ZMW),Parts Cost (ZMW),Total Cost (ZMW)");

            foreach (var job in jobs)
            {
                var equipName = job.Equipment?.Name?.Replace(",", " ") ?? "N/A";
                // Quote description to handle commas gracefully in Excel
                var desc = $"\"{job.Description?.Replace("\"", "\"\"") ?? ""}\"";
                var type = job.JobType?.Name?.Replace(",", " ") ?? "General";
                
                // Format dates for Excel compatibility
                var created = job.CreatedAt.ToString("yyyy-MM-dd HH:mm");
                var completed = job.ActualEndDate?.ToString("yyyy-MM-dd HH:mm") ?? "";

                // Format money
                var labor = job.LaborCost.ToString("F2");
                var parts = job.PartsCost.ToString("F2");
                var total = job.TotalCost.ToString("F2");
                
                var techName = job.AssignedTechnician?.UserName ?? "Unassigned";
                sb.AppendLine($"{job.JobNumber},{type},{desc},{job.Priority},{job.Status},{equipName},{techName},{created},{completed},{labor},{parts},{total}");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }
        public byte[] GeneratePerformanceExcel(PerformanceMetrics metrics)
        {
            using var workbook = new ClosedXML.Excel.XLWorkbook();
            
            // Sheet 1: Executive Summary
            var summarySheet = workbook.Worksheets.Add("Summary");
            summarySheet.Cell(1, 1).Value = "Performance Analytics Executive Summary";
            summarySheet.Cell(1, 1).Style.Font.Bold = true;
            summarySheet.Cell(1, 1).Style.Font.FontSize = 14;

            summarySheet.Cell(3, 1).Value = "Metric";
            summarySheet.Cell(3, 2).Value = "Value";
            summarySheet.Range(3, 1, 3, 2).Style.Font.Bold = true;
            summarySheet.Range(3, 1, 3, 2).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;

            summarySheet.Cell(4, 1).Value = "On-Time Completion Rate";
            summarySheet.Cell(4, 2).Value = metrics.OnTimeCompletionPercentage / 100.0;
            summarySheet.Cell(4, 2).Style.NumberFormat.Format = "0.0%";

            summarySheet.Cell(5, 1).Value = "Avg Lead Time (Hours)";
            summarySheet.Cell(5, 2).Value = metrics.AvgLeadTimeHours;

            summarySheet.Cell(6, 1).Value = "Total Jobs Completed (Last 30 Days)";
            summarySheet.Cell(6, 2).Value = metrics.CompletedJobsInPeriod;

            summarySheet.Columns().AdjustToContents();

            // Sheet 2: Equipment Performance
            var equipSheet = workbook.Worksheets.Add("Equipment Data");
            equipSheet.Cell(1, 1).Value = "Equipment Performance and MTTR Analysis";
            equipSheet.Cell(1, 1).Style.Font.Bold = true;

            var headers = new[] { "Asset Name", "Jobs", "Maint. Hours", "Breakdowns", "MTTR (Hrs)", "MTBF (Hrs)", "Utilization %" };
            for (int i = 0; i < headers.Length; i++)
            {
                equipSheet.Cell(3, i + 1).Value = headers[i];
            }
            equipSheet.Range(3, 1, 3, headers.Length).Style.Font.Bold = true;
            equipSheet.Range(3, 1, 3, headers.Length).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightGray;

            int row = 4;
            foreach (var equip in metrics.EquipmentStats)
            {
                equipSheet.Cell(row, 1).Value = equip.EquipmentName;
                equipSheet.Cell(row, 2).Value = equip.MaintenanceJobsCount;
                equipSheet.Cell(row, 3).Value = equip.TotalMaintenanceHours;
                equipSheet.Cell(row, 4).Value = equip.BreakdownCount;
                equipSheet.Cell(row, 5).Value = equip.MTTR_Hours;
                equipSheet.Cell(row, 6).Value = equip.MTBF_Hours;
                equipSheet.Cell(row, 7).Value = equip.UtilizationPercentage / 100.0;
                equipSheet.Cell(row, 7).Style.NumberFormat.Format = "0.0%";
                row++;
            }
            equipSheet.Columns().AdjustToContents();

            // Sheet 3: Technician Stats
            var techSheet = workbook.Worksheets.Add("Technician Utilization");
            var techHeaders = new[] { "Technician", "Jobs", "Hours Worked", "Avg Job Time", "Utilization %" };
            for (int i = 0; i < techHeaders.Length; i++) techSheet.Cell(1, i + 1).Value = techHeaders[i];
            techSheet.Row(1).Style.Font.Bold = true;

            row = 2;
            foreach (var tech in metrics.TechnicianStats)
            {
                techSheet.Cell(row, 1).Value = tech.TechnicianName;
                techSheet.Cell(row, 2).Value = tech.JobsCompleted;
                techSheet.Cell(row, 3).Value = tech.TotalHoursWorked;
                techSheet.Cell(row, 4).Value = tech.AvgJobTimeHours;
                techSheet.Cell(row, 5).Value = tech.UtilizationPercentage / 100.0;
                techSheet.Cell(row, 5).Style.NumberFormat.Format = "0.0%";
                row++;
            }
            techSheet.Columns().AdjustToContents();

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }
    }
}

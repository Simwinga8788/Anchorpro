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

            var headers = new[] { "Asset Name", "Jobs", "Maint. Hours", "Down Time Events", "MTTR (Hrs)", "MTBF (Hrs)", "Utilization %" };
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

        public byte[] GenerateJobImportTemplate()
        {
            using var workbook = new ClosedXML.Excel.XLWorkbook();
            var ws = workbook.Worksheets.Add("Job Import Template");

            // Headers
            ws.Cell(1, 1).Value = "#";
            ws.Cell(1, 2).Value = "Job Number";
            ws.Cell(1, 3).Value = "Type";
            ws.Cell(1, 4).Value = "Description";
            ws.Cell(1, 5).Value = "Priority";
            ws.Cell(1, 6).Value = "Status";
            ws.Cell(1, 7).Value = "Equipment";
            ws.Cell(1, 8).Value = "Technician";
            ws.Cell(1, 9).Value = "Scheduled Start";
            ws.Cell(1, 10).Value = "Scheduled End";

            // Header Style
            var headerRange = ws.Range(1, 1, 1, 10);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;
            headerRange.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#1E3A8A"); // Deep Navy/Slate Blue
            headerRange.Style.Alignment.Horizontal = ClosedXML.Excel.XLAlignmentHorizontalValues.Center;

            // Generate 5 numbered empty rows (with nice formatting)
            for (int i = 1; i <= 5; i++)
            {
                var rowNum = i + 1;
                ws.Cell(rowNum, 1).Value = i;
                ws.Cell(rowNum, 1).Style.Alignment.Horizontal = ClosedXML.Excel.XLAlignmentHorizontalValues.Center;
                ws.Cell(rowNum, 1).Style.Font.Bold = true;
                ws.Cell(rowNum, 1).Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#F3F4F6"); // Light grey for numbers
                
                // Add soft borders for visual hierarchy
                ws.Range(rowNum, 1, rowNum, 10).Style.Border.BottomBorder = ClosedXML.Excel.XLBorderStyleValues.Thin;
                ws.Range(rowNum, 1, rowNum, 10).Style.Border.BottomBorderColor = ClosedXML.Excel.XLColor.FromHtml("#E5E7EB");
            }

            // Dropdown validation list for Priority (Low, Normal, High, Critical)
            var priorityVal = ws.Range(2, 5, 20, 5).CreateDataValidation();
            priorityVal.List("Low, Normal, High, Critical", true);
            priorityVal.ErrorTitle = "Invalid Priority";
            priorityVal.ErrorMessage = "Please select one: Low, Normal, High, Critical";

            // Dropdown validation list for Status
            var statusVal = ws.Range(2, 6, 20, 6).CreateDataValidation();
            statusVal.List("Unscheduled, Scheduled, InProgress, Completed, Cancelled, OnHold", true);
            statusVal.ErrorTitle = "Invalid Status";
            statusVal.ErrorMessage = "Please select one: Unscheduled, Scheduled, InProgress, Completed, Cancelled, OnHold";

            // Add Example Row at row 7
            ws.Cell(7, 1).Value = "Example";
            ws.Cell(7, 2).Value = "JOB-2026-001";
            ws.Cell(7, 3).Value = "Preventive Maintenance";
            ws.Cell(7, 4).Value = "[Example: Inspect hydraulic pressure valves]";
            ws.Cell(7, 5).Value = "High";
            ws.Cell(7, 6).Value = "Scheduled";
            ws.Cell(7, 7).Value = "CNC Lathe #1";
            ws.Cell(7, 8).Value = "mapalo1@gmail.com";
            ws.Cell(7, 9).Value = "2026-06-12 08:30";
            ws.Cell(7, 10).Value = "2026-06-12 12:00";

            var exampleRange = ws.Range(7, 1, 7, 10);
            exampleRange.Style.Font.Italic = true;
            exampleRange.Style.Font.FontColor = ClosedXML.Excel.XLColor.FromHtml("#4B5563");
            exampleRange.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#EFF6FF"); // Soft blue example shading
            exampleRange.Style.Border.BottomBorder = ClosedXML.Excel.XLBorderStyleValues.Thin;
            exampleRange.Style.Border.BottomBorderColor = ClosedXML.Excel.XLColor.FromHtml("#BFDBFE");

            // Auto-adjust column widths so nothing is truncated
            ws.Columns().AdjustToContents();

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }
    }
}

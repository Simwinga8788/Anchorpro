using System.Text;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;

namespace AnchorPro.Services
{
    public class ReportingService : IReportingService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly IDashboardService _dashboardService;
        private readonly IEmailService _emailService;
        private readonly ILogger<ReportingService> _logger;
        private readonly IWebHostEnvironment _env;
        private readonly ICurrentTenantService _tenantService;

        public ReportingService(
            IDbContextFactory<ApplicationDbContext> factory,
            IDashboardService dashboardService,
            IEmailService emailService,
            ILogger<ReportingService> logger,
            IWebHostEnvironment env,
            ICurrentTenantService tenantService)
        {
            _factory = factory;
            _dashboardService = dashboardService;
            _emailService = emailService;
            _logger = logger;
            _env = env;
            _tenantService = tenantService;
        }

        public async Task<List<ReportDefinition>> GetScheduledReportsAsync()
        {
            using var context = _factory.CreateDbContext();
            // We want to see all reports for the current tenant context?
            // Since this service might be used by UI (CurrentTenantService active) or Background (No tenant),
            // we rely on the DbContext's behavior or manual filtering.
            // For Background service, we'll need to disable the filter.
            return await context.ReportDefinitions
                .Include(r => r.Department)
                .ToListAsync();
        }

        public async Task SaveReportDefinitionAsync(ReportDefinition report)
        {
            using var context = _factory.CreateDbContext();
            
            // Calculate NextRun if not set
            if (report.NextRun == null)
            {
                report.NextRun = CalculateNextRun(report.CronSchedule);
            }

            if (report.Id == 0)
            {
                context.ReportDefinitions.Add(report);
            }
            else
            {
                context.ReportDefinitions.Update(report);
            }
            await context.SaveChangesAsync();
        }

        public async Task DeleteReportDefinitionAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var report = await context.ReportDefinitions.FindAsync(id);
            if (report != null)
            {
                context.ReportDefinitions.Remove(report);
                await context.SaveChangesAsync();
            }
        }

        public async Task ProcessDueReportsAsync()
        {
            using var context = _factory.CreateDbContext();
            
            // Need to ignore tenant filter to see ALL tenant reports
            context.IgnoreTenantFilter = true;

            var dueReports = await context.ReportDefinitions
                .Where(r => r.IsEnabled && r.NextRun <= DateTime.UtcNow)
                .ToListAsync();

            foreach (var report in dueReports)
            {
                try
                {
                    _logger.LogInformation("Processing report {ReportName} for Tenant {TenantId}", report.Name, report.TenantId);

                    // Generate Content
                    // We need to set the context for the dashboard service to the specific TENANT of the report
                    // But DashboardService uses _factory.CreateDbContext() internally which typically uses CurrentTenantService.
                    // This is tricky. We need a way to pass TenantId to DashboardService or set it.
                    // For now, I'll pass tenantId to GenerateReportHtmlAsync which will need to handle data fetching manually 
                    // or I'll assume DashboardService needs a "ForTenant(int id)" overload?
                    // Actually, DashboardService just does `using var context = _factory.CreateDbContext()`.
                    // We can modify DashboardService to accept an optional TenantId override or create a helper here.
                    
                    var html = await GenerateReportHtmlAsync(report.Type, report.TenantId, report.DepartmentId);
                    
                    if (string.IsNullOrEmpty(html)) {
                        _logger.LogWarning("Generated empty report for {ReportName}", report.Name);
                    }
                    else 
                    {
                        var recipients = report.Recipients.Split(',', StringSplitOptions.RemoveEmptyEntries);
                        var excelFile = await GenerateReportExcelAsync(report.Type, report.TenantId, report.DepartmentId);
                        
                        var attachments = new Dictionary<string, byte[]>();
                        if (excelFile != null && excelFile.Length > 0)
                        {
                            attachments.Add($"{report.Name.Replace(" ", "_")}_{DateTime.UtcNow:yyyyMMdd}.xlsx", excelFile);
                        }

                        foreach (var recipient in recipients)
                        {
                            await _emailService.SendEmailAsync(recipient.Trim(), $"[Anchor Pro] {report.Name}", html, attachments);
                        }
                    }

                    // Update Schedule
                    report.LastRun = DateTime.UtcNow;
                    report.NextRun = CalculateNextRun(report.CronSchedule);
                    context.ReportDefinitions.Update(report);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process report {ReportId}", report.Id);
                }
            }

            await context.SaveChangesAsync();
            await context.SaveChangesAsync();
        }

        public async Task RunReportAsync(int reportId)
        {
            using var context = _factory.CreateDbContext();
            context.IgnoreTenantFilter = true;
            
            var report = await context.ReportDefinitions.FindAsync(reportId);
            if (report == null || !report.IsEnabled) return;

            try 
            {
               var html = await GenerateReportHtmlAsync(report.Type, report.TenantId, report.DepartmentId);
               var excelFile = await GenerateReportExcelAsync(report.Type, report.TenantId, report.DepartmentId);
               
               var attachments = new Dictionary<string, byte[]>();
               var fileName = $"{report.Name.Replace(" ", "_")}_{DateTime.UtcNow:yyyyMMdd}.xlsx";

               if (excelFile != null && excelFile.Length > 0)
               {
                   // Save localized copy to wwwroot/admin-reports/ for verification
                   try 
                   {
                       var reportDir = Path.Combine(_env.WebRootPath, "admin-reports");
                       Directory.CreateDirectory(reportDir);
                       var filePath = Path.Combine(reportDir, fileName);
                       await File.WriteAllBytesAsync(filePath, excelFile);
                       _logger.LogInformation("Saved report locally to {Path}", filePath);
                   }
                   catch(Exception ex) 
                   {
                       _logger.LogError(ex, "Failed to save local report copy.");
                   }

                   // Attach Excel Directly
                   attachments.Add(fileName, excelFile);
               }

               if (!string.IsNullOrEmpty(html))
               {
                   // Add note about attachment
                   if (attachments.Count > 0)
                   {
                       html = html.Replace("</div>\r\n</body>", @"
                        <div style='margin: 20px 40px; padding: 15px; background-color: #e0f2fe; border: 1px solid #bae6fd; border-radius: 6px; color: #0369a1; font-size: 14px; text-align: center;'>
                            <strong>📎 Excel Report Attached:</strong> A detailed breakdown including the full job list is attached to this email.
                        </div>
                    </div>
                </div>
            </body>");
                   }

                   var recipients = report.Recipients.Split(',', StringSplitOptions.RemoveEmptyEntries);
                   foreach (var recipient in recipients)
                   {
                       await _emailService.SendEmailAsync(recipient.Trim(), $"[Anchor Pro] {report.Name} - {DateTime.UtcNow:MMM dd HH:mm}", html, attachments);
                   }
               }
               // We do NOT update LastRun for manual triggers to avoid messing up the schedule
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "Failed to run manual report {ReportId}", report.Id);
                 throw; // Rethrow to let UI catch it
            }
        }

        private DateTime CalculateNextRun(string schedule)
        {
            // MVP: Simple predefined schedules
            var now = DateTime.UtcNow;
            switch (schedule.ToLower())
            {
                case "daily": return now.AddDays(1);
                case "weekly": return now.AddDays(7);
                case "monthly": return now.AddMonths(1);
                default: return now.AddMonths(1); // Fallback
            }
        }

        public async Task<string> GenerateReportHtmlAsync(ReportType type, int? tenantId = null, int? departmentId = null)
        {
            // Fall back to the current HTTP-request tenant when not called from background scheduler
            tenantId ??= _tenantService.TenantId;

            using var context = _factory.CreateDbContext();
            context.IgnoreTenantFilter = true; // Use global access, then filter clause

            // Helper to get job cards for tenant/department
            IQueryable<JobCard> Jobs() 
            {
                var query = context.JobCards.Where(j => j.TenantId == tenantId);
                if (departmentId.HasValue)
                {
                    query = query.Where(j => j.Equipment != null && j.Equipment.DepartmentId == departmentId.Value);
                }
                return query;
            }
            
            var sb = new StringBuilder();
            string scopeName = "";
            if (departmentId.HasValue)
            {
                var dept = await context.Departments.FirstOrDefaultAsync(d => d.Id == departmentId.Value);
                scopeName = dept?.Name ?? "";
            }
            sb.Append(@"
     <html>
    <head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <style>
            /* Reset & Base */
            body, table, td, p, div { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #334155; line-height: 1.5; margin: 0; padding: 0; }
            body { background-color: #f1f5f9; padding: 20px 0; }
            h1, h2, h3, h4 { color: #0f172a; margin: 0; font-weight: 700; }
            
            /* Container */
            .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; }
            .content { max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            
            /* Header */
            .header { background-color: #0f172a; color: #ffffff; padding: 30px 40px; text-align: center; }
            .header h1 { color: #ffffff; font-size: 24px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { color: #94a3b8; font-size: 14px; }

            /* Sections */
            .section { padding: 30px 40px; border-bottom: 1px solid #e2e8f0; }
            .section-title { font-size: 18px; color: #334155; margin-bottom: 15px; display: flex; align-items: center; border-left: 4px solid #3b82f6; padding-left: 10px; }
            
            /* KPIs Grid - Using Table for Email Compatibility */
            .kpi-table { width: 100%; border-spacing: 0; }
            .kpi-cell { width: 25%; text-align: center; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
            .kpi-value { font-size: 28px; font-weight: 700; color: #3b82f6; display: block; margin-bottom: 4px; }
            .kpi-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
            .kpi-cell.alert .kpi-value { color: #ef4444; }
            .kpi-cell.success .kpi-value { color: #10b981; }

            /* Data Tables */
            .data-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px; }
            .data-table th { background-color: #f8fafc; color: #475569; text-align: left; padding: 10px 15px; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
            .data-table td { padding: 10px 15px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .data-table tr:last-child td { border-bottom: none; }
            
            /* Highlights/Badges */
            .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
            .badge-low { background: #dcfce7; color: #166534; }
            .badge-med { background: #fef9c3; color: #854d0e; }
            .badge-high { background: #fee2e2; color: #991b1b; }

            /* Footer */
            .footer { background-color: #f8fafc; padding: 30px 40px; text-align: center; font-size: 12px; color: #94a3b8; }
            .footer a { color: #3b82f6; text-decoration: none; }
            
            /* Utils */
            .text-right { text-align: right; }
            .text-danger { color: #ef4444; }
            .text-success { color: #10b981; }
            .mt-20 { margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class='wrapper'>
            <div class='content'>
");

            if (type == ReportType.MonthlyMaintenanceSummary)
            {
                var today = DateTime.UtcNow;
                var startDate = today.AddDays(-30);
                
                var jobs = await Jobs()
                    .Where(j => j.CreatedAt >= startDate)
                    .Include(j => j.JobType)
                    .Include(j => j.Equipment)
                    .Include(j => j.AssignedTechnician)
                    .ToListAsync();
                
                // KPIs
                var completed = jobs.Count(j => j.Status == JobStatus.Completed);
                var created = jobs.Count;
                var breakdownCount = jobs.Count(j => j.JobType?.Name.Contains("Corrective") == true || j.JobType?.Name.Contains("Emergency") == true || j.JobType?.Name.Contains("Breakdown") == true);
                var totalCost = jobs.Sum(j => j.LaborCost + j.PartsCost + j.DirectPurchaseCost + j.SubcontractingCost);
                var totalSubCost = jobs.Sum(j => j.SubcontractingCost);
                var totalDirectCost = jobs.Sum(j => j.DirectPurchaseCost);

                
                // Top Assets by Cost
                var topCostAssets = jobs
                    .Where(j => j.Equipment != null)
                    .GroupBy(j => j.Equipment!.Name)
                    .Select(g => new { 
                        Name = g.Key, 
                        Count = g.Count(), 
                        Cost = g.Sum(x => x.LaborCost + x.PartsCost + x.DirectPurchaseCost + x.SubcontractingCost) 
                    })
                    .OrderByDescending(x => x.Cost)
                    .Take(5)
                    .ToList();

                // Top Technicians
                var topTechs = jobs
                    .Where(j => j.AssignedTechnician != null && j.Status == JobStatus.Completed)
                    .GroupBy(j => j.AssignedTechnician!.UserName) // Using UserName as fallback for Name
                    .Select(g => new { Name = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToList();

                // Departmental Breakdown
                var deptSummary = await context.Departments
                    .Where(d => d.TenantId == tenantId)
                    .AsNoTracking()
                    .ToListAsync();
                
                var topDepts = jobs
                    .Where(j => j.Equipment != null && j.Equipment.DepartmentId.HasValue)
                    .GroupBy(j => j.Equipment!.DepartmentId!.Value)
                    .Select(g => {
                        var deptName = deptSummary.FirstOrDefault(d => d.Id == g.Key)?.Name ?? "Unassigned";
                        return new { 
                            Name = deptName, 
                            Count = g.Count(), 
                            Cost = g.Sum(x => x.LaborCost + x.PartsCost + x.DirectPurchaseCost + x.SubcontractingCost) 
                        };
                    })
                    .OrderByDescending(x => x.Cost)
                    .ToList();

                sb.Append($@"
                <!-- Header -->
                <div class='header'>
                    <h1>Executive Summary</h1>
                    {(string.IsNullOrEmpty(scopeName) ? "" : $"<p style='color:#3b82f6;font-weight:700;'>Department: {scopeName}</p>")}
                    <p>{startDate:MMMM dd} - {today:MMMM dd, yyyy}</p>
                </div>

                <!-- KPI Section -->
                <div class='section'>
                    <h3 class='section-title'>Operational Overview</h3>
                    <table class='kpi-table'>
                        <tr>
                            <td class='kpi-cell'>
                                <span class='kpi-value'>{created}</span>
                                <span class='kpi-label'>Total Jobs</span>
                            </td>
                            <td class='kpi-cell success'>
                                <span class='kpi-value'>{completed}</span>
                                <span class='kpi-label'>Completed</span>
                            </td>
                            <td class='kpi-cell {(breakdownCount > 0 ? "alert" : "")}'>
                                <span class='kpi-value'>{breakdownCount}</span>
                                <span class='kpi-label'>Breakdowns</span>
                            </td>
                            <td class='kpi-cell'>
                                <span class='kpi-value'>${totalSubCost:N0}</span>
                                <span class='kpi-label'>Subcontracted</span>
                            </td>
                            <td class='kpi-cell'>
                                <span class='kpi-value'>${totalCost:N0}</span>
                                <span class='kpi-label'>Total Spend</span>
                            </td>
                        </tr>
                    </table>
                </div>");

                sb.Append(@"
                <!-- Departmental Insights -->
                <div class='section'>
                    <h3 class='section-title'>Departmental Analysis</h3>
                    <table class='data-table'>
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th class='text-right'>Activity</th>
                                <th class='text-right'>Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>");

                if (topDepts.Any())
                {
                    foreach(var dept in topDepts)
                    {
                        sb.Append($@"
                            <tr>
                                <td style='font-weight:700;'>{dept.Name}</td>
                                <td class='text-right'>{dept.Count} Jobs</td>
                                <td class='text-right fw-bold'>${dept.Cost:N2}</td>
                            </tr>");
                    }
                }
                else
                {
                    sb.Append("<tr><td colspan='3' style='text-align:center;color:#94a3b8;'>No departmental data linked to items.</td></tr>");
                }

                sb.Append(@"
                        </tbody>
                    </table>
                </div>

                <!-- Financial Insights -->
                <div class='section'>
                    <h3 class='section-title'>Highest Cost Assets</h3>
                     <table class='data-table'>
                        <thead>
                            <tr>
                                <th>Asset Name</th>
                                <th class='text-right'>Jobs</th>
                                <th class='text-right'>Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>");
                
                if (topCostAssets.Any())
                {
                    foreach(var asset in topCostAssets)
                    {
                        sb.Append($@"
                            <tr>
                                <td>{asset.Name}</td>
                                <td class='text-right'>{asset.Count}</td>
                                <td class='text-right fw-bold'>${asset.Cost:N2}</td>
                            </tr>");
                    }
                }
                else
                {
                    sb.Append("<tr><td colspan='3' style='text-align:center;color:#94a3b8;'>No cost data available for this period.</td></tr>");
                }

                sb.Append(@"
                        </tbody>
                    </table>
                </div>

                <!-- Team Performance -->
                <div class='section'>
                    <h3 class='section-title'>Top Technicians</h3>
                    <table class='data-table'>
                        <thead>
                            <tr>
                                <th>Technician</th>
                                <th class='text-right'>Jobs Completed</th>
                                <th class='text-right'>Performance</th>
                            </tr>
                        </thead>
                        <tbody>");

                if (topTechs.Any())
                {
                    var maxJobs = topTechs.First().Count;
                    foreach(var tech in topTechs)
                    {
                        var width = (int)((double)tech.Count / maxJobs * 100);
                        sb.Append($@"
                            <tr>
                                <td>{tech.Name}</td>
                                <td class='text-right'>{tech.Count}</td>
                                <td width='40%'>
                                    <div style='background:#f1f5f9;border-radius:4px;height:8px;width:100%;'>
                                        <div style='background:#3b82f6;border-radius:4px;height:8px;width:{width}%'></div>
                                    </div>
                                </td>
                            </tr>");
                    }
                }
                else
                {
                     sb.Append("<tr><td colspan='3' style='text-align:center;color:#94a3b8;'>No completed jobs assigned to technicians properly.</td></tr>");
                }

                sb.Append(@"
                        </tbody>
                    </table>
                </div>
");
            }
            else if (type == ReportType.ProcurementSummary)
            {
                var today = DateTime.UtcNow;
                var startDate = today.AddDays(-30);

                var query = context.PurchaseOrders
                    .Where(p => p.TenantId == tenantId && p.OrderDate >= startDate);

                if (departmentId.HasValue)
                {
                    query = query.Where(p => p.DepartmentId == departmentId.Value);
                }

                var pos = await query
                    .Include(p => p.Supplier)
                    .Include(p => p.Items)
                    .ToListAsync();

                var totalPoAmount = pos.Sum(p => p.TotalAmount);
                var submittedCount = pos.Count(p => p.Status == PurchaseOrderStatus.Submitted);
                var receivedCount = pos.Count(p => p.Status == PurchaseOrderStatus.Received);
                var draftCount = pos.Count(p => p.Status == PurchaseOrderStatus.Draft);

                var topSuppliers = pos
                    .Where(p => p.Supplier != null)
                    .GroupBy(p => p.Supplier!.Name)
                    .Select(g => new { Name = g.Key, Amount = g.Sum(p => p.TotalAmount), Count = g.Count() })
                    .OrderByDescending(x => x.Amount)
                    .Take(5)
                    .ToList();

                sb.Append($@"
                <!-- Header -->
                <div class='header'>
                    <h1>Procurement Summary</h1>
                    {(string.IsNullOrEmpty(scopeName) ? "" : $"<p style='color:#3b82f6;font-weight:700;'>Department: {scopeName}</p>")}
                    <p>{startDate:MMMM dd} - {today:MMMM dd, yyyy}</p>
                </div>

                <!-- KPI Section -->
                <div class='section'>
                    <h3 class='section-title'>Financial Controls</h3>
                    <table class='kpi-table'>
                        <tr>
                            <td class='kpi-cell'>
                                <span class='kpi-value'>{pos.Count}</span>
                                <span class='kpi-label'>Total POs</span>
                            </td>
                            <td class='kpi-cell success'>
                                <span class='kpi-value'>ZMW {totalPoAmount:N0}</span>
                                <span class='kpi-label'>Total Spend</span>
                            </td>
                            <td class='kpi-cell'>
                                <span class='kpi-value'>{submittedCount}</span>
                                <span class='kpi-label'>Active POs</span>
                            </td>
                            <td class='kpi-cell'>
                                <span class='kpi-value'>{receivedCount}</span>
                                <span class='kpi-label'>Full Goods Rec.</span>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Supplier Breakdown -->
                <div class='section'>
                    <h3 class='section-title'>Vendor Exposure (Top 5)</h3>
                    <table class='data-table'>
                        <thead>
                            <tr>
                                <th>Supplier</th>
                                <th class='text-right'>Orders</th>
                                <th class='text-right'>Total Commitment</th>
                            </tr>
                        </thead>
                        <tbody>");

                if (topSuppliers.Any())
                {
                    foreach (var s in topSuppliers)
                    {
                        sb.Append($@"
                            <tr>
                                <td style='font-weight:700;'>{s.Name}</td>
                                <td class='text-right'>{s.Count} POs</td>
                                <td class='text-right fw-bold'>ZMW {s.Amount:N2}</td>
                            </tr>");
                    }
                }
                else
                {
                    sb.Append("<tr><td colspan='3' style='text-align:center;color:#94a3b8;'>No supplier transactions recorded in this period.</td></tr>");
                }

                sb.Append(@"
                        </tbody>
                    </table>
                </div>

                <!-- Status Breakdown -->
                <div class='section'>
                    <h3 class='section-title'>Order Pipeline Status</h3>
                    <table class='data-table'>
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th class='text-right'>Volume</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Draft (Awaiting Action)</td>
                                <td class='text-right'>{draftCount}</td>
                            </tr>
                            <tr>
                                <td>Submitted (Pending Delivery)</td>
                                <td class='text-right'>{submittedCount}</td>
                            </tr>
                            <tr>
                                <td>Completed (Fully Received)</td>
                                <td class='text-right'>{receivedCount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>");
            }
            else if (type == ReportType.DepartmentalAudit)
            {
                var today = DateTime.UtcNow;
                var startDate = today.AddDays(-30);

                var depts = await context.Departments
                    .Where(d => d.TenantId == tenantId)
                    .AsNoTracking()
                    .ToListAsync();

                var jobs = await Jobs()
                    .Where(j => j.CreatedAt >= startDate)
                    .Include(j => j.PermitToWork)
                    .Include(j => j.Equipment)
                    .ToListAsync();

                sb.Append($@"
                <!-- Header -->
                <div class='header'>
                    <h1>Departmental Audit</h1>
                    <p>{startDate:MMMM dd} - {today:MMMM dd, yyyy}</p>
                </div>

                <!-- Summary Section -->
                <div class='section'>
                    <h3 class='section-title'>Organizational Overview</h3>
                    <p>Cross-departmental performance review for {depts.Count} active units.</p>
                </div>

                <!-- Main Grid -->
                <div class='section'>
                    <table class='data-table'>
                        <thead>
                            <tr>
                                <th>Department Name</th>
                                <th class='text-right'>Activity</th>
                                <th class='text-right'>Total Spend</th>
                                <th class='text-right'>Safety Status</th>
                            </tr>
                        </thead>
                        <tbody>");

                foreach (var d in depts.OrderBy(x => x.Name))
                {
                    var deptJobs = jobs.Where(j => j.Equipment?.DepartmentId == d.Id).ToList();
                    var deptSpend = deptJobs.Sum(j => j.TotalCost);
                    var safetyFlags = deptJobs.Count(j => j.PermitToWork != null && j.PermitToWork.Status == PermitStatus.Suspended);

                    sb.Append($@"
                        <tr>
                            <td style='font-weight:700;'>{d.Name}</td>
                            <td class='text-right'>{deptJobs.Count} Jobs</td>
                            <td class='text-right'>ZMW {deptSpend:N2}</td>
                            <td class='text-right'>
                                <span class='badge {(safetyFlags > 0 ? "badge-high" : "badge-low")}'>
                                    {(safetyFlags > 0 ? $"{safetyFlags} INCIDENTS" : "SECURE")}
                                </span>
                            </td>
                        </tr>");
                }

                sb.Append(@"
                        </tbody>
                    </table>
                </div>");
            }

            sb.Append(@"
                <!-- Footer -->
                <div class='footer'>
                    <p>Generated by <strong>Anchor Pro Production Planning</strong> &bull; Automated Intelligence</p>
                    <p style='margin-top:10px;'>
                        <a href='#'>View full dashboard</a> &bull; <a href='#'>Manage preferences</a>
                    </p>
                    <p style='font-size:10px; margin-top:20px; color:#cbd5e1;'>
                        This message contains confidential information. If you are not the intended recipient, please delete it.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
");

            return sb.ToString();
        }
        public async Task<byte[]> GenerateReportExcelAsync(ReportType type, int? tenantId = null, int? departmentId = null)
        {
            // Fall back to the current HTTP-request tenant when not called from background scheduler
            tenantId ??= _tenantService.TenantId;

            using var context = _factory.CreateDbContext();
            context.IgnoreTenantFilter = true;

            using var workbook = new XLWorkbook();
            
            string scopeName = "";
            if (departmentId.HasValue)
            {
                var dept = await context.Departments.FirstOrDefaultAsync(d => d.Id == departmentId.Value);
                scopeName = dept?.Name ?? "";
            }
            
            // --- Sheet 1: Dashboard ---
            var dashboard = workbook.Worksheets.Add("Executive Dashboard");
            dashboard.TabColor = XLColor.AirForceBlue;
            dashboard.PageSetup.PageOrientation = XLPageOrientation.Landscape;
            dashboard.PageSetup.FitToPages(1, 1);

            if (type == ReportType.MonthlyMaintenanceSummary)
            {
                var today = DateTime.UtcNow;
                var startDate = today.AddDays(-30);
                
                var query = context.JobCards
                    .Where(j => j.TenantId == tenantId && j.CreatedAt >= startDate);
                
                if (departmentId.HasValue)
                {
                    query = query.Where(j => j.Equipment != null && j.Equipment.DepartmentId == departmentId.Value);
                }

                var jobs = await query
                    .Include(j => j.JobType)
                    .Include(j => j.Equipment)
                    .Include(j => j.AssignedTechnician)
                    .OrderByDescending(j => j.CreatedAt)
                    .ToListAsync();

                // KPIs Calculation
                var totalJobs = jobs.Count;
                var completedJobs = jobs.Count(j => j.Status == JobStatus.Completed);
                var openJobs = totalJobs - completedJobs;
                var totalCost = jobs.Sum(j => j.LaborCost + j.PartsCost + j.DirectPurchaseCost + j.SubcontractingCost);
                var totalSubCost = jobs.Sum(j => j.SubcontractingCost);

                var completionRate = totalJobs > 0 ? (double)completedJobs / totalJobs : 0;

                // --- HEADER SECTION ---
                dashboard.Cell("B2").Value = string.IsNullOrEmpty(scopeName) ? "MONTHLY MAINTENANCE REPORT" : $"MAINTENANCE REPORT: {scopeName.ToUpper()}";
                dashboard.Range("B2:K2").Merge().Style
                    .Font.SetFontSize(26)
                    .Font.SetBold(true)
                    .Font.SetFontColor(XLColor.AirForceBlue)
                    .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Left);

                dashboard.Cell("B3").Value = $"Reporting Period: {startDate:MMMM dd, yyyy} - {today:MMMM dd, yyyy}";
                dashboard.Range("B3:K3").Merge().Style
                    .Font.SetFontSize(12)
                    .Font.SetFontColor(XLColor.SlateGray)
                    .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Left);

                // --- KPI CARDS SECTION ---
                // Helper to create cards with simple text (RichText not supported in this version)
                void CreateCard(int row, int col, string title, string value, XLColor color, XLColor bgColor)
                {
                    // Card Container Range (no merge, just style)
                    var cardRange = dashboard.Range(row, col, row + 3, col + 2);
                    cardRange.Style
                        .Fill.SetBackgroundColor(bgColor) 
                        .Border.SetOutsideBorder(XLBorderStyleValues.Medium)
                        .Border.SetOutsideBorderColor(color);

                    // Title Area (Row 1 of card)
                    var titleRange = dashboard.Range(row, col, row, col + 2);
                    titleRange.Merge();
                    titleRange.Value = title.ToUpper();
                    titleRange.Style
                        .Font.SetFontSize(10)
                        .Font.SetBold(true)
                        .Font.SetFontColor(XLColor.DarkSlateGray)
                        .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                        .Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                        
                    // Value Area (Rows 2-3 of card)
                    var valueRange = dashboard.Range(row + 1, col, row + 2, col + 2);
                    valueRange.Merge();
                    valueRange.Value = value;
                    valueRange.Style
                        .Font.SetFontSize(24)
                        .Font.SetBold(true)
                        .Font.SetFontColor(color)
                        .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                        .Alignment.SetVertical(XLAlignmentVerticalValues.Center);

                    // Force row heights
                    dashboard.Row(row + 1).Height = 35; 
                    dashboard.Row(row + 2).Height = 35;
                }

                // 2x2 Grid Layout for better mobile visibility
                // Row 5
                CreateCard(5, 2, "TOTAL JOBS", totalJobs.ToString(), XLColor.DarkSlateGray, XLColor.FromHtml("#F8FAFC")); // B-D
                CreateCard(5, 6, "COMPLETED", completedJobs.ToString(), XLColor.Green, XLColor.FromHtml("#F0FDF4")); // F-H
                
                // Row 9 (immediately after)
                CreateCard(9, 2, "OPEN / PENDING", openJobs.ToString(), XLColor.Orange, XLColor.FromHtml("#FFF7ED")); // B-D
                CreateCard(9, 6, "SUBCONTRACTED", $"K{totalSubCost:N0}", XLColor.Purple, XLColor.FromHtml("#FAF5FF")); // F-H
                CreateCard(5, 10, "TOTAL SPEND", $"K{totalCost:N0}", XLColor.RoyalBlue, XLColor.FromHtml("#EFF6FF")); // J-L

                // --- TABLES SECTION ---
                int tableStartRow = 14; 
                
                // --- TABLE 1: HIGHEST COST ASSETS (LEFT) ---
                dashboard.Cell(tableStartRow, 2).Value = "Highest Cost Assets";
                dashboard.Range(tableStartRow, 2, tableStartRow, 4).Merge().Style
                    .Font.SetBold(true).Font.SetFontSize(14).Font.SetFontColor(XLColor.DarkSlateGray);
                
                var topAssets = jobs.Where(j => j.Equipment != null)
                    .GroupBy(j => j.Equipment!.Name)
                    .Select(g => new { Name = g.Key, Cost = g.Sum(j => j.LaborCost + j.PartsCost + j.DirectPurchaseCost + j.SubcontractingCost), Count = g.Count() })
                    .OrderByDescending(x => x.Cost)
                    .Take(8).ToList();

                var headerRow = tableStartRow + 2;
                dashboard.Cell(headerRow, 2).Value = "Asset Name";
                dashboard.Cell(headerRow, 3).Value = "Jobs";
                dashboard.Cell(headerRow, 4).Value = "Total Cost";
                dashboard.Range(headerRow, 2, headerRow, 4).Style.Font.Bold = true;
                dashboard.Range(headerRow, 2, headerRow, 4).Style.Fill.BackgroundColor = XLColor.LightGray;

                int assetRow = headerRow + 1;
                foreach(var asset in topAssets)
                {
                    dashboard.Cell(assetRow, 2).Value = asset.Name;
                    dashboard.Cell(assetRow, 3).Value = asset.Count;
                    dashboard.Cell(assetRow, 4).Value = asset.Cost;
                    dashboard.Cell(assetRow, 4).Style.NumberFormat.Format = "\"K\"#,##0";
                    assetRow++;
                }
                dashboard.Range(headerRow, 2, assetRow - 1, 4).Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                dashboard.Range(headerRow, 2, assetRow - 1, 4).Style.Border.OutsideBorder = XLBorderStyleValues.Medium;

                // --- TABLE 2: TECHNICIAN PERFORMANCE (RIGHT) ---
                dashboard.Cell(tableStartRow, 6).Value = "Technician Performance";
                dashboard.Range(tableStartRow, 6, tableStartRow, 8).Merge().Style
                    .Font.SetBold(true).Font.SetFontSize(14).Font.SetFontColor(XLColor.DarkSlateGray);

                var techStats = jobs.Where(j => j.AssignedTechnician != null)
                    .GroupBy(j => j.AssignedTechnician!.UserName)
                    .Select(g => new { 
                        Name = g.Key, 
                        Completed = g.Count(x => x.Status == JobStatus.Completed),
                        OnTime = g.Count(x => x.Status == JobStatus.Completed && x.ActualEndDate <= x.ScheduledEndDate),
                        TotalJobs = g.Count()
                    })
                    .OrderByDescending(x => x.Completed).Take(8).ToList();

                dashboard.Cell(headerRow, 6).Value = "Technician";
                dashboard.Cell(headerRow, 7).Value = "Done";
                dashboard.Cell(headerRow, 8).Value = "On-Time %";
                dashboard.Range(headerRow, 6, headerRow, 8).Style.Font.Bold = true;
                dashboard.Range(headerRow, 6, headerRow, 8).Style.Fill.BackgroundColor = XLColor.LightGray;

                int techRow = headerRow + 1;
                foreach(var tech in techStats)
                {
                    dashboard.Cell(techRow, 6).Value = tech.Name;
                    dashboard.Cell(techRow, 7).Value = tech.Completed;
                    double rate = tech.Completed > 0 ? (double)tech.OnTime / tech.Completed : 0;
                    dashboard.Cell(techRow, 8).Value = rate;
                    dashboard.Cell(techRow, 8).Style.NumberFormat.Format = "0%";
                    techRow++;
                }
                dashboard.Range(headerRow, 6, techRow - 1, 8).Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                dashboard.Range(headerRow, 6, techRow - 1, 8).Style.Border.OutsideBorder = XLBorderStyleValues.Medium;

                // --- COLUMN SIZING ---
                dashboard.Column(2).Width = 25; // Asset Name / Tech Name
                dashboard.Column(3).Width = 8;
                dashboard.Column(4).Width = 15;
                dashboard.Column(5).Width = 5; // Spacer
                dashboard.Column(6).Width = 25;
                dashboard.Column(7).Width = 8;
                dashboard.Column(8).Width = 12;

                // Hide gridlines
                dashboard.ShowGridLines = false;
                dashboard.PageSetup.FitToPages(1, 1);

                // --- Sheet 2: Data List ---
                var dataSheet = workbook.Worksheets.Add("Job Details");
                dataSheet.TabColor = XLColor.Gray;

                var headers = new[] { "Job #", "Title", "Type", "Status", "Priority", "Tech", "Asset", "Created", "Scheduled", "Completed", "Timeliness", "Labor", "Parts", "Total" };
                
                for (int i = 0; i < headers.Length; i++)
                {
                    dataSheet.Cell(1, i + 1).Value = headers[i];
                }
                
                var headerStyle = dataSheet.Range(1, 1, 1, headers.Length).Style;
                headerStyle.Font.Bold = true;
                headerStyle.Fill.BackgroundColor = XLColor.LightGray;
                dataSheet.SheetView.FreezeRows(1);

                int row = 2;
                foreach (var job in jobs)
                {
                    dataSheet.Cell(row, 1).Value = job.JobNumber;
                    dataSheet.Cell(row, 2).Value = job.Description?.Replace("\n", " ") ?? ""; // Changed from job.Name to job.Description
                    dataSheet.Cell(row, 3).Value = job.JobType?.Name ?? "-";
                    dataSheet.Cell(row, 4).Value = job.Status.ToString();
                    
                    // Color code status
                    if(job.Status == JobStatus.Completed) 
                    {
                        dataSheet.Cell(row, 4).Style.Font.FontColor = XLColor.Green;
                    }
                    else if(job.ScheduledEndDate < DateTime.UtcNow && job.Status != JobStatus.Completed && job.Status != JobStatus.Cancelled) // Adjusted condition
                    {
                         dataSheet.Cell(row, 4).Style.Font.FontColor = XLColor.Red;
                         dataSheet.Cell(row, 4).Value = job.Status + " (Overdue)";
                    }

                    dataSheet.Cell(row, 5).Value = job.Priority.ToString(); // Added Priority
                    dataSheet.Cell(row, 6).Value = job.AssignedTechnician?.UserName ?? "Unassigned";
                    dataSheet.Cell(row, 7).Value = job.Equipment?.Name ?? "-";
                    dataSheet.Cell(row, 8).Value = job.CreatedAt;
                    dataSheet.Cell(row, 9).Value = job.ScheduledStartDate; // Changed from ScheduledEndDate to ScheduledStartDate
                    dataSheet.Cell(row, 10).Value = job.ActualEndDate;
                    
                    // Timeliness calculation
                    string timeliness = "-";
                    if (job.Status == JobStatus.Completed && job.ActualEndDate.HasValue && job.ScheduledEndDate.HasValue)
                    {
                        timeliness = job.ActualEndDate <= job.ScheduledEndDate ? "On Time" : "Late";
                    }
                    dataSheet.Cell(row, 11).Value = timeliness; // Added Timeliness
                    if (timeliness == "Late") dataSheet.Cell(row, 11).Style.Font.FontColor = XLColor.Red;

                    dataSheet.Cell(row, 12).Value = job.LaborCost;
                    dataSheet.Cell(row, 12).Style.NumberFormat.Format = "\"K\"#,##0.00";

                    dataSheet.Cell(row, 13).Value = job.PartsCost;
                    dataSheet.Cell(row, 13).Style.NumberFormat.Format = "\"K\"#,##0.00";

                    dataSheet.Cell(row, 14).Value = job.LaborCost + job.PartsCost; // Changed to calculate total cost
                    dataSheet.Cell(row, 14).Style.NumberFormat.Format = "\"K\"#,##0.00";
                    
                    // Format Dates
                    dataSheet.Cell(row, 8).Style.DateFormat.Format = "yyyy-MM-dd";
                    dataSheet.Cell(row, 9).Style.DateFormat.Format = "yyyy-MM-dd";
                    dataSheet.Cell(row, 10).Style.DateFormat.Format = "yyyy-MM-dd";

                    row++;
                }

                dataSheet.Columns().AdjustToContents();
                dataSheet.Column(2).Width = 40; // Wider Descriptiontle column if auto-fit is too small or huge
                dataSheet.SheetView.FreezeRows(1);
            }
            else if (type == ReportType.ProcurementSummary)
            {
                var today = DateTime.UtcNow;
                var startDate = today.AddDays(-30);

                var query = context.PurchaseOrders
                    .Where(p => p.TenantId == tenantId && p.OrderDate >= startDate);

                if (departmentId.HasValue)
                {
                    query = query.Where(p => p.DepartmentId == departmentId.Value);
                }

                var pos = await query
                    .Include(p => p.Supplier)
                    .Include(p => p.Items)
                    .OrderByDescending(p => p.OrderDate)
                    .ToListAsync();

                // Dashboard
                dashboard.Cell("B2").Value = string.IsNullOrEmpty(scopeName) ? "PROCUREMENT SUMMARY REPORT" : $"PROCUREMENT REPORT: {scopeName.ToUpper()}";
                dashboard.Range("B2:K2").Merge().Style.Font.SetBold(true).Font.SetFontSize(22).Font.SetFontColor(XLColor.AirForceBlue);
                dashboard.Cell("B3").Value = $"Period: {startDate:yyyy-MM-dd} to {today:yyyy-MM-dd}";

                // KPIs
                var totalSpend = pos.Sum(p => p.TotalAmount);
                dashboard.Cell("B5").Value = "TOTAL SPEND";
                dashboard.Cell("B6").Value = totalSpend;
                dashboard.Cell("B6").Style.NumberFormat.Format = "\"K\"#,##0";
                dashboard.Cell("B6").Style.Font.SetBold(true).Font.SetFontSize(20);

                dashboard.Cell("E5").Value = "TOTAL POs";
                dashboard.Cell("E6").Value = pos.Count;
                dashboard.Cell("E6").Style.Font.SetBold(true).Font.SetFontSize(20);

                // Supplier Table
                var topSupps = pos.Where(p => p.Supplier != null)
                    .GroupBy(p => p.Supplier!.Name)
                    .Select(g => new { Name = g.Key, Amount = g.Sum(x => x.TotalAmount), Count = g.Count() })
                    .OrderByDescending(x => x.Amount).Take(10).ToList();

                dashboard.Cell(10, 2).Value = "Top Suppliers by Spend";
                dashboard.Range(10, 2, 10, 4).Merge().Style.Font.Bold = true;
                
                dashboard.Cell(11, 2).Value = "Supplier";
                dashboard.Cell(11, 3).Value = "Orders";
                dashboard.Cell(11, 4).Value = "Amount";
                dashboard.Range(11, 2, 11, 4).Style.Fill.BackgroundColor = XLColor.LightGray;

                int sRow = 12;
                foreach(var s in topSupps)
                {
                    dashboard.Cell(sRow, 2).Value = s.Name;
                    dashboard.Cell(sRow, 3).Value = s.Count;
                    dashboard.Cell(sRow, 4).Value = s.Amount;
                    dashboard.Cell(sRow, 4).Style.NumberFormat.Format = "\"K\"#,##0";
                    sRow++;
                }

                // Data List
                var dataSheet = workbook.Worksheets.Add("Order List");
                var headers = new[] { "PO #", "Date", "Supplier", "Status", "Items", "Total Amount", "Raised By" };
                for (int i = 0; i < headers.Length; i++) dataSheet.Cell(1, i + 1).Value = headers[i];
                dataSheet.Range(1, 1, 1, headers.Length).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);

                int row = 2;
                foreach(var po in pos)
                {
                    dataSheet.Cell(row, 1).Value = po.PoNumber;
                    dataSheet.Cell(row, 2).Value = po.OrderDate;
                    dataSheet.Cell(row, 3).Value = po.Supplier?.Name ?? "N/A";
                    dataSheet.Cell(row, 4).Value = po.Status.ToString();
                    dataSheet.Cell(row, 5).Value = po.Items.Count;
                    dataSheet.Cell(row, 6).Value = po.TotalAmount;
                    dataSheet.Cell(row, 6).Style.NumberFormat.Format = "\"K\"#,##0.00";
                    dataSheet.Cell(row, 7).Value = po.RaisedBy;
                    row++;
                }
                dataSheet.Columns().AdjustToContents();
            }
            else if (type == ReportType.DepartmentalAudit)
            {
                var today = DateTime.UtcNow;
                var startDate = today.AddDays(-30);

                var depts = await context.Departments
                    .Where(d => d.TenantId == tenantId)
                    .AsNoTracking()
                    .ToListAsync();

                var jobs = await context.JobCards
                    .Where(j => j.TenantId == tenantId && j.CreatedAt >= startDate)
                    .Include(j => j.PermitToWork)
                    .Include(j => j.Equipment)
                    .ToListAsync();

                dashboard.Cell("B2").Value = "DEPARTMENTAL AUDIT REPORT";
                dashboard.Range("B2:K2").Merge().Style.Font.SetBold(true).Font.SetFontSize(22).Font.SetFontColor(XLColor.AirForceBlue);
                dashboard.Cell("B3").Value = $"Period: {startDate:yyyy-MM-dd} to {today:yyyy-MM-dd}";

                dashboard.Cell(6, 2).Value = "Department";
                dashboard.Cell(6, 3).Value = "Job Activity";
                dashboard.Cell(6, 4).Value = "Total Spend";
                dashboard.Cell(6, 5).Value = "Safety Flags";
                dashboard.Range(6, 2, 6, 5).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);

                int row = 7;
                foreach(var d in depts.OrderBy(x => x.Name))
                {
                    var deptJobs = jobs.Where(j => j.Equipment?.DepartmentId == d.Id).ToList();
                    var deptSpend = deptJobs.Sum(j => j.TotalCost);
                    var safetyFlags = deptJobs.Count(j => j.PermitToWork != null && j.PermitToWork.Status == PermitStatus.Suspended);

                    dashboard.Cell(row, 2).Value = d.Name;
                    dashboard.Cell(row, 3).Value = deptJobs.Count;
                    dashboard.Cell(row, 4).Value = deptSpend;
                    dashboard.Cell(row, 4).Style.NumberFormat.Format = "\"K\"#,##0.00";
                    dashboard.Cell(row, 5).Value = safetyFlags;
                    
                    if (safetyFlags > 0) dashboard.Cell(row, 5).Style.Font.FontColor = XLColor.Red;
                    row++;
                }
                dashboard.Columns().AdjustToContents();
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();
            _logger.LogInformation("Generated Excel report. Size: {Size} bytes", content.Length);
            return content;
        }
    }
}

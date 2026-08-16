using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class ShiftProductionLogService(
        IDbContextFactory<ApplicationDbContext> factory, 
        IEmailService emailService, 
        ISettingsService settingsService) : IShiftProductionLogService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory = factory;
        private readonly IEmailService _emailService = emailService;
        private readonly ISettingsService _settingsService = settingsService;

        public async Task<List<ShiftProductionLog>> GetAllAsync()
        {
            using var ctx = _factory.CreateDbContext();
            return await ctx.ShiftProductionLogs
                .Include(s => s.Equipment)
                .Include(s => s.CostEntries)
                .Include(s => s.Resources).ThenInclude(r => r.Operator)
                .Include(s => s.Resources).ThenInclude(r => r.Equipment)
                .AsNoTracking()
                .OrderByDescending(s => s.ShiftDate)
                .ThenBy(s => s.Shift)
                .ToListAsync();
        }

        public async Task<ShiftProductionLog?> GetByIdAsync(int id)
        {
            using var ctx = _factory.CreateDbContext();
            return await ctx.ShiftProductionLogs
                .Include(s => s.Equipment)
                .Include(s => s.CostEntries)
                .Include(s => s.Resources).ThenInclude(r => r.Operator)
                .Include(s => s.Resources).ThenInclude(r => r.Equipment)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<ShiftProductionLog> CreateAsync(ShiftProductionLog log, string userId)
        {
            using var ctx = _factory.CreateDbContext();

            // Auto-generate log number: SPL-YYYYMM-NNNN
            var count = await ctx.ShiftProductionLogs.CountAsync();
            log.LogNumber = $"SPL-{DateTime.UtcNow:yyyyMM}-{count + 1:D4}";
            log.Status    = ShiftLogStatus.Draft;
            log.CreatedAt = DateTime.UtcNow;
            log.CreatedBy = userId;

            ctx.ShiftProductionLogs.Add(log);
            await ctx.SaveChangesAsync();
            return log;
        }

        public async Task UpdateAsync(ShiftProductionLog log, string userId)
        {
            using var ctx = _factory.CreateDbContext();
            var existing = await ctx.ShiftProductionLogs
                .Include(s => s.Resources)
                .FirstOrDefaultAsync(s => s.Id == log.Id)
                ?? throw new KeyNotFoundException($"ShiftProductionLog {log.Id} not found.");

            if (existing.Status != ShiftLogStatus.Draft)
                throw new InvalidOperationException("Only Draft shift logs can be edited.");

            existing.ShiftDate           = log.ShiftDate;
            existing.Shift               = log.Shift;
            existing.EquipmentId         = log.EquipmentId;
            existing.QuantityProduced    = log.QuantityProduced;
            existing.TargetQuantity      = log.TargetQuantity;
            existing.UnitOfMeasure       = log.UnitOfMeasure;
            existing.FuelConsumedLitres  = log.FuelConsumedLitres;
            existing.OperatingHours      = log.OperatingHours;
            existing.DowntimeHours       = log.DowntimeHours;
            existing.OperatorName        = log.OperatorName;
            existing.SupervisorName      = log.SupervisorName;
            existing.CrewCount           = log.CrewCount;
            existing.Location            = log.Location;
            existing.ActivityType        = log.ActivityType;
            existing.OperationActivity   = log.OperationActivity;
            existing.Material            = log.Material;
            existing.SourceLocation      = log.SourceLocation;
            existing.DestinationLocation = log.DestinationLocation;
            existing.ClientContractId    = log.ClientContractId;
            existing.ContractorContractId = log.ContractorContractId;
            existing.Remarks             = log.Remarks;
            existing.UpdatedAt           = DateTime.UtcNow;
            existing.UpdatedBy           = userId;

            // Sync Resources
            ctx.ShiftResources.RemoveRange(existing.Resources);
            if (log.Resources != null)
            {
                foreach (var r in log.Resources)
                {
                    r.Id = 0; // ensure EF treats it as new
                    existing.Resources.Add(r);
                }
            }

            await ctx.SaveChangesAsync();
        }

        public async Task SubmitForApprovalAsync(int id, string userId)
        {
            using var ctx = _factory.CreateDbContext();
            var log = await ctx.ShiftProductionLogs.FindAsync(id)
                ?? throw new KeyNotFoundException($"ShiftProductionLog {id} not found.");

            if (log.Status != ShiftLogStatus.Draft)
                throw new InvalidOperationException("Only Draft shift logs can be submitted.");

            log.Status    = ShiftLogStatus.Submitted;
            log.UpdatedAt = DateTime.UtcNow;
            log.UpdatedBy = userId;
            await ctx.SaveChangesAsync();
        }

        public async Task ApproveAsync(int id, string approvedByUserId)
        {
            using var ctx = _factory.CreateDbContext();
            var log = await ctx.ShiftProductionLogs.FindAsync(id)
                ?? throw new KeyNotFoundException($"ShiftProductionLog {id} not found.");

            if (log.Status != ShiftLogStatus.Submitted)
                throw new InvalidOperationException("Only Submitted shift logs can be approved.");

            log.Status      = ShiftLogStatus.Approved;
            log.ApprovedBy  = approvedByUserId;
            log.ApprovedAt  = DateTime.UtcNow;
            log.UpdatedAt   = DateTime.UtcNow;
            log.UpdatedBy   = approvedByUserId;
            await ctx.SaveChangesAsync();

            // Fire off the automated email in the background without blocking the request
            _ = Task.Run(() => GenerateAndSendDailyLogEmailAsync(id));
        }

        private async Task GenerateAndSendDailyLogEmailAsync(int id)
        {
            try
            {
                using var ctx = _factory.CreateDbContext();
                var log = await ctx.ShiftProductionLogs
                    .Include(s => s.Resources).ThenInclude(r => r.Operator)
                    .Include(s => s.Resources).ThenInclude(r => r.Equipment)
                    .Include(s => s.Project).ThenInclude(p => p.Manager)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (log == null) return;

                // Build recipient list dynamically based on project/department
                var recipients = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                // 1. Add Project Manager (if applicable)
                if (!string.IsNullOrWhiteSpace(log.Project?.Manager?.Email))
                {
                    recipients.Add(log.Project.Manager.Email);
                }

                // 2. Add Global fallback/CC list
                var globalRecipientsStr = await _settingsService.GetGlobalSettingAsync("DailyReportRecipients", "");
                if (!string.IsNullOrWhiteSpace(globalRecipientsStr))
                {
                    foreach (var email in globalRecipientsStr.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    {
                        var trimmed = email.Trim();
                        if (!string.IsNullOrEmpty(trimmed)) recipients.Add(trimmed);
                    }
                }

                if (!recipients.Any()) return; // No one to send to

                // 1. Build HTML Email
                var sb = new System.Text.StringBuilder();
                sb.Append($@"
                    <html>
                    <head>
                        <style>
                            body {{ font-family: Arial, sans-serif; color: #333; }}
                            .header {{ background-color: #f8fafc; padding: 20px; border-bottom: 2px solid #3b82f6; }}
                            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                            th, td {{ border: 1px solid #e2e8f0; padding: 10px; text-align: left; }}
                            th {{ background-color: #f1f5f9; }}
                        </style>
                    </head>
                    <body>
                        <div class='header'>
                            <h2>Daily Shift Log: {log.LogNumber}</h2>
                            <p><strong>Date:</strong> {log.ShiftDate.ToShortDateString()}</p>
                            <p><strong>Supervisor:</strong> {log.SupervisorName}</p>
                            <p><strong>Status:</strong> Approved</p>
                        </div>
                        <h3>Executed Tasks</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Task / Role</th>
                                    <th>Operator</th>
                                    <th>Equipment</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody>");

                // 2. Build CSV Attachment Content concurrently
                var csv = new System.Text.StringBuilder();
                csv.AppendLine("Task/Role,Operator,Equipment,Quantity,Unit");

                foreach (var res in log.Resources)
                {
                    var operatorName = res.Operator != null ? $"{res.Operator.FirstName} {res.Operator.LastName}".Trim() : "N/A";
                    var equipmentName = res.Equipment?.Name ?? "N/A";
                    
                    sb.Append($@"
                                <tr>
                                    <td>{res.Role}</td>
                                    <td>{operatorName}</td>
                                    <td>{equipmentName}</td>
                                    <td>{res.ActualQuantity} {res.QuantityUnit}</td>
                                </tr>");
                                
                    // Sanitize CSV fields
                    var safeRole = res.Role?.Replace(",", "") ?? "";
                    csv.AppendLine($"{safeRole},{operatorName.Replace(",", "")},{equipmentName.Replace(",", "")},{res.ActualQuantity},{res.QuantityUnit}");
                }

                sb.Append(@"
                            </tbody>
                        </table>
                        <p style='margin-top:20px; font-size:12px; color:#64748b;'>This is an automated report from Anchor Pro.</p>
                    </body>
                    </html>");

                // 3. Prepare Attachments
                var attachments = new Dictionary<string, byte[]>
                {
                    { $"DailyLog_{log.LogNumber}_{log.ShiftDate:yyyyMMdd}.csv", System.Text.Encoding.UTF8.GetBytes(csv.ToString()) }
                };

                // 4. Send Emails
                foreach (var recipient in recipients)
                {
                    await _emailService.SendEmailAsync(
                        recipient, 
                        $"[Anchor Pro] Daily Log Approved - {log.LogNumber}", 
                        sb.ToString(), 
                        attachments
                    );
                }
            }
            catch (Exception ex)
            {
                // In production you would use an ILogger here
                Console.WriteLine($"Error sending daily log email: {ex.Message}");
            }
        }

        public async Task RejectAsync(int id, string reason, string userId)
        {
            using var ctx = _factory.CreateDbContext();
            var log = await ctx.ShiftProductionLogs.FindAsync(id)
                ?? throw new KeyNotFoundException($"ShiftProductionLog {id} not found.");

            log.Status          = ShiftLogStatus.Rejected;
            log.RejectionReason = reason;
            log.UpdatedAt       = DateTime.UtcNow;
            log.UpdatedBy       = userId;
            await ctx.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            using var ctx = _factory.CreateDbContext();
            var log = await ctx.ShiftProductionLogs.FindAsync(id)
                ?? throw new KeyNotFoundException($"ShiftProductionLog {id} not found.");

            if (log.Status == ShiftLogStatus.Approved)
                throw new InvalidOperationException("Approved shift logs cannot be deleted.");

            ctx.ShiftProductionLogs.Remove(log);
            await ctx.SaveChangesAsync();
        }

        public async Task<ShiftProductionLog> GenerateDailyLogAsync(DateTime date, string userId)
        {
            using var ctx = _factory.CreateDbContext();
            
            // 1. Get all JobCards scheduled/completed for this date
            var completedJobs = await ctx.JobCards
                .Where(j => j.ScheduledStartDate.HasValue && j.ScheduledStartDate.Value.Date == date.Date && j.Status == JobStatus.Completed)
                .Include(j => j.Equipment)
                .ToListAsync();

            if (!completedJobs.Any())
                throw new InvalidOperationException($"No completed job cards found for date {date.ToShortDateString()}.");

            // 2. Aggregate into a Daily Log
            var count = await ctx.ShiftProductionLogs.CountAsync();
            var log = new ShiftProductionLog
            {
                LogNumber        = $"SPL-{DateTime.UtcNow:yyyyMM}-{count + 1:D4}",
                ShiftDate        = date,
                Shift            = ShiftType.Day,
                Status           = ShiftLogStatus.Draft,
                SupervisorName   = "System Generated",
                UnitOfMeasure    = "Tasks",
                CreatedAt        = DateTime.UtcNow,
                CreatedBy        = userId,
                Remarks          = $"Auto-generated daily log from {completedJobs.Count} completed tasks.",
                Resources        = new List<ShiftResource>()
            };

            foreach (var job in completedJobs)
            {
                log.Resources.Add(new ShiftResource
                {
                    EquipmentId     = job.EquipmentId,
                    OperatorId      = job.AssignedTechnicianId,
                    Role            = job.Description,
                    ActualQuantity  = 1,
                    QuantityUnit    = "Task",
                });
            }

            ctx.ShiftProductionLogs.Add(log);
            await ctx.SaveChangesAsync();
            return log;
        }

        public async Task<List<ShiftProductionLog>> GetByEquipmentAsync(int equipmentId)
        {
            using var ctx = _factory.CreateDbContext();
            return await ctx.ShiftProductionLogs
                .Where(s => s.EquipmentId == equipmentId)
                .Include(s => s.Equipment)
                .AsNoTracking()
                .OrderByDescending(s => s.ShiftDate)
                .ToListAsync();
        }

        public async Task<ShiftProductionSummary> GetSummaryAsync(DateTime from, DateTime to)
        {
            using var ctx = _factory.CreateDbContext();
            var logs = await ctx.ShiftProductionLogs
                .Where(s => s.Status != ShiftLogStatus.Rejected
                         && s.ShiftDate >= from
                         && s.ShiftDate <= to)
                .Include(s => s.CostEntries)
                .AsNoTracking()
                .ToListAsync();

            var totalQty          = logs.Sum(l => l.QuantityProduced);
            var totalTarget       = logs.Sum(l => l.TargetQuantity ?? 0);
            var totalFuel         = logs.Sum(l => l.FuelConsumedLitres);
            var totalOpHours      = logs.Sum(l => l.OperatingHours);
            var totalDowntime     = logs.Sum(l => l.DowntimeHours);
            var totalCost         = logs.SelectMany(l => l.CostEntries).Sum(c => c.Amount);
            var unitOfMeasure     = logs.FirstOrDefault()?.UnitOfMeasure ?? "Units";
            var costPerUnit       = totalQty > 0 ? totalCost / totalQty : 0;

            return new ShiftProductionSummary(
                totalQty, totalTarget, unitOfMeasure, totalFuel,
                totalOpHours, totalDowntime, logs.Count, costPerUnit
            );
        }

        public async Task<List<ShiftProductionLog>> GetUnbilledAsync()
        {
            using var ctx = _factory.CreateDbContext();
            return await ctx.ShiftProductionLogs
                .Where(s => s.Status == ShiftLogStatus.Approved && s.InvoiceId == null)
                .Include(s => s.Equipment)
                .AsNoTracking()
                .OrderByDescending(s => s.ShiftDate)
                .ToListAsync();
        }
        public async Task<List<ShiftProductionChartData>> GetChartDataAsync(int days)
        {
            using var ctx = _factory.CreateDbContext();
            var fromDate = DateTime.UtcNow.Date.AddDays(-days);

            var logs = await ctx.ShiftProductionLogs
                .Where(s => s.Status != ShiftLogStatus.Rejected && s.ShiftDate >= fromDate)
                .AsNoTracking()
                .ToListAsync();

            var chartData = logs
                .GroupBy(l => l.ShiftDate.Date)
                .OrderBy(g => g.Key)
                .Select(g => new ShiftProductionChartData(
                    g.Key.ToString("MMM dd"),
                    g.Sum(l => l.QuantityProduced),
                    g.Sum(l => l.TargetQuantity ?? 0)
                ))
                .ToList();

            return chartData;
        }
    }
}

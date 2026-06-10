using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class JobCardService : IJobCardService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly IInventoryService _inventoryService;
        private readonly IEmailService _emailService;
        private readonly ISettingsService _settingsService;

        public JobCardService(IDbContextFactory<ApplicationDbContext> factory, IInventoryService inventoryService, IEmailService emailService, ISettingsService settingsService)
        {
            _factory = factory;
            _inventoryService = inventoryService;
            _emailService = emailService;
            _settingsService = settingsService;
        }

        public async Task<List<JobCard>> GetAllJobCardsAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.JobCards
                .Include(j => j.Equipment)
                .Include(j => j.JobType)
                .Include(j => j.AssignedTechnician)
                .OrderByDescending(j => j.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<JobCard?> GetJobCardByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.JobCards
                .Include(j => j.Equipment)
                .Include(j => j.JobType)
                .Include(j => j.Customer)
                .Include(j => j.Contract)
                .Include(j => j.AssignedTechnician)
                .Include(j => j.JobTasks)
                    .ThenInclude(t => t.DowntimeEntries)
                    .ThenInclude(d => d.DowntimeCategory)
                .Include(j => j.JobCardParts)
                    .ThenInclude(p => p.InventoryItem)
                .Include(j => j.JobAttachments)
                .Include(j => j.PermitToWork)
                .FirstOrDefaultAsync(j => j.Id == id);
        }

        public async Task<List<JobCard>> GetJobCardsByTechnicianAsync(string technicianId)
        {
            using var context = _factory.CreateDbContext();
            return await context.JobCards
                .Where(j => j.AssignedTechnicianId == technicianId)
                .Include(j => j.Equipment)
                .Include(j => j.JobType)
                .Include(j => j.JobTasks)
                .OrderByDescending(j => j.ScheduledStartDate)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task CreateJobCardAsync(JobCard jobCard, string userId)
        {
            using var context = _factory.CreateDbContext();

            var user = await context.Users.FindAsync(userId);
            jobCard.TenantId = user?.TenantId;

            jobCard.CreatedAt = DateTime.UtcNow;
            jobCard.CreatedBy = userId;
            jobCard.Status = JobStatus.Unscheduled; // Default status

            if (jobCard.ScheduledStartDate.HasValue)
            {
                jobCard.Status = JobStatus.Scheduled;
            }

            if (string.IsNullOrWhiteSpace(jobCard.JobNumber) || jobCard.JobNumber.StartsWith("JOB-"))
            {
                // Find all job cards for this tenant
                var tenantJobNumbers = await context.JobCards
                    .Where(j => j.TenantId == jobCard.TenantId)
                    .Select(j => j.JobNumber)
                    .ToListAsync();

                int maxNum = 1000;
                foreach (var numStr in tenantJobNumbers)
                {
                    if (int.TryParse(numStr, out int parsed))
                    {
                        if (parsed > maxNum)
                        {
                            maxNum = parsed;
                        }
                    }
                }
                jobCard.JobNumber = (maxNum + 1).ToString();
            }
            else
            {
                // Strict uniqueness for custom numbers
                var duplicateExists = await context.JobCards
                    .AnyAsync(j => j.TenantId == jobCard.TenantId && j.JobNumber == jobCard.JobNumber.Trim());
                if (duplicateExists)
                {
                    throw new InvalidOperationException($"Job number '{jobCard.JobNumber}' is already in use for this tenant.");
                }
                jobCard.JobNumber = jobCard.JobNumber.Trim();
            }

            context.JobCards.Add(jobCard);
            await context.SaveChangesAsync();
        }

        public async Task UpdateJobCardAsync(JobCard jobCard, string userId)
        {
            using var context = _factory.CreateDbContext();
            var existing = await context.JobCards.FindAsync(jobCard.Id);

            if (existing != null)
            {
                if (!string.IsNullOrWhiteSpace(jobCard.JobNumber))
                {
                    var trimmedNum = jobCard.JobNumber.Trim();
                    if (existing.JobNumber != trimmedNum)
                    {
                        var duplicateExists = await context.JobCards
                            .AnyAsync(j => j.TenantId == existing.TenantId && j.JobNumber == trimmedNum && j.Id != jobCard.Id);
                        if (duplicateExists)
                        {
                            throw new InvalidOperationException($"Job number '{jobCard.JobNumber}' is already in use for this tenant.");
                        }
                    }
                    existing.JobNumber = trimmedNum;
                }

                existing.Description = jobCard.Description;
                existing.EquipmentId = jobCard.EquipmentId;
                existing.JobTypeId = jobCard.JobTypeId;
                existing.CustomerId = jobCard.CustomerId;
                existing.ContractId = jobCard.ContractId;
                existing.Priority = jobCard.Priority;
                existing.ScheduledStartDate = jobCard.ScheduledStartDate;
                existing.ScheduledEndDate = jobCard.ScheduledEndDate;
                existing.AssignedTechnicianId = jobCard.AssignedTechnicianId;
                existing.InvoiceAmount = jobCard.InvoiceAmount;

                // Logic: If transitioning from Unscheduled to having a date, update status
                if (existing.Status == JobStatus.Unscheduled && jobCard.ScheduledStartDate.HasValue)
                {
                    existing.Status = JobStatus.Scheduled;
                }

                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;

                await context.SaveChangesAsync();
            }
        }

        public async Task UpdateJobStatusAsync(int jobCardId, JobStatus status, string userId)
        {
            using var context = _factory.CreateDbContext();
            var job = await context.JobCards
                .Include(j => j.JobTasks)
                .Include(j => j.JobCardParts)
                    .ThenInclude(p => p.InventoryItem)
                .FirstOrDefaultAsync(j => j.Id == jobCardId);

            if (job != null)
            {
                // Validation: Cannot complete if tasks are pending
                if (status == JobStatus.Completed && job.JobTasks.Any(t => !t.IsCompleted))
                {
                    throw new InvalidOperationException("All tasks must be completed before finishing the job.");
                }

                // Logic: Set Actual timestamps
                if ((status == JobStatus.InProgress || status == JobStatus.Completed) && !job.ActualStartDate.HasValue)
                {
                    job.ActualStartDate = DateTime.UtcNow;
                }
                
                if (status == JobStatus.Completed && !job.ActualEndDate.HasValue)
                {
                    job.ActualEndDate = DateTime.UtcNow;

                    // 1. Calculate Parts Cost using ONLY issued parts (Using Snapshots)
                    decimal totalPartsCost = 0;
                    if (job.JobCardParts != null)
                    {
                        foreach (var part in job.JobCardParts.Where(p => p.IsIssued))
                        {
                            // Use snapshot for calculation to preserve historical data
                            totalPartsCost += (part.UnitCostSnapshot * part.QuantityUsed);
                        }
                    }

                    // 2. Calculate Labor Cost (Fetching Tech Rate)
                    var technician = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == job.AssignedTechnicianId);
                    decimal techRate = technician?.HourlyRate ?? 500.00m; 

                    // Use ActualStartDate only — ScheduledStartDate is a planning date and must NOT
                    // be used as the labor clock start (it could be days in the past).
                    // If somehow ActualStartDate is missing, cap labor at a minimum of 0.25h.
                    double grossDurationHours = 0.25;
                    if (job.ActualStartDate.HasValue)
                    {
                        grossDurationHours = Math.Max(0.25, (DateTime.UtcNow - job.ActualStartDate.Value).TotalHours);
                    }

                    // 1.1 Job Duration (Net Processing Time) — subtract logged downtime
                    var totalDowntimeMins = job.JobTasks.SelectMany(t => t.DowntimeEntries).Sum(d => d.DurationMinutes);
                    var netDurationHours = Math.Max(0.25, grossDurationHours - (totalDowntimeMins / 60.0));

                    decimal laborCost = (decimal)netDurationHours * techRate;

                    // 2.5 — Aggregate external costs from linked Received POs, split by type
                    var jobDirectPurchaseCost = await context.PurchaseOrders
                        .Where(p => p.JobCardId == job.Id 
                                 && p.PoType == PurchaseOrderType.DirectPurchase
                                 && p.Status == PurchaseOrderStatus.Received)
                        .SumAsync(p => p.TotalAmount);

                    var jobSubcontractingCost = await context.PurchaseOrders
                        .Where(p => p.JobCardId == job.Id 
                                 && p.PoType == PurchaseOrderType.Subcontracting
                                 && p.Status == PurchaseOrderStatus.Received)
                        .SumAsync(p => p.TotalAmount);

                    // 3. Update Financials — four buckets, one clean snapshot
                    job.PartsCost          = Math.Round(totalPartsCost, 2);
                    job.LaborCost          = Math.Round(laborCost, 2);
                    job.DirectPurchaseCost = Math.Round(jobDirectPurchaseCost, 2);
                    job.SubcontractingCost = Math.Round(jobSubcontractingCost, 2);
                    job.TotalCost          = Math.Round(job.LaborCost + job.PartsCost + job.DirectPurchaseCost + job.SubcontractingCost, 2);

                    // For now, auto-set InvoiceAmount to 1.35x TotalCost if not set
                    if (job.InvoiceAmount == 0)
                    {
                        job.InvoiceAmount = Math.Round(job.TotalCost * 1.35m, 2);
                    }

                    job.Profit = job.InvoiceAmount - job.TotalCost;
                    if (job.InvoiceAmount > 0)
                    {
                        job.ProfitMarginPercent = Math.Round((job.Profit / job.InvoiceAmount) * 100, 2);
                    }

                    // Notify Supervisor (Check Settings)
                    bool notifyCompletion = true;
                    var setting = await _settingsService.GetSettingAsync("Notify.JobCompletion");
                    if (setting?.ToLower() == "false") notifyCompletion = false;

                    if (notifyCompletion)
                    {
                        try 
                        {
                            await _emailService.SendEmailAsync(
                                "supervisor@anchorpro.com",
                                $"Job Completed: #{job.JobNumber}",
                                $"Job #{job.JobNumber} has been completed by the technician."
                            );
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Warning: Failed to send completion email: {ex.Message}");
                        }
                    }
                }

                var oldStatus = job.Status;
                job.Status = status;
                job.UpdatedAt = DateTime.UtcNow;
                job.UpdatedBy = userId;

                if (oldStatus != status)
                {
                    context.SystemAuditLogs.Add(new SystemAuditLog
                    {
                        Action = $"JobStatusChange_{job.Id}",
                        Module = "JobCards",
                        ChangedBy = userId,
                        OldValue = oldStatus.ToString(),
                        NewValue = status.ToString(),
                        Timestamp = DateTime.UtcNow,
                        TenantId = job.TenantId
                    });
                }

                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteJobCardAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var job = await context.JobCards.FindAsync(id);
            if (job != null)
            {
                context.JobCards.Remove(job);
                await context.SaveChangesAsync();
            }
        }

        public async Task<List<SystemAuditLog>> GetJobHistoryAsync(int jobCardId)
        {
            using var context = _factory.CreateDbContext();
            return await context.SystemAuditLogs
                .Where(log => log.Module == "JobCards" && log.Action == $"JobStatusChange_{jobCardId}")
                .OrderByDescending(log => log.Timestamp)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task AssignTechnicianAsync(int jobCardId, string? technicianId, DateTime? scheduledStart = null, DateTime? scheduledEnd = null)
        {
            using var context = _factory.CreateDbContext();
            var job = await context.JobCards.FindAsync(jobCardId);
            if (job != null)
            {
                job.AssignedTechnicianId = technicianId;

                if (scheduledStart.HasValue)
                {
                    job.ScheduledStartDate = scheduledStart.Value;
                }
                else if (!job.ScheduledStartDate.HasValue)
                {
                    job.ScheduledStartDate = DateTime.UtcNow;
                }

                if (scheduledEnd.HasValue)
                {
                    job.ScheduledEndDate = scheduledEnd.Value;
                }

                job.Status = JobStatus.Scheduled;

                // Notify Technician (Check Settings)
                bool notifyAssignment = true;
                var setting = await _settingsService.GetSettingAsync("Notify.JobAssignment");
                if (setting?.ToLower() == "false") notifyAssignment = false;

                if (notifyAssignment)
                {
                    try
                    {
                        await _emailService.SendEmailAsync(
                            "technician@anchorpro.com",
                            $"Job Assigned: #{job.JobNumber}",
                            $"You have been assigned to Job #{job.JobNumber}. Check your task list."
                        );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Warning: Failed to send assignment email: {ex.Message}");
                    }
                }

                await context.SaveChangesAsync();
            }
        }

        public async Task<AnchorPro.Data.Models.SchedulingConflict> CheckScheduleConflictsAsync(int jobCardId, string technicianId, DateTime startDate, DateTime? endDate)
        {
            using var context = _factory.CreateDbContext();

            // Assume 1 hour default duration if no end date provided for check
            var end = endDate ?? startDate.AddHours(1);

            // Find overlapping jobs for this technician
            // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
            var conflictingJobs = await context.JobCards
                .Where(j => j.AssignedTechnicianId == technicianId
                            && j.Id != jobCardId // Exclude self
                            && j.Status != JobStatus.Completed
                            && j.Status != JobStatus.Cancelled
                            && j.ScheduledStartDate.HasValue
                            && j.ScheduledEndDate.HasValue
                            && j.ScheduledStartDate <= end
                            && j.ScheduledEndDate >= startDate)
                .Select(j => j.Id)
                .ToListAsync();

            if (conflictingJobs.Any())
            {
                return new AnchorPro.Data.Models.SchedulingConflict
                {
                    IsConflicted = true,
                    Message = $"Technician is already booked for {conflictingJobs.Count} job(s) during this time.",
                    ConflictingJobIds = conflictingJobs
                };
            }

            return new AnchorPro.Data.Models.SchedulingConflict { IsConflicted = false };
        }

        public async Task AddPartToJobAsync(int jobCardId, int inventoryItemId, int quantity, string userId)
        {
            using var context = _factory.CreateDbContext();

            var item = await context.InventoryItems.FindAsync(inventoryItemId);
            if (item == null) throw new ArgumentException("Invalid inventory item ID.");

            // Check if unissued part already added to this job
            var existingPart = await context.JobCardParts
                .FirstOrDefaultAsync(p => p.JobCardId == jobCardId && p.InventoryItemId == inventoryItemId && !p.IsIssued);

            if (existingPart != null)
            {
                existingPart.QuantityUsed += quantity;
            }
            else
            {
                var part = new JobCardPart
                {
                    JobCardId = jobCardId,
                    InventoryItemId = inventoryItemId,
                    QuantityUsed = quantity,
                    UnitCostSnapshot = item.UnitCost,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userId,
                    IsIssued = false
                };
                context.JobCardParts.Add(part);
            }

            await context.SaveChangesAsync();
        }

        public async Task IssuePartAsync(int jobCardPartId, string userId)
        {
            using var context = _factory.CreateDbContext();

            var part = await context.JobCardParts
                .Include(p => p.JobCard)
                .Include(p => p.InventoryItem)
                .FirstOrDefaultAsync(p => p.Id == jobCardPartId);

            if (part == null) throw new ArgumentException("Invalid job card part ID.");
            if (part.IsIssued) throw new InvalidOperationException("This part has already been issued.");

            if (part.InventoryItem == null) throw new InvalidOperationException("Inventory item not found.");
            if (part.InventoryItem.QuantityOnHand < part.QuantityUsed)
            {
                throw new InvalidOperationException($"Insufficient stock for '{part.InventoryItem.Name}'. Available: {part.InventoryItem.QuantityOnHand}, Requested: {part.QuantityUsed}");
            }

            // Deduct stock
            var jobNo = part.JobCard?.JobNumber ?? part.JobCardId.ToString();
            await _inventoryService.AdjustStockAsync(part.InventoryItemId, -part.QuantityUsed, userId, $"Issued for Job #{jobNo}");

            part.IsIssued = true;
            part.UpdatedAt = DateTime.UtcNow;
            part.UpdatedBy = userId;

            await context.SaveChangesAsync();
        }

        public async Task RemovePartFromJobAsync(int jobCardPartId, string userId = "System")
        {
            using var context = _factory.CreateDbContext();
            var part = await context.JobCardParts
                .Include(p => p.JobCard)
                .FirstOrDefaultAsync(p => p.Id == jobCardPartId);

            if (part != null)
            {
                if (part.IsIssued)
                {
                    // Refund stock
                    var jobNo = part.JobCard?.JobNumber ?? part.JobCardId.ToString();
                    await _inventoryService.AdjustStockAsync(part.InventoryItemId, part.QuantityUsed, userId, $"Refunded from Job #{jobNo} deletion");
                }
                context.JobCardParts.Remove(part);
                await context.SaveChangesAsync();
            }
        }

        public async Task<List<JobCardPart>> GetPendingPartsRequestsAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.JobCardParts
                .Include(p => p.InventoryItem)
                .Include(p => p.JobCard)
                    .ThenInclude(j => j.Equipment)
                .Where(p => !p.IsIssued)
                .OrderByDescending(p => p.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task AddAttachmentAsync(JobAttachment attachment)
        {
            using var context = _factory.CreateDbContext();
            context.JobAttachments.Add(attachment);
            await context.SaveChangesAsync();
        }

        public async Task RemoveAttachmentAsync(int attachmentId)
        {
            using var context = _factory.CreateDbContext();
            var att = await context.JobAttachments.FindAsync(attachmentId);
            if (att != null)
            {
                context.JobAttachments.Remove(att);
                await context.SaveChangesAsync();
            }
        }

        public async Task CreatePermitAsync(PermitToWork permit)
        {
            using var context = _factory.CreateDbContext();

            // Validation: Ensure no duplicate permit for job
            if (await context.PermitsToWork.AnyAsync(p => p.JobCardId == permit.JobCardId))
                throw new InvalidOperationException("A permit already exists for this job.");

            context.PermitsToWork.Add(permit);
            await context.SaveChangesAsync();
        }

        public async Task<string> ImportJobCardsFromCsvAsync(string csvContent, string userId)
        {
            using var context = _factory.CreateDbContext();
            
            var user = await context.Users.FindAsync(userId);
            var tenantId = user?.TenantId;

            // Load existing equipment, job types, and technicians for cache lookup
            var existingEquipment = await context.Equipment.Where(e => e.TenantId == tenantId).ToListAsync();
            var existingJobTypes = await context.JobTypes.Where(jt => jt.TenantId == tenantId).ToListAsync();
            var technicians = await context.Users.Where(u => u.TenantId == tenantId).ToListAsync();

            var lines = csvContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
            if (lines.Length <= 1)
            {
                throw new ArgumentException("CSV content is empty or contains only a header.");
            }

            var firstLine = lines[0];
            if (firstLine.StartsWith("\uFEFF"))
            {
                firstLine = firstLine.Substring(1);
            }

            char separator = ',';
            if (firstLine.Count(c => c == ';') > firstLine.Count(c => c == ','))
            {
                separator = ';';
            }

            var headers = ParseCsvLine(firstLine, separator);
            
            // Map header columns to indices
            int descIdx = -1, typeIdx = -1, equipIdx = -1, prioIdx = -1, statusIdx = -1;
            int techIdx = -1, startIdx = -1, endIdx = -1, jobNumIdx = -1;

            for (int i = 0; i < headers.Count; i++)
            {
                var h = headers[i].ToLower().Trim();
                if (h.Contains("description") || h == "desc") descIdx = i;
                else if (h == "type" || h.Contains("job type") || h == "jobtype") typeIdx = i;
                else if (h == "equipment" || h == "asset" || h.Contains("equip")) equipIdx = i;
                else if (h.Contains("priority")) prioIdx = i;
                else if (h.Contains("status")) statusIdx = i;
                else if (h == "technician" || h == "tech" || h.Contains("assign")) techIdx = i;
                else if (h.Contains("start") || h.Contains("created")) startIdx = i;
                else if (h.Contains("end") || h.Contains("completed") || h == "deadline") endIdx = i;
                else if (h.Contains("job number") || h == "jobnumber" || h.Contains("job ref")) jobNumIdx = i;
            }

            if (descIdx == -1)
            {
                throw new ArgumentException("CSV must contain a 'Description' column.");
            }

            int successCount = 0;
            int eqCreated = 0;
            int jtCreated = 0;

            // Find current max job number for prefix incrementing
            var tenantJobNumbers = await context.JobCards
                .Where(j => j.TenantId == tenantId)
                .Select(j => j.JobNumber)
                .ToListAsync();

            int maxNum = 1000;
            foreach (var numStr in tenantJobNumbers)
            {
                if (int.TryParse(numStr, out int parsed))
                {
                    if (parsed > maxNum) maxNum = parsed;
                }
            }

            for (int r = 1; r < lines.Length; r++)
            {
                var line = lines[r];
                if (string.IsNullOrWhiteSpace(line)) continue;

                var values = ParseCsvLine(line, separator);
                if (values.Count == 0) continue;

                // Ensure index checks
                string GetValue(int idx) => idx >= 0 && idx < values.Count ? values[idx] : string.Empty;

                var desc = GetValue(descIdx);
                if (string.IsNullOrWhiteSpace(desc) || desc.Contains("[Describe") || desc.Contains("[Example")) continue; // Skip empty/helper rows

                var typeName = GetValue(typeIdx);
                if (string.IsNullOrWhiteSpace(typeName)) typeName = "General";

                var equipName = GetValue(equipIdx);
                if (string.IsNullOrWhiteSpace(equipName)) equipName = "General Equipment";

                // Resolve or create JobType
                var jobType = existingJobTypes.FirstOrDefault(jt => jt.Name.Equals(typeName, StringComparison.OrdinalIgnoreCase));
                if (jobType == null)
                {
                    jobType = new JobType { Name = typeName, TenantId = tenantId };
                    context.JobTypes.Add(jobType);
                    await context.SaveChangesAsync(); // Save to get ID
                    existingJobTypes.Add(jobType);
                    jtCreated++;
                }

                // Resolve or create Equipment
                var equipment = existingEquipment.FirstOrDefault(e => e.Name.Equals(equipName, StringComparison.OrdinalIgnoreCase));
                if (equipment == null)
                {
                    equipment = new Equipment 
                    { 
                        Name = equipName, 
                        SerialNumber = $"SN-AUTO-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
                        TenantId = tenantId 
                    };
                    context.Equipment.Add(equipment);
                    await context.SaveChangesAsync(); // Save to get ID
                    existingEquipment.Add(equipment);
                    eqCreated++;
                }

                // Resolve Technician
                string? techId = null;
                var techName = GetValue(techIdx);
                if (!string.IsNullOrWhiteSpace(techName))
                {
                    var tech = technicians.FirstOrDefault(u => 
                        u.UserName?.Equals(techName, StringComparison.OrdinalIgnoreCase) == true ||
                        u.Email?.Equals(techName, StringComparison.OrdinalIgnoreCase) == true ||
                        $"{u.FirstName} {u.LastName}".Trim().Equals(techName, StringComparison.OrdinalIgnoreCase)
                    );
                    if (tech != null)
                    {
                        techId = tech.Id;
                    }
                }

                // Resolve Priority
                var prioStr = GetValue(prioIdx).ToLower();
                var priority = JobPriority.Normal;
                if (prioStr.Contains("low")) priority = JobPriority.Low;
                else if (prioStr.Contains("high")) priority = JobPriority.High;
                else if (prioStr.Contains("crit")) priority = JobPriority.Critical;

                // Resolve Status & Dates
                DateTime? scheduledStart = null;
                DateTime? scheduledEnd = null;

                if (DateTime.TryParse(GetValue(startIdx), out var sD)) scheduledStart = sD;
                if (DateTime.TryParse(GetValue(endIdx), out var eD)) scheduledEnd = eD;

                var statusStr = GetValue(statusIdx).ToLower();
                var status = JobStatus.Unscheduled;
                if (statusStr.Contains("sched") && !statusStr.Contains("unsched")) status = JobStatus.Scheduled;
                else if (statusStr.Contains("progress") || statusStr.Contains("active")) status = JobStatus.InProgress;
                else if (statusStr.Contains("complete")) status = JobStatus.Completed;
                else if (statusStr.Contains("cancel")) status = JobStatus.Cancelled;
                else if (statusStr.Contains("hold")) status = JobStatus.OnHold;
                else if (scheduledStart.HasValue) status = JobStatus.Scheduled;

                // Job Number
                var jobNum = GetValue(jobNumIdx).Trim();
                if (string.IsNullOrWhiteSpace(jobNum))
                {
                    maxNum++;
                    jobNum = maxNum.ToString();
                }
                else
                {
                    // Ensure uniqueness
                    var duplicateExists = await context.JobCards.AnyAsync(j => j.TenantId == tenantId && j.JobNumber == jobNum);
                    if (duplicateExists)
                    {
                        // Fallback to auto-numbered to avoid import crash
                        maxNum++;
                        jobNum = $"{jobNum}-DUP-{maxNum}";
                    }
                }

                var jobCard = new JobCard
                {
                    TenantId = tenantId,
                    JobNumber = jobNum,
                    Description = desc,
                    EquipmentId = equipment.Id,
                    JobTypeId = jobType.Id,
                    Priority = priority,
                    Status = status,
                    ScheduledStartDate = scheduledStart,
                    ScheduledEndDate = scheduledEnd,
                    AssignedTechnicianId = techId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userId
                };

                context.JobCards.Add(jobCard);
                successCount++;
            }

            await context.SaveChangesAsync();
            return $"Successfully imported {successCount} job cards. (Auto-created {eqCreated} equipment, {jtCreated} job types).";
        }

        private static List<string> ParseCsvLine(string line, char separator = ',')
        {
            var result = new List<string>();
            var current = new System.Text.StringBuilder();
            bool inQuotes = false;
            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '\"')
                {
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '\"')
                    {
                        current.Append('\"');
                        i++; // Skip next quote
                    }
                    else
                    {
                        inQuotes = !inQuotes;
                    }
                }
                else if (c == separator && !inQuotes)
                {
                    result.Add(current.ToString().Trim());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }
            result.Add(current.ToString().Trim());
            return result;
        }
    }
}

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

            context.JobCards.Add(jobCard);
            await context.SaveChangesAsync();
        }

        public async Task UpdateJobCardAsync(JobCard jobCard, string userId)
        {
            using var context = _factory.CreateDbContext();
            var existing = await context.JobCards.FindAsync(jobCard.Id);

            if (existing != null)
            {
                existing.JobNumber = jobCard.JobNumber;
                existing.Description = jobCard.Description;
                existing.EquipmentId = jobCard.EquipmentId;
                existing.JobTypeId = jobCard.JobTypeId;
                existing.Priority = jobCard.Priority;
                existing.ScheduledStartDate = jobCard.ScheduledStartDate;
                existing.ScheduledEndDate = jobCard.ScheduledEndDate;
                existing.AssignedTechnicianId = jobCard.AssignedTechnicianId;

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

                    // 1. Deduct Stock & Calculate Parts Cost (Using Snapshots)
                    decimal totalPartsCost = 0;
                    if (job.JobCardParts != null)
                    {
                        foreach (var part in job.JobCardParts)
                        {
                            // Reduce stock in inventory
                            await _inventoryService.AdjustStockAsync(part.InventoryItemId, -part.QuantityUsed, userId, $"Used on Job #{job.JobNumber}");
                            
                            // Use snapshot for calculation to preserve historical data
                            totalPartsCost += (part.UnitCostSnapshot * part.QuantityUsed);
                        }
                    }

                    // 2. Calculate Labor Cost (Fetching Tech Rate)
                    var technician = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == job.AssignedTechnicianId);
                    decimal techRate = technician?.HourlyRate ?? 500.00m; 

                    var startTime = job.ActualStartDate ?? job.ScheduledStartDate ?? job.CreatedAt;
                    var grossDurationHours = (DateTime.UtcNow - startTime).TotalHours;
                    
                    // 1.1 Job Duration (Net Processing Time) calculation for labor cost
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

        public async Task AssignTechnicianAsync(int jobCardId, string technicianId, DateTime? scheduledStart = null, DateTime? scheduledEnd = null)
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

            // Check if part already added to this job
            var existingPart = await context.JobCardParts
                .FirstOrDefaultAsync(p => p.JobCardId == jobCardId && p.InventoryItemId == inventoryItemId);

            if (existingPart != null)
            {
                existingPart.QuantityUsed += quantity;
                // Optional: Update unit cost snapshot if policy dictates, usually we keep original or average
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
                    CreatedBy = userId
                };
                context.JobCardParts.Add(part);
            }

            await context.SaveChangesAsync();
        }

        public async Task RemovePartFromJobAsync(int jobCardPartId)
        {
            using var context = _factory.CreateDbContext();
            var part = await context.JobCardParts.FindAsync(jobCardPartId);
            if (part != null)
            {
                context.JobCardParts.Remove(part);
                await context.SaveChangesAsync();
            }
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
    }
}

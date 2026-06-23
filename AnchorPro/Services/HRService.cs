using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services;

public class HRService(ApplicationDbContext context, UserManager<ApplicationUser> userManager) : IHRService
{
    // ─── Employee Profiles ────────────────────────────────────────────────

    public async Task<EmployeeProfile?> GetEmployeeProfileAsync(string userId)
    {
        return await context.EmployeeProfiles
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == userId);
    }

    public async Task<EmployeeProfile> UpsertEmployeeProfileAsync(EmployeeProfile profile)
    {
        var existing = await context.EmployeeProfiles.FirstOrDefaultAsync(p => p.UserId == profile.UserId);
        if (existing == null)
        {
            profile.CreatedAt = DateTime.UtcNow;
            context.EmployeeProfiles.Add(profile);
        }
        else
        {
            existing.DateOfBirth = profile.DateOfBirth;
            existing.Gender = profile.Gender;
            existing.Nationality = profile.Nationality;
            existing.NationalIdNumber = profile.NationalIdNumber;
            existing.MaritalStatus = profile.MaritalStatus;
            existing.PersonalPhone = profile.PersonalPhone;
            existing.PersonalEmail = profile.PersonalEmail;
            existing.HomeAddress = profile.HomeAddress;
            existing.EmergencyContactName = profile.EmergencyContactName;
            existing.EmergencyContactRelation = profile.EmergencyContactRelation;
            existing.EmergencyContactPhone = profile.EmergencyContactPhone;
            existing.BankName = profile.BankName;
            existing.BankBranch = profile.BankBranch;
            existing.BankAccountNumber = profile.BankAccountNumber;
            existing.BankAccountType = profile.BankAccountType;
            existing.JobTitle = profile.JobTitle;
            existing.EmploymentType = profile.EmploymentType;
            existing.EmploymentStartDate = profile.EmploymentStartDate;
            existing.ProfilePhotoUrl = profile.ProfilePhotoUrl;
            existing.IdDocumentUrl = profile.IdDocumentUrl;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = profile.UpdatedBy;
            profile = existing;
        }
        await context.SaveChangesAsync();
        return profile;
    }

    public async Task<List<EmployeeProfileSummary>> GetAllEmployeeSummariesAsync()
    {
        var users = await userManager.Users
            .Include(u => u.Department)
            .OrderBy(u => u.FirstName)
            .ToListAsync();

        var profiles = await context.EmployeeProfiles.ToListAsync();

        var summaries = new List<EmployeeProfileSummary>();
        foreach (var user in users)
        {
            var profile = profiles.FirstOrDefault(p => p.UserId == user.Id);
            var roles = await userManager.GetRolesAsync(user);
            summaries.Add(new EmployeeProfileSummary
            {
                UserId = user.Id,
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                Email = user.Email ?? "",
                EmployeeNumber = user.EmployeeNumber,
                Department = user.Department?.Name,
                JobTitle = profile?.JobTitle,
                EmploymentType = profile?.EmploymentType.ToString(),
                EmploymentStartDate = profile?.EmploymentStartDate,
                HourlyRate = user.HourlyRate,
                IsActive = user.LockoutEnd == null || user.LockoutEnd < DateTimeOffset.UtcNow,
                ProfilePhotoUrl = profile?.ProfilePhotoUrl,
                Role = roles.FirstOrDefault()
            });
        }
        return summaries;
    }

    // ─── Employment Contracts ─────────────────────────────────────────────

    public async Task<List<EmploymentContract>> GetAllContractsAsync()
    {
        return await context.EmploymentContracts
            .Include(c => c.User)
            .OrderByDescending(c => c.StartDate)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<EmploymentContract>> GetContractsByUserAsync(string userId)
    {
        return await context.EmploymentContracts
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.StartDate)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<EmploymentContract> CreateContractAsync(EmploymentContract contract)
    {
        // Deactivate any previously active contract for this user
        var activeContracts = await context.EmploymentContracts
            .Where(c => c.UserId == contract.UserId && c.Status == EmploymentContractStatus.Active)
            .ToListAsync();
        foreach (var ac in activeContracts)
            ac.Status = EmploymentContractStatus.Expired;

        contract.CreatedAt = DateTime.UtcNow;
        context.EmploymentContracts.Add(contract);

        // Sync hourly rate to ApplicationUser
        var user = await userManager.FindByIdAsync(contract.UserId);
        if (user != null && contract.HourlyRate > 0)
        {
            user.HourlyRate = contract.HourlyRate;
            await userManager.UpdateAsync(user);
        }

        await context.SaveChangesAsync();
        return contract;
    }

    public async Task<EmploymentContract> UpdateContractAsync(EmploymentContract contract)
    {
        var existing = await context.EmploymentContracts.FindAsync(contract.Id)
            ?? throw new InvalidOperationException("Contract not found");

        existing.JobTitle = contract.JobTitle;
        existing.ContractType = contract.ContractType;
        existing.Status = contract.Status;
        existing.StartDate = contract.StartDate;
        existing.EndDate = contract.EndDate;
        existing.AgreedMonthlySalary = contract.AgreedMonthlySalary;
        existing.HourlyRate = contract.HourlyRate;
        existing.NoticePeriodDays = contract.NoticePeriodDays;
        existing.DocumentUrl = contract.DocumentUrl;
        existing.Notes = contract.Notes;
        existing.TerminationReason = contract.TerminationReason;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = contract.UpdatedBy;

        await context.SaveChangesAsync();
        return existing;
    }

    // ─── Payroll Runs ─────────────────────────────────────────────────────

    public async Task<List<PayrollRun>> GetAllPayrollRunsAsync()
    {
        return await context.PayrollRuns
            .OrderByDescending(r => r.PeriodYear).ThenByDescending(r => r.PeriodMonth)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<PayrollRun?> GetPayrollRunAsync(int id)
    {
        return await context.PayrollRuns
            .Include(r => r.PayslipEntries).ThenInclude(e => e.User)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<PayrollRun> CreatePayrollRunAsync(int month, int year, string createdByUserId)
    {
        // Check for duplicates
        var exists = await context.PayrollRuns.AnyAsync(r => r.PeriodMonth == month && r.PeriodYear == year);
        if (exists) throw new InvalidOperationException($"A payroll run for {month}/{year} already exists.");

        var run = new PayrollRun
        {
            PeriodMonth = month,
            PeriodYear = year,
            RunDate = DateTime.UtcNow,
            Status = PayrollRunStatus.Draft,
            CreatedBy = createdByUserId
        };

        context.PayrollRuns.Add(run);
        await context.SaveChangesAsync();

        // Auto-populate payslips for all active employees
        var users = await userManager.Users.ToListAsync();
        var profiles = await context.EmployeeProfiles.ToListAsync();
        var contracts = await context.EmploymentContracts
            .Where(c => c.Status == EmploymentContractStatus.Active)
            .ToListAsync();

        // Calculate overtime hours from job cards for this period
        var periodStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var periodEnd = periodStart.AddMonths(1);
        var jobCards = await context.JobCards
            .Where(j => j.ActualStartDate >= periodStart && j.ActualEndDate <= periodEnd && j.AssignedTechnicianId != null)
            .ToListAsync();

        var entries = new List<PayslipEntry>();
        foreach (var user in users)
        {
            var contract = contracts.FirstOrDefault(c => c.UserId == user.Id);
            var basicSalary = contract?.AgreedMonthlySalary ?? 0;
            var hourlyRate = contract?.HourlyRate ?? user.HourlyRate;

            // Calculate overtime: actual hours worked beyond 8h/day assumed standard
            var userJobs = jobCards.Where(j => j.AssignedTechnicianId == user.Id).ToList();
            var totalActualHours = userJobs
                .Where(j => j.ActualStartDate.HasValue && j.ActualEndDate.HasValue)
                .Sum(j => (j.ActualEndDate!.Value - j.ActualStartDate!.Value).TotalHours);

            // Assume 22 working days × 8 hours = 176 standard hours/month
            var standardHours = 176.0;
            var overtimeHours = Math.Max(0, totalActualHours - standardHours);
            var overtimeRate = hourlyRate * 1.5m;
            var overtimePay = (decimal)overtimeHours * overtimeRate;

            var grossPay = basicSalary + overtimePay;

            // Zambia statutory deductions
            var paye = CalculateZambiaPayeTax(grossPay);
            var napsaEmployee = Math.Min(grossPay * 0.05m, 1221m); // 5% capped at ZMW 1,221
            var napsaEmployer = Math.Min(grossPay * 0.05m, 1221m); // 5% employer share (tracked)
            var nhima = grossPay * 0.01m; // 1% NHIMA

            var totalDeductions = paye + napsaEmployee + nhima;
            var netPay = grossPay - totalDeductions;

            entries.Add(new PayslipEntry
            {
                PayrollRunId = run.Id,
                UserId = user.Id,
                BasicSalary = basicSalary,
                OvertimeHours = (decimal)overtimeHours,
                OvertimeRate = overtimeRate,
                OvertimePay = overtimePay,
                GrossPay = grossPay,
                PayeTax = paye,
                NapsaEmployee = napsaEmployee,
                NapsaEmployer = napsaEmployer,
                NhimaContribution = nhima,
                TotalDeductions = totalDeductions,
                NetPay = netPay,
                Status = PayslipStatus.Pending,
                CreatedBy = createdByUserId
            });
        }

        context.PayslipEntries.AddRange(entries);

        run.TotalGross = entries.Sum(e => e.GrossPay);
        run.TotalDeductions = entries.Sum(e => e.TotalDeductions);
        run.TotalNet = entries.Sum(e => e.NetPay);
        run.TotalEmployerNapsa = entries.Sum(e => e.NapsaEmployer);

        await context.SaveChangesAsync();
        return run;
    }

    public async Task FinalisePayrollRunAsync(int runId, string userId)
    {
        var run = await context.PayrollRuns.FindAsync(runId)
            ?? throw new InvalidOperationException("Payroll run not found");
        run.Status = PayrollRunStatus.Finalised;
        run.FinalisedAt = DateTime.UtcNow;
        run.FinalisedBy = userId;
        run.UpdatedAt = DateTime.UtcNow;
        run.UpdatedBy = userId;
        await context.SaveChangesAsync();
    }

    public async Task MarkPayrollRunPaidAsync(int runId, string userId)
    {
        var run = await context.PayrollRuns.FindAsync(runId)
            ?? throw new InvalidOperationException("Payroll run not found");
        run.Status = PayrollRunStatus.Paid;
        run.PaidAt = DateTime.UtcNow;
        run.PaidBy = userId;
        run.UpdatedAt = DateTime.UtcNow;
        run.UpdatedBy = userId;

        // Mark all payslips as paid
        var entries = await context.PayslipEntries.Where(e => e.PayrollRunId == runId).ToListAsync();
        foreach (var e in entries) e.Status = PayslipStatus.Paid;

        // Add Ledger Entry for cash outflow
        var ledgerEntry = new LedgerEntry
        {
            TransactionDate = DateTime.UtcNow,
            Type = LedgerTransactionType.Expense,
            Amount = run.TotalNet, // + run.TotalEmployerNapsa if you want to track statutory separately, but let's stick to net payroll payout for simplicity, or gross? Actually, cash outflow is Net Pay + Taxes Paid. Let's record Net Pay as the main outflow here, assuming taxes are paid separately, or Gross Pay if it's all handled by HR. Let's record TotalNet + TotalEmployerNapsa + TotalDeductions (which equals Gross + EmployerNapsa).
            Category = "Payroll",
            Description = $"Payroll Run - {run.PeriodMonth}/{run.PeriodYear}",
            PayrollRunId = run.Id,
            RecordedBy = userId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        // Note: In a real system, you'd split Net Pay and Statutory Deductions into separate ledger entries when they are actually paid to the tax authority. 
        // For this startup cashbook, we'll record the full Gross + Employer Napsa as the total cost of payroll for the month.
        ledgerEntry.Amount = run.TotalGross + run.TotalEmployerNapsa;

        context.LedgerEntries.Add(ledgerEntry);

        await context.SaveChangesAsync();
    }

    // ─── Payslips ─────────────────────────────────────────────────────────

    public async Task<List<PayslipEntry>> GetPayslipsByRunAsync(int runId)
    {
        return await context.PayslipEntries
            .Include(e => e.User).ThenInclude(u => u!.Department)
            .Where(e => e.PayrollRunId == runId)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<PayslipEntry?> GetMyPayslipAsync(int runId, string userId)
    {
        return await context.PayslipEntries
            .Include(e => e.PayrollRun)
            .FirstOrDefaultAsync(e => e.PayrollRunId == runId && e.UserId == userId);
    }

    public async Task<PayslipEntry> UpdatePayslipAsync(PayslipEntry entry)
    {
        var existing = await context.PayslipEntries.FindAsync(entry.Id)
            ?? throw new InvalidOperationException("Payslip not found");

        existing.TransportAllowance = entry.TransportAllowance;
        existing.HousingAllowance = entry.HousingAllowance;
        existing.OtherAllowances = entry.OtherAllowances;
        existing.OtherDeductions = entry.OtherDeductions;
        existing.OtherDeductionsNote = entry.OtherDeductionsNote;

        // Recalculate totals
        existing.GrossPay = existing.BasicSalary + existing.OvertimePay
            + existing.TransportAllowance + existing.HousingAllowance + existing.OtherAllowances;

        existing.PayeTax = CalculateZambiaPayeTax(existing.GrossPay);
        existing.NapsaEmployee = Math.Min(existing.GrossPay * 0.05m, 1221m);
        existing.NapsaEmployer = Math.Min(existing.GrossPay * 0.05m, 1221m);
        existing.NhimaContribution = existing.GrossPay * 0.01m;
        existing.TotalDeductions = existing.PayeTax + existing.NapsaEmployee
            + existing.NhimaContribution + existing.OtherDeductions;
        existing.NetPay = existing.GrossPay - existing.TotalDeductions;

        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = entry.UpdatedBy;

        // Update payroll run totals
        var run = await context.PayrollRuns.FindAsync(existing.PayrollRunId);
        if (run != null)
        {
            var allEntries = await context.PayslipEntries.Where(e => e.PayrollRunId == run.Id).ToListAsync();
            run.TotalGross = allEntries.Sum(e => e.GrossPay);
            run.TotalDeductions = allEntries.Sum(e => e.TotalDeductions);
            run.TotalNet = allEntries.Sum(e => e.NetPay);
        }

        await context.SaveChangesAsync();
        return existing;
    }

    // ─── Zambia Tax Calculation ───────────────────────────────────────────

    /// <summary>
    /// Calculates PAYE tax based on Zambia 2024/25 monthly tax bands.
    /// Bands: 0-4800 = 0%; 4801-9600 = 25%; 9601-14400 = 30%; 14401+ = 37.5%
    /// </summary>
    public static decimal CalculateZambiaPayeTax(decimal monthlyGross)
    {
        if (monthlyGross <= 4800m) return 0m;

        decimal tax = 0m;

        if (monthlyGross > 4800m)
            tax += Math.Min(monthlyGross - 4800m, 4800m) * 0.25m;  // Band 2: 4801–9600 @ 25%

        if (monthlyGross > 9600m)
            tax += Math.Min(monthlyGross - 9600m, 4800m) * 0.30m;  // Band 3: 9601–14400 @ 30%

        if (monthlyGross > 14400m)
            tax += (monthlyGross - 14400m) * 0.375m;               // Band 4: 14401+ @ 37.5%

        return Math.Round(tax, 2);
    }
}

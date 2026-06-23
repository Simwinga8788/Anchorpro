using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces;

public interface IHRService
{
    // Employee Profiles
    Task<EmployeeProfile?> GetEmployeeProfileAsync(string userId);
    Task<EmployeeProfile> UpsertEmployeeProfileAsync(EmployeeProfile profile);
    Task<List<EmployeeProfileSummary>> GetAllEmployeeSummariesAsync();

    // Employment Contracts
    Task<List<EmploymentContract>> GetAllContractsAsync();
    Task<List<EmploymentContract>> GetContractsByUserAsync(string userId);
    Task<EmploymentContract> CreateContractAsync(EmploymentContract contract);
    Task<EmploymentContract> UpdateContractAsync(EmploymentContract contract);

    // Payroll Runs
    Task<List<PayrollRun>> GetAllPayrollRunsAsync();
    Task<PayrollRun?> GetPayrollRunAsync(int id);
    Task<PayrollRun> CreatePayrollRunAsync(int month, int year, string createdByUserId);
    Task FinalisePayrollRunAsync(int runId, string userId);
    Task MarkPayrollRunPaidAsync(int runId, string userId);

    // Payslips
    Task<List<PayslipEntry>> GetPayslipsByRunAsync(int runId);
    Task<PayslipEntry?> GetMyPayslipAsync(int runId, string userId);
    Task<PayslipEntry> UpdatePayslipAsync(PayslipEntry entry);
}

public class EmployeeProfileSummary
{
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? EmployeeNumber { get; set; }
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public string? EmploymentType { get; set; }
    public DateTime? EmploymentStartDate { get; set; }
    public decimal HourlyRate { get; set; }
    public bool IsActive { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string? Role { get; set; }
}

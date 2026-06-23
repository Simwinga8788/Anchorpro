using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AnchorPro.Controllers;

[ApiController]
[Route("api/hr")]
[Authorize]
public class HRController(IHRService hrService) : ControllerBase
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // ─── Employee Profiles ─────────────────────────────────────────────────

    [HttpGet("employees")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetAllEmployees()
    {
        var summaries = await hrService.GetAllEmployeeSummariesAsync();
        return Ok(summaries);
    }

    [HttpGet("employees/{userId}/profile")]
    public async Task<IActionResult> GetProfile(string userId)
    {
        // Allow users to view their own profile; HR/Admin can view anyone's
        if (userId != CurrentUserId && !User.IsInRole("Admin") && !User.IsInRole("HR"))
            return Forbid();

        var profile = await hrService.GetEmployeeProfileAsync(userId);
        if (profile == null)
            return Ok(new { }); // Return empty — profile not yet created
        
        // Mask bank details for non-Admin/HR
        if (!User.IsInRole("Admin") && !User.IsInRole("HR"))
        {
            profile.BankAccountNumber = profile.BankAccountNumber != null
                ? "••••" + profile.BankAccountNumber[^Math.Min(4, profile.BankAccountNumber.Length)..]
                : null;
        }

        return Ok(profile);
    }

    [HttpPut("employees/{userId}/profile")]
    public async Task<IActionResult> UpsertProfile(string userId, [FromBody] EmployeeProfile profile)
    {
        if (userId != CurrentUserId && !User.IsInRole("Admin") && !User.IsInRole("HR"))
            return Forbid();

        // Non-HR/Admin cannot update bank details
        if (!User.IsInRole("Admin") && !User.IsInRole("HR"))
        {
            profile.BankName = null;
            profile.BankBranch = null;
            profile.BankAccountNumber = null;
            profile.BankAccountType = null;
        }

        profile.UserId = userId;
        profile.UpdatedBy = CurrentUserId;
        var result = await hrService.UpsertEmployeeProfileAsync(profile);
        return Ok(result);
    }

    // ─── Employment Contracts ──────────────────────────────────────────────

    [HttpGet("contracts")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetAllContracts()
    {
        var contracts = await hrService.GetAllContractsAsync();
        return Ok(contracts);
    }

    [HttpGet("contracts/mine")]
    public async Task<IActionResult> GetMyContracts()
    {
        var contracts = await hrService.GetContractsByUserAsync(CurrentUserId);
        return Ok(contracts);
    }

    [HttpGet("contracts/user/{userId}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetUserContracts(string userId)
    {
        var contracts = await hrService.GetContractsByUserAsync(userId);
        return Ok(contracts);
    }

    [HttpPost("contracts")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> CreateContract([FromBody] EmploymentContract contract)
    {
        contract.CreatedBy = CurrentUserId;
        var result = await hrService.CreateContractAsync(contract);
        return Ok(result);
    }

    [HttpPut("contracts/{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> UpdateContract(int id, [FromBody] EmploymentContract contract)
    {
        contract.Id = id;
        contract.UpdatedBy = CurrentUserId;
        var result = await hrService.UpdateContractAsync(contract);
        return Ok(result);
    }

    // ─── Payroll Runs ──────────────────────────────────────────────────────

    [HttpGet("payroll")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetAllPayrollRuns()
    {
        var runs = await hrService.GetAllPayrollRunsAsync();
        return Ok(runs);
    }

    [HttpGet("payroll/{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetPayrollRun(int id)
    {
        var run = await hrService.GetPayrollRunAsync(id);
        if (run == null) return NotFound();
        return Ok(run);
    }

    [HttpPost("payroll")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> CreatePayrollRun([FromBody] CreatePayrollRunRequest req)
    {
        try
        {
            var run = await hrService.CreatePayrollRunAsync(req.Month, req.Year, CurrentUserId);
            return Ok(run);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("payroll/{id}/finalise")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> FinalisePayrollRun(int id)
    {
        await hrService.FinalisePayrollRunAsync(id, CurrentUserId);
        return Ok();
    }

    [HttpPost("payroll/{id}/paid")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> MarkPayrollRunPaid(int id)
    {
        await hrService.MarkPayrollRunPaidAsync(id, CurrentUserId);
        return Ok();
    }

    // ─── Payslips ──────────────────────────────────────────────────────────

    [HttpGet("payroll/{runId}/payslips")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetPayslips(int runId)
    {
        var payslips = await hrService.GetPayslipsByRunAsync(runId);
        return Ok(payslips);
    }

    [HttpGet("payroll/{runId}/payslips/mine")]
    public async Task<IActionResult> GetMyPayslip(int runId)
    {
        var payslip = await hrService.GetMyPayslipAsync(runId, CurrentUserId);
        if (payslip == null) return NotFound();
        return Ok(payslip);
    }

    [HttpPut("payroll/payslips/{id}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> UpdatePayslip(int id, [FromBody] PayslipEntry entry)
    {
        entry.Id = id;
        entry.UpdatedBy = CurrentUserId;
        var result = await hrService.UpdatePayslipAsync(entry);
        return Ok(result);
    }
}

public record CreatePayrollRunRequest(int Month, int Year);

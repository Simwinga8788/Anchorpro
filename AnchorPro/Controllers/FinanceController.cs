using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AnchorPro.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FinanceController : ControllerBase
    {
        private readonly IFinancialService _financialService;

        public FinanceController(IFinancialService financialService)
        {
            _financialService = financialService;
        }

        private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";

        // ==========================================
        // VENDOR BILLS
        // ==========================================
        [HttpGet("vendor-bills")]
        public async Task<IActionResult> GetAllVendorBills()
        {
            var bills = await _financialService.GetAllVendorBillsAsync();
            return Ok(bills);
        }

        [HttpGet("vendor-bills/{id}")]
        public async Task<IActionResult> GetVendorBillById(int id)
        {
            var bill = await _financialService.GetVendorBillByIdAsync(id);
            if (bill == null) return NotFound();
            return Ok(bill);
        }

        [HttpPost("vendor-bills/from-po/{poId}")]
        public async Task<IActionResult> CreateVendorBillFromPO(int poId)
        {
            try
            {
                var bill = await _financialService.CreateVendorBillFromPOAsync(poId, GetUserId());
                return Ok(bill);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class RecordVendorBillPaymentRequest
        {
            public decimal Amount { get; set; }
        }

        [HttpPost("vendor-bills/{id}/record-payment")]
        public async Task<IActionResult> RecordVendorBillPayment(int id, [FromBody] RecordVendorBillPaymentRequest request)
        {
            try
            {
                await _financialService.RecordVendorBillPaymentAsync(id, request.Amount, GetUserId());
                return Ok(new { message = "Payment recorded successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ==========================================
        // AD-HOC EXPENSES
        // ==========================================
        [HttpGet("expenses")]
        public async Task<IActionResult> GetAllExpenses()
        {
            var expenses = await _financialService.GetAllExpensesAsync();
            return Ok(expenses);
        }

        [HttpPost("expenses")]
        public async Task<IActionResult> RecordExpense([FromBody] Expense expense)
        {
            try
            {
                var result = await _financialService.RecordExpenseAsync(expense, GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ==========================================
        // LEDGER & REPORTING
        // ==========================================
        [HttpGet("ledger")]
        public async Task<IActionResult> GetLedgerEntries([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var entries = await _financialService.GetLedgerEntriesAsync(from, to);
            return Ok(entries);
        }

        [HttpGet("profit-and-loss")]
        public async Task<IActionResult> GetProfitAndLoss([FromQuery] int month, [FromQuery] int year)
        {
            var report = await _financialService.GetProfitAndLossAsync(month, year);
            return Ok(report);
        }
    }
}

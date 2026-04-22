using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AnchorPro.Data;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FinancialController : ControllerBase
    {
        private readonly IFinancialService _financialService;
        private readonly UserManager<ApplicationUser> _userManager;

        public FinancialController(IFinancialService financialService, UserManager<ApplicationUser> userManager)
        {
            _financialService = financialService;
            _userManager = userManager;
        }

        [HttpGet("invoices")]
        public async Task<ActionResult> GetAllInvoices()
        {
            var invoices = await _financialService.GetAllInvoicesAsync();
            return Ok(invoices);
        }

        [HttpGet("invoices/{id}")]
        public async Task<ActionResult> GetInvoice(int id)
        {
            var invoice = await _financialService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpPost("invoices/from-job/{jobId}")]
        public async Task<ActionResult> CreateFromJob(int jobId)
        {
            var userId = _userManager.GetUserId(User) ?? "";
            var invoice = await _financialService.CreateInvoiceFromJobAsync(jobId, userId);
            return Ok(invoice);
        }

        [HttpPost("invoices")]
        public async Task<ActionResult> CreateAdHocInvoice([FromBody] Invoice invoice)
        {
            var userId = _userManager.GetUserId(User) ?? "";
            await _financialService.CreateAdHocInvoiceAsync(invoice, userId);
            return Ok(new { message = "Invoice created" });
        }

        [HttpPut("invoices/{id}")]
        public async Task<ActionResult> UpdateInvoice(int id, [FromBody] Invoice invoice)
        {
            invoice.Id = id;
            var userId = _userManager.GetUserId(User) ?? "";
            await _financialService.UpdateInvoiceAsync(invoice, userId);
            return Ok(new { message = "Invoice updated" });
        }

        [HttpGet("invoices/{invoiceId}/payments")]
        public async Task<ActionResult> GetPayments(int invoiceId)
        {
            var payments = await _financialService.GetPaymentsByInvoiceIdAsync(invoiceId);
            return Ok(payments);
        }

        [HttpPost("invoices/{invoiceId}/payments")]
        public async Task<ActionResult> RecordPayment(int invoiceId, [FromBody] InvoicePayment payment)
        {
            payment.InvoiceId = invoiceId;
            var userId = _userManager.GetUserId(User) ?? "";
            await _financialService.RecordPaymentAsync(payment, userId);
            return Ok(new { message = "Payment recorded" });
        }

        [HttpGet("snapshot")]
        public async Task<ActionResult> GetSnapshot()
        {
            var snapshot = await _financialService.GetFinancialSnapshotAsync();
            return Ok(snapshot);
        }
    }
}

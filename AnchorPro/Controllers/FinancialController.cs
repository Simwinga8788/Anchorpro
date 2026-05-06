using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/financial")]
    [ApiController]
    public class FinancialController : ControllerBase
    {
        private readonly IFinancialService _financialService;

        public FinancialController(IFinancialService financialService)
        {
            _financialService = financialService;
        }

        // ── SNAPSHOT ──────────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/financial/snapshot
        /// Returns MTD revenue, collected, outstanding, overdue, and unpaid invoice count.
        /// </summary>
        [HttpGet("snapshot")]
        public async Task<ActionResult<FinancialSnapshot>> GetSnapshot()
            => Ok(await _financialService.GetFinancialSnapshotAsync());

        // ── INVOICES ──────────────────────────────────────────────────────────

        /// <summary>GET /api/financial/invoices — All invoices.</summary>
        [HttpGet("invoices")]
        public async Task<ActionResult<List<Invoice>>> GetAllInvoices()
            => Ok(await _financialService.GetAllInvoicesAsync());

        /// <summary>GET /api/financial/invoices/{id}</summary>
        [HttpGet("invoices/{id}")]
        public async Task<ActionResult<Invoice>> GetInvoiceById(int id)
        {
            var result = await _financialService.GetInvoiceByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>GET /api/financial/invoices/job/{jobId} — Invoice linked to a specific job card.</summary>
        [HttpGet("invoices/job/{jobId}")]
        public async Task<ActionResult<Invoice>> GetInvoiceByJob(int jobId)
        {
            var result = await _financialService.GetInvoiceByJobIdAsync(jobId);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>
        /// POST /api/financial/invoices/from-job/{jobId}
        /// Auto-generates an invoice from a completed job card using the calculated costs.
        /// </summary>
        [HttpPost("invoices/from-job/{jobId}")]
        public async Task<ActionResult<Invoice>> CreateFromJob(int jobId)
        {
            var userId = User.Identity?.Name ?? "API_User";
            var invoice = await _financialService.CreateInvoiceFromJobAsync(jobId, userId);
            return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, invoice);
        }

        /// <summary>POST /api/financial/invoices — Create a manual (ad-hoc) invoice.</summary>
        [HttpPost("invoices")]
        public async Task<ActionResult> CreateAdHoc([FromBody] Invoice invoice)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _financialService.CreateAdHocInvoiceAsync(invoice, userId);
            return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, invoice);
        }

        /// <summary>PUT /api/financial/invoices/{id}</summary>
        [HttpPut("invoices/{id}")]
        public async Task<ActionResult> UpdateInvoice(int id, [FromBody] Invoice invoice)
        {
            if (id != invoice.Id) return BadRequest("ID mismatch.");
            var userId = User.Identity?.Name ?? "API_User";
            await _financialService.UpdateInvoiceAsync(invoice, userId);
            return NoContent();
        }

        // ── PAYMENTS ──────────────────────────────────────────────────────────

        /// <summary>GET /api/financial/invoices/{invoiceId}/payments — All payments for an invoice.</summary>
        [HttpGet("invoices/{invoiceId}/payments")]
        public async Task<ActionResult<List<InvoicePayment>>> GetPayments(int invoiceId)
            => Ok(await _financialService.GetPaymentsByInvoiceIdAsync(invoiceId));

        /// <summary>
        /// POST /api/financial/payments — Record a payment against an invoice.
        /// Updates Invoice.AmountPaid, Balance, and PaymentStatus automatically.
        /// </summary>
        [HttpPost("payments")]
        public async Task<ActionResult> RecordPayment([FromBody] InvoicePayment payment)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _financialService.RecordPaymentAsync(payment, userId);
            return Ok();
        }
    }
}

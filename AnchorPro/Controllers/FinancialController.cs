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
        private readonly IContractService _contractService;

        public FinancialController(IFinancialService financialService, IContractService contractService)
        {
            _financialService = financialService;
            _contractService = contractService;
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

        /// <summary>
        /// GET /api/financial/invoices/overdue — All invoices past their due date with an outstanding balance.
        /// Useful for chasing payments and dunning workflows.
        /// </summary>
        [HttpGet("invoices/overdue")]
        public async Task<ActionResult<List<Invoice>>> GetOverdueInvoices()
        {
            var all = await _financialService.GetAllInvoicesAsync();
            var now = DateTime.UtcNow;
            var overdue = all
                .Where(i => i.Balance > 0 && i.DueDate.HasValue && i.DueDate.Value < now)
                .OrderBy(i => i.DueDate)
                .ToList();
            return Ok(overdue);
        }

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

        /// <summary>
        /// POST /api/financial/invoices/from-contract/{contractId}
        /// Generates the monthly retainer invoice from an active contract's MonthlyFee.
        /// Use this at the start of each billing cycle to bill recurring SLA clients.
        /// </summary>
        [HttpPost("invoices/from-contract/{contractId}")]
        public async Task<ActionResult> CreateFromContract(int contractId)
        {
            var userId = User.Identity?.Name ?? "API_User";
            var contract = await _contractService.GetContractByIdAsync(contractId);
            if (contract == null) return NotFound(new { message = $"Contract {contractId} not found." });
            if (contract.Status != ContractStatus.Active)
                return BadRequest(new { message = $"Contract is not Active (current status: {contract.Status})." });
            if (contract.MonthlyFee <= 0)
                return BadRequest(new { message = "Contract has no MonthlyFee configured." });

            var now = DateTime.UtcNow;
            var invoice = new Invoice
            {
                InvoiceNumber = $"INV-C{contractId}-{now:yyyyMM}",
                ContractId = contractId,
                CustomerId = contract.CustomerId,
                InvoiceDate = now,
                DueDate = now.AddDays(30),
                Subtotal = contract.MonthlyFee,
                TaxRate = 16.00m,
                Notes = $"Monthly retainer for {contract.Title} — {now:MMMM yyyy}",
                CreatedAt = now,
                CreatedBy = userId
            };
            invoice.TaxAmount = Math.Round(invoice.Subtotal * (invoice.TaxRate / 100), 2);
            invoice.Total = invoice.Subtotal + invoice.TaxAmount;
            invoice.Balance = invoice.Total;
            invoice.PaymentStatus = InvoicePaymentStatus.Unpaid;

            await _financialService.CreateAdHocInvoiceAsync(invoice, userId);
            return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, invoice);
        }

        /// <summary>
        /// PATCH /api/financial/invoices/{id}/cancel
        /// Voids an invoice — sets balance to 0 and PaymentStatus to Cancelled.
        /// Only valid for Unpaid or Partial invoices.
        /// </summary>
        [HttpPatch("invoices/{id}/cancel")]
        public async Task<ActionResult> CancelInvoice(int id)
        {
            var userId = User.Identity?.Name ?? "API_User";
            var invoice = await _financialService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound();
            if (invoice.PaymentStatus == InvoicePaymentStatus.Paid)
                return BadRequest(new { message = "Cannot cancel a fully paid invoice." });
            if (invoice.PaymentStatus == InvoicePaymentStatus.Cancelled)
                return BadRequest(new { message = "Invoice is already cancelled." });

            invoice.PaymentStatus = InvoicePaymentStatus.Cancelled;
            invoice.Balance = 0;
            invoice.Notes = (invoice.Notes ?? "") + $" [Cancelled by {userId} on {DateTime.UtcNow:yyyy-MM-dd}]";
            await _financialService.UpdateInvoiceAsync(invoice, userId);
            return Ok(new { message = $"Invoice {invoice.InvoiceNumber} cancelled." });
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

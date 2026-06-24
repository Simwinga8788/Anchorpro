using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class QuotationsController : ControllerBase
    {
        private readonly IQuotationService _quotationService;

        public QuotationsController(IQuotationService quotationService)
        {
            _quotationService = quotationService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Quotation>>> GetAll()
        {
            var result = await _quotationService.GetAllQuotationsAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Quotation>> GetById(int id)
        {
            var result = await _quotationService.GetQuotationByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpGet("job/{jobId}")]
        public async Task<ActionResult<Quotation>> GetByJob(int jobId)
        {
            var result = await _quotationService.GetQuotationByJobIdAsync(jobId);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost("from-job/{jobId}")]
        public async Task<ActionResult<Quotation>> CreateFromJob(int jobId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            var quotation = await _quotationService.CreateQuotationFromJobAsync(jobId, userId);
            return CreatedAtAction(nameof(GetById), new { id = quotation.Id }, quotation);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Quotation>> Update(int id, [FromBody] UpdateQuotationRequest req)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            var updated = await _quotationService.UpdateQuotationAsync(id, req.Subtotal, req.Notes, userId);
            return Ok(updated);
        }

        [HttpPost("{id}/accept")]
        public async Task<ActionResult> Accept(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _quotationService.AcceptQuotationAsync(id, userId);
            return NoContent();
        }

        [HttpPost("{id}/reject")]
        public async Task<ActionResult> Reject(int id, [FromBody] RejectRequest req)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _quotationService.RejectQuotationAsync(id, req.Reason, userId);
            return NoContent();
        }
    }

    public class RejectRequest
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class UpdateQuotationRequest
    {
        public decimal Subtotal { get; set; }
        public string? Notes { get; set; }
    }
}

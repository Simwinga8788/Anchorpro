using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class ContractsController : ControllerBase
    {
        private readonly IContractService _contractService;

        public ContractsController(IContractService contractService)
        {
            _contractService = contractService;
        }

        /// <summary>GET /api/contracts — All service contracts.</summary>
        [HttpGet]
        public async Task<ActionResult<List<Contract>>> GetAll()
            => Ok(await _contractService.GetAllContractsAsync());

        /// <summary>GET /api/contracts/{id}</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Contract>> GetById(int id)
        {
            var result = await _contractService.GetContractByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>GET /api/contracts/customer/{customerId} — Contracts for a specific customer.</summary>
        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult<List<Contract>>> GetByCustomer(int customerId)
            => Ok(await _contractService.GetContractsByCustomerIdAsync(customerId));

        /// <summary>
        /// GET /api/contracts/{id}/sla
        /// Returns: TotalJobs, JobsWithinSLA, JobsBreachedSLA, ComplianceRate (%), AverageResolutionTime (hours)
        /// </summary>
        [HttpGet("{id}/sla")]
        public async Task<ActionResult<SLAPerformance>> GetSLA(int id)
            => Ok(await _contractService.GetSLAPerformanceAsync(id));

        /// <summary>POST /api/contracts — Create a new contract.</summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Contract contract)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _contractService.CreateContractAsync(contract, userId);
            return CreatedAtAction(nameof(GetById), new { id = contract.Id }, contract);
        }

        /// <summary>PUT /api/contracts/{id}</summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] Contract contract)
        {
            if (id != contract.Id) return BadRequest("ID mismatch.");
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _contractService.UpdateContractAsync(contract, userId);
            return NoContent();
        }

        /// <summary>POST /api/contracts/{id}/cancel — Soft-cancel a contract.</summary>
        [HttpPost("{id}/cancel")]
        public async Task<ActionResult> Cancel(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _contractService.CancelContractAsync(id, userId);
            return NoContent();
        }
    }
}

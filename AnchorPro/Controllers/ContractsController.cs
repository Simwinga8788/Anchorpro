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
    public class ContractsController : ControllerBase
    {
        private readonly IContractService _contractService;
        private readonly UserManager<ApplicationUser> _userManager;

        public ContractsController(IContractService contractService, UserManager<ApplicationUser> userManager)
        {
            _contractService = contractService;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll()
        {
            var contracts = await _contractService.GetAllContractsAsync();
            return Ok(contracts);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            var contract = await _contractService.GetContractByIdAsync(id);
            if (contract == null) return NotFound();
            return Ok(contract);
        }

        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult> GetByCustomer(int customerId)
        {
            var contracts = await _contractService.GetContractsByCustomerIdAsync(customerId);
            return Ok(contracts);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Contract contract)
        {
            var userId = _userManager.GetUserId(User) ?? "";
            await _contractService.CreateContractAsync(contract, userId);
            return Ok(contract);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] Contract contract)
        {
            contract.Id = id;
            var userId = _userManager.GetUserId(User) ?? "";
            await _contractService.UpdateContractAsync(contract, userId);
            return NoContent();
        }

        [HttpPatch("{id}/cancel")]
        public async Task<ActionResult> Cancel(int id)
        {
            var userId = _userManager.GetUserId(User) ?? "";
            await _contractService.CancelContractAsync(id, userId);
            return NoContent();
        }

        [HttpGet("{id}/sla")]
        public async Task<ActionResult> GetSla(int id)
        {
            var sla = await _contractService.GetSLAPerformanceAsync(id);
            return Ok(sla);
        }
    }
}

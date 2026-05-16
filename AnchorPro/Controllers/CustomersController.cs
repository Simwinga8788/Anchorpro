using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        public CustomersController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        /// <summary>GET /api/customers</summary>
        [HttpGet]
        public async Task<ActionResult<List<Customer>>> GetAll()
            => Ok(await _customerService.GetAllCustomersAsync());

        /// <summary>GET /api/customers/{id}</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetById(int id)
        {
            var result = await _customerService.GetCustomerByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>GET /api/customers/{id}/full — Includes job card navigation.</summary>
        [HttpGet("{id}/full")]
        public async Task<ActionResult<Customer>> GetWithJobs(int id)
        {
            var result = await _customerService.GetCustomerWithJobsAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>
        /// GET /api/customers/{id}/stats
        /// Returns: TotalJobs, CompletedJobs, OpenJobs, TotalRevenue, LastServiceDate
        /// </summary>
        [HttpGet("{id}/stats")]
        public async Task<ActionResult<CustomerStats>> GetStats(int id)
            => Ok(await _customerService.GetCustomerStatsAsync(id));

        /// <summary>POST /api/customers</summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Customer customer)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _customerService.CreateCustomerAsync(customer, userId);
            return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
        }

        /// <summary>PUT /api/customers/{id}</summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] Customer customer)
        {
            if (id != customer.Id) return BadRequest("ID mismatch.");
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _customerService.UpdateCustomerAsync(customer, userId);
            return NoContent();
        }

        /// <summary>DELETE /api/customers/{id}</summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _customerService.DeleteCustomerAsync(id);
            return NoContent();
        }
    }
}

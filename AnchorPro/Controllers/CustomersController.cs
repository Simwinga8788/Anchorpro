using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public CustomersController(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        [HttpGet]
        public async Task<ActionResult<List<Customer>>> GetAll()
        {
            using var context = await _factory.CreateDbContextAsync();
            return await context.Customers.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Customer>> Create(Customer customer)
        {
            using var context = await _factory.CreateDbContextAsync();
            customer.CreatedAt = DateTime.UtcNow;
            customer.CreatedBy = User.Identity?.Name ?? "API";
            context.Customers.Add(customer);
            await context.SaveChangesAsync();
            return Ok(customer);
        }
    }
}

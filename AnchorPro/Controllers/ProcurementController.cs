using AnchorPro.Data;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProcurementController : ControllerBase
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public ProcurementController(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        [HttpGet("orders")]
        public async Task<ActionResult<List<PurchaseOrder>>> GetPurchaseOrders()
        {
            using var context = await _factory.CreateDbContextAsync();
            var orders = await context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.JobCard)
                .Include(po => po.Items)
                .OrderByDescending(po => po.OrderDate)
                .AsNoTracking()
                .ToListAsync();

            return Ok(orders);
        }

        [HttpPost("orders")]
        public async Task<ActionResult<PurchaseOrder>> CreatePurchaseOrder(PurchaseOrder order)
        {
            using var context = await _factory.CreateDbContextAsync();
            order.CreatedAt = DateTime.UtcNow;
            order.CreatedBy = User.Identity?.Name ?? "API";
            order.OrderDate = DateTime.UtcNow;
            
            // Calculate total from items
            if (order.Items != null && order.Items.Any())
            {
                foreach (var item in order.Items)
                {
                    item.LineTotal = item.QuantityOrdered * item.UnitCost;
                    item.CreatedAt = DateTime.UtcNow;
                    item.CreatedBy = order.CreatedBy;
                }
                order.TotalAmount = order.Items.Sum(i => i.LineTotal);
            }

            context.PurchaseOrders.Add(order);
            await context.SaveChangesAsync();
            return Ok(order);
        }
        
        [HttpGet("suppliers")]
        public async Task<ActionResult<List<Supplier>>> GetSuppliers()
        {
            using var context = await _factory.CreateDbContextAsync();
            return await context.Suppliers.AsNoTracking().ToListAsync();
        }

        [HttpPost("suppliers")]
        public async Task<ActionResult<Supplier>> CreateSupplier([FromBody] Supplier supplier)
        {
            using var context = await _factory.CreateDbContextAsync();
            supplier.CreatedAt = DateTime.UtcNow;
            supplier.CreatedBy = User.Identity?.Name ?? "API";
            context.Suppliers.Add(supplier);
            await context.SaveChangesAsync();
            return Ok(supplier);
        }

        [HttpDelete("suppliers/{id}")]
        public async Task<ActionResult> DeleteSupplier(int id)
        {
            using var context = await _factory.CreateDbContextAsync();
            var supplier = await context.Suppliers.FindAsync(id);
            if (supplier == null) return NotFound();
            context.Suppliers.Remove(supplier);
            await context.SaveChangesAsync();
            return NoContent();
        }
    }
}

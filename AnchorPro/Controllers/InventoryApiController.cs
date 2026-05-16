using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/inventory")]
    [Authorize]
    [ApiController]
    public class InventoryApiController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryApiController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        /// <summary>GET /api/inventory — All inventory items.</summary>
        [HttpGet]
        public async Task<ActionResult<List<InventoryItem>>> GetAll()
            => Ok(await _inventoryService.GetAllItemsAsync());

        /// <summary>GET /api/inventory/{id}</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryItem>> GetById(int id)
        {
            var result = await _inventoryService.GetItemByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>POST /api/inventory — Create a new inventory item.</summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Storeman,Purchasing")]
        public async Task<ActionResult> Create([FromBody] InventoryItem item)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _inventoryService.CreateItemAsync(item, userId);
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        }

        /// <summary>PUT /api/inventory/{id} — Update item details (not stock levels).</summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Storeman,Purchasing")]
        public async Task<ActionResult> Update(int id, [FromBody] InventoryItem item)
        {
            if (id != item.Id) return BadRequest("ID mismatch.");
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _inventoryService.UpdateItemAsync(item, userId);
            return NoContent();
        }

        /// <summary>DELETE /api/inventory/{id}</summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Delete(int id)
        {
            await _inventoryService.DeleteItemAsync(id);
            return NoContent();
        }

        /// <summary>
        /// POST /api/inventory/{id}/adjust
        /// Body: { "quantityAdjustment": -5, "reason": "Manual count correction" }
        /// Use positive values to add stock, negative to deduct.
        /// </summary>
        [HttpPost("{id}/adjust")]
        [Authorize(Roles = "Admin,Storeman,Purchasing")]
        public async Task<ActionResult> AdjustStock(int id, [FromBody] StockAdjustmentRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _inventoryService.AdjustStockAsync(id, req.QuantityAdjustment, userId, req.Reason);
            return NoContent();
        }

        /// <summary>
        /// POST /api/inventory/{id}/reserve
        /// Body: { "quantity": 5, "jobCardId": 123 }
        /// Deducts from available stock and adds a reservation audit log to prevent over-allocation.
        /// </summary>
        [HttpPost("{id}/reserve")]
        public async Task<ActionResult> ReserveStock(int id, [FromBody] ReserveStockRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            string reason = $"Reservation for Job #{req.JobCardId}";
            await _inventoryService.AdjustStockAsync(id, -req.Quantity, userId, reason);
            return NoContent();
        }
    }

    public class StockAdjustmentRequest
    {
        public int QuantityAdjustment { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class ReserveStockRequest
    {
        public int Quantity { get; set; }
        public int JobCardId { get; set; }
    }
}

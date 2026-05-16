using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/procurement")]
    [Authorize]
    [ApiController]
    public class ProcurementController : ControllerBase
    {
        private readonly IProcurementService _procurementService;

        public ProcurementController(IProcurementService procurementService)
        {
            _procurementService = procurementService;
        }

        // ── PURCHASE ORDERS ───────────────────────────────────────────────────

        /// <summary>GET /api/procurement/orders — All purchase orders with supplier + items.</summary>
        [HttpGet("orders")]
        public async Task<ActionResult<List<PurchaseOrder>>> GetPurchaseOrders()
            => Ok(await _procurementService.GetAllPurchaseOrdersAsync());

        /// <summary>GET /api/procurement/orders/{id}</summary>
        [HttpGet("orders/{id}")]
        public async Task<ActionResult<PurchaseOrder>> GetPurchaseOrderById(int id)
        {
            var result = await _procurementService.GetPurchaseOrderByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>GET /api/procurement/orders/job/{jobCardId} — POs linked to a specific job card.</summary>
        [HttpGet("orders/job/{jobCardId}")]
        public async Task<ActionResult<List<PurchaseOrder>>> GetByJobCard(int jobCardId)
            => Ok(await _procurementService.GetPurchaseOrdersByJobCardIdAsync(jobCardId));

        /// <summary>
        /// POST /api/procurement/orders — Create a PO with line items.
        /// PoType: 0=InventoryReplenishment, 1=DirectPurchase, 2=Subcontracting
        /// Service calculates LineTotals and TotalAmount automatically.
        /// </summary>
        [HttpPost("orders")]
        [Authorize(Roles = "Admin,Purchasing,Storeman")]
        public async Task<ActionResult<PurchaseOrder>> CreatePurchaseOrder([FromBody] CreatePurchaseOrderRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            var created = await _procurementService.CreatePurchaseOrderAsync(req.PurchaseOrder, req.Items, userId);
            return CreatedAtAction(nameof(GetPurchaseOrderById), new { id = created.Id }, created);
        }

        /// <summary>
        /// PATCH /api/procurement/orders/{id}/status
        /// Body: integer enum value (0=Draft, 1=Submitted, 2=PartiallyReceived, 3=Received, 4=Cancelled)
        /// </summary>
        [HttpPatch("orders/{id}/status")]
        public async Task<ActionResult> UpdateOrderStatus(int id, [FromBody] PurchaseOrderStatus status)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _procurementService.UpdatePurchaseOrderStatusAsync(id, status, userId);
            return NoContent();
        }

        /// <summary>
        /// POST /api/procurement/orders/{id}/receive
        /// Body: [{ "itemId": 3, "quantity": 10 }, ...]
        /// For InventoryReplenishment POs this automatically adds stock to inventory.
        /// </summary>
        [HttpPost("orders/{id}/receive")]
        [Authorize(Roles = "Admin,Purchasing,Storeman")]
        public async Task<ActionResult> ReceiveItems(int id, [FromBody] List<ReceiveItemRequest> items)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            var tuples = items.Select(i => (i.ItemId, i.Quantity)).ToList();
            await _procurementService.ReceiveItemsAsync(id, tuples, userId);
            return NoContent();
        }

        // ── SUPPLIERS ─────────────────────────────────────────────────────────

        /// <summary>GET /api/procurement/suppliers</summary>
        [HttpGet("suppliers")]
        public async Task<ActionResult<List<Supplier>>> GetSuppliers()
            => Ok(await _procurementService.GetAllSuppliersAsync());

        /// <summary>GET /api/procurement/suppliers/{id}</summary>
        [HttpGet("suppliers/{id}")]
        public async Task<ActionResult<Supplier>> GetSupplierById(int id)
        {
            var result = await _procurementService.GetSupplierByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>POST /api/procurement/suppliers</summary>
        [HttpPost("suppliers")]
        public async Task<ActionResult> CreateSupplier([FromBody] Supplier supplier)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _procurementService.CreateSupplierAsync(supplier, userId);
            return CreatedAtAction(nameof(GetSupplierById), new { id = supplier.Id }, supplier);
        }

        /// <summary>PUT /api/procurement/suppliers/{id}</summary>
        [HttpPut("suppliers/{id}")]
        public async Task<ActionResult> UpdateSupplier(int id, [FromBody] Supplier supplier)
        {
            if (id != supplier.Id) return BadRequest("ID mismatch.");
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _procurementService.UpdateSupplierAsync(supplier, userId);
            return NoContent();
        }

        /// <summary>DELETE /api/procurement/suppliers/{id}</summary>
        [HttpDelete("suppliers/{id}")]
        [Authorize(Roles = "Admin,Purchasing")]
        public async Task<ActionResult> DeleteSupplier(int id)
        {
            await _procurementService.DeleteSupplierAsync(id);
            return NoContent();
        }
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public class CreatePurchaseOrderRequest
    {
        public PurchaseOrder PurchaseOrder { get; set; } = new();
        public List<PurchaseOrderItem> Items { get; set; } = new();
    }

    public class ReceiveItemRequest
    {
        public int ItemId { get; set; }
        public int Quantity { get; set; }
    }
}

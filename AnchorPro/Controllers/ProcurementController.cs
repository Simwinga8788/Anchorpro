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

        /// <summary>GET /api/procurement/orders/pending-approval — Finance approval queue.</summary>
        [HttpGet("orders/pending-approval")]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult<List<PurchaseOrder>>> GetPendingApproval()
            => Ok(await _procurementService.GetPendingApprovalOrdersAsync());

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
        public class UpdateOrderStatusRequest
        {
            public PurchaseOrderStatus Status { get; set; }
        }

        [HttpPatch("orders/{id}/status")]
        public async Task<ActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _procurementService.UpdatePurchaseOrderStatusAsync(id, req.Status, userId);
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

        // ── APPROVAL WORKFLOW ──────────────────────────────────────────────────

        public class RejectPORequest { public string? Reason { get; set; } }

        /// <summary>
        /// POST /api/procurement/orders/{id}/send-for-approval
        /// Moves PO from Submitted → PendingApproval for Finance review.
        /// </summary>
        [HttpPost("orders/{id}/send-for-approval")]
        [Authorize(Roles = "Admin,Purchasing,Storeman")]
        public async Task<ActionResult> SendForApproval(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _procurementService.UpdatePurchaseOrderStatusAsync(id, PurchaseOrderStatus.PendingApproval, userId);
            return NoContent();
        }

        /// <summary>
        /// POST /api/procurement/orders/{id}/approve
        /// Finance approves the PO. Requires Admin or Finance role.
        /// </summary>
        [HttpPost("orders/{id}/approve")]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult> ApprovePO(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _procurementService.ApprovePurchaseOrderAsync(id, userId);
            return NoContent();
        }

        /// <summary>
        /// POST /api/procurement/orders/{id}/reject
        /// Finance rejects the PO with a reason. Requires Admin or Finance role.
        /// </summary>
        [HttpPost("orders/{id}/reject")]
        [Authorize(Roles = "Admin,Finance")]
        public async Task<ActionResult> RejectPO(int id, [FromBody] RejectPORequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _procurementService.RejectPurchaseOrderAsync(id, req.Reason ?? "No reason provided", userId);
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

        // ── PURCHASE REQUISITIONS ─────────────────────────────────────────────

        /// <summary>GET /api/procurement/requisitions — All purchase requisitions.</summary>
        [HttpGet("requisitions")]
        public async Task<ActionResult<List<PurchaseRequisition>>> GetPurchaseRequisitions()
            => Ok(await _procurementService.GetAllPurchaseRequisitionsAsync());

        /// <summary>GET /api/procurement/requisitions/pending-approval — Manager/Finance review queue.</summary>
        [HttpGet("requisitions/pending-approval")]
        [Authorize(Roles = "Admin,Finance,Supervisor")]
        public async Task<ActionResult<List<PurchaseRequisition>>> GetPendingApprovalRequisitions()
            => Ok(await _procurementService.GetPendingApprovalRequisitionsAsync());

        /// <summary>GET /api/procurement/requisitions/{id}</summary>
        [HttpGet("requisitions/{id}")]
        public async Task<ActionResult<PurchaseRequisition>> GetPurchaseRequisitionById(int id)
        {
            var result = await _procurementService.GetPurchaseRequisitionByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>GET /api/procurement/requisitions/job/{jobCardId} — PRs linked to a job card.</summary>
        [HttpGet("requisitions/job/{jobCardId}")]
        public async Task<ActionResult<List<PurchaseRequisition>>> GetRequisitionsByJobCard(int jobCardId)
            => Ok(await _procurementService.GetPurchaseRequisitionsByJobCardIdAsync(jobCardId));

        /// <summary>
        /// POST /api/procurement/requisitions — Raise a new Purchase Requisition.
        /// Can be operational (JobCardId) or departmental (DepartmentId).
        /// </summary>
        [HttpPost("requisitions")]
        public async Task<ActionResult<PurchaseRequisition>> CreatePurchaseRequisition([FromBody] CreatePurchaseRequisitionRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            
            // If the user wants to submit immediately rather than save as draft:
            // We can set status to PendingApproval on creation.
            // If they are in a Supervisor/Admin/Finance role, it can be auto-approved,
            // but normally it defaults to PendingApproval if submitted.
            if (req.SubmitImmediately)
            {
                req.PurchaseRequisition.Status = PurchaseRequisitionStatus.PendingApproval;
            }
            else
            {
                req.PurchaseRequisition.Status = PurchaseRequisitionStatus.Draft;
            }

            var created = await _procurementService.CreatePurchaseRequisitionAsync(req.PurchaseRequisition, req.Items, userId);
            return CreatedAtAction(nameof(GetPurchaseRequisitionById), new { id = created.Id }, created);
        }

        /// <summary>
        /// POST /api/procurement/requisitions/{id}/approve — Approve a requisition.
        /// Requires Admin, Finance, or Supervisor roles.
        /// </summary>
        [HttpPost("requisitions/{id}/approve")]
        [Authorize(Roles = "Admin,Finance,Supervisor")]
        public async Task<ActionResult> ApproveRequisition(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _procurementService.ApprovePurchaseRequisitionAsync(id, userId);
            return NoContent();
        }

        /// <summary>
        /// POST /api/procurement/requisitions/{id}/reject — Reject a requisition with a reason.
        /// Requires Admin, Finance, or Supervisor roles.
        /// </summary>
        [HttpPost("requisitions/{id}/reject")]
        [Authorize(Roles = "Admin,Finance,Supervisor")]
        public async Task<ActionResult> RejectRequisition(int id, [FromBody] RejectRequisitionRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _procurementService.RejectPurchaseRequisitionAsync(id, req.Reason ?? "No reason provided", userId);
            return NoContent();
        }

        /// <summary>
        /// POST /api/procurement/requisitions/{id}/submit — Submit a draft requisition for approval.
        /// </summary>
        [HttpPost("requisitions/{id}/submit")]
        public async Task<ActionResult> SubmitRequisition(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _procurementService.UpdatePurchaseRequisitionStatusAsync(id, PurchaseRequisitionStatus.PendingApproval, userId);
            return NoContent();
        }

        /// <summary>
        /// POST /api/procurement/requisitions/{id}/convert-to-po — Convert approved PR into PO.
        /// Requires Admin, Purchasing, or Storeman roles.
        /// </summary>
        [HttpPost("requisitions/{id}/convert-to-po")]
        [Authorize(Roles = "Admin,Purchasing,Storeman")]
        public async Task<ActionResult<PurchaseOrder>> ConvertToPO(int id, [FromBody] ConvertToPORequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            var po = await _procurementService.ConvertRequisitionToPOAsync(id, req.SupplierId, userId);
            return Ok(po);
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

    public class CreatePurchaseRequisitionRequest
    {
        public PurchaseRequisition PurchaseRequisition { get; set; } = new();
        public List<PurchaseRequisitionItem> Items { get; set; } = new();
        public bool SubmitImmediately { get; set; } = true;
    }

    public class RejectRequisitionRequest
    {
        public string? Reason { get; set; }
    }

    public class ConvertToPORequest
    {
        public int SupplierId { get; set; }
    }
}

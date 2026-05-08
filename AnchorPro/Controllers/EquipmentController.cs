using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Full Equipment management. Canonical endpoint at api/equipment.
    /// (Replaces the old split between EquipmentApiController and EquipmentController)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentController : ControllerBase
    {
        private readonly IEquipmentService _service;

        public EquipmentController(IEquipmentService service)
        {
            _service = service;
        }

        // ── LIST / GET ────────────────────────────────────────────────────────

        /// <summary>GET /api/equipment — All equipment for the current tenant.</summary>
        [HttpGet]
        public async Task<ActionResult<List<Equipment>>> GetAll()
            => Ok(await _service.GetAllEquipmentAsync());

        /// <summary>GET /api/equipment/{id}</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Equipment>> GetById(int id)
        {
            var result = await _service.GetEquipmentByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>GET /api/equipment/{id}/history</summary>
        [HttpGet("{id}/history")]
        public async Task<ActionResult<List<JobCard>>> GetHistory(int id)
        {
            var result = await _service.GetEquipmentHistoryAsync(id);
            return Ok(result);
        }

        // ── CREATE / UPDATE / DELETE ──────────────────────────────────────────

        /// <summary>
        /// POST /api/equipment — Register a new piece of equipment.
        /// Body: { "name": "CAT 777G", "serialNumber": "SN-001", "departmentId": 2 }
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Equipment equipment)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _service.CreateEquipmentAsync(equipment, userId);
            return CreatedAtAction(nameof(GetById), new { id = equipment.Id }, equipment);
        }

        /// <summary>PUT /api/equipment/{id} — Update equipment details.</summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] Equipment equipment)
        {
            if (id != equipment.Id) return BadRequest("ID mismatch.");
            var userId = User.Identity?.Name ?? "API_User";
            await _service.UpdateEquipmentAsync(equipment, userId);
            return NoContent();
        }

        /// <summary>DELETE /api/equipment/{id}</summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _service.DeleteEquipmentAsync(id);
            return NoContent();
        }
    }
}

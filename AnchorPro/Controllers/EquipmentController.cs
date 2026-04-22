using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentController : ControllerBase
    {
        private readonly IEquipmentService _service;

        public EquipmentController(IEquipmentService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<List<Equipment>>> GetAll()
        {
            var result = await _service.GetAllEquipmentAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Equipment>> GetById(int id)
        {
            var result = await _service.GetEquipmentByIdAsync(id);
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Equipment equipment)
        {
            // Simple string 'userId' logic for now (mock user or from token)
            var userId = User.Identity?.Name ?? "API_User";
            await _service.CreateEquipmentAsync(equipment, userId);
            return CreatedAtAction(nameof(GetById), new { id = equipment.Id }, equipment);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] Equipment equipment)
        {
            if (id != equipment.Id)
            {
                return BadRequest("ID mismatch");
            }

            var userId = User.Identity?.Name ?? "API_User";
            await _service.UpdateEquipmentAsync(equipment, userId);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _service.DeleteEquipmentAsync(id);
            return NoContent();
        }
    }
}

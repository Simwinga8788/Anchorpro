using AnchorPro.Services.Interfaces;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentApiController : ControllerBase
    {
        private readonly IEquipmentService _equipmentService;
        public EquipmentApiController(IEquipmentService equipmentService) => _equipmentService = equipmentService;

        [HttpGet]
        public async Task<ActionResult<List<Equipment>>> GetAll()
            => Ok(await _equipmentService.GetAllEquipmentAsync());

        [HttpGet("{id}")]
        public async Task<ActionResult<Equipment>> GetById(int id)
        {
            var e = await _equipmentService.GetEquipmentByIdAsync(id);
            return e == null ? NotFound() : Ok(e);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Equipment equip)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _equipmentService.CreateEquipmentAsync(equip, userId);
            return Ok(equip);
        }
    }
}

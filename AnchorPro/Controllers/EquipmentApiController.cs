using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EquipmentApiController : ControllerBase
    {
        private readonly IEquipmentService _equipmentService;
        private readonly UserManager<ApplicationUser> _userManager;

        public EquipmentApiController(IEquipmentService equipmentService, UserManager<ApplicationUser> userManager)
        {
            _equipmentService = equipmentService;
            _userManager = userManager;
        }

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
            var user = await _userManager.GetUserAsync(User);
            var userId = user?.Id ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "API_User";
            await _equipmentService.CreateEquipmentAsync(equip, userId);
            return Ok(equip);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] Equipment equip)
        {
            equip.Id = id;
            var user = await _userManager.GetUserAsync(User);
            var userId = user?.Id ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "API_User";
            await _equipmentService.UpdateEquipmentAsync(equip, userId);
            return Ok(equip);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _equipmentService.DeleteEquipmentAsync(id);
            return NoContent();
        }
    }
}

using AnchorPro.Services.Interfaces;
using AnchorPro.Data.Entities;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryApiController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;
        public InventoryApiController(IInventoryService inventoryService) => _inventoryService = inventoryService;

        [HttpGet]
        public async Task<ActionResult<List<InventoryItem>>> GetAll()
            => Ok(await _inventoryService.GetAllItemsAsync());

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] InventoryItem item)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _inventoryService.CreateItemAsync(item, userId);
            return Ok(item);
        }
    }
}

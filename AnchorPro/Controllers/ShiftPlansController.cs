using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ShiftPlansController(IShiftPlanService _service) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<List<ShiftPlan>>> GetAll()
        {
            var res = await _service.GetAllAsync();
            return Ok(res);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ShiftPlan>> GetById(int id)
        {
            var res = await _service.GetByIdAsync(id);
            if (res == null) return NotFound();
            return Ok(res);
        }

        [HttpPost]
        public async Task<ActionResult<ShiftPlan>> Create([FromBody] ShiftPlan plan)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var res = await _service.CreateAsync(plan, userId);
            return CreatedAtAction(nameof(GetById), new { id = res.Id }, res);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ShiftPlan plan)
        {
            if (id != plan.Id) return BadRequest();
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            try
            {
                await _service.UpdateAsync(plan, userId);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }

        [HttpPost("{id}/generate-actuals")]
        public async Task<IActionResult> GenerateActuals(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            try
            {
                var log = await _service.GenerateActualsAsync(id, userId);
                return Ok(log);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }
    }
}

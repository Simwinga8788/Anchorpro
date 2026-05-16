using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class DepartmentsController : ControllerBase
    {
        private readonly IOrgService _orgService;

        public DepartmentsController(IOrgService orgService)
        {
            _orgService = orgService;
        }

        /// <summary>GET /api/departments — All departments.</summary>
        [HttpGet]
        public async Task<ActionResult<List<Department>>> GetAll()
            => Ok(await _orgService.GetAllDepartmentsAsync());

        /// <summary>GET /api/departments/{id}</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Department>> GetById(int id)
        {
            var result = await _orgService.GetDepartmentByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>POST /api/departments</summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Department department)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _orgService.CreateDepartmentAsync(department, userId);
            return CreatedAtAction(nameof(GetById), new { id = department.Id }, department);
        }

        /// <summary>PUT /api/departments/{id}</summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] Department department)
        {
            if (id != department.Id) return BadRequest("ID mismatch.");
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _orgService.UpdateDepartmentAsync(department, userId);
            return NoContent();
        }

        /// <summary>DELETE /api/departments/{id}</summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _orgService.DeleteDepartmentAsync(id);
            return NoContent();
        }
    }
}

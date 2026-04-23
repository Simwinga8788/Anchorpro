using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AnchorPro.Data;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrgController : ControllerBase
    {
        private readonly IOrgService _orgService;
        private readonly UserManager<ApplicationUser> _userManager;

        public OrgController(IOrgService orgService, UserManager<ApplicationUser> userManager)
        {
            _orgService = orgService;
            _userManager = userManager;
        }

        [HttpGet("departments")]
        public async Task<ActionResult> GetDepartments()
        {
            var depts = await _orgService.GetAllDepartmentsAsync();
            return Ok(depts);
        }

        [HttpGet("departments/{id}")]
        public async Task<ActionResult> GetDepartment(int id)
        {
            var dept = await _orgService.GetDepartmentByIdAsync(id);
            if (dept == null) return NotFound();
            return Ok(dept);
        }

        [HttpPost("departments")]
        public async Task<ActionResult> CreateDepartment([FromBody] Department department)
        {
            var userId = _userManager.GetUserId(User) ?? "";
            await _orgService.CreateDepartmentAsync(department, userId);
            return Ok(department);
        }

        [HttpPut("departments/{id}")]
        public async Task<ActionResult> UpdateDepartment(int id, [FromBody] Department department)
        {
            department.Id = id;
            var userId = _userManager.GetUserId(User) ?? "";
            await _orgService.UpdateDepartmentAsync(department, userId);
            return NoContent();
        }

        [HttpDelete("departments/{id}")]
        public async Task<ActionResult> DeleteDepartment(int id)
        {
            await _orgService.DeleteDepartmentAsync(id);
            return NoContent();
        }
    }
}

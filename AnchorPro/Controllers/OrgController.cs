using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public OrgController(IOrgService orgService, UserManager<ApplicationUser> userManager, IDbContextFactory<ApplicationDbContext> factory)
        {
            _orgService = orgService;
            _userManager = userManager;
            _factory = factory;
        }

        // ─── Org Profile ──────────────────────────────────────────────────

        [HttpGet]
        public async Task<ActionResult> GetOrg()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user?.TenantId == null) return NotFound(new { message = "No tenant associated with this account" });
            using var ctx = await _factory.CreateDbContextAsync();
            var tenant = await ctx.Tenants.FindAsync(user.TenantId);
            if (tenant == null) return NotFound(new { message = "Tenant not found" });
            return Ok(new {
                id = tenant.Id,
                name = tenant.Name,
                address = tenant.Address,
                contactEmail = tenant.ContactEmail,
                contactPhone = tenant.ContactPhone,
                currency = "ZMW",
                isActive = tenant.IsActive
            });
        }

        [HttpPut]
        public async Task<ActionResult> UpdateOrg([FromBody] UpdateOrgRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user?.TenantId == null) return NotFound(new { message = "No tenant associated with this account" });
            using var ctx = await _factory.CreateDbContextAsync();
            var tenant = await ctx.Tenants.FindAsync(user.TenantId);
            if (tenant == null) return NotFound(new { message = "Tenant not found" });
            if (!string.IsNullOrWhiteSpace(request.Name)) tenant.Name = request.Name;
            if (request.Address != null) tenant.Address = request.Address;
            if (request.ContactEmail != null) tenant.ContactEmail = request.ContactEmail;
            if (request.ContactPhone != null) tenant.ContactPhone = request.ContactPhone;
            tenant.UpdatedAt = DateTime.UtcNow;
            tenant.UpdatedBy = _userManager.GetUserId(User);
            await ctx.SaveChangesAsync();
            return Ok(new { message = "Organisation updated" });
        }

        // ─── Departments ──────────────────────────────────────────────────

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

    public class UpdateOrgRequest
    {
        public string? Name { get; set; }
        public string? Address { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public string? Currency { get; set; }
    }
}

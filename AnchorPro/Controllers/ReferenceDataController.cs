using AnchorPro.Data.Entities;
using AnchorPro.Data;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReferenceDataController : ControllerBase
    {
        private readonly IReferenceDataService _refService;

        public ReferenceDataController(IReferenceDataService refService)
        {
            _refService = refService;
        }

        [HttpGet("jobtypes")]
        public async Task<ActionResult<List<JobType>>> GetJobTypes()
        {
            return Ok(await _refService.GetJobTypesAsync());
        }

        [HttpGet("downtimecategories")]
        public async Task<ActionResult<List<DowntimeCategory>>> GetDowntimeCategories()
        {
            return Ok(await _refService.GetDowntimeCategoriesAsync());
        }

        [HttpGet("equipment")]
        public async Task<ActionResult<List<Equipment>>> GetEquipment()
        {
            return Ok(await _refService.GetEquipmentAsync());
        }

        [HttpGet("customers")]
        public async Task<ActionResult<List<Customer>>> GetCustomers()
        {
            return Ok(await _refService.GetCustomersAsync());
        }

        [HttpGet("contracts")]
        public async Task<ActionResult<List<Contract>>> GetContracts()
        {
            return Ok(await _refService.GetContractsAsync());
        }

        [HttpGet("technicians")]
        public async Task<ActionResult> GetTechnicians()
        {
            // Returns a safe DTO — never expose the full ApplicationUser (password hashes, security stamps etc.)
            var technicians = await _refService.GetTechniciansAsync();
            var result = technicians.Select(t => new
            {
                t.Id,
                t.FirstName,
                t.LastName,
                t.Email,
                t.EmployeeNumber,
                t.DepartmentId,
                t.HourlyRate
            });
            return Ok(result);
        }

        [HttpPost("jobtypes")]
        public async Task<ActionResult> CreateJobType([FromBody] JobType item)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _refService.CreateJobTypeAsync(item, userId);
            return Ok(item);
        }

        [HttpPost("downtimecategories")]
        public async Task<ActionResult> CreateDowntimeCategory([FromBody] DowntimeCategory item)
        {
            var userId = User.Identity?.Name ?? "API_User";
            await _refService.CreateDowntimeCategoryAsync(item, userId);
            return Ok(item);
        }

        [HttpDelete("jobtypes/{id}")]
        public async Task<ActionResult> DeleteJobType(int id)
        {
            await _refService.DeleteJobTypeAsync(id);
            return NoContent();
        }

        [HttpDelete("downtimecategories/{id}")]
        public async Task<ActionResult> DeleteDowntimeCategory(int id)
        {
            await _refService.DeleteDowntimeCategoryAsync(id);
            return NoContent();
        }
    }
}

using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// REST API for Shift Production Logs — used by Mining & Extraction tenants (OperationMode = 1).
    /// Base route: /api/shift-logs
    /// </summary>
    [ApiController]
    [Route("api/shift-logs")]
    [Authorize]
    public class ShiftProductionLogsController(IShiftProductionLogService _service) : ControllerBase
    {
        private string UserId =>
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";

        /// <summary>GET /api/shift-logs — All shift logs for this tenant.</summary>
        [HttpGet]
        public async Task<ActionResult<List<ShiftProductionLog>>> GetAll()
            => Ok(await _service.GetAllAsync());

        /// <summary>GET /api/shift-logs/unbilled — All approved shift logs that have not been invoiced yet.</summary>
        [HttpGet("unbilled")]
        public async Task<ActionResult<List<ShiftProductionLog>>> GetUnbilled()
            => Ok(await _service.GetUnbilledAsync());

        /// <summary>GET /api/shift-logs/{id}</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ShiftProductionLog>> GetById(int id)
        {
            var log = await _service.GetByIdAsync(id);
            return log == null ? NotFound() : Ok(log);
        }

        /// <summary>GET /api/shift-logs/equipment/{equipmentId}</summary>
        [HttpGet("equipment/{equipmentId}")]
        public async Task<ActionResult<List<ShiftProductionLog>>> GetByEquipment(int equipmentId)
            => Ok(await _service.GetByEquipmentAsync(equipmentId));

        /// <summary>
        /// GET /api/shift-logs/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
        /// Returns totals and Cost Per Unit for the given date range.
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult<ShiftProductionSummary>> GetSummary(
            [FromQuery] DateTime from, [FromQuery] DateTime to)
            => Ok(await _service.GetSummaryAsync(from, to));

        /// <summary>
        /// GET /api/shift-logs/chart-data?days=30
        /// Returns aggregated daily actual vs target for charts.
        /// </summary>
        [HttpGet("chart-data")]
        public async Task<ActionResult<List<ShiftProductionChartData>>> GetChartData([FromQuery] int days = 30)
            => Ok(await _service.GetChartDataAsync(days));

        /// <summary>POST /api/shift-logs — Create a new Draft shift log.</summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Operator,Supervisor,Storeman")]
        public async Task<ActionResult<ShiftProductionLog>> Create([FromBody] ShiftProductionLog log)
        {
            var created = await _service.CreateAsync(log, UserId);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        /// <summary>PUT /api/shift-logs/{id} — Update a Draft shift log.</summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Operator,Supervisor")]
        public async Task<IActionResult> Update(int id, [FromBody] ShiftProductionLog log)
        {
            if (log.Id != id) return BadRequest(new { message = "ID mismatch." });
            try
            {
                await _service.UpdateAsync(log, UserId);
                return NoContent();
            }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>POST /api/shift-logs/{id}/submit — Submit for supervisor approval.</summary>
        [HttpPost("{id}/submit")]
        public async Task<IActionResult> Submit(int id)
        {
            try { await _service.SubmitForApprovalAsync(id, UserId); return NoContent(); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>POST /api/shift-logs/{id}/approve — Approve a submitted shift log.</summary>
        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin,Supervisor,Manager")]
        public async Task<IActionResult> Approve(int id)
        {
            try { await _service.ApproveAsync(id, UserId); return NoContent(); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>POST /api/shift-logs/{id}/reject</summary>
        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Admin,Supervisor,Manager")]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectRequest req)
        {
            try { await _service.RejectAsync(id, req.Reason, UserId); return NoContent(); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>DELETE /api/shift-logs/{id}</summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Supervisor")]
        public async Task<IActionResult> Delete(int id)
        {
            try { await _service.DeleteAsync(id); return NoContent(); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        public record RejectRequest(string Reason);
    }
}

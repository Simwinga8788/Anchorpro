using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    /// <summary>
    /// Full Equipment management. Canonical endpoint at api/equipment.
    /// (Replaces the old split between EquipmentApiController and EquipmentController)
    /// </summary>
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class EquipmentController : ControllerBase
    {
        private readonly IEquipmentService _service;

        public EquipmentController(IEquipmentService service)
        {
            _service = service;
        }

        // ── LIST / GET ────────────────────────────────────────────────────────

        /// <summary>GET /api/equipment — All equipment for the current tenant.</summary>
        [HttpGet]
        public async Task<ActionResult<List<Equipment>>> GetAll()
            => Ok(await _service.GetAllEquipmentAsync());

        /// <summary>GET /api/equipment/{id}</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Equipment>> GetById(int id)
        {
            var result = await _service.GetEquipmentByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>GET /api/equipment/{id}/history</summary>
        [HttpGet("{id}/history")]
        public async Task<ActionResult<List<JobCard>>> GetHistory(int id)
        {
            var result = await _service.GetEquipmentHistoryAsync(id);
            return Ok(result);
        }

        // ── CREATE / UPDATE / DELETE ──────────────────────────────────────────

        /// <summary>
        /// POST /api/equipment — Register a new piece of equipment.
        /// Body: { "name": "CAT 777G", "serialNumber": "SN-001", "departmentId": 2 }
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Equipment equipment)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _service.CreateEquipmentAsync(equipment, userId);
            return CreatedAtAction(nameof(GetById), new { id = equipment.Id }, equipment);
        }

        /// <summary>PUT /api/equipment/{id} — Update equipment details.</summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] Equipment equipment)
        {
            if (id != equipment.Id) return BadRequest("ID mismatch.");
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _service.UpdateEquipmentAsync(equipment, userId);
            return NoContent();
        }

        /// <summary>DELETE /api/equipment/{id}</summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            await _service.DeleteEquipmentAsync(id);
            return NoContent();
        }

        /// <summary>
        /// POST /api/equipment/import
        /// Form-data: "file" (CSV or XLSX file)
        /// Imports equipment items in bulk.
        /// </summary>
        [HttpPost("import")]
        [Authorize(Roles = "Admin,Supervisor,Planner")]
        public async Task<ActionResult> Import(Microsoft.AspNetCore.Http.IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded." });
            }

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            try
            {
                string csvContent;
                var fileExtension = System.IO.Path.GetExtension(file.FileName).ToLower();

                if (fileExtension == ".xlsx")
                {
                    using var workbook = new ClosedXML.Excel.XLWorkbook(file.OpenReadStream());
                    var worksheet = workbook.Worksheets.First();
                    var lastCol = worksheet.LastColumnUsed()?.ColumnNumber() ?? 10;
                    var rows = worksheet.RowsUsed();
                    var csvBuilder = new System.Text.StringBuilder();

                    foreach (var row in rows)
                    {
                        var rowValues = new List<string>();
                        for (int col = 1; col <= lastCol; col++)
                        {
                            var cellValue = row.Cell(col).Value.ToString() ?? "";
                            if (cellValue.Contains(",") || cellValue.Contains("\"") || cellValue.Contains("\n") || cellValue.Contains("\r") || cellValue.Contains(";"))
                            {
                                cellValue = $"\"{cellValue.Replace("\"", "\"\"")}\"";
                            }
                            rowValues.Add(cellValue);
                        }
                        csvBuilder.AppendLine(string.Join(",", rowValues));
                    }
                    csvContent = csvBuilder.ToString();
                }
                else
                {
                    using var reader = new System.IO.StreamReader(file.OpenReadStream());
                    csvContent = await reader.ReadToEndAsync();
                }

                var result = await _service.ImportEquipmentFromCsvAsync(csvContent, userId);
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
                return BadRequest(new { message = msg });
            }
        }
    }
}

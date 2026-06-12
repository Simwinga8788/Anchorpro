using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers
{
    [Route("api/inventory")]
    [Authorize]
    [ApiController]
    public class InventoryApiController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryApiController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        /// <summary>GET /api/inventory — All inventory items.</summary>
        [HttpGet]
        public async Task<ActionResult<List<InventoryItem>>> GetAll()
            => Ok(await _inventoryService.GetAllItemsAsync());

        /// <summary>GET /api/inventory/{id}</summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryItem>> GetById(int id)
        {
            var result = await _inventoryService.GetItemByIdAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        /// <summary>POST /api/inventory — Create a new inventory item.</summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Storeman,Purchasing")]
        public async Task<ActionResult> Create([FromBody] InventoryItem item)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _inventoryService.CreateItemAsync(item, userId);
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        }

        /// <summary>PUT /api/inventory/{id} — Update item details (not stock levels).</summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Storeman,Purchasing")]
        public async Task<ActionResult> Update(int id, [FromBody] InventoryItem item)
        {
            if (id != item.Id) return BadRequest("ID mismatch.");
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _inventoryService.UpdateItemAsync(item, userId);
            return NoContent();
        }

        /// <summary>DELETE /api/inventory/{id}</summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Delete(int id)
        {
            await _inventoryService.DeleteItemAsync(id);
            return NoContent();
        }

        /// <summary>
        /// POST /api/inventory/{id}/adjust
        /// Body: { "quantityAdjustment": -5, "reason": "Manual count correction" }
        /// Use positive values to add stock, negative to deduct.
        /// </summary>
        [HttpPost("{id}/adjust")]
        [Authorize(Roles = "Admin,Storeman,Purchasing")]
        public async Task<ActionResult> AdjustStock(int id, [FromBody] StockAdjustmentRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            await _inventoryService.AdjustStockAsync(id, req.QuantityAdjustment, userId, req.Reason);
            return NoContent();
        }

        /// <summary>
        /// POST /api/inventory/{id}/reserve
        /// Body: { "quantity": 5, "jobCardId": 123 }
        /// Deducts from available stock and adds a reservation audit log to prevent over-allocation.
        /// </summary>
        [HttpPost("{id}/reserve")]
        public async Task<ActionResult> ReserveStock(int id, [FromBody] ReserveStockRequest req)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
            string reason = $"Reservation for Job #{req.JobCardId}";
            await _inventoryService.AdjustStockAsync(id, -req.Quantity, userId, reason);
            return NoContent();
        }

        /// <summary>
        /// POST /api/inventory/import
        /// Form-data: "file" (CSV or XLSX file)
        /// Imports inventory items in bulk.
        /// </summary>
        [HttpPost("import")]
        [Authorize(Roles = "Admin,Storeman,Purchasing")]
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

                var result = await _inventoryService.ImportInventoryFromCsvAsync(csvContent, userId);
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
                return BadRequest(new { message = msg });
            }
        }
    }

    public class StockAdjustmentRequest
    {
        public int QuantityAdjustment { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class ReserveStockRequest
    {
        public int Quantity { get; set; }
        public int JobCardId { get; set; }
    }
}

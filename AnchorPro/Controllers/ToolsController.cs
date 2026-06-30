using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnchorPro.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ToolsController(IToolService toolService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Tool>>> GetAllTools()
    {
        var tools = await toolService.GetAllToolsAsync();
        return Ok(tools);
    }

    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<Tool>>> GetAvailableTools()
    {
        var tools = await toolService.GetAvailableToolsAsync();
        return Ok(tools);
    }

    [HttpGet("issued")]
    public async Task<ActionResult<IEnumerable<ToolTransaction>>> GetIssuedTools()
    {
        var transactions = await toolService.GetIssuedToolsAsync();
        // Avoid cycle serialization issues by returning simplified DTO or trusting json options
        return Ok(transactions);
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<IEnumerable<ToolTransaction>>> GetToolHistory(int id)
    {
        var history = await toolService.GetToolHistoryAsync(id);
        return Ok(history);
    }

    [HttpPost("receive")]
    public async Task<ActionResult<Tool>> ReceiveTool([FromBody] Tool tool)
    {
        try
        {
            var createdTool = await toolService.ReceiveToolAsync(tool);
            return Ok(createdTool);
        }
        catch (System.Exception ex)
        {
            return BadRequest(ex.InnerException?.Message ?? ex.Message);
        }
    }

    public class UpdateToolRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ToolTag { get; set; } = string.Empty;
        public ToolCondition Condition { get; set; }
        public decimal? PurchaseCost { get; set; }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Tool>> UpdateTool(int id, [FromBody] UpdateToolRequest req)
    {
        try
        {
            var updated = await toolService.UpdateToolAsync(id, req.Name, req.Description, req.ToolTag, req.Condition, req.PurchaseCost);
            return Ok(updated);
        }
        catch (ArgumentException ex)   { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (Exception ex) { return BadRequest(ex.InnerException?.Message ?? ex.Message); }
    }

    public class IssueToolRequest
    {
        public int ToolId { get; set; }
        public string AssignedToUserId { get; set; } = string.Empty;
        public ToolCondition Condition { get; set; }
        public DateTime? ExpectedReturnDate { get; set; }
        public string? Notes { get; set; }
    }

    [HttpPost("issue")]
    public async Task<ActionResult<ToolTransaction>> IssueTool([FromBody] IssueToolRequest request)
    {
        try
        {
            // The current user issuing the tool
            var issuedByUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(issuedByUserId))
                return Unauthorized();

            var transaction = await toolService.IssueToolAsync(
                request.ToolId, 
                request.AssignedToUserId, 
                issuedByUserId, 
                request.Condition, 
                request.ExpectedReturnDate, 
                request.Notes);

            return Ok(transaction);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.InnerException?.Message ?? ex.Message);
        }
    }

    public class ReturnToolRequest
    {
        public int TransactionId { get; set; }
        public ToolCondition ReturnCondition { get; set; }
        public string? Notes { get; set; }
    }

    [HttpPost("return")]
    public async Task<ActionResult<ToolTransaction>> ReturnTool([FromBody] ReturnToolRequest request)
    {
        try
        {
            // The current user receiving the returned tool
            var receivedByUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(receivedByUserId))
                return Unauthorized();

            var transaction = await toolService.ReturnToolAsync(
                request.TransactionId,
                receivedByUserId,
                request.ReturnCondition,
                request.Notes);

            return Ok(transaction);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.InnerException?.Message ?? ex.Message);
        }
    }

    /// <summary>
    /// POST /api/tools/import
    /// Form-data: "file" (CSV or XLSX file)
    /// Imports tools in bulk.
    /// </summary>
    [HttpPost("import")]
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

            var result = await toolService.ImportToolsFromCsvAsync(csvContent, userId);
            return Ok(new { message = result });
        }
        catch (Exception ex)
        {
            var msg = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
            return BadRequest(new { message = msg });
        }
    }

    // ─── Tool Requests ───────────────────────────────────────────────────

    public class CreateToolRequestModel
    {
        public string RequestedToolName { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    [HttpPost("requests")]
    public async Task<ActionResult> CreateToolRequest([FromBody] CreateToolRequestModel req)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
        var result = await toolService.CreateToolRequestAsync(userId, req.RequestedToolName, req.Notes);
        return Ok(result);
    }

    [HttpGet("requests")]
    public async Task<ActionResult> GetPendingToolRequests()
    {
        var result = await toolService.GetPendingToolRequestsAsync();
        return Ok(result);
    }

    [HttpGet("requests/my")]
    public async Task<ActionResult> GetMyToolRequests()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
        var result = await toolService.GetMyToolRequestsAsync(userId);
        return Ok(result);
    }

    [HttpPost("requests/{id}/reject")]
    public async Task<ActionResult> RejectToolRequest(int id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "API_User";
        await toolService.RejectToolRequestAsync(id, userId);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTool(int id)
    {
        try
        {
            await toolService.DeleteToolAsync(id);
            return NoContent();
        }
        catch (ArgumentException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message }); }
    }
}

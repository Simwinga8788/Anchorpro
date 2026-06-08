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
    [Authorize(Roles = "Admin,Manager,Storeman")]
    public async Task<ActionResult<Tool>> ReceiveTool([FromBody] Tool tool)
    {
        var createdTool = await toolService.ReceiveToolAsync(tool);
        return CreatedAtAction(nameof(GetAllTools), new { id = createdTool.Id }, createdTool);
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
    [Authorize(Roles = "Admin,Manager,Storeman")]
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
            return BadRequest(ex.Message);
        }
    }

    public class ReturnToolRequest
    {
        public int TransactionId { get; set; }
        public ToolCondition ReturnCondition { get; set; }
        public string? Notes { get; set; }
    }

    [HttpPost("return")]
    [Authorize(Roles = "Admin,Manager,Storeman")]
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
            return BadRequest(ex.Message);
        }
    }
}

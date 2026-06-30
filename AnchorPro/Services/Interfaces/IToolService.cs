using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;

namespace AnchorPro.Services.Interfaces;

public interface IToolService
{
    Task<Tool> ReceiveToolAsync(Tool tool);
    Task<ToolTransaction> IssueToolAsync(int toolId, string assignedToUserId, string issuedByUserId, ToolCondition condition, DateTime? expectedReturnDate, string? notes, int? toolRequestId = null);
    Task<ToolTransaction> ReturnToolAsync(int transactionId, string receivedByUserId, ToolCondition returnCondition, string? notes);
    Task<List<Tool>> GetAvailableToolsAsync();
    Task<List<ToolTransaction>> GetIssuedToolsAsync();
    Task<List<ToolTransaction>> GetToolHistoryAsync(int toolId);
    Task<List<Tool>> GetAllToolsAsync();
    Task<string> ImportToolsFromCsvAsync(string csvContent, string userId);
    Task<Tool> UpdateToolAsync(int toolId, string name, string? description, string toolTag, ToolCondition condition, decimal? purchaseCost);

    // Tool Requests
    Task<ToolRequest> CreateToolRequestAsync(string requestedByUserId, string toolName, string? notes);
    Task<List<ToolRequest>> GetPendingToolRequestsAsync();
    Task<List<ToolRequest>> GetMyToolRequestsAsync(string userId);
    Task RejectToolRequestAsync(int requestId, string userId);
    Task DeleteToolAsync(int toolId);
}

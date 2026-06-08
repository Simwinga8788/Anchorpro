using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;

namespace AnchorPro.Services.Interfaces;

public interface IToolService
{
    Task<Tool> ReceiveToolAsync(Tool tool);
    Task<ToolTransaction> IssueToolAsync(int toolId, string assignedToUserId, string issuedByUserId, ToolCondition condition, DateTime? expectedReturnDate, string? notes);
    Task<ToolTransaction> ReturnToolAsync(int transactionId, string receivedByUserId, ToolCondition returnCondition, string? notes);
    Task<List<Tool>> GetAvailableToolsAsync();
    Task<List<ToolTransaction>> GetIssuedToolsAsync();
    Task<List<ToolTransaction>> GetToolHistoryAsync(int toolId);
    Task<List<Tool>> GetAllToolsAsync();
}

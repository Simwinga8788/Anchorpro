using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services;

public class ToolService(ApplicationDbContext context) : IToolService
{
    public async Task<List<Tool>> GetAllToolsAsync()
    {
        return await context.Tools
            .OrderByDescending(t => t.ReceivedDate)
            .ToListAsync();
    }

    public async Task<List<Tool>> GetAvailableToolsAsync()
    {
        return await context.Tools
            .Where(t => t.Status == ToolStatus.Available)
            .OrderBy(t => t.Name)
            .ToListAsync();
    }

    public async Task<List<ToolTransaction>> GetIssuedToolsAsync()
    {
        return await context.ToolTransactions
            .Include(t => t.Tool)
            .Include(t => t.AssignedToUser)
            .Include(t => t.IssuedByUser)
            .Where(t => t.ReturnedAt == null)
            .OrderBy(t => t.IssuedAt)
            .ToListAsync();
    }

    public async Task<List<ToolTransaction>> GetToolHistoryAsync(int toolId)
    {
        return await context.ToolTransactions
            .Include(t => t.AssignedToUser)
            .Include(t => t.IssuedByUser)
            .Include(t => t.ReceivedByUser)
            .Where(t => t.ToolId == toolId)
            .OrderByDescending(t => t.IssuedAt)
            .ToListAsync();
    }

    public async Task<ToolTransaction> IssueToolAsync(int toolId, string assignedToUserId, string issuedByUserId, ToolCondition condition, DateTime? expectedReturnDate, string? notes)
    {
        var tool = await context.Tools.FindAsync(toolId);
        if (tool == null)
            throw new ArgumentException("Tool not found");

        if (tool.Status != ToolStatus.Available)
            throw new InvalidOperationException($"Cannot issue tool because its status is {tool.Status}");

        var transaction = new ToolTransaction
        {
            ToolId = toolId,
            AssignedToUserId = assignedToUserId,
            IssuedByUserId = issuedByUserId,
            IssuedAt = DateTime.UtcNow,
            ConditionOnIssue = condition,
            ExpectedReturnDate = expectedReturnDate,
            Notes = notes
        };

        tool.Status = ToolStatus.Issued;
        tool.Condition = condition; // Update current condition to reflect what it was when issued

        context.ToolTransactions.Add(transaction);
        await context.SaveChangesAsync();

        return transaction;
    }

    public async Task<Tool> ReceiveToolAsync(Tool tool)
    {
        tool.Status = ToolStatus.Available;
        tool.ReceivedDate = DateTime.UtcNow;
        
        context.Tools.Add(tool);
        await context.SaveChangesAsync();
        
        return tool;
    }

    public async Task<ToolTransaction> ReturnToolAsync(int transactionId, string receivedByUserId, ToolCondition returnCondition, string? notes)
    {
        var transaction = await context.ToolTransactions
            .Include(t => t.Tool)
            .FirstOrDefaultAsync(t => t.Id == transactionId);

        if (transaction == null)
            throw new ArgumentException("Transaction not found");

        if (transaction.ReturnedAt != null)
            throw new InvalidOperationException("Tool has already been returned");

        transaction.ReturnedAt = DateTime.UtcNow;
        transaction.ReceivedByUserId = receivedByUserId;
        transaction.ConditionOnReturn = returnCondition;
        
        if (!string.IsNullOrWhiteSpace(notes))
        {
            transaction.Notes = string.IsNullOrWhiteSpace(transaction.Notes) 
                ? notes 
                : transaction.Notes + "\nReturn Notes: " + notes;
        }

        var tool = transaction.Tool;
        tool.Condition = returnCondition;
        
        // If damaged, mark as UnderRepair, else Available
        if (returnCondition == ToolCondition.Damaged)
        {
            tool.Status = ToolStatus.UnderRepair;
        }
        else
        {
            tool.Status = ToolStatus.Available;
        }

        await context.SaveChangesAsync();

        return transaction;
    }
}

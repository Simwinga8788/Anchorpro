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

    public async Task<string> ImportToolsFromCsvAsync(string csvContent, string userId)
    {
        var user = await context.Users.FindAsync(userId);
        var tenantId = user?.TenantId;

        var lines = csvContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
        if (lines.Length <= 1)
        {
            throw new ArgumentException("CSV content is empty or contains only a header.");
        }

        var firstLine = lines[0];
        if (firstLine.StartsWith("\uFEFF"))
        {
            firstLine = firstLine.Substring(1);
        }

        char separator = ',';
        if (firstLine.Count(c => c == ';') > firstLine.Count(c => c == ','))
        {
            separator = ';';
        }

        var headers = ParseCsvLine(firstLine, separator);
        int nameIdx = -1, descIdx = -1, tagIdx = -1, statusIdx = -1, condIdx = -1, costIdx = -1;

        for (int i = 0; i < headers.Count; i++)
        {
            var h = headers[i].ToLower().Trim();
            if (h.Contains("name")) nameIdx = i;
            else if (h.Contains("desc")) descIdx = i;
            else if (h.Contains("tag") || h.Contains("tooltag") || h.Contains("tool tag")) tagIdx = i;
            else if (h.Contains("status")) statusIdx = i;
            else if (h.Contains("cond")) condIdx = i;
            else if (h.Contains("cost") || h.Contains("price") || h.Contains("purchase")) costIdx = i;
        }

        if (nameIdx == -1)
        {
            throw new ArgumentException("CSV must contain a 'Name' column.");
        }

        int successCount = 0;
        var currentCount = await context.Tools.CountAsync(t => t.TenantId == tenantId);
        int nextToolTag = currentCount + 1001;

        for (int r = 1; r < lines.Length; r++)
        {
            var line = lines[r];
            if (string.IsNullOrWhiteSpace(line)) continue;

            var values = ParseCsvLine(line, separator);
            if (values.Count == 0) continue;

            string GetValue(int idx) => idx >= 0 && idx < values.Count ? values[idx] : string.Empty;

            var name = GetValue(nameIdx);
            if (string.IsNullOrWhiteSpace(name) || name.Contains("[Example") || name.Contains("[Describe")) continue;

            var tag = GetValue(tagIdx);
            if (string.IsNullOrWhiteSpace(tag))
            {
                tag = $"T-AUTO-{nextToolTag++}";
            }

            // Parse Status
            var statusStr = GetValue(statusIdx).ToLower();
            var status = ToolStatus.Available;
            if (statusStr.Contains("issue")) status = ToolStatus.Issued;
            else if (statusStr.Contains("repair") || statusStr.Contains("under")) status = ToolStatus.UnderRepair;
            else if (statusStr.Contains("lost")) status = ToolStatus.Lost;
            else if (statusStr.Contains("retir")) status = ToolStatus.Retired;

            // Parse Condition
            var condStr = GetValue(condIdx).ToLower();
            var condition = ToolCondition.Good;
            if (condStr.Contains("new")) condition = ToolCondition.New;
            else if (condStr.Contains("good")) condition = ToolCondition.Good;
            else if (condStr.Contains("fair")) condition = ToolCondition.Fair;
            else if (condStr.Contains("damag")) condition = ToolCondition.Damaged;

            decimal? purchaseCost = null;
            var costStr = GetValue(costIdx);
            if (!string.IsNullOrWhiteSpace(costStr) && decimal.TryParse(costStr, out var parsedCost))
            {
                purchaseCost = parsedCost;
            }

            var tool = new Tool
            {
                TenantId = tenantId,
                Name = name,
                Description = GetValue(descIdx),
                ToolTag = tag,
                Status = status,
                Condition = condition,
                PurchaseCost = purchaseCost,
                ReceivedDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId
            };

            context.Tools.Add(tool);
            successCount++;
        }

        await context.SaveChangesAsync();
        return $"Successfully imported {successCount} tools.";
    }

    private static List<string> ParseCsvLine(string line, char separator = ',')
    {
        var result = new List<string>();
        var current = new System.Text.StringBuilder();
        bool inQuotes = false;
        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '\"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '\"')
                {
                    current.Append('\"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == separator && !inQuotes)
            {
                result.Add(current.ToString().Trim());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }
        result.Add(current.ToString().Trim());
        return result;
    }
}

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

    public async Task<ToolTransaction> IssueToolAsync(int toolId, string assignedToUserId, string issuedByUserId, ToolCondition condition, DateTime? expectedReturnDate, string? notes, int? toolRequestId = null)
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

        if (toolRequestId.HasValue)
        {
            var request = await context.ToolRequests.FindAsync(toolRequestId.Value);
            if (request != null && request.Status == ToolRequestStatus.Pending)
            {
                request.Status = ToolRequestStatus.Approved;
                request.IssuedToolTransactionId = transaction.Id;
                request.ResolvedAt = DateTime.UtcNow;
                request.UpdatedAt = DateTime.UtcNow;
                request.UpdatedBy = issuedByUserId;
                await context.SaveChangesAsync();
            }
        }

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

    public async Task<Tool> UpdateToolAsync(int toolId, string name, string? description, string toolTag, ToolCondition condition, decimal? purchaseCost)
    {
        var tool = await context.Tools.FindAsync(toolId)
            ?? throw new ArgumentException("Tool not found.");

        // Guard: tag must be unique within the tenant (excluding this tool itself)
        var tagTaken = await context.Tools.AnyAsync(t =>
            t.Id != toolId &&
            t.TenantId == tool.TenantId &&
            t.ToolTag == toolTag);

        if (tagTaken)
            throw new InvalidOperationException($"Tag '{toolTag}' is already used by another tool.");

        tool.Name        = name;
        tool.Description = description;
        tool.ToolTag     = toolTag;
        tool.Condition   = condition;
        tool.PurchaseCost = purchaseCost;
        tool.UpdatedAt   = DateTime.UtcNow;

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
        int nameIdx = -1, descIdx = -1, tagIdx = -1, statusIdx = -1, condIdx = -1, costIdx = -1, qtyIdx = -1;

        for (int i = 0; i < headers.Count; i++)
        {
            var h = headers[i].ToLower().Trim();
            if (h.Contains("name")) nameIdx = i;
            else if (h.Contains("desc")) descIdx = i;
            else if (h.Contains("tag") || h.Contains("tooltag") || h.Contains("tool tag")) tagIdx = i;
            else if (h.Contains("status")) statusIdx = i;
            else if (h.Contains("cond")) condIdx = i;
            else if (h.Contains("cost") || h.Contains("price") || h.Contains("purchase")) costIdx = i;
            else if (h.Contains("qty") || h.Contains("quant")) qtyIdx = i;
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
            if (string.IsNullOrWhiteSpace(name)) continue;

            // Skip example rows (case-insensitive checks)
            if (name.Contains("[Example", StringComparison.OrdinalIgnoreCase) || 
                name.Contains("[Describe", StringComparison.OrdinalIgnoreCase) ||
                name.Contains("example", StringComparison.OrdinalIgnoreCase)) 
                continue;

            // Also check the index/first column for "example"
            if (values.Count > 0 && values[0].Contains("example", StringComparison.OrdinalIgnoreCase))
                continue;

            var tag = GetValue(tagIdx).Trim();
            if (tag.Contains("leave blank", StringComparison.OrdinalIgnoreCase) || (tag.StartsWith("[") && tag.EndsWith("]")))
            {
                tag = string.Empty;
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

            // Parse Quantity — default to 1 if column is absent or blank
            int quantity = 1;
            if (qtyIdx >= 0)
            {
                var qtyStr = GetValue(qtyIdx).Trim();
                if (int.TryParse(qtyStr, out var parsedQty) && parsedQty > 1)
                    quantity = parsedQty;
            }

            // Create one Tool record per unit so each can be individually tracked
            for (int unit = 1; unit <= quantity; unit++)
            {
                // When qty > 1 and the user supplied a base tag, append -1, -2, …
                string unitTag;
                if (!string.IsNullOrWhiteSpace(tag))
                {
                    unitTag = quantity > 1 ? $"{tag}-{unit}" : tag;
                }
                else
                {
                    unitTag = $"T-AUTO-{nextToolTag++}";
                }

                var tool = new Tool
                {
                    TenantId = tenantId,
                    Name = name,
                    Description = GetValue(descIdx),
                    ToolTag = unitTag,
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

    // ─── Tool Requests ───────────────────────────────────────────────────

    public async Task<ToolRequest> CreateToolRequestAsync(string requestedByUserId, string toolName, string? notes)
    {
        var request = new ToolRequest
        {
            RequestedByUserId = requestedByUserId,
            RequestedToolName = toolName,
            Notes = notes,
            Status = ToolRequestStatus.Pending,
            RequestedAt = DateTime.UtcNow
        };
        context.ToolRequests.Add(request);
        await context.SaveChangesAsync();
        return request;
    }

    public async Task<List<ToolRequest>> GetPendingToolRequestsAsync()
    {
        return await context.ToolRequests
            .Include(r => r.RequestedByUser)
            .Where(r => r.Status == ToolRequestStatus.Pending)
            .OrderByDescending(r => r.RequestedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<List<ToolRequest>> GetMyToolRequestsAsync(string userId)
    {
        return await context.ToolRequests
            .Include(r => r.RequestedByUser)
            .Include(r => r.IssuedToolTransaction)
                .ThenInclude(t => t.Tool)
            .Where(r => r.RequestedByUserId == userId)
            .OrderByDescending(r => r.RequestedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task RejectToolRequestAsync(int requestId, string userId)
    {
        var request = await context.ToolRequests.FindAsync(requestId);
        if (request != null && request.Status == ToolRequestStatus.Pending)
        {
            request.Status = ToolRequestStatus.Rejected;
            request.ResolvedAt = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;
            request.UpdatedBy = userId;
            await context.SaveChangesAsync();
        }
    }

    public async Task DeleteToolAsync(int toolId)
    {
        var tool = await context.Tools
            .Include(t => t.Transactions)
            .FirstOrDefaultAsync(t => t.Id == toolId);

        if (tool == null)
            throw new ArgumentException("Tool not found.");

        if (tool.Status == ToolStatus.Issued)
            throw new InvalidOperationException("Cannot delete a tool that is currently issued to a technician. Return the tool first.");

        // Clean up transaction history before deleting the tool
        if (tool.Transactions != null && tool.Transactions.Any())
        {
            context.ToolTransactions.RemoveRange(tool.Transactions);
        }

        context.Tools.Remove(tool);
        await context.SaveChangesAsync();
    }
}

using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly IEmailService _emailService;

        public InventoryService(IDbContextFactory<ApplicationDbContext> factory, IEmailService emailService)
        {
            _factory = factory;
            _emailService = emailService;
        }

        public async Task<List<InventoryItem>> GetAllItemsAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.InventoryItems
                .OrderBy(i => i.Name)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<InventoryItem?> GetItemByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.InventoryItems.FindAsync(id);
        }

        public async Task CreateItemAsync(InventoryItem item, string userId)
        {
            using var context = _factory.CreateDbContext();
            item.CreatedAt = DateTime.UtcNow;
            item.CreatedBy = userId;
            context.InventoryItems.Add(item);
            await context.SaveChangesAsync();
        }

        public async Task UpdateItemAsync(InventoryItem item, string userId)
        {
            using var context = _factory.CreateDbContext();
            var existing = await context.InventoryItems.FindAsync(item.Id);
            if (existing != null)
            {
                existing.PartNumber = item.PartNumber;
                existing.Name = item.Name;
                existing.Description = item.Description;
                existing.ReorderLevel = item.ReorderLevel;
                existing.UnitCost = item.UnitCost;
                existing.LocationBin = item.LocationBin;
                // Note: QuantityOnHand is handled via AdjustStock normally, but if admins want to force set it, they could.
                // For now let's allow editing it directly for simplicity if the passed item has it.
                existing.QuantityOnHand = item.QuantityOnHand;
                existing.LocationBin = item.LocationBin;
                existing.Category = item.Category;

                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteItemAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var item = await context.InventoryItems.FindAsync(id);
            if (item != null)
            {
                context.InventoryItems.Remove(item);
                await context.SaveChangesAsync();
            }
        }

        public async Task AdjustStockAsync(int itemId, int quantityAdjustment, string userId, string reason)
        {
            using var context = _factory.CreateDbContext();
            var item = await context.InventoryItems.FindAsync(itemId);
            if (item != null)
            {
                item.QuantityOnHand += quantityAdjustment;
                item.UpdatedAt = DateTime.UtcNow;
                item.UpdatedBy = userId;

                // TODO: Record transaction log/history here if we add that entity later

                // Check Low Stock
                if (item.QuantityOnHand <= item.ReorderLevel)
                {
                    // Trigger Low Stock Alert (Safely)
                    try
                    {
                        await _emailService.SendEmailAsync(
                            "purchasing@anchorpro.com",
                            $"Low Stock Alert: {item.Name}",
                            $"Warning: Stock for {item.Name} ({item.PartNumber}) has dropped to {item.QuantityOnHand}. Reorder Level is {item.ReorderLevel}."
                        );
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Warning: Failed to send low stock email: {ex.Message}");
                    }
                }

                await context.SaveChangesAsync();
            }
        }

        public async Task<string> ImportInventoryFromCsvAsync(string csvContent, string userId)
        {
            using var context = _factory.CreateDbContext();
            var user = await context.Users.FindAsync(userId);
            var tenantId = user?.TenantId;

            // Load existing items for lookup to do upserts
            var existingItems = await context.InventoryItems.Where(i => i.TenantId == tenantId).ToListAsync();

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
            int partNumIdx = -1, nameIdx = -1, descIdx = -1, qtyIdx = -1, reorderIdx = -1, costIdx = -1, binIdx = -1;

            for (int i = 0; i < headers.Count; i++)
            {
                var h = headers[i].ToLower().Trim();
                if (h.Contains("part number") || h == "partnumber" || h == "pn" || h == "part_number") partNumIdx = i;
                else if (h.Contains("name")) nameIdx = i;
                else if (h.Contains("description") || h == "desc") descIdx = i;
                else if (h.Contains("quantity") || h.Contains("qty") || h.Contains("stock") || h.Contains("hand")) qtyIdx = i;
                else if (h.Contains("reorder")) reorderIdx = i;
                else if (h.Contains("cost") || h.Contains("unit") || h.Contains("price")) costIdx = i;
                else if (h.Contains("bin") || h.Contains("loc")) binIdx = i;
            }

            if (partNumIdx == -1 || nameIdx == -1)
            {
                throw new ArgumentException("CSV must contain 'Part Number' and 'Name' columns.");
            }

            int createdCount = 0;
            int updatedCount = 0;

            for (int r = 1; r < lines.Length; r++)
            {
                var line = lines[r];
                if (string.IsNullOrWhiteSpace(line)) continue;

                var values = ParseCsvLine(line, separator);
                if (values.Count == 0) continue;

                string GetValue(int idx) => idx >= 0 && idx < values.Count ? values[idx] : string.Empty;

                var partNum = GetValue(partNumIdx);
                var name = GetValue(nameIdx);
                // Skip helper or empty rows
                if (string.IsNullOrWhiteSpace(partNum) || string.IsNullOrWhiteSpace(name) || partNum.Contains("[Example") || partNum.Contains("[Describe")) continue;

                int qty = 0;
                var qtyStr = GetValue(qtyIdx);
                if (!string.IsNullOrWhiteSpace(qtyStr) && int.TryParse(qtyStr, out var parsedQty)) qty = parsedQty;

                int reorder = 5;
                var reorderStr = GetValue(reorderIdx);
                if (!string.IsNullOrWhiteSpace(reorderStr) && int.TryParse(reorderStr, out var parsedReorder)) reorder = parsedReorder;

                decimal cost = 0.00m;
                var costStr = GetValue(costIdx);
                if (!string.IsNullOrWhiteSpace(costStr) && decimal.TryParse(costStr, out var parsedCost)) cost = parsedCost;

                var bin = GetValue(binIdx);
                var desc = GetValue(descIdx);

                var item = existingItems.FirstOrDefault(i => i.PartNumber.Equals(partNum, StringComparison.OrdinalIgnoreCase));
                if (item != null)
                {
                    // Update
                    item.Name = name;
                    item.Description = desc;
                    item.QuantityOnHand = qty;
                    item.ReorderLevel = reorder;
                    item.UnitCost = cost;
                    item.LocationBin = bin;
                    item.UpdatedAt = DateTime.UtcNow;
                    item.UpdatedBy = userId;
                    updatedCount++;
                }
                else
                {
                    // Create
                    item = new InventoryItem
                    {
                        TenantId = tenantId,
                        PartNumber = partNum,
                        Name = name,
                        Description = desc,
                        QuantityOnHand = qty,
                        ReorderLevel = reorder,
                        UnitCost = cost,
                        LocationBin = bin,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = userId
                    };
                    context.InventoryItems.Add(item);
                    existingItems.Add(item);
                    createdCount++;
                }
            }

            await context.SaveChangesAsync();
            return $"Successfully imported inventory items. (Created {createdCount} new, updated {updatedCount} existing).";
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
}

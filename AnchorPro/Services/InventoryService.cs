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
    }
}

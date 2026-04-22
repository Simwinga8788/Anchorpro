using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IInventoryService
    {
        Task<List<InventoryItem>> GetAllItemsAsync();
        Task<InventoryItem?> GetItemByIdAsync(int id);
        Task CreateItemAsync(InventoryItem item, string userId);
        Task UpdateItemAsync(InventoryItem item, string userId);
        Task DeleteItemAsync(int id);

        // Stock operations
        Task AdjustStockAsync(int itemId, int quantityAdjustment, string userId, string reason);
    }
}

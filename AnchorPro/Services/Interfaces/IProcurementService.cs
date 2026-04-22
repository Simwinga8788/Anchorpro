using AnchorPro.Data.Entities;

namespace AnchorPro.Services.Interfaces
{
    public interface IProcurementService
    {
        // Suppliers
        Task<List<Supplier>> GetAllSuppliersAsync();
        Task<Supplier?> GetSupplierByIdAsync(int id);
        Task CreateSupplierAsync(Supplier supplier, string userId);
        Task UpdateSupplierAsync(Supplier supplier, string userId);
        Task DeleteSupplierAsync(int id);

        // Purchase Orders
        Task<List<PurchaseOrder>> GetAllPurchaseOrdersAsync();
        Task<PurchaseOrder?> GetPurchaseOrderByIdAsync(int id);
        Task<PurchaseOrder> CreatePurchaseOrderAsync(PurchaseOrder po, List<PurchaseOrderItem> items, string userId);
        Task UpdatePurchaseOrderStatusAsync(int poId, PurchaseOrderStatus status, string userId);
        Task ReceiveItemsAsync(int poId, List<(int itemId, int quantity)> receivedItems, string userId);
        Task<List<PurchaseOrder>> GetPurchaseOrdersByJobCardIdAsync(int jobCardId);
    }
}

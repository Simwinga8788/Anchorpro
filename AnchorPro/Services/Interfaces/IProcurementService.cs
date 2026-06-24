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
        Task ApprovePurchaseOrderAsync(int poId, string approvedByUserId);
        Task RejectPurchaseOrderAsync(int poId, string reason, string rejectedByUserId);
        Task<List<PurchaseOrder>> GetPendingApprovalOrdersAsync();

        // Purchase Requisitions
        Task<List<PurchaseRequisition>> GetAllPurchaseRequisitionsAsync();
        Task<PurchaseRequisition?> GetPurchaseRequisitionByIdAsync(int id);
        Task<PurchaseRequisition> CreatePurchaseRequisitionAsync(PurchaseRequisition pr, List<PurchaseRequisitionItem> items, string userId);
        Task UpdatePurchaseRequisitionStatusAsync(int prId, PurchaseRequisitionStatus status, string userId);
        Task ApprovePurchaseRequisitionAsync(int prId, string approvedByUserId);
        Task RejectPurchaseRequisitionAsync(int prId, string reason, string rejectedByUserId);
        Task<PurchaseOrder> ConvertRequisitionToPOAsync(int prId, int supplierId, string userId);
        Task<List<PurchaseRequisition>> GetPurchaseRequisitionsByJobCardIdAsync(int jobCardId);
        Task<List<PurchaseRequisition>> GetPendingApprovalRequisitionsAsync();
    }
}

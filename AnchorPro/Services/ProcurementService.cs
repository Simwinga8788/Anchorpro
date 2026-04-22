using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class ProcurementService : IProcurementService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public ProcurementService(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        public async Task<List<Supplier>> GetAllSuppliersAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Suppliers
                .OrderBy(s => s.Name)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Supplier?> GetSupplierByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.Suppliers.FindAsync(id);
        }

        public async Task CreateSupplierAsync(Supplier supplier, string userId)
        {
            using var context = _factory.CreateDbContext();
            supplier.CreatedAt = DateTime.UtcNow;
            supplier.CreatedBy = userId;
            context.Suppliers.Add(supplier);
            await context.SaveChangesAsync();
        }

        public async Task UpdateSupplierAsync(Supplier supplier, string userId)
        {
            using var context = _factory.CreateDbContext();
            var existing = await context.Suppliers.FindAsync(supplier.Id);
            if (existing != null)
            {
                existing.Name = supplier.Name;
                existing.ContactPerson = supplier.ContactPerson;
                existing.Email = supplier.Email;
                existing.Phone = supplier.Phone;
                existing.Address = supplier.Address;
                existing.SupplierCode = supplier.SupplierCode;
                existing.Notes = supplier.Notes;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task DeleteSupplierAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            var supplier = await context.Suppliers.FindAsync(id);
            if (supplier != null)
            {
                context.Suppliers.Remove(supplier);
                await context.SaveChangesAsync();
            }
        }

        public async Task<List<PurchaseOrder>> GetAllPurchaseOrdersAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.PurchaseOrders
                .Include(p => p.Supplier)
                .OrderByDescending(p => p.OrderDate)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<PurchaseOrder?> GetPurchaseOrderByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.PurchaseOrders
                .Include(p => p.Supplier)
                .Include(p => p.Items)
                    .ThenInclude(i => i.InventoryItem)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<PurchaseOrder> CreatePurchaseOrderAsync(PurchaseOrder po, List<PurchaseOrderItem> items, string userId)
        {
            using var context = _factory.CreateDbContext();
            
            po.PoNumber = $"PO-{DateTime.UtcNow:yyyyMM}-{context.PurchaseOrders.Count() + 1:D4}";
            po.CreatedAt = DateTime.UtcNow;
            po.CreatedBy = userId;
            po.RaisedBy = userId;
            po.TotalAmount = items.Sum(i => i.LineTotal);

            foreach (var item in items)
            {
                item.CreatedAt = DateTime.UtcNow;
                item.CreatedBy = userId;
                po.Items.Add(item);
            }

            context.PurchaseOrders.Add(po);
            await context.SaveChangesAsync();
            return po;
        }

        public async Task UpdatePurchaseOrderStatusAsync(int poId, PurchaseOrderStatus status, string userId)
        {
            using var context = _factory.CreateDbContext();
            var po = await context.PurchaseOrders.FindAsync(poId);
            if (po != null)
            {
                po.Status = status;
                po.UpdatedAt = DateTime.UtcNow;
                po.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task ReceiveItemsAsync(int poId, List<(int itemId, int quantity)> receivedItems, string userId)
        {
            using var context = _factory.CreateDbContext();
            using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var po = await context.PurchaseOrders
                    .Include(p => p.Items)
                    .FirstOrDefaultAsync(p => p.Id == poId);

                if (po == null) throw new Exception("PO not found");

                foreach (var ri in receivedItems)
                {
                    var item = po.Items.FirstOrDefault(i => i.Id == ri.itemId);
                    if (item != null)
                    {
                        item.QuantityReceived += ri.quantity;
                        item.UpdatedAt = DateTime.UtcNow;
                        item.UpdatedBy = userId;

                        // If linked to inventory, update stock
                        if (item.InventoryItemId.HasValue)
                        {
                            var inv = await context.InventoryItems.FindAsync(item.InventoryItemId.Value);
                            if (inv != null)
                            {
                                inv.QuantityOnHand += ri.quantity;
                                inv.UpdatedAt = DateTime.UtcNow;
                                inv.UpdatedBy = userId;
                            }
                        }
                    }
                }

                // Update PO status
                if (po.Items.All(i => i.QuantityReceived >= i.QuantityOrdered))
                {
                    po.Status = PurchaseOrderStatus.Received;
                    po.ReceivedDate = DateTime.UtcNow;

                    // If linked to a JobCard, update the JobCard's SubcontractorCost
                    if (po.JobCardId.HasValue)
                    {
                        var linkedJob = await context.JobCards.FirstOrDefaultAsync(j => j.Id == po.JobCardId.Value);
                        if (linkedJob != null)
                        {
                            // Recalculate each bucket from all received POs for this job
                            linkedJob.DirectPurchaseCost = await context.PurchaseOrders
                                .Where(p => p.JobCardId == linkedJob.Id 
                                         && p.PoType == PurchaseOrderType.DirectPurchase
                                         && p.Status == PurchaseOrderStatus.Received)
                                .SumAsync(p => p.TotalAmount);

                            linkedJob.SubcontractingCost = await context.PurchaseOrders
                                .Where(p => p.JobCardId == linkedJob.Id 
                                         && p.PoType == PurchaseOrderType.Subcontracting
                                         && p.Status == PurchaseOrderStatus.Received)
                                .SumAsync(p => p.TotalAmount);

                            // Recalculate running total (labor + parts already set at start/completion)
                            linkedJob.TotalCost = linkedJob.LaborCost + linkedJob.PartsCost + linkedJob.DirectPurchaseCost + linkedJob.SubcontractingCost;
                            linkedJob.Profit = linkedJob.InvoiceAmount - linkedJob.TotalCost;
                            if (linkedJob.InvoiceAmount > 0)
                            {
                                linkedJob.ProfitMarginPercent = Math.Round((linkedJob.Profit / linkedJob.InvoiceAmount) * 100, 2);
                            }
                        }
                    }
                }
                else if (po.Items.Any(i => i.QuantityReceived > 0))
                {
                    po.Status = PurchaseOrderStatus.PartiallyReceived;
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<List<PurchaseOrder>> GetPurchaseOrdersByJobCardIdAsync(int jobCardId)
        {
            using var context = _factory.CreateDbContext();
            return await context.PurchaseOrders
                .Include(p => p.Supplier)
                .Include(p => p.Items)
                .Where(p => p.JobCardId == jobCardId)
                .OrderByDescending(p => p.OrderDate)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}

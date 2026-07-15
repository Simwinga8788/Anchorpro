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
                .Include(p => p.Items)
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
                .Include(p => p.PurchaseRequisition)
                .Include(p => p.JobCard)
                .Include(p => p.Department)
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
            decimal totalAmount = 0;
            foreach (var item in items)
            {
                item.LineTotal = item.QuantityOrdered * item.UnitCost;
                item.CreatedAt = DateTime.UtcNow;
                item.CreatedBy = userId;
                po.Items.Add(item);
                totalAmount += item.LineTotal;
            }
            po.TotalAmount = totalAmount;

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
                        else if (po.PoType == PurchaseOrderType.InventoryReplenishment)
                        {
                            // Try to match by name (case-insensitive) to prevent duplicate SKUs
                            var itemDesc = item.Description?.Trim();
                            if (!string.IsNullOrEmpty(itemDesc))
                            {
                                var inv = await context.InventoryItems
                                    .FirstOrDefaultAsync(i => i.Name.ToLower() == itemDesc.ToLower() && i.TenantId == po.TenantId);

                                if (inv != null)
                                {
                                    // Link it and update stock
                                    item.InventoryItemId = inv.Id;
                                    inv.QuantityOnHand += ri.quantity;
                                    inv.UpdatedAt = DateTime.UtcNow;
                                    inv.UpdatedBy = userId;
                                }
                                else
                                {
                                    // Create a new inventory item automatically in the registry
                                    var newInv = new InventoryItem
                                    {
                                        TenantId = po.TenantId,
                                        Name = item.Description ?? "Unknown Item",
                                        PartNumber = $"SKU-{DateTime.UtcNow:yyyyMMdd}-{context.InventoryItems.Count() + 1:D3}",
                                        Description = item.Description,
                                        QuantityOnHand = ri.quantity,
                                        ReorderLevel = 5,
                                        UnitCost = item.UnitCost,
                                        LocationBin = "Warehouse",
                                        Category = "Uncategorized",
                                        CreatedAt = DateTime.UtcNow,
                                        CreatedBy = userId
                                    };
                                    context.InventoryItems.Add(newInv);
                                    await context.SaveChangesAsync(); // Save to generate database ID

                                    item.InventoryItemId = newInv.Id;
                                }
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

                    // Auto-Generate Vendor Bill
                    var existingBill = await context.VendorBills.FirstOrDefaultAsync(b => b.PurchaseOrderId == po.Id);
                    if (existingBill == null)
                    {
                        var bill = new VendorBill
                        {
                            BillNumber = $"VB-PO-{po.Id}",
                            SupplierId = po.SupplierId,
                            PurchaseOrderId = po.Id,
                            TotalAmount = po.TotalAmount,
                            AmountPaid = 0,
                            BillDate = DateTime.UtcNow,
                            DueDate = DateTime.UtcNow.AddDays(30),
                            Status = VendorBillStatus.Unpaid,
                            CreatedAt = DateTime.UtcNow,
                            CreatedBy = userId
                        };
                        context.VendorBills.Add(bill);
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

        public async Task ApprovePurchaseOrderAsync(int poId, string approvedByUserId)
        {
            using var context = _factory.CreateDbContext();
            var po = await context.PurchaseOrders.FindAsync(poId);
            if (po == null) throw new InvalidOperationException($"PO {poId} not found.");
            po.Status = PurchaseOrderStatus.Approved;
            po.ApprovedBy = approvedByUserId;
            po.UpdatedAt = DateTime.UtcNow;
            po.UpdatedBy = approvedByUserId;
            await context.SaveChangesAsync();
        }

        public async Task RejectPurchaseOrderAsync(int poId, string reason, string rejectedByUserId)
        {
            using var context = _factory.CreateDbContext();
            var po = await context.PurchaseOrders.FindAsync(poId);
            if (po == null) throw new InvalidOperationException($"PO {poId} not found.");
            po.Status = PurchaseOrderStatus.Rejected;
            po.Notes = string.IsNullOrEmpty(po.Notes)
                ? $"Rejected: {reason}"
                : $"{po.Notes} | Rejected: {reason}";
            po.UpdatedAt = DateTime.UtcNow;
            po.UpdatedBy = rejectedByUserId;
            await context.SaveChangesAsync();
        }

        public async Task<List<PurchaseOrder>> GetPendingApprovalOrdersAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.PurchaseOrders
                .Include(p => p.Supplier)
                .Include(p => p.Items)
                .Include(p => p.Department)
                .Where(p => p.Status == PurchaseOrderStatus.PendingApproval)
                .OrderByDescending(p => p.TotalAmount)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<PurchaseRequisition>> GetAllPurchaseRequisitionsAsync(string userId)
        {
            using var context = _factory.CreateDbContext();
            
            var user = await context.Users.FindAsync(userId);
            if (user == null) return new List<PurchaseRequisition>();

            // Resolve roles for this user
            var roleIds = await context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.RoleId)
                .ToListAsync();
            var roles = await context.Roles
                .Where(r => roleIds.Contains(r.Id))
                .Select(r => r.Name)
                .ToListAsync();

            bool hasGlobalAccess = roles.Any(r => r == "Admin" || r == "Finance" || r == "Purchasing" || r == "Storeman" || r == "Supervisor" || r == "PlatformOwner");

            var query = context.PurchaseRequisitions
                .Include(r => r.JobCard)
                .Include(r => r.Department)
                .Include(r => r.RequestedBy)
                .Include(r => r.ApprovedBy)
                .Include(r => r.Items)
                .AsQueryable();

            if (!hasGlobalAccess)
            {
                query = query.Where(r => r.RequestedById == userId || (user.DepartmentId.HasValue && r.DepartmentId == user.DepartmentId));
            }

            return await query
                .OrderByDescending(r => r.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<PurchaseRequisition?> GetPurchaseRequisitionByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.PurchaseRequisitions
                .Include(r => r.JobCard)
                .Include(r => r.Department)
                .Include(r => r.RequestedBy)
                .Include(r => r.ApprovedBy)
                .Include(r => r.Items)
                    .ThenInclude(i => i.InventoryItem)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<PurchaseRequisition> CreatePurchaseRequisitionAsync(PurchaseRequisition pr, List<PurchaseRequisitionItem> items, string userId)
        {
            using var context = _factory.CreateDbContext();
            
            var user = await context.Users.FindAsync(userId);
            if (user == null) throw new InvalidOperationException("User not found.");

            // Resolve roles for this user
            var roleIds = await context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.RoleId)
                .ToListAsync();
            var roles = await context.Roles
                .Where(r => roleIds.Contains(r.Id))
                .Select(r => r.Name)
                .ToListAsync();

            bool hasGlobalAccess = roles.Any(r => r == "Admin" || r == "Finance" || r == "Purchasing" || r == "Storeman" || r == "Supervisor" || r == "PlatformOwner");

            // Enforce departmental isolation on creation:
            // Relaxed to allow cross-department requests and requests by users without a set department.
            // Requisitions require subsequent approval anyway, so this is safe and improves usability.
            /*
            if (pr.DepartmentId.HasValue && !hasGlobalAccess)
            {
                if (pr.DepartmentId != user.DepartmentId)
                {
                    throw new UnauthorizedAccessException("You are not authorized to raise a requisition for another department.");
                }
            }
            */

            pr.RequisitionNumber = $"PR-{DateTime.UtcNow:yyyyMM}-{context.PurchaseRequisitions.Count() + 1:D4}";
            pr.CreatedAt = DateTime.UtcNow;
            pr.CreatedBy = userId;
            pr.RequestedById = userId;
            decimal totalAmount = 0;
            foreach (var item in items)
            {
                item.LineTotal = item.QuantityRequested * item.EstimatedUnitCost;
                item.CreatedAt = DateTime.UtcNow;
                item.CreatedBy = userId;
                pr.Items.Add(item);
                totalAmount += item.LineTotal;
            }
            pr.TotalEstimatedAmount = totalAmount;

            context.PurchaseRequisitions.Add(pr);
            await context.SaveChangesAsync();
            return pr;
        }

        public async Task UpdatePurchaseRequisitionStatusAsync(int prId, PurchaseRequisitionStatus status, string userId)
        {
            using var context = _factory.CreateDbContext();
            var pr = await context.PurchaseRequisitions.FindAsync(prId);
            if (pr != null)
            {
                pr.Status = status;
                pr.UpdatedAt = DateTime.UtcNow;
                pr.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task ApprovePurchaseRequisitionAsync(int prId, string approvedByUserId)
        {
            using var context = _factory.CreateDbContext();
            var pr = await context.PurchaseRequisitions.FindAsync(prId);
            if (pr == null) throw new InvalidOperationException($"Purchase Requisition {prId} not found.");

            if (pr.RequestedById == approvedByUserId)
            {
                throw new InvalidOperationException("Separation of duties: The requester of a purchase requisition cannot be the one who approves it.");
            }
            
            pr.Status = PurchaseRequisitionStatus.Approved;
            pr.ApprovedById = approvedByUserId;
            pr.ApprovedDate = DateTime.UtcNow;
            pr.UpdatedAt = DateTime.UtcNow;
            pr.UpdatedBy = approvedByUserId;
            await context.SaveChangesAsync();
        }

        public async Task RejectPurchaseRequisitionAsync(int prId, string reason, string rejectedByUserId)
        {
            using var context = _factory.CreateDbContext();
            var pr = await context.PurchaseRequisitions.FindAsync(prId);
            if (pr == null) throw new InvalidOperationException($"Purchase Requisition {prId} not found.");

            if (pr.RequestedById == rejectedByUserId)
            {
                throw new InvalidOperationException("Separation of duties: The requester of a purchase requisition cannot be the one who rejects it.");
            }
            
            pr.Status = PurchaseRequisitionStatus.Rejected;
            pr.Notes = string.IsNullOrEmpty(pr.Notes)
                ? $"Rejected: {reason}"
                : $"{pr.Notes} | Rejected: {reason}";
            pr.ApprovedById = rejectedByUserId;
            pr.ApprovedDate = DateTime.UtcNow;
            pr.UpdatedAt = DateTime.UtcNow;
            pr.UpdatedBy = rejectedByUserId;
            await context.SaveChangesAsync();
        }

        public async Task<PurchaseOrder> ConvertRequisitionToPOAsync(int prId, int supplierId, string userId)
        {
            using var context = _factory.CreateDbContext();
            using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var pr = await context.PurchaseRequisitions
                    .Include(r => r.Items)
                    .FirstOrDefaultAsync(r => r.Id == prId);

                if (pr == null) throw new InvalidOperationException($"Requisition {prId} not found.");
                if (pr.Status != PurchaseRequisitionStatus.Approved) 
                    throw new InvalidOperationException("Only approved requisitions can be converted to Purchase Orders.");

                // Create the PO
                var po = new PurchaseOrder
                {
                    SupplierId = supplierId,
                    PoType = pr.JobCardId.HasValue ? PurchaseOrderType.DirectPurchase : PurchaseOrderType.InventoryReplenishment,
                    JobCardId = pr.JobCardId,
                    DepartmentId = pr.DepartmentId,
                    PurchaseRequisitionId = pr.Id,
                    Notes = pr.Notes,
                    Status = PurchaseOrderStatus.Draft,
                    OrderDate = DateTime.UtcNow,
                    RaisedBy = userId,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userId
                };

                // Generate PO Number
                po.PoNumber = $"PO-{DateTime.UtcNow:yyyyMM}-{context.PurchaseOrders.Count() + 1:D4}";

                // Add Items
                var poItems = new List<PurchaseOrderItem>();
                decimal totalAmount = 0;
                foreach (var item in pr.Items)
                {
                    var lineTotal = item.QuantityRequested * item.EstimatedUnitCost;
                    poItems.Add(new PurchaseOrderItem
                    {
                        InventoryItemId = item.InventoryItemId,
                        Description = item.Description,
                        QuantityOrdered = item.QuantityRequested,
                        QuantityReceived = 0,
                        UnitCost = item.EstimatedUnitCost,
                        LineTotal = lineTotal,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = userId
                    });
                    totalAmount += lineTotal;
                }

                po.TotalAmount = totalAmount;
                foreach (var poItem in poItems)
                {
                    po.Items.Add(poItem);
                }

                context.PurchaseOrders.Add(po);

                // Update PR status
                pr.Status = PurchaseRequisitionStatus.ConvertedToPO;
                pr.UpdatedAt = DateTime.UtcNow;
                pr.UpdatedBy = userId;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return po;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<List<PurchaseRequisition>> GetPurchaseRequisitionsByJobCardIdAsync(int jobCardId)
        {
            using var context = _factory.CreateDbContext();
            return await context.PurchaseRequisitions
                .Include(r => r.RequestedBy)
                .Include(r => r.ApprovedBy)
                .Include(r => r.Department)
                .Include(r => r.Items)
                .Where(r => r.JobCardId == jobCardId)
                .OrderByDescending(r => r.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<PurchaseRequisition>> GetPendingApprovalRequisitionsAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.PurchaseRequisitions
                .Include(r => r.JobCard)
                .Include(r => r.Department)
                .Include(r => r.RequestedBy)
                .Include(r => r.Items)
                .Where(r => r.Status == PurchaseRequisitionStatus.PendingApproval)
                .OrderByDescending(r => r.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}

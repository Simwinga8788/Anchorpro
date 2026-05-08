using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class FinancialService : IFinancialService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public FinancialService(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        public async Task<List<Invoice>> GetAllInvoicesAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.JobCard)
                .OrderByDescending(i => i.InvoiceDate)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Invoice?> GetInvoiceByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.JobCard)
                    .ThenInclude(j => j!.Equipment)
                .Include(i => i.Payments)
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<Invoice?> GetInvoiceByJobIdAsync(int jobId)
        {
            using var context = _factory.CreateDbContext();
            return await context.Invoices
                .FirstOrDefaultAsync(i => i.JobCardId == jobId);
        }

        public async Task<Invoice> CreateInvoiceFromJobAsync(int jobId, string userId)
        {
            using var context = _factory.CreateDbContext();
            var job = await context.JobCards
                .Include(j => j.Customer)
                .FirstOrDefaultAsync(j => j.Id == jobId);

            if (job == null) throw new Exception("Job not found");

            // Check if invoice already exists
            var existing = await context.Invoices.FirstOrDefaultAsync(i => i.JobCardId == jobId);
            if (existing != null) return existing;

            var invoice = new Invoice
            {
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{job.JobNumber.Split('-').Last()}",
                JobCardId = jobId,
                CustomerId = job.CustomerId,
                InvoiceDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                Subtotal = job.InvoiceAmount, // The Amount from JobCard is treated as Subtotal
                TaxRate = 16.00m,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId
            };

            invoice.TaxAmount = Math.Round(invoice.Subtotal * (invoice.TaxRate / 100), 2);
            invoice.Total = invoice.Subtotal + invoice.TaxAmount;
            invoice.Balance = invoice.Total;
            invoice.PaymentStatus = InvoicePaymentStatus.Unpaid;

            context.Invoices.Add(invoice);
            await context.SaveChangesAsync();

            return invoice;
        }

        public async Task CreateAdHocInvoiceAsync(Invoice invoice, string userId)
        {
            using var context = _factory.CreateDbContext();
            invoice.CreatedAt = DateTime.UtcNow;
            invoice.CreatedBy = userId;
            invoice.TaxAmount = Math.Round(invoice.Subtotal * (invoice.TaxRate / 100), 2);
            invoice.Total = invoice.Subtotal + invoice.TaxAmount;
            invoice.Balance = invoice.Total;
            invoice.PaymentStatus = InvoicePaymentStatus.Unpaid;

            context.Invoices.Add(invoice);
            await context.SaveChangesAsync();
        }

        public async Task UpdateInvoiceAsync(Invoice invoice, string userId)
        {
            using var context = _factory.CreateDbContext();
            var existing = await context.Invoices.FindAsync(invoice.Id);
            if (existing != null)
            {
                existing.DueDate = invoice.DueDate;
                existing.Notes = invoice.Notes;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }

        public async Task<List<InvoicePayment>> GetPaymentsByInvoiceIdAsync(int invoiceId)
        {
            using var context = _factory.CreateDbContext();
            return await context.InvoicePayments
                .Where(p => p.InvoiceId == invoiceId)
                .OrderByDescending(p => p.PaymentDate)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task RecordPaymentAsync(InvoicePayment payment, string userId)
        {
            using var context = _factory.CreateDbContext();
            using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                var invoice = await context.Invoices.FindAsync(payment.InvoiceId);
                if (invoice == null) throw new Exception("Invoice not found");

                payment.CreatedAt = DateTime.UtcNow;
                payment.CreatedBy = userId;
                payment.RecordedBy = userId;

                context.InvoicePayments.Add(payment);

                invoice.AmountPaid += payment.Amount;
                invoice.Balance = invoice.Total - invoice.AmountPaid;

                if (invoice.Balance <= 0)
                {
                    invoice.PaymentStatus = InvoicePaymentStatus.Paid;
                    invoice.Balance = 0;
                }
                else if (invoice.AmountPaid > 0)
                {
                    invoice.PaymentStatus = InvoicePaymentStatus.Partial;
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

        public async Task<FinancialSnapshot> GetFinancialSnapshotAsync()
        {
            using var context = _factory.CreateDbContext();
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var invoices = await context.Invoices
                .Where(i => i.InvoiceDate >= monthStart)
                .AsNoTracking()
                .ToListAsync();

            var allInvoices = await context.Invoices
                .AsNoTracking()
                .ToListAsync();

            return new FinancialSnapshot
            {
                TotalRevenueMTD = invoices.Sum(i => i.Total),
                TotalCollectedMTD = invoices.Sum(i => i.AmountPaid),
                TotalOutstanding = allInvoices.Sum(i => i.Balance),
                OverdueAmount = allInvoices.Where(i => i.DueDate < now && i.Balance > 0).Sum(i => i.Balance),
                UnpaidInvoiceCount = allInvoices.Count(i => i.Balance > 0)
            };
        }
        public async Task<AgingReportDto> GetAgingReportAsync()
        {
            using var context = _factory.CreateDbContext();
            var now = DateTime.UtcNow;

            var unpaidInvoices = await context.Invoices
                .Where(i => i.Balance > 0)
                .AsNoTracking()
                .ToListAsync();

            var report = new AgingReportDto();

            foreach (var inv in unpaidInvoices)
            {
                if (!inv.DueDate.HasValue) 
                {
                    report.Current += inv.Balance;
                    continue;
                }

                var daysOverdue = (now - inv.DueDate.Value).TotalDays;
                
                if (daysOverdue <= 0)
                {
                    // Not overdue yet, but unpaid. Consider it current or 0-30 based on invoice date.
                    report.Current += inv.Balance;
                }
                else if (daysOverdue <= 30)
                {
                    report.Current += inv.Balance;
                }
                else if (daysOverdue <= 60)
                {
                    report.Days31To60 += inv.Balance;
                }
                else if (daysOverdue <= 90)
                {
                    report.Days61To90 += inv.Balance;
                }
                else
                {
                    report.Days90Plus += inv.Balance;
                }
            }

            return report;
        }
    }
}

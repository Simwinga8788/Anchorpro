using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Data.Enums;
using AnchorPro.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Services
{
    public class QuotationService : IQuotationService
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly IFinancialService _financialService;

        public QuotationService(IDbContextFactory<ApplicationDbContext> factory, IFinancialService financialService)
        {
            _factory = factory;
            _financialService = financialService;
        }

        public async Task<Quotation?> GetQuotationByIdAsync(int id)
        {
            using var context = _factory.CreateDbContext();
            return await context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.JobCard)
                .AsNoTracking()
                .FirstOrDefaultAsync(q => q.Id == id);
        }

        public async Task<Quotation?> GetQuotationByJobIdAsync(int jobId)
        {
            using var context = _factory.CreateDbContext();
            return await context.Quotations
                .Include(q => q.Customer)
                .AsNoTracking()
                .FirstOrDefaultAsync(q => q.JobCardId == jobId);
        }

        public async Task<Quotation> CreateQuotationFromJobAsync(int jobId, string userId)
        {
            using var context = _factory.CreateDbContext();
            var job = await context.JobCards
                .Include(j => j.Customer)
                .FirstOrDefaultAsync(j => j.Id == jobId);

            if (job == null) throw new Exception("Job not found");

            // Check if quotation already exists
            var existing = await context.Quotations.FirstOrDefaultAsync(q => q.JobCardId == jobId);
            if (existing != null) return existing;

            // Use JobNumber as the QuotationNumber
            var qtnNumber = !string.IsNullOrWhiteSpace(job.JobNumber) ? job.JobNumber.Trim() : $"QTN-{job.Id}";

            // Subtotal is based on job's invoiceAmount (Agreed Price), fallback to TotalCost (components + external service)
            decimal subtotal = job.InvoiceAmount;
            if (subtotal <= 0)
            {
                subtotal = job.TotalCost;
            }

            var quotation = new Quotation
            {
                QuotationNumber = qtnNumber,
                JobCardId = jobId,
                CustomerId = job.CustomerId,
                QuoteDate = DateTime.UtcNow,
                ExpiryDate = DateTime.UtcNow.AddDays(30),
                Subtotal = subtotal,
                TaxRate = 16.00m,
                Status = QuotationStatus.Draft,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                TenantId = job.TenantId
            };

            quotation.TaxAmount = Math.Round(quotation.Subtotal * (quotation.TaxRate / 100), 2);
            quotation.Total = quotation.Subtotal + quotation.TaxAmount;

            context.Quotations.Add(quotation);
            await context.SaveChangesAsync();

            return quotation;
        }

        public async Task AcceptQuotationAsync(int id, string userId)
        {
            using var context = _factory.CreateDbContext();
            var quote = await context.Quotations.FindAsync(id);
            if (quote != null)
            {
                quote.Status = QuotationStatus.Accepted;
                quote.UpdatedAt = DateTime.UtcNow;
                quote.UpdatedBy = userId;
                await context.SaveChangesAsync();

                // Update the JobCard's InvoiceAmount to match the accepted quote subtotal
                var job = await context.JobCards.FindAsync(quote.JobCardId);
                if (job != null)
                {
                    job.InvoiceAmount = quote.Subtotal;
                    job.UpdatedAt = DateTime.UtcNow;
                    job.UpdatedBy = userId;
                    await context.SaveChangesAsync();
                }

                // Automatically generate the invoice
                await _financialService.CreateInvoiceFromJobAsync(quote.JobCardId, userId);
            }
        }

        public async Task RejectQuotationAsync(int id, string reason, string userId)
        {
            using var context = _factory.CreateDbContext();
            var quote = await context.Quotations.FindAsync(id);
            if (quote != null)
            {
                quote.Status = QuotationStatus.Rejected;
                quote.RejectionReason = reason;
                quote.UpdatedAt = DateTime.UtcNow;
                quote.UpdatedBy = userId;
                await context.SaveChangesAsync();
            }
        }
    }
}

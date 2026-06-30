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
            var qtnNumber = !string.IsNullOrWhiteSpace(job.JobNumber) ? job.JobNumber.Trim().Replace("JOB", "QTN") : $"QTN-{job.Id}";

            // Retrieve Global Financial & Markup settings for this tenant
            var settings = await context.SystemSettings
                .Where(s => s.TenantId == job.TenantId)
                .ToListAsync();

            decimal partsMarkupPercent = 20m; // Fallback default
            decimal laborBillingRate = 400m; // Fallback default
            decimal laborMarkupPercent = 10m; // Fallback default

            var partsMarkupSetting = settings.FirstOrDefault(s => s.Key == "Fin.DefaultPartsMarkupPercent");
            if (partsMarkupSetting != null && decimal.TryParse(partsMarkupSetting.Value, out var pm))
            {
                partsMarkupPercent = pm;
            }

            var laborRateSetting = settings.FirstOrDefault(s => s.Key == "Fin.DefaultLaborBillingRate");
            if (laborRateSetting != null && decimal.TryParse(laborRateSetting.Value, out var lr))
            {
                laborBillingRate = lr;
            }

            var laborMarkupSetting = settings.FirstOrDefault(s => s.Key == "Fin.DefaultLaborMarkupPercent");
            if (laborMarkupSetting != null && decimal.TryParse(laborMarkupSetting.Value, out var lm))
            {
                laborMarkupPercent = lm;
            }

            // Calculation
            // Quoted Parts = JobCard.PartsCost * (1 + partsMarkupPercent / 100)
            decimal quotedParts = job.PartsCost * (1 + (partsMarkupPercent / 100));

            // Quoted Labor = JobCard.EstimatedLaborHours * laborBillingRate * (1 + laborMarkupPercent / 100)
            decimal quotedLabor = job.EstimatedLaborHours * laborBillingRate * (1 + (laborMarkupPercent / 100));

            // Quotation Subtotal = Quoted Parts + Quoted Labor + DirectPurchaseCost + SubcontractingCost
            decimal subtotal = Math.Round(quotedParts + quotedLabor + job.DirectPurchaseCost + job.SubcontractingCost, 2);

            // Fallback: If subtotal is 0, use the job's invoiceAmount or totalCost
            if (subtotal <= 0)
            {
                subtotal = job.InvoiceAmount > 0 ? job.InvoiceAmount : job.TotalCost;
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

        public async Task<Quotation> CreateAdHocQuotationAsync(Quotation quotation, string userId)
        {
            using var context = _factory.CreateDbContext();
            
            // Set defaults for ad-hoc creation
            quotation.QuotationNumber = $"QTN-AH-{DateTime.UtcNow:yyyyMMddHHmmss}";
            quotation.QuoteDate = DateTime.UtcNow;
            if (quotation.ExpiryDate == default)
                quotation.ExpiryDate = DateTime.UtcNow.AddDays(30);
            
            quotation.TaxAmount = Math.Round(quotation.Subtotal * (quotation.TaxRate / 100), 2);
            quotation.Total = quotation.Subtotal + quotation.TaxAmount;
            
            quotation.Status = QuotationStatus.Draft;
            quotation.CreatedAt = DateTime.UtcNow;
            quotation.CreatedBy = userId;
            
            // Fetch first tenant id if missing
            if (quotation.TenantId == 0)
            {
                var tenant = await context.Tenants.FirstOrDefaultAsync();
                if (tenant != null) quotation.TenantId = tenant.Id;
            }

            context.Quotations.Add(quotation);
            await context.SaveChangesAsync();

            return quotation;
        }

        public async Task<Quotation> UpdateQuotationAsync(int id, decimal subtotal, string? notes, string userId)
        {
            using var context = _factory.CreateDbContext();
            var quotation = await context.Quotations.FindAsync(id);
            if (quotation == null) throw new Exception("Quotation not found");
            if (quotation.Status == QuotationStatus.Accepted || quotation.Status == QuotationStatus.Rejected)
                throw new Exception("Cannot edit an accepted or rejected quotation");

            quotation.Subtotal   = subtotal;
            quotation.TaxAmount  = Math.Round(subtotal * (quotation.TaxRate / 100), 2);
            quotation.Total      = subtotal + quotation.TaxAmount;
            quotation.Notes      = notes;
            quotation.UpdatedAt  = DateTime.UtcNow;
            quotation.UpdatedBy  = userId;

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

        public async Task<List<Quotation>> GetAllQuotationsAsync()
        {
            using var context = _factory.CreateDbContext();
            return await context.Quotations
                .Include(q => q.JobCard)
                    .ThenInclude(j => j!.Customer)
                .OrderByDescending(q => q.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}

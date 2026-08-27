using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
using AnchorPro.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnchorPro.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CertificatesController : ControllerBase
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;
        private readonly IFinancialService _financialService;

        public CertificatesController(IDbContextFactory<ApplicationDbContext> factory, IFinancialService financialService)
        {
            _factory = factory;
            _financialService = financialService;
        }

        /// <summary>
        /// GET /api/certificates/project/{projectId}
        /// Get all Interim Payment Certificates for a project
        /// </summary>
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetByProject(int projectId)
        {
            using var db = _factory.CreateDbContext();
            var certs = await db.PaymentCertificates
                .Include(c => c.ApprovedBy)
                .Where(c => c.ProjectId == projectId)
                .OrderByDescending(c => c.PeriodEndDate)
                .ToListAsync();

            return Ok(certs);
        }

        /// <summary>
        /// GET /api/certificates/{id}
        /// Get certificate details with all line item measurements
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            using var db = _factory.CreateDbContext();
            var cert = await db.PaymentCertificates
                .Include(c => c.Project)
                .Include(c => c.BillOfQuantities)
                .Include(c => c.Items)
                    .ThenInclude(i => i.BoqItem!)
                        .ThenInclude(b => b.BoqSection)
                .Include(c => c.Variations)
                    .ThenInclude(v => v.Variation)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cert == null) return NotFound();
            return Ok(cert);
        }

        /// <summary>
        /// POST /api/certificates
        /// Generate a new Interim Payment Certificate pre-populated from the project's BOQ
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCertificateDto dto)
        {
            using var db = _factory.CreateDbContext();
            var boq = await db.BillsOfQuantities
                .Include(b => b.Sections)
                    .ThenInclude(s => s.Items)
                .FirstOrDefaultAsync(b => b.ProjectId == dto.ProjectId);

            if (boq == null)
                return BadRequest("No Bill of Quantities found for this project. Please create a BOQ first.");

            // Calculate previous certified totals
            var previousCerts = await db.PaymentCertificates
                .Where(c => c.ProjectId == dto.ProjectId && c.Status != CertificateStatus.Draft)
                .ToListAsync();

            decimal previousPaid = previousCerts.Sum(c => c.NetAmountDue);
            int nextCertNumber = await db.PaymentCertificates.CountAsync(c => c.ProjectId == dto.ProjectId) + 1;

            var cert = new PaymentCertificate
            {
                ProjectId = dto.ProjectId,
                BillOfQuantitiesId = boq.Id,
                CertificateNumber = $"IPC-{nextCertNumber:D2}",
                PeriodStartDate = dto.PeriodStartDate,
                PeriodEndDate = dto.PeriodEndDate,
                RetentionPercentage = dto.RetentionPercentage > 0 ? dto.RetentionPercentage : 5.00m,
                PreviousCertificatesPaid = previousPaid,
                Status = CertificateStatus.Draft
            };

            // Pre-populate with all BOQ items
            decimal itemsValue = 0;
            foreach (var section in boq.Sections)
            {
                foreach (var item in section.Items)
                {
                    // Find previous cumulative quantity completed for this BOQ item
                    var prevItem = await db.PaymentCertificateItems
                        .Where(i => i.BoqItemId == item.Id && i.PaymentCertificate!.ProjectId == dto.ProjectId)
                        .OrderByDescending(i => i.PaymentCertificate!.PeriodEndDate)
                        .FirstOrDefaultAsync();

                    decimal prevQty = prevItem?.CumulativeQuantityCompleted ?? 0;
                    decimal cumulativeValue = Math.Round(prevQty * item.Rate, 2);
                    itemsValue += cumulativeValue;

                    cert.Items.Add(new PaymentCertificateItem
                    {
                        BoqItemId = item.Id,
                        PreviousQuantity = prevQty,
                        CurrentQuantityCompleted = 0,
                        CumulativeQuantityCompleted = prevQty,
                        CumulativeValueCompleted = cumulativeValue,
                        PercentageComplete = item.Quantity > 0 ? Math.Round((prevQty / item.Quantity) * 100, 2) : 0
                    });
                }
            }

            // Pull in Approved variations for this project that haven't been certified yet —
            // per FR-8.2, an approved variation automatically becomes available on the next certificate.
            var alreadyCertifiedVariationIds = await db.PaymentCertificateVariations
                .Where(cv => cv.PaymentCertificate!.ProjectId == dto.ProjectId)
                .Select(cv => cv.VariationId)
                .ToListAsync();

            var pendingVariations = await db.Variations
                .Where(v => v.ProjectId == dto.ProjectId
                    && v.Status == VariationStatus.Approved
                    && !alreadyCertifiedVariationIds.Contains(v.Id))
                .ToListAsync();

            decimal variationsValue = 0;
            foreach (var variation in pendingVariations)
            {
                variationsValue += variation.Amount;
                cert.Variations.Add(new PaymentCertificateVariation
                {
                    VariationId = variation.Id,
                    ValuedAmount = variation.Amount
                });
            }

            cert.GrossValuationToDate = itemsValue + variationsValue;
            cert.RetentionDeductionToDate = Math.Round(cert.GrossValuationToDate * (cert.RetentionPercentage / 100m), 2);
            cert.NetAmountDue = (cert.GrossValuationToDate - cert.RetentionDeductionToDate) - cert.PreviousCertificatesPaid;
            if (cert.NetAmountDue < 0) cert.NetAmountDue = 0;

            db.PaymentCertificates.Add(cert);
            await db.SaveChangesAsync();

            return Ok(cert);
        }

        /// <summary>
        /// PUT /api/certificates/{id}/items
        /// Save measured quantities completed this period and recalculate certificate totals
        /// </summary>
        [HttpPut("{id}/items")]
        public async Task<IActionResult> UpdateMeasurements(int id, [FromBody] List<UpdateMeasurementDto> measurements)
        {
            using var db = _factory.CreateDbContext();
            var cert = await db.PaymentCertificates
                .Include(c => c.Items)
                    .ThenInclude(i => i.BoqItem)
                .Include(c => c.Variations)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cert == null) return NotFound();
            if (cert.Status != CertificateStatus.Draft && cert.Status != CertificateStatus.Queried)
                return BadRequest("Certificate measurements can only be edited while in Draft or Queried status.");

            decimal totalGrossValuation = 0;

            foreach (var m in measurements)
            {
                var item = cert.Items.FirstOrDefault(i => i.Id == m.CertificateItemId);
                if (item != null && item.BoqItem != null)
                {
                    item.CurrentQuantityCompleted = m.CurrentQuantity;
                    item.CumulativeQuantityCompleted = item.PreviousQuantity + m.CurrentQuantity;
                    item.CumulativeValueCompleted = Math.Round(item.CumulativeQuantityCompleted * item.BoqItem.Rate, 2);
                    item.PercentageComplete = item.BoqItem.Quantity > 0 ?
                        Math.Round((item.CumulativeQuantityCompleted / item.BoqItem.Quantity) * 100, 2) : 0;
                    item.Notes = m.Notes;

                    totalGrossValuation += item.CumulativeValueCompleted;
                }
            }

            // Items not present in this update batch keep their existing cumulative value
            foreach (var item in cert.Items.Where(i => !measurements.Any(m => m.CertificateItemId == i.Id)))
            {
                totalGrossValuation += item.CumulativeValueCompleted;
            }

            totalGrossValuation += cert.Variations.Sum(v => v.ValuedAmount);

            cert.GrossValuationToDate = totalGrossValuation;
            cert.RetentionDeductionToDate = Math.Round(totalGrossValuation * (cert.RetentionPercentage / 100m), 2);
            
            // Net Amount Due = (Gross Valuation - Retention) - Previous Certificates Paid
            cert.NetAmountDue = (cert.GrossValuationToDate - cert.RetentionDeductionToDate) - cert.PreviousCertificatesPaid;
            if (cert.NetAmountDue < 0) cert.NetAmountDue = 0;

            await db.SaveChangesAsync();

            return Ok(cert);
        }

        /// <summary>
        /// POST /api/certificates/{id}/submit
        /// Submit certificate to Consultant / Quantity Surveyor for review.
        /// Valid from Draft (first submission) or Queried (resubmission after addressing a query).
        /// </summary>
        [HttpPost("{id}/submit")]
        public async Task<IActionResult> SubmitToConsultant(int id)
        {
            using var db = _factory.CreateDbContext();
            var cert = await db.PaymentCertificates.FindAsync(id);
            if (cert == null) return NotFound();

            if (cert.Status != CertificateStatus.Draft && cert.Status != CertificateStatus.Queried)
                return BadRequest("Only a Draft or Queried certificate can be submitted to the Consultant.");

            cert.Status = CertificateStatus.SubmittedToConsultant;
            await db.SaveChangesAsync();

            return Ok(new { message = "Payment Certificate submitted to Consultant." });
        }

        /// <summary>
        /// POST /api/certificates/{id}/query
        /// Consultant queries the certificate, sending it back to the contractor with notes.
        /// </summary>
        [HttpPost("{id}/query")]
        public async Task<IActionResult> Query(int id, [FromBody] QueryCertificateDto dto)
        {
            using var db = _factory.CreateDbContext();
            var cert = await db.PaymentCertificates.FindAsync(id);
            if (cert == null) return NotFound();

            if (cert.Status != CertificateStatus.SubmittedToConsultant)
                return BadRequest("Only a certificate submitted to the Consultant can be queried.");

            if (string.IsNullOrWhiteSpace(dto.Notes))
                return BadRequest("A note explaining the query is required.");

            cert.Status = CertificateStatus.Queried;
            cert.ConsultantNotes = dto.Notes;

            await db.SaveChangesAsync();
            return Ok(new { message = "Payment Certificate queried." });
        }

        /// <summary>
        /// POST /api/certificates/{id}/approve
        /// Approve certificate (Consultant / Director Sign-off)
        /// </summary>
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            using var db = _factory.CreateDbContext();
            var cert = await db.PaymentCertificates.FindAsync(id);
            if (cert == null) return NotFound();

            if (cert.Status != CertificateStatus.SubmittedToConsultant)
                return BadRequest("Only a certificate submitted to the Consultant can be approved.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            cert.Status = CertificateStatus.Approved;
            cert.ApprovedAt = DateTime.UtcNow;
            cert.ApprovedById = userId;

            await db.SaveChangesAsync();
            return Ok(new { message = "Payment Certificate approved." });
        }

        /// <summary>
        /// POST /api/certificates/{id}/issue
        /// Issue the approved certificate to the client/consultant for payment.
        /// </summary>
        [HttpPost("{id}/issue")]
        public async Task<IActionResult> Issue(int id)
        {
            using var db = _factory.CreateDbContext();
            var cert = await db.PaymentCertificates.FindAsync(id);
            if (cert == null) return NotFound();

            if (cert.Status != CertificateStatus.Approved)
                return BadRequest("Only an approved certificate can be issued.");

            cert.Status = CertificateStatus.Issued;
            await db.SaveChangesAsync();

            return Ok(new { message = "Payment Certificate issued." });
        }

        /// <summary>
        /// POST /api/certificates/{id}/pay
        /// Record that the issued certificate has been paid.
        /// </summary>
        [HttpPost("{id}/pay")]
        public async Task<IActionResult> MarkPaid(int id)
        {
            using var db = _factory.CreateDbContext();
            var cert = await db.PaymentCertificates.FindAsync(id);
            if (cert == null) return NotFound();

            if (cert.Status != CertificateStatus.Issued)
                return BadRequest("Only an issued certificate can be marked as paid.");

            cert.Status = CertificateStatus.Paid;
            await db.SaveChangesAsync();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "System";
            await _financialService.PostCertificatePaymentAsync(cert.Id, userId);

            return Ok(new { message = "Payment Certificate marked as paid." });
        }
    }

    public class CreateCertificateDto
    {
        public int ProjectId { get; set; }
        public DateTime PeriodStartDate { get; set; }
        public DateTime PeriodEndDate { get; set; }
        public decimal RetentionPercentage { get; set; } = 5.00m;
    }

    public class UpdateMeasurementDto
    {
        public int CertificateItemId { get; set; }
        public decimal CurrentQuantity { get; set; }
        public string? Notes { get; set; }
    }

    public class QueryCertificateDto
    {
        public string Notes { get; set; } = string.Empty;
    }
}

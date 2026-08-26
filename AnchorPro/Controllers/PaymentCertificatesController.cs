using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AnchorPro.Data;
using AnchorPro.Data.Entities;
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

        public CertificatesController(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
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
            int nextCertNumber = previousCerts.Count + 1;

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

                    cert.Items.Add(new PaymentCertificateItem
                    {
                        BoqItemId = item.Id,
                        PreviousQuantity = prevQty,
                        CurrentQuantityCompleted = 0,
                        CumulativeQuantityCompleted = prevQty,
                        CumulativeValueCompleted = Math.Round(prevQty * item.Rate, 2),
                        PercentageComplete = item.Quantity > 0 ? Math.Round((prevQty / item.Quantity) * 100, 2) : 0
                    });
                }
            }

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
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cert == null) return NotFound();
            if (cert.Status == CertificateStatus.Approved || cert.Status == CertificateStatus.Paid)
                return BadRequest("Cannot edit an approved or paid certificate.");

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
        /// Submit certificate to Consultant / Quantity Surveyor for review
        /// </summary>
        [HttpPost("{id}/submit")]
        public async Task<IActionResult> SubmitToConsultant(int id)
        {
            using var db = _factory.CreateDbContext();
            var cert = await db.PaymentCertificates.FindAsync(id);
            if (cert == null) return NotFound();

            cert.Status = CertificateStatus.SubmittedToConsultant;
            await db.SaveChangesAsync();

            return Ok(new { message = "Payment Certificate submitted to Consultant." });
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

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            cert.Status = CertificateStatus.Approved;
            cert.ApprovedAt = DateTime.UtcNow;
            cert.ApprovedById = userId;

            await db.SaveChangesAsync();
            return Ok(new { message = "Payment Certificate approved." });
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
}

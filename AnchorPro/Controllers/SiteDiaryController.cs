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
    public class SiteDiaryController : ControllerBase
    {
        private readonly IDbContextFactory<ApplicationDbContext> _factory;

        public SiteDiaryController(IDbContextFactory<ApplicationDbContext> factory)
        {
            _factory = factory;
        }

        /// <summary>
        /// GET /api/sitediary/project/{projectId}
        /// Get all site diary entries for a project with summary stats
        /// </summary>
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetByProject(int projectId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            using var db = _factory.CreateDbContext();
            var query = db.SiteDiaryEntries
                .Include(d => d.LabourHeadcounts)
                    .ThenInclude(l => l.Employee)
                .Include(d => d.PlantUsages)
                .Include(d => d.Deliveries)
                .Include(d => d.Photos)
                .Include(d => d.SafetyLogs)
                .Include(d => d.LoggedBy)
                .Where(d => d.ProjectId == projectId);

            if (fromDate.HasValue)
                query = query.Where(d => d.DiaryDate >= fromDate.Value.Date);
            if (toDate.HasValue)
                query = query.Where(d => d.DiaryDate <= toDate.Value.Date);

            var entries = await query.OrderByDescending(d => d.DiaryDate).ToListAsync();
            return Ok(entries);
        }

        /// <summary>
        /// GET /api/sitediary/{id}
        /// Get single diary entry with all child details
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            using var db = _factory.CreateDbContext();
            var entry = await db.SiteDiaryEntries
                .Include(d => d.LabourHeadcounts)
                    .ThenInclude(l => l.Employee)
                .Include(d => d.PlantUsages)
                .Include(d => d.Deliveries)
                .Include(d => d.Photos)
                .Include(d => d.SafetyLogs)
                .Include(d => d.LoggedBy)
                .Include(d => d.Project)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (entry == null) return NotFound();
            return Ok(entry);
        }

        /// <summary>
        /// POST /api/sitediary
        /// Create a new Daily Site Diary entry
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSiteDiaryDto dto)
        {
            using var db = _factory.CreateDbContext();
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var entry = new SiteDiaryEntry
            {
                ProjectId = dto.ProjectId,
                DiaryDate = dto.DiaryDate.Date,
                WeatherCondition = dto.WeatherCondition ?? "Sunny",
                TemperatureCelsius = dto.TemperatureCelsius,
                WorkPerformedSummary = dto.WorkPerformedSummary,
                SiteInstructionsReceived = dto.SiteInstructionsReceived,
                DelaysOrConstraints = dto.DelaysOrConstraints,
                Status = SiteDiaryStatus.Draft,
                LoggedById = userId
            };

            if (dto.Labour != null)
            {
                foreach (var l in dto.Labour)
                {
                    entry.LabourHeadcounts.Add(new SiteDiaryLabour
                    {
                        TradeOrCrewName = l.TradeOrCrewName,
                        Headcount = l.Headcount,
                        HoursWorked = l.HoursWorked,
                        EmployeeUserId = l.EmployeeUserId,
                        Notes = l.Notes
                    });
                }
            }

            if (dto.Plant != null)
            {
                foreach (var p in dto.Plant)
                {
                    entry.PlantUsages.Add(new SiteDiaryPlant
                    {
                        EquipmentId = p.EquipmentId,
                        EquipmentName = p.EquipmentName,
                        OperatingHours = p.OperatingHours,
                        IdleHours = p.IdleHours,
                        BreakdownHours = p.BreakdownHours,
                        FuelConsumedLitres = p.FuelConsumedLitres,
                        Notes = p.Notes
                    });
                }
            }

            if (dto.Deliveries != null)
            {
                foreach (var d in dto.Deliveries)
                {
                    entry.Deliveries.Add(new SiteDiaryDelivery
                    {
                        SupplierName = d.SupplierName,
                        MaterialDescription = d.MaterialDescription,
                        QuantityReceived = d.QuantityReceived,
                        UnitOfMeasure = d.UnitOfMeasure,
                        DeliveryNoteNumber = d.DeliveryNoteNumber,
                        VerifiedBy = d.VerifiedBy
                    });
                }
            }

            if (dto.Safety != null)
            {
                entry.SafetyLogs.Add(new SiteDiarySafety
                {
                    ToolboxTalkTopic = dto.Safety.ToolboxTalkTopic,
                    IncidentsReported = dto.Safety.IncidentsReported,
                    NearMissesCount = dto.Safety.NearMissesCount,
                    HazardsIdentified = dto.Safety.HazardsIdentified,
                    CorrectiveAction = dto.Safety.CorrectiveAction
                });
            }

            db.SiteDiaryEntries.Add(entry);
            await db.SaveChangesAsync();

            return Ok(entry);
        }

        /// <summary>
        /// POST /api/sitediary/{id}/photos
        /// Attach a photo URL / caption to a site diary entry
        /// </summary>
        [HttpPost("{id}/photos")]
        public async Task<IActionResult> AddPhoto(int id, [FromBody] AddDiaryPhotoDto dto)
        {
            using var db = _factory.CreateDbContext();
            var entry = await db.SiteDiaryEntries.FindAsync(id);
            if (entry == null) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var photo = new SiteDiaryPhoto
            {
                SiteDiaryEntryId = id,
                PhotoUrl = dto.PhotoUrl,
                Caption = dto.Caption,
                TakenAt = DateTime.UtcNow,
                UploadedById = userId
            };

            db.SiteDiaryPhotos.Add(photo);
            await db.SaveChangesAsync();

            return Ok(photo);
        }

        /// <summary>
        /// POST /api/sitediary/{id}/submit
        /// Submit diary for Director / PM signoff
        /// </summary>
        [HttpPost("{id}/submit")]
        public async Task<IActionResult> Submit(int id)
        {
            using var db = _factory.CreateDbContext();
            var entry = await db.SiteDiaryEntries.FindAsync(id);
            if (entry == null) return NotFound();

            entry.Status = SiteDiaryStatus.Submitted;
            await db.SaveChangesAsync();

            return Ok(new { message = "Site Diary submitted for review." });
        }

        /// <summary>
        /// POST /api/sitediary/{id}/approve
        /// Approve site diary entry
        /// </summary>
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            using var db = _factory.CreateDbContext();
            var entry = await db.SiteDiaryEntries.FindAsync(id);
            if (entry == null) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            entry.Status = SiteDiaryStatus.Approved;
            entry.ApprovedAt = DateTime.UtcNow;
            entry.ApprovedById = userId;

            await db.SaveChangesAsync();
            return Ok(new { message = "Site Diary approved." });
        }
    }

    public class CreateSiteDiaryDto
    {
        public int ProjectId { get; set; }
        public DateTime DiaryDate { get; set; } = DateTime.UtcNow;
        public string WeatherCondition { get; set; } = "Sunny";
        public decimal? TemperatureCelsius { get; set; }
        public string WorkPerformedSummary { get; set; } = string.Empty;
        public string? SiteInstructionsReceived { get; set; }
        public string? DelaysOrConstraints { get; set; }
        public List<DiaryLabourDto>? Labour { get; set; }
        public List<DiaryPlantDto>? Plant { get; set; }
        public List<DiaryDeliveryDto>? Deliveries { get; set; }
        public DiarySafetyDto? Safety { get; set; }
    }

    public class DiaryLabourDto
    {
        public string TradeOrCrewName { get; set; } = string.Empty;
        public int Headcount { get; set; }
        public decimal HoursWorked { get; set; } = 8;
        public string? EmployeeUserId { get; set; }
        public string? Notes { get; set; }
    }

    public class DiaryPlantDto
    {
        public int? EquipmentId { get; set; }
        public string EquipmentName { get; set; } = string.Empty;
        public decimal OperatingHours { get; set; }
        public decimal IdleHours { get; set; }
        public decimal BreakdownHours { get; set; }
        public decimal? FuelConsumedLitres { get; set; }
        public string? Notes { get; set; }
    }

    public class DiaryDeliveryDto
    {
        public string SupplierName { get; set; } = string.Empty;
        public string MaterialDescription { get; set; } = string.Empty;
        public decimal QuantityReceived { get; set; }
        public string UnitOfMeasure { get; set; } = "ton";
        public string? DeliveryNoteNumber { get; set; }
        public string? VerifiedBy { get; set; }
    }

    public class DiarySafetyDto
    {
        public string? ToolboxTalkTopic { get; set; }
        public int IncidentsReported { get; set; }
        public int NearMissesCount { get; set; }
        public string? HazardsIdentified { get; set; }
        public string? CorrectiveAction { get; set; }
    }

    public class AddDiaryPhotoDto
    {
        public string PhotoUrl { get; set; } = string.Empty;
        public string? Caption { get; set; }
    }
}

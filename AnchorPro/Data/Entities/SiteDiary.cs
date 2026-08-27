using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public enum SiteDiaryStatus
    {
        Draft,
        Submitted,
        Approved
    }

    public class SiteDiaryEntry : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public DateTime DiaryDate { get; set; } = DateTime.UtcNow.Date;

        [MaxLength(100)]
        public string WeatherCondition { get; set; } = "Sunny"; // Sunny, Overcast, Rain, Heavy Rain, Wind, Hot

        public decimal? TemperatureCelsius { get; set; }

        [Required]
        public string WorkPerformedSummary { get; set; } = string.Empty;

        public string? SiteInstructionsReceived { get; set; }

        public string? DelaysOrConstraints { get; set; }

        public SiteDiaryStatus Status { get; set; } = SiteDiaryStatus.Draft;

        [MaxLength(85)]
        public string? LoggedById { get; set; }
        public ApplicationUser? LoggedBy { get; set; }

        public DateTime? ApprovedAt { get; set; }

        [MaxLength(85)]
        public string? ApprovedById { get; set; }
        public ApplicationUser? ApprovedBy { get; set; }

        // Child records for complete daily accountability
        public ICollection<SiteDiaryLabour> LabourHeadcounts { get; set; } = new List<SiteDiaryLabour>();
        public ICollection<SiteDiaryPlant> PlantUsages { get; set; } = new List<SiteDiaryPlant>();
        public ICollection<SiteDiaryDelivery> Deliveries { get; set; } = new List<SiteDiaryDelivery>();
        public ICollection<SiteDiaryPhoto> Photos { get; set; } = new List<SiteDiaryPhoto>();
        public ICollection<SiteDiarySafety> SafetyLogs { get; set; } = new List<SiteDiarySafety>();
    }

    public class SiteDiaryLabour : BaseEntity
    {
        public int SiteDiaryEntryId { get; set; }
        public SiteDiaryEntry? SiteDiaryEntry { get; set; }

        [Required]
        [MaxLength(100)]
        public string TradeOrCrewName { get; set; } = string.Empty; // e.g. "Concrete / Formwork", "Steel Fixers", "Electricians", "General Labour"

        public int Headcount { get; set; }

        [Column(TypeName = "decimal(8,2)")]
        public decimal HoursWorked { get; set; } = 8;

        // Set when this crew line is (or is led by) an actual AnchorPro employee rather than
        // subcontracted/casual labour — lets their hours roll into cost tracking via ApplicationUser.HourlyRate.
        [MaxLength(85)]
        public string? EmployeeUserId { get; set; }
        [ForeignKey(nameof(EmployeeUserId))]
        public ApplicationUser? Employee { get; set; }

        public string? Notes { get; set; }
    }

    public class SiteDiaryPlant : BaseEntity
    {
        public int SiteDiaryEntryId { get; set; }
        public SiteDiaryEntry? SiteDiaryEntry { get; set; }

        public int? EquipmentId { get; set; }
        public Equipment? Equipment { get; set; }

        [Required]
        [MaxLength(150)]
        public string EquipmentName { get; set; } = string.Empty; // e.g. "CAT 320 Excavator", "Concrete Mixer 400L"

        [Column(TypeName = "decimal(8,2)")]
        public decimal OperatingHours { get; set; }

        [Column(TypeName = "decimal(8,2)")]
        public decimal IdleHours { get; set; }

        [Column(TypeName = "decimal(8,2)")]
        public decimal BreakdownHours { get; set; }

        [Column(TypeName = "decimal(8,2)")]
        public decimal? FuelConsumedLitres { get; set; }

        public string? Notes { get; set; }
    }

    public class SiteDiaryDelivery : BaseEntity
    {
        public int SiteDiaryEntryId { get; set; }
        public SiteDiaryEntry? SiteDiaryEntry { get; set; }

        [Required]
        [MaxLength(150)]
        public string SupplierName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string MaterialDescription { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal QuantityReceived { get; set; }

        [MaxLength(30)]
        public string UnitOfMeasure { get; set; } = "ton";

        [MaxLength(80)]
        public string? DeliveryNoteNumber { get; set; }

        [MaxLength(100)]
        public string? VerifiedBy { get; set; }
    }

    public class SiteDiaryPhoto : BaseEntity
    {
        public int SiteDiaryEntryId { get; set; }
        public SiteDiaryEntry? SiteDiaryEntry { get; set; }

        [Required]
        public string PhotoUrl { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Caption { get; set; }

        public DateTime TakenAt { get; set; } = DateTime.UtcNow;

        [MaxLength(85)]
        public string? UploadedById { get; set; }
        public ApplicationUser? UploadedBy { get; set; }
    }

    public class SiteDiarySafety : BaseEntity
    {
        public int SiteDiaryEntryId { get; set; }
        public SiteDiaryEntry? SiteDiaryEntry { get; set; }

        [MaxLength(200)]
        public string? ToolboxTalkTopic { get; set; }

        public int IncidentsReported { get; set; } = 0;

        public int NearMissesCount { get; set; } = 0;

        public string? HazardsIdentified { get; set; }

        public string? CorrectiveAction { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public enum ShiftType { Day = 0, Night = 1, Afternoon = 2 }

    public enum ShiftLogStatus
    {
        Draft     = 0,
        Submitted = 1,
        Approved  = 2,
        Rejected  = 3,
    }

    /// <summary>
    /// Primary work document for Mining & Extraction operations.
    /// Records production output, machine hours, fuel consumption, and crew for a single shift.
    /// Connects to Finance via WorkDocumentCostEntry (WorkDocumentType = ShiftProductionLog).
    /// </summary>
    public class ShiftProductionLog : BaseEntity
    {
        /// <summary>Auto-generated reference number, e.g. SPL-2026-0001.</summary>
        [MaxLength(30)]
        public string LogNumber { get; set; } = "TEMP";

        public DateTime ShiftDate { get; set; }

        public ShiftType Shift { get; set; } = ShiftType.Day;

        // ── Equipment Link ──────────────────────────────────────────────────────
        public int? EquipmentId { get; set; }
        public Equipment? Equipment { get; set; }

        // ── Production Figures ──────────────────────────────────────────────────
        /// <summary>Quantity of material produced/moved this shift (tons, BCM, m³, etc.).</summary>
        public decimal QuantityProduced { get; set; }

        /// <summary>Unit of measure: Tons, BCM, m³, Oz, etc.</summary>
        [MaxLength(30)]
        public string UnitOfMeasure { get; set; } = "Tons";

        /// <summary>Planned/target production quantity for this shift.</summary>
        public decimal? TargetQuantity { get; set; }

        /// <summary>Number of trips/loads made.</summary>
        public int? LoadCount { get; set; }

        /// <summary>Tonnage factor per load (often pulled from Equipment.PayloadCapacity).</summary>
        public decimal? PayloadFactor { get; set; }

        // ── Resource Consumption ────────────────────────────────────────────────
        /// <summary>Fuel consumed in litres during this shift.</summary>
        public decimal FuelConsumedLitres { get; set; }

        /// <summary>Total machine operating hours logged for this shift.</summary>
        public decimal OperatingHours { get; set; }

        /// <summary>Any machine downtime recorded during the shift (hours).</summary>
        public decimal DowntimeHours { get; set; }

        // ── Personnel ───────────────────────────────────────────────────────────
        [MaxLength(150)]
        public string? OperatorName { get; set; }

        [MaxLength(150)]
        public string? SupervisorName { get; set; }

        /// <summary>Crew size on shift.</summary>
        public int? CrewCount { get; set; }

        // ── Location / Site ─────────────────────────────────────────────────────
        [MaxLength(200)]
        public string? Location { get; set; }  // e.g. "Pit 3 — North Face" (Legacy/General)

        [MaxLength(200)]
        public string? SourceLocation { get; set; } // e.g. "Level 12 Stope", "Pit 3 Face"

        [MaxLength(200)]
        public string? DestinationLocation { get; set; } // e.g. "Crusher", "Waste Dump 2"

        [MaxLength(100)]
        public string? ActivityType { get; set; }  // e.g. "Blasting", "Loading", "Hauling"

        // ── Notes & Status ──────────────────────────────────────────────────────
        [MaxLength(1000)]
        public string? Remarks { get; set; }

        public ShiftLogStatus Status { get; set; } = ShiftLogStatus.Draft;

        [MaxLength(450)]
        public string? ApprovedBy { get; set; }

        public DateTime? ApprovedAt { get; set; }

        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        // ── Navigation ──────────────────────────────────────────────────────────
        public ICollection<WorkDocumentCostEntry> CostEntries { get; set; } = new List<WorkDocumentCostEntry>();

        public int? InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }
    }
}

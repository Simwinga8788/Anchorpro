using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AnchorPro.Data.Entities
{
    public class ShiftPlanTask : BaseEntity
    {
        public int ShiftPlanId { get; set; }
        
        [JsonIgnore]
        public ShiftPlan? ShiftPlan { get; set; }

        /// <summary>
        /// E.g. "Drilling", "Loading", "Hauling"
        /// </summary>
        [MaxLength(100)]
        public string? ActivityCategory { get; set; }

        public int? EquipmentId { get; set; }
        public Equipment? Equipment { get; set; }

        [MaxLength(450)]
        public string? OperatorId { get; set; }
        public ApplicationUser? Operator { get; set; }

        public decimal? TargetPrimary { get; set; } // e.g. Meters, Buckets, Trips
        
        [MaxLength(50)]
        public string? TargetPrimaryUnit { get; set; } // "m", "buckets", "trips"

        public decimal? TargetTonnage { get; set; }

        [MaxLength(200)]
        public string? Location { get; set; } // e.g. 1250 stope 5814L ORE

        // Drilling specific
        [MaxLength(100)]
        public string? DrillRingAndHole { get; set; }

        // Loading specific: comma-separated list of Dump Truck IDs or simple text string
        [MaxLength(500)]
        public string? AssignedTrucks { get; set; }

        [MaxLength(500)]
        public string? Remarks { get; set; }
    }
}

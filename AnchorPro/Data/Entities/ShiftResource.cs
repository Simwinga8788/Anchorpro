using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AnchorPro.Data.Entities
{
    /// <summary>
    /// Represents a specific machine and operator assigned to a shift.
    /// A single shift can have a fleet of resources (e.g. 1 loader, 3 dump trucks).
    /// </summary>
    public class ShiftResource : BaseEntity
    {
        public int ShiftProductionLogId { get; set; }
        
        [JsonIgnore]
        public ShiftProductionLog? ShiftProductionLog { get; set; }

        public int? EquipmentId { get; set; }
        public Equipment? Equipment { get; set; }

        [MaxLength(450)]
        public string? OperatorId { get; set; }
        public ApplicationUser? Operator { get; set; }

        /// <summary>
        /// e.g. "Loader Operator", "Haulage Driver"
        /// </summary>
        [MaxLength(100)]
        public string? Role { get; set; }

        /// <summary>
        /// Specific operating hours for this machine during the shift (if different from overall shift hours).
        /// </summary>
        public decimal? OperatingHours { get; set; }

        public decimal? DowntimeHours { get; set; }

        [MaxLength(200)]
        public string? DowntimeReason { get; set; }

        /// <summary>
        /// Specific production amount achieved by this resource (e.g. 50 meters, 12 trips).
        /// </summary>
        public decimal? ActualQuantity { get; set; }

        [MaxLength(50)]
        public string? QuantityUnit { get; set; }
    }
}

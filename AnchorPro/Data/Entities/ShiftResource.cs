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
    }
}

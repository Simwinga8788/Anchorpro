using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class DowntimeCategory : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty; // e.g. "Waiting for Parts", "Safety Hold"

        public bool IsPaidTime { get; set; } = true; // Business logic: does this count as 'paid' downtime?
    }
}

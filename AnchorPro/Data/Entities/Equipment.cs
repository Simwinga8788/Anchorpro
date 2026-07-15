using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class Equipment : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string SerialNumber { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? ModelNumber { get; set; }

        [MaxLength(50)]
        public string? Manufacturer { get; set; }

        [MaxLength(200)]
        public string? Location { get; set; }

        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }

        /// <summary>Cost per hour when equipment is idle/down (Burden Rate)</summary>
        public decimal HourlyRate { get; set; } = 150.00m; 

        /// <summary>Standard payload capacity (e.g. 40 tons for a dump truck)</summary>
        public decimal? PayloadCapacity { get; set; }

        // Navigation property for JobCards
        public ICollection<JobCard> JobCards { get; set; } = new List<JobCard>();
    }
}

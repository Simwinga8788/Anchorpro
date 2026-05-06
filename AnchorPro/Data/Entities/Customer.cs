using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class Customer : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ContactPerson { get; set; }       // Primary contact at the company

        [EmailAddress]
        [MaxLength(100)]
        public string? Email { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(200)]
        public string? Address { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }               // Internal notes about the client

        public ICollection<JobCard> JobCards { get; set; } = new List<JobCard>();
    }
}

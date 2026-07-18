using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class ProjectMember : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        [Required]
        [MaxLength(85)]
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser? User { get; set; }

        [Required]
        [MaxLength(50)]
        public string ProjectRole { get; set; } = "Viewer"; // e.g., Viewer, Contributor, Admin
    }
}

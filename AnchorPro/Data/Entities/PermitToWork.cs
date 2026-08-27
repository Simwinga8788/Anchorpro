using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class PermitToWork : BaseEntity
    {
        // Either JobCardId (maintenance work) or ProjectId (construction site work) — a permit
        // needs at least one, but construction Site Diary work has no job card to attach to.
        public int? JobCardId { get; set; }
        public JobCard? JobCard { get; set; }

        public int? ProjectId { get; set; }
        public Project? Project { get; set; }

        // Safety Checks
        public bool IsIsolated { get; set; }
        public bool IsLotoApplied { get; set; }     // Lock Out Tag Out
        public bool IsAreaSecure { get; set; }
        public bool IsPpeChecked { get; set; }
        public bool ToolboxTalkCompleted { get; set; }

        [MaxLength(500)]
        public string? HazardsIdentified { get; set; }

        [MaxLength(500)]
        public string? ControlMeasures { get; set; }    // Mitigations for identified hazards

        [MaxLength(100)]
        public string? WorkScope { get; set; }           // Brief scope of work to be performed

        [Required]
        [MaxLength(100)]
        public string AuthorizedBy { get; set; } = string.Empty;

        public DateTime AuthorizedAt { get; set; } = DateTime.UtcNow;

        // Permit lifecycle
        public PermitStatus Status { get; set; } = PermitStatus.Active;
        public DateTime? ClosedAt { get; set; }

        [MaxLength(200)]
        public string? ClosureNotes { get; set; }
    }

    public enum PermitStatus
    {
        Active,
        Suspended,
        Closed
    }
}

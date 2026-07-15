using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    /// <summary>
    /// Determines which primary work document type this tenant uses in Operations.
    /// Set once at onboarding — immutable after registration.
    /// </summary>
    public enum OperationMode
    {
        JobCard             = 0, // Default — Workshops, Engineering, Field Service
        ShiftProductionLog  = 1, // Mining & Extraction
        TripSheet           = 2, // Transport & Logistics
        SiteDiary           = 3, // Construction & Civil Works
        MaintenanceRecord   = 4, // Facilities Management
        GeneralWorkOrder    = 5, // Generic fallback
    }

    public class Tenant
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? ContactEmail { get; set; }

        [MaxLength(50)]
        public string? ContactPhone { get; set; }

        // The user who owns this tenant/company
        [MaxLength(450)]
        public string? OwnerId { get; set; }

        public string? LogoUrl { get; set; }

        /// <summary>Industry selected at onboarding (e.g. "Mining & Extraction"). Immutable after registration.</summary>
        [MaxLength(100)]
        public string? Industry { get; set; }

        /// <summary>Drives which work document type is used in the Operations module. Immutable after registration.</summary>
        public OperationMode OperationMode { get; set; } = OperationMode.JobCard;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [MaxLength(450)]
        public string? CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }
        [MaxLength(450)]
        public string? UpdatedBy { get; set; }
        
        public bool IsActive { get; set; } = true;
    }
}

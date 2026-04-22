using System;
using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }

        // Multi-Tenancy: Null = System/Global, Value = Specific Tenant
        public int? TenantId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(85)] // Matches Identity User Id length
        public string? CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        [MaxLength(85)]
        public string? UpdatedBy { get; set; }
    }
}

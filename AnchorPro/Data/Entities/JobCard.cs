using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AnchorPro.Data.Enums;

namespace AnchorPro.Data.Entities
{
    public class JobCard : BaseEntity
    {
        [Required]
        [MaxLength(20)]
        public string JobNumber { get; set; } = string.Empty; // e.g. "JOB-2025-001234"

        [Required]
        public string Description { get; set; } = string.Empty;

        // Foreign Keys
        public int EquipmentId { get; set; }
        public Equipment? Equipment { get; set; }

        public int JobTypeId { get; set; }
        public JobType? JobType { get; set; }

        public int? CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public int? ContractId { get; set; }
        public Contract? Contract { get; set; }

        // Scheduling
        public JobStatus Status { get; set; } = JobStatus.Unscheduled;
        public JobPriority Priority { get; set; } = JobPriority.Normal;

        public DateTime? ScheduledStartDate { get; set; }
        public DateTime? ScheduledEndDate { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }

        // Assigned Technician (Can be null initially)
        [MaxLength(85)]
        public string? AssignedTechnicianId { get; set; }
        public ApplicationUser? AssignedTechnician { get; set; }

        // Navigation
        public ICollection<JobTask> JobTasks { get; set; } = new List<JobTask>();
        public ICollection<JobCardPart> JobCardParts { get; set; } = new List<JobCardPart>();
        public ICollection<JobAttachment> JobAttachments { get; set; } = new List<JobAttachment>();

        // Compliance
        public PermitToWork? PermitToWork { get; set; }

        // Financials — "Cost Trinity" Snapshot (set at completion)
        /// <summary>Internal Labor: Technician hours × hourly rate</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal LaborCost { get; set; }

        /// <summary>Stock Parts: Items withdrawn from the warehouse for this job</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal PartsCost { get; set; }

        /// <summary>Direct Purchase: Non-stock items bought specifically for this job (via PO tagged DirectPurchase)</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal DirectPurchaseCost { get; set; }

        /// <summary>Subcontracting: External labor/expertise invoices (via PO tagged Subcontracting)</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubcontractingCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal InvoiceAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Profit { get; set; }

        [Column(TypeName = "decimal(5,2)")] // e.g. 100.00
        public decimal ProfitMarginPercent { get; set; }
    }
}

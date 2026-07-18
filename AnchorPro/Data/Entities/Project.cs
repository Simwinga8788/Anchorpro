using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnchorPro.Data.Entities
{
    public enum ProjectStatus
    {
        Draft,
        Active,
        Completed,
        Cancelled
    }

    public class Project : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public ProjectStatus Status { get; set; } = ProjectStatus.Draft;

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Budget { get; set; }

        public int? CustomerId { get; set; }
        public Customer? Customer { get; set; }

        [MaxLength(85)]
        public string? ManagerId { get; set; }
        public ApplicationUser? Manager { get; set; }

        // Navigation
        public ICollection<JobCard> JobCards { get; set; } = new List<JobCard>();
        public ICollection<ShiftProductionLog> ShiftLogs { get; set; } = new List<ShiftProductionLog>();
        public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public ICollection<ProjectDocument> Documents { get; set; } = new List<ProjectDocument>();
        public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
        public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    }
}

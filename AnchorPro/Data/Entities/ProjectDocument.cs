using System;
using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public enum ProjectDocumentCategory
    {
        Drawing,
        Specification,
        Contract,
        Photo,
        Other
    }

    public class ProjectDocument : BaseEntity
    {
        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string FileUrl { get; set; } = string.Empty;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public string? UploadedById { get; set; }
        public ApplicationUser? UploadedBy { get; set; }

        public ProjectDocumentCategory Category { get; set; } = ProjectDocumentCategory.Other;

        /// <summary>Free-text revision marker (e.g. "Rev A", "Rev 2") — captured as metadata only.
        /// No live drawing-management sync exists, so there is no honest way to detect or flag when
        /// a newer revision exists elsewhere; this is just what the uploader records.</summary>
        [MaxLength(30)]
        public string? RevisionNumber { get; set; }

        /// <summary>Optional link to the BOQ section this document covers (e.g. "Substructure" drawings).</summary>
        public int? BoqSectionId { get; set; }
        public BoqSection? BoqSection { get; set; }
    }
}

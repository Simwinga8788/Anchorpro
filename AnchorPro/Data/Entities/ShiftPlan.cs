using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AnchorPro.Data.Entities
{
    public class ShiftPlan : BaseEntity
    {
        public DateTime PlanDate { get; set; }
        
        /// <summary>
        /// e.g. 0 = Day, 1 = Night, 2 = Afternoon
        /// </summary>
        public ShiftType Shift { get; set; }
        
        [MaxLength(450)]
        public string? MineCaptainId { get; set; }
        public ApplicationUser? MineCaptain { get; set; }

        [MaxLength(450)]
        public string? ShiftBossId { get; set; }
        public ApplicationUser? ShiftBoss { get; set; }

        public decimal? OverallTargetTonnage { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        /// <summary>
        /// 0 = Draft, 1 = Active, 2 = Completed/Executed
        /// </summary>
        public int Status { get; set; }

        public ICollection<ShiftPlanTask> Tasks { get; set; } = new List<ShiftPlanTask>();
    }
}

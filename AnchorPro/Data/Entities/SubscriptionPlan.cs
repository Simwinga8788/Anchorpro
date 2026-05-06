namespace AnchorPro.Data.Entities;

public class SubscriptionPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public decimal AnnualPrice { get; set; }
    public string Currency { get; set; } = "ZMW";
    
    // Limits
    public int MaxTechnicians { get; set; }
    public int MaxEquipment { get; set; }
    public int MaxActiveJobs { get; set; }
    public int StorageLimitMB { get; set; }
    
    // Features (JSON serialized)
    public string FeaturesJson { get; set; } = "{}";
    
    // Flags
    public bool AllowExports { get; set; }
    public bool AllowPredictiveEngine { get; set; }
    public bool AllowMobileAccess { get; set; }
    public bool IsActive { get; set; } = true;
}

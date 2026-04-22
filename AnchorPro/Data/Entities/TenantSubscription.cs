namespace AnchorPro.Data.Entities;

public class TenantSubscription : BaseEntity
{
    public new int TenantId { get; set; }
    public Tenant? Tenant { get; set; }
    
    public int SubscriptionPlanId { get; set; }
    public SubscriptionPlan? SubscriptionPlan { get; set; }
    
    public string Status { get; set; } = "Active"; // Active, Suspended, Cancelled, Trial, GracePeriod, PastDue
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? TrialEndDate { get; set; }
    
    public bool IsTrial { get; set; }
    public bool AutoRenew { get; set; } = true;
    
    // Payment tracking
    public DateTime? LastPaymentDate { get; set; }
    public DateTime? NextBillingDate { get; set; }
    
    // Grace Period Management
    public DateTime? GracePeriodStartDate { get; set; }
    public DateTime? GracePeriodEndDate { get; set; }
    public int GracePeriodDays { get; set; } = 7; // Default 7 days grace period
    
    // Suspension Tracking
    public DateTime? SuspendedAt { get; set; }
    public string? SuspensionReason { get; set; } // "PaymentFailure", "ManualSuspension", "TrialExpired"
    public string? SuspendedByUserId { get; set; }
    
    // Reactivation Tracking
    public DateTime? ReactivatedAt { get; set; }
    public string? ReactivatedByUserId { get; set; }
    public string? ReactivationNotes { get; set; }
    
    // Trial Conversion
    public bool ConvertedFromTrial { get; set; }
    public DateTime? TrialConvertedAt { get; set; }
    public int? OriginalTrialPlanId { get; set; }
    
    // Dunning Management (Payment Retry)
    public int PaymentRetryCount { get; set; } = 0;
    public DateTime? LastPaymentRetryDate { get; set; }
    public int MaxPaymentRetries { get; set; } = 3;
    
    // Cancellation
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public string? CancelledByUserId { get; set; }
}

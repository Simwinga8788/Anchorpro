# Anchor Pro - Billing & Subscription System Documentation

## Overview

Anchor Pro includes a comprehensive **multi-tier subscription and billing system** that enables platform monetization, resource limit enforcement, and feature gating. The system is designed for SaaS deployment with support for trials, upgrades, and payment gateway integration.

---

## Architecture

### Three-Layer Control Model

The system implements a strict separation of concerns:

| Layer | Audience | Access | Purpose |
|-------|----------|--------|---------|
| **System Settings** | Platform Owner (Developer) | `/system` | Monetization, limits, integrations |
| **Admin Settings** | Client Administrator | `/admin/settings` | Business rules, compliance |
| **User Settings** | End Users | Profile pages | Personal preferences |

### System Settings vs Billing Settings

Understanding the relationship between these two critical areas:

#### System Settings (`/system`)
**Purpose**: Platform-level configuration that affects how the billing system operates

**Controls**:
- **Billing Rules**: Trial duration, grace periods, currency defaults
- **Global Limits**: Default caps for each subscription tier
- **Payment Gateways**: Stripe/Flutterwave API credentials
- **Feature Flags**: Enable/disable platform capabilities
- **Security**: Developer access, emergency lockdowns

**Who Uses It**: Platform developers and system administrators

**Example Settings**:
```
Billing.TrialDays = 14
Billing.Currency = ZMW
Billing.GracePeriodDays = 7
Integration.Stripe.ApiKey = sk_live_xxxxx
Features.PredictiveEngine = true
```

**Access**: Direct URL only (`/system`), not in navigation menu

---

#### Billing & Subscription (`/billing`)
**Purpose**: User-facing interface for subscription management

**Controls**:
- **Current Plan**: View active subscription details
- **Plan Selection**: Upgrade or downgrade between tiers
- **Limits & Features**: See what's included in each plan
- **Trial Status**: Days remaining, expiration warnings

**Who Uses It**: End users, administrators, account owners

**Example Actions**:
- View current plan: "Professional - ZMW 2,500/month"
- See limits: "5/50 equipment used"
- Upgrade: Switch from Professional to Enterprise
- Check features: "AI Predictive Maintenance: ✗ Not Available"

**Access**: Sidebar navigation → Administration → Billing & Subscription

---

#### How They Work Together

```
┌─────────────────────────────────────────────────────────────┐
│ SYSTEM SETTINGS (/system)                                   │
│ Developer configures:                                        │
│ • Trial = 14 days                                           │
│ • Professional Plan = ZMW 2,500/month                       │
│ • Professional Limit = 50 equipment                         │
│ • Stripe API Key = sk_live_xxxxx                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Platform Configuration
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ SUBSCRIPTION PLANS (Database)                                │
│ • Free Trial: 5 equipment, 14 days                          │
│ • Professional: 50 equipment, ZMW 2,500/mo                  │
│ • Enterprise: 999 equipment, ZMW 8,000/mo                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Plan Definitions
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ BILLING PAGE (/billing)                                      │
│ User sees:                                                   │
│ • Current Plan: Professional                                 │
│ • Equipment: 35/50 used                                     │
│ • Available Upgrades: Enterprise (ZMW 8,000/mo)             │
│ • Action: Click "Upgrade" button                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ User Action
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ SUBSCRIPTION SERVICE                                         │
│ • Validates upgrade request                                  │
│ • Updates TenantSubscription record                         │
│ • Logs to SystemAuditLog                                    │
│ • Applies new limits immediately                            │
└─────────────────────────────────────────────────────────────┘
```

#### Key Differences

| Aspect | System Settings | Billing Page |
|--------|----------------|--------------|
| **Scope** | Platform-wide rules | Individual subscription |
| **Audience** | Developers only | All users |
| **Changes** | Affect all tenants | Affect single tenant |
| **Examples** | "Set trial to 30 days" | "Upgrade my plan" |
| **Visibility** | Hidden (direct URL) | Visible in navigation |
| **Frequency** | Rarely changed | Changed by users |

---


## Database Schema

### Core Entities

#### 1. SubscriptionPlan
Defines pricing tiers with associated limits and features.

```csharp
public class SubscriptionPlan : BaseEntity
{
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal MonthlyPrice { get; set; }
    public decimal AnnualPrice { get; set; }
    public string Currency { get; set; } = "ZMW";
    
    // Limits
    public int MaxTechnicians { get; set; }
    public int MaxEquipment { get; set; }
    public int MaxActiveJobs { get; set; }
    public int StorageLimitMB { get; set; }
    
    // Feature Flags
    public bool AllowExports { get; set; }
    public bool AllowPredictiveEngine { get; set; }
    public bool AllowMobileAccess { get; set; }
    public bool IsActive { get; set; }
}
```

#### 2. TenantSubscription
Tracks the active subscription for each tenant.

```csharp
public class TenantSubscription : BaseEntity
{
    public string TenantId { get; set; } = "default";
    public int SubscriptionPlanId { get; set; }
    public SubscriptionPlan? SubscriptionPlan { get; set; }
    
    public string Status { get; set; } // Active, Trial, Suspended, Cancelled
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? TrialEndDate { get; set; }
    
    public bool IsTrial { get; set; }
    public bool AutoRenew { get; set; }
    
    public DateTime? LastPaymentDate { get; set; }
    public DateTime? NextBillingDate { get; set; }
}
```

#### 3. SystemAuditLog
Records all platform-level configuration changes.

```csharp
public class SystemAuditLog : BaseEntity
{
    public string Action { get; set; }
    public string Module { get; set; } // Billing, Security, Integration
    public string ChangedBy { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; }
}
```

---

## Pre-Configured Subscription Plans

The system seeds three default plans on initial deployment:

### Free Trial
- **Price**: ZMW 0 (14-day trial)
- **Limits**: 2 technicians, 5 equipment, 10 active jobs, 100MB storage
- **Features**: Mobile access only
- **Use Case**: Evaluation and small-scale testing

### Professional
- **Price**: ZMW 2,500/month (ZMW 25,000/year)
- **Limits**: 10 technicians, 50 equipment, 100 active jobs, 5GB storage
- **Features**: Data exports, mobile access
- **Use Case**: Growing maintenance teams

### Enterprise
- **Price**: ZMW 8,000/month (ZMW 80,000/year)
- **Limits**: 999 technicians, 999 equipment, 9999 active jobs, 50GB storage
- **Features**: All features including AI-powered predictive maintenance
- **Use Case**: Large-scale industrial operations

---

## Services

### ISubscriptionService

Core service for subscription management and enforcement.

#### Key Methods

```csharp
// Get current subscription details
Task<TenantSubscription?> GetCurrentSubscriptionAsync(string tenantId = "default");
Task<SubscriptionPlan?> GetCurrentPlanAsync(string tenantId = "default");

// Plan management
Task<List<SubscriptionPlan>> GetAllPlansAsync();
Task<bool> UpgradeSubscriptionAsync(string tenantId, int newPlanId, string userId);

// Feature & limit enforcement
Task<bool> IsFeatureEnabledAsync(string featureName, string tenantId = "default");
Task<bool> CheckLimitAsync(string limitType, int currentCount, string tenantId = "default");

// Trial management
Task<bool> IsTrialExpiredAsync(string tenantId = "default");
Task<int> GetDaysRemainingAsync(string tenantId = "default");
```

#### Usage Example

```csharp
// Check if user can add equipment
var currentCount = await _context.Equipment.CountAsync();
var canAdd = await _subscriptionService.CheckLimitAsync("equipment", currentCount);

if (!canAdd)
{
    var plan = await _subscriptionService.GetCurrentPlanAsync();
    throw new InvalidOperationException(
        $"Equipment limit reached. Your current plan allows {plan?.MaxEquipment} equipment.");
}
```

---

## User Interfaces

### 1. Billing & Subscription (`/billing`)

**Audience**: Users and Administrators  
**Purpose**: View subscription status and manage plan upgrades

#### Features
- Current plan overview with limits and features
- Visual comparison of all available plans
- One-click upgrade/downgrade with confirmation modal
- Trial countdown badge
- Feature availability indicators

#### Navigation
Accessible via sidebar: **Administration → Billing & Subscription**

---

### 2. System Control Panel (`/system`)

**Audience**: Platform Developers Only  
**Purpose**: Configure platform-level settings and monetization

#### Modules

##### Billing & Subscriptions
- Trial duration (default: 14 days)
- Grace period before suspension (default: 7 days)
- Default currency (ZMW)
- Auto-renewal settings
- Master payment toggle

##### Tenant Limits
- Configure max resources per plan tier
- Free tier limits
- Professional tier limits
- Enterprise tier limits

##### Platform Security
- Developer email whitelist
- Maintenance mode toggle
- Emergency lockdown switch

##### Integrations
- Stripe API configuration
- Flutterwave integration
- File storage provider (Local/Azure/S3)
- SMTP settings

##### Feature Flags
- Enable/disable predictive engine
- Mobile access control
- Beta features toggle

##### Audit Log
- View platform configuration changes
- Track subscription upgrades
- Monitor billing events

#### Access
Direct URL only: `http://localhost:5165/system`  
**Not visible in navigation menu**

---

### 3. Plan Management UI (`/system/plans`)

**Audience**: Platform Developers Only  
**Purpose**: Edit subscription pricing, limits, and features

#### Capabilities
- Edit monthly and annual pricing
- Adjust resource limits (technicians, equipment, jobs, storage)
- Toggle feature availability (exports, AI, mobile)
- Update plan descriptions
- Enable/disable plans
- Bulk save all changes

#### Access
From System Control Panel: Click **"Manage Plans"** button

---

## Limit Enforcement

### Implementation Pattern

Limits are enforced at the service layer before resource creation:

```csharp
public async Task CreateEquipmentAsync(Equipment equipment, string userId)
{
    // Check subscription limits
    var currentCount = await _context.Equipment.CountAsync();
    var subscriptionService = new SubscriptionService(_context);
    var canAdd = await subscriptionService.CheckLimitAsync("equipment", currentCount);
    
    if (!canAdd)
    {
        var plan = await subscriptionService.GetCurrentPlanAsync();
        throw new InvalidOperationException(
            $"Equipment limit reached. Your current plan allows {plan?.MaxEquipment} equipment. Upgrade your subscription to add more.");
    }

    // Proceed with creation
    equipment.CreatedAt = DateTime.UtcNow;
    equipment.CreatedBy = userId;
    _context.Equipment.Add(equipment);
    await _context.SaveChangesAsync();
}
```

### Supported Limit Types
- `"technicians"` - Maximum number of technician users
- `"equipment"` - Maximum equipment assets
- `"jobs"` - Maximum active job cards

### Error Handling

When a limit is exceeded, the system:
1. Throws `InvalidOperationException` with descriptive message
2. Message includes current limit and upgrade prompt
3. UI can display `<UpgradePrompt>` component

---

## Feature Gating

### Checking Feature Availability

```csharp
var canExport = await _subscriptionService.IsFeatureEnabledAsync("exports");
if (!canExport)
{
    return Forbid("Data exports are not available on your current plan.");
}
```

### Available Features
- `"exports"` - CSV/Excel data exports
- `"predictive"` - AI-powered predictive maintenance
- `"mobile"` - Mobile app access

---

## Upgrade/Downgrade Flow

### User-Initiated Upgrade

1. User navigates to `/billing`
2. Clicks "Upgrade" on desired plan
3. Confirmation modal shows:
   - Current plan
   - New plan
   - New monthly cost
   - Effective date
4. User confirms
5. System updates `TenantSubscription`:
   - Changes `SubscriptionPlanId`
   - Sets `Status = "Active"`
   - Sets `IsTrial = false`
   - Calculates `NextBillingDate`
6. Audit log entry created
7. Changes take effect immediately

### Code Example

```csharp
var success = await _subscriptionService.UpgradeSubscriptionAsync(
    tenantId: "default",
    newPlanId: selectedPlan.Id,
    userId: currentUser.Id
);
```

---

## Trial Management

### Default Trial Configuration
- **Duration**: 14 days
- **Plan**: Free Trial tier
- **Auto-created**: On first deployment

### Trial Expiration Check

```csharp
var isExpired = await _subscriptionService.IsTrialExpiredAsync();
if (isExpired)
{
    // Redirect to billing page or show upgrade prompt
}
```

### Days Remaining

```csharp
var daysLeft = await _subscriptionService.GetDaysRemainingAsync();
// Display in UI: "Trial: {daysLeft} days remaining"
```

---

## Payment Gateway Integration

### Supported Providers
- **Stripe** (configured via `Integration.Stripe.ApiKey`)
- **Flutterwave** (configured via `Integration.Flutterwave.PublicKey`)

### Configuration Location
System Control Panel → Integrations

### Implementation Status
- ✅ Configuration UI ready
- ✅ Settings storage implemented
- ⏳ Payment processing (Phase C - future)

---

## Audit Trail

All subscription changes are logged to `SystemAuditLog`:

```csharp
var auditLog = new SystemAuditLog
{
    Action = "Subscription Upgrade",
    Module = "Billing",
    ChangedBy = userId,
    OldValue = "Professional",
    NewValue = "Enterprise",
    Timestamp = DateTime.UtcNow
};
```

### Queryable Fields
- Action type
- Module (Billing, Security, Integration)
- User who made the change
- Before/after values
- Timestamp

---

## Configuration Management

### System Settings (Developer)

Stored in `SystemSettings` table with the following groups:

- **Billing**: Trial days, currency, grace period
- **Limits**: Resource caps per tier
- **Security**: Developer whitelist, lockdown modes
- **Integration**: API keys, storage providers
- **Features**: Platform capability toggles

### Editing Methods

#### Method 1: System Control Panel UI
1. Navigate to `/system`
2. Select module tab
3. Edit settings
4. Click "Save System Configuration"

#### Method 2: Direct Database
```sql
UPDATE SystemSettings 
SET Value = '30' 
WHERE Key = 'Billing.TrialDays';
```

---

## Plan Pricing Management

### Method 1: Plan Management UI (Recommended)

1. Navigate to `/system/plans`
2. Edit pricing fields for any plan
3. Adjust limits and features
4. Click "Save All Plans"

### Method 2: Direct SQL

```sql
UPDATE SubscriptionPlans 
SET MonthlyPrice = 3500, 
    AnnualPrice = 35000
WHERE Name = 'Professional';
```

---

## Multi-Tenancy Support

The system is designed for future multi-tenant deployment:

- `TenantSubscription.TenantId` field ready
- Default value: `"default"` (single-tenant mode)
- All service methods accept optional `tenantId` parameter
- Easy migration path to multi-tenant architecture

---

## Security Considerations

### Access Control
- System Control Panel: Developer-only (no UI navigation)
- Plan Management: Developer-only (direct URL)
- Billing Page: Authenticated users only
- Admin Settings: Role-based (Admin role required)

### Secret Management
- API keys stored in `SystemSettings`
- Password input type for sensitive fields
- Recommend environment variables for production

### Developer Whitelist
Configure in System Control Panel → Platform Security:
```
Security.DeveloperEmails = "admin@anchor.com,dev@anchor.com"
```

---

## Deployment Checklist

### Initial Setup
- ✅ Run migrations: `dotnet ef database update`
- ✅ Verify plan seeding (3 plans created automatically)
- ✅ Verify default tenant subscription (14-day trial)
- ✅ Configure currency if not ZMW
- ✅ Set trial duration if not 14 days

### Production Configuration
- [ ] Set `Billing.PaymentsEnabled = true`
- [ ] Configure payment gateway credentials
- [ ] Set developer email whitelist
- [ ] Configure SMTP for billing notifications
- [ ] Adjust plan pricing for target market
- [ ] Set appropriate resource limits

### Testing
- [ ] Test limit enforcement (try exceeding equipment limit)
- [ ] Test plan upgrade flow
- [ ] Verify trial expiration logic
- [ ] Test feature gating
- [ ] Verify audit logging

---

## API Endpoints (Future)

The system is prepared for API-based subscription management:

```
GET    /api/subscription/current
GET    /api/subscription/plans
POST   /api/subscription/upgrade
GET    /api/subscription/features/{featureName}
GET    /api/subscription/limits/{limitType}
```

---

## Troubleshooting

### "Equipment limit reached" error
**Cause**: Current plan's equipment limit exceeded  
**Solution**: Upgrade to higher tier or delete unused equipment

### Trial expired
**Cause**: 14-day trial period ended  
**Solution**: Upgrade to paid plan via `/billing`

### Cannot access System Control Panel
**Cause**: Page not in navigation (by design)  
**Solution**: Navigate directly to `/system`

### Plan changes not reflected
**Cause**: Cache or stale data  
**Solution**: Restart application or clear browser cache

---

## Future Enhancements (Roadmap)

### Phase B (Current)
- ✅ Subscription management UI
- ✅ Limit enforcement
- ✅ Feature gating
- ✅ Plan management

### Phase C (Next)
- [ ] Payment gateway integration
- [ ] Invoice generation
- [ ] Automated billing
- [ ] Email notifications
- [ ] Usage analytics

### Phase D (Future)
- [ ] Multi-tenant support
- [ ] Usage-based pricing
- [ ] Add-on modules
- [ ] Reseller/partner portal
- [ ] Self-service plan customization

---

## Support & Maintenance

### Monitoring
- Check `SystemAuditLog` for subscription changes
- Monitor trial expirations
- Track plan distribution

### Regular Tasks
- Review and adjust pricing
- Analyze feature usage
- Update plan limits based on usage patterns
- Monitor payment gateway health

---

## Related Documentation
- [Admin Settings Documentation](./ADMIN_SETTINGS.md)
- [System Settings Reference](./SYSTEM_SETTINGS.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Documentation](./API_REFERENCE.md)

---

**Last Updated**: 2026-02-02  
**Version**: 1.0.0  
**Author**: Anchor Pro Development Team

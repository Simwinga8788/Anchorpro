# 🔧 Anchor Pro - Tomorrow's Fix Plan

**Date**: 2026-02-04  
**Goal**: Fix critical issues before presentation  
**Estimated Time**: 3-4 hours

---

## 🔴 CRITICAL FIX #1: Equipment Limit Enforcement

### Issue
User can add unlimited equipment despite Free Trial limit of 5

### Root Cause (Suspected)
The limit check in `EquipmentService.CreateEquipmentAsync` is either:
1. Not being called
2. Failing silently
3. Subscription service not working correctly

### Fix Steps

#### Step 1: Verify Subscription Service (15 min)
```powershell
# Check if subscription data exists
# Run SQL query to verify
```

**SQL to check**:
```sql
SELECT * FROM TenantSubscriptions;
SELECT * FROM SubscriptionPlans;
```

Expected: Should see Free Trial subscription with MaxEquipment = 5

#### Step 2: Check Equipment Service (30 min)
File: `AnchorPro/Services/EquipmentService.cs`

**Current code** (around line 40):
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
            $"Equipment limit reached. Your current plan allows {plan?.MaxEquipment} equipment.");
    }

    // ... rest of code
}
```

**Problem**: Creating new `SubscriptionService` instance might not have proper context

**Fix**: Inject `ISubscriptionService` instead

#### Step 3: Update Equipment Service (45 min)

**Add to constructor**:
```csharp
private readonly ISubscriptionService _subscriptionService;

public EquipmentService(
    IDbContextFactory<ApplicationDbContext> factory,
    ISubscriptionService subscriptionService)
{
    _factory = factory;
    _subscriptionService = subscriptionService;
}
```

**Update CreateEquipmentAsync**:
```csharp
public async Task CreateEquipmentAsync(Equipment equipment, string userId)
{
    using var context = _factory.CreateDbContext();
    
    // Check subscription limits
    var currentCount = await context.Equipment.CountAsync();
    var canAdd = await _subscriptionService.CheckLimitAsync("equipment", currentCount);
    
    if (!canAdd)
    {
        var plan = await _subscriptionService.GetCurrentPlanAsync();
        throw new InvalidOperationException(
            $"Equipment limit reached. Your current plan allows {plan?.MaxEquipment} equipment. Upgrade your subscription to add more.");
    }

    equipment.CreatedAt = DateTime.UtcNow;
    equipment.CreatedBy = userId;
    context.Equipment.Add(equipment);
    await context.SaveChangesAsync();
}
```

#### Step 4: Update Program.cs Registration (15 min)

Ensure services are registered correctly:
```csharp
// In Program.cs
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
```

#### Step 5: Test the Fix (30 min)

1. Restart application
2. Login as admin
3. Add 5 equipment items
4. Try to add 6th equipment
5. Should see error message
6. Upgrade to Professional plan
7. Try to add 6th equipment
8. Should succeed

**Total Time**: 2 hours 15 minutes

---

## 🔴 CRITICAL FIX #2: Performance Dashboard

### Issue
Performance dashboard doesn't load, charts don't render

### Decision Point
**Option A**: Fix it (3-4 hours)  
**Option B**: Skip in demo (0 hours)  
**Option C**: Show mockup/screenshot (30 min)

### Recommendation: **Option B or C**

If you choose to fix:

#### Likely Issues
1. Chart.js not loaded
2. Data not being fetched
3. JavaScript errors
4. Missing dependencies

#### Quick Diagnostic (15 min)
1. Open browser console at `/performance`
2. Check for JavaScript errors
3. Check network tab for failed requests
4. Check if Chart.js is loaded

#### If Chart.js Missing (30 min)
Add to `_Layout.cshtml` or `App.razor`:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

#### If Data Not Loading (1 hour)
Check `PerformanceDashboard.razor` and ensure:
- Service is injected
- Data is being fetched in `OnInitializedAsync`
- No null reference exceptions

**Total Time**: 1-4 hours (depending on issue)

---

## 🔴 CRITICAL FIX #3: Safety/PTW Feature

### Issue
Permit to Work page doesn't display properly

### Decision Point
**Option A**: Fix it (2-3 hours)  
**Option B**: Skip in demo (0 hours)  
**Option C**: Mention as "Phase 2" (0 hours)

### Recommendation: **Option B or C**

If you choose to fix:

#### Quick Diagnostic (15 min)
1. Navigate to Safety/PTW page
2. Check browser console for errors
3. Check if route exists
4. Check if page file exists

#### Likely Issues
1. Route not registered
2. Page file missing
3. Service not working
4. Database table missing

**Total Time**: 2-3 hours

---

## 🟡 OPTIONAL FIX: Add Search to Equipment

### If Time Permits (1 hour)

Add to `Equipment.razor`:
```razor
<div class="search-box mb-3">
    <input type="text" 
           class="form-control" 
           placeholder="Search equipment..." 
           @bind="searchTerm" 
           @bind:event="oninput" />
</div>

@code {
    private string searchTerm = "";
    
    private List<Equipment> FilteredEquipment => 
        string.IsNullOrWhiteSpace(searchTerm) 
            ? equipment 
            : equipment.Where(e => 
                e.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                e.SerialNumber.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)
              ).ToList();
}
```

---

## 📅 RECOMMENDED SCHEDULE (UPDATED)

### Morning Session (8:30 AM - 12:00 PM)

**8:30 - 9:30**: 🎭 **Role-Based Testing** ✅ **DO THIS FIRST**
- Test Technician role (30 min)
- Test Viewer role (20 min)
- Test direct URL bypass (15 min)
- Document any authorization issues
- **See**: `ROLE_BASED_TESTING.md`

**9:30 - 9:45**: ☕ **Break & Review**
- Review role testing results
- Prioritize any security issues found
- Update fix plan if needed

**9:45 - 12:00**: 🔧 **Fix Equipment Limit Enforcement** ✅ **MUST DO**
- Verify subscription data
- Update EquipmentService
- Inject ISubscriptionService
- Test thoroughly
- **See**: Fix steps below

**12:00 - 12:30**: 🍽️ **Lunch Break**

**11:30 - 12:00**: Decision on Performance Dashboard
- Quick diagnostic
- Decide: Fix, Skip, or Mockup
- If skip: Update demo script

### Afternoon Session (2:00 PM - 5:00 PM)

**2:00 - 2:30**: Decision on Safety/PTW
- Quick diagnostic
- Decide: Fix, Skip, or "Phase 2"
- If skip: Update demo script

**2:30 - 3:30**: Final Testing
- Test all fixes
- Test demo flow end-to-end
- Document any new issues

**3:30 - 4:30**: Demo Preparation
- Practice presentation
- Prepare talking points
- Create backup slides
- Test on presentation laptop

**4:30 - 5:00**: Final Review
- Review checklist
- Confirm all critical issues fixed
- Sign off as presentation-ready

---

## ✅ SUCCESS CRITERIA

By end of day tomorrow, you should have:

### Must Have ✅
- [ ] Equipment limit enforcement working
- [ ] Tested with 6th equipment (should fail)
- [ ] Tested after upgrade (should succeed)
- [ ] Decision made on Performance dashboard
- [ ] Decision made on Safety/PTW
- [ ] Demo script updated
- [ ] Practiced full demo once

### Nice to Have
- [ ] Performance dashboard fixed or mocked
- [ ] Safety/PTW fixed or documented
- [ ] Search added to Equipment
- [ ] Search added to Inventory

---

## 🎯 PRESENTATION READINESS CHECKLIST

After fixes, verify:

- [ ] Application starts without errors
- [ ] Can login successfully
- [ ] All demo features work
- [ ] No console errors during demo
- [ ] Limit enforcement works
- [ ] Plan upgrade works
- [ ] System control panel works
- [ ] Plan management works
- [ ] Demo takes 25-30 minutes
- [ ] Backup plan for broken features
- [ ] Talking points prepared
- [ ] Questions anticipated

---

## 📞 CONTINGENCY PLAN

### If Fixes Take Longer Than Expected

**Plan B**: Demo with workarounds
- Skip limit enforcement demo
- Skip Performance dashboard
- Skip Safety/PTW
- Focus on working features:
  - Equipment management
  - Job cards
  - Billing UI (without enforcement)
  - System control
  - Plan management

**Plan C**: Hybrid demo
- Live demo of working features
- Screenshots/mockups of broken features
- Explain "in development" for missing parts

---

## 🚀 CONFIDENCE LEVELS

**Current**: 7/10

**After Equipment Limit Fix**: 8.5/10

**After All Fixes**: 9.5/10

**With Workarounds**: 7.5/10

---

**Start Time**: 9:00 AM tomorrow  
**Target Completion**: 5:00 PM tomorrow  
**Presentation**: TBD

**Good luck! You've got this!** 💪

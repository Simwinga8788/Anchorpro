# ⚡ QUICK START - Fix Equipment Limit Enforcement

**Time**: 8:30 AM  
**Task**: Fix the #1 critical issue  
**Duration**: ~2 hours  
**Status**: Ready to start

---

## 🎯 THE PROBLEM

**What's broken**: Can add unlimited equipment (should be limited to 5 on Free Trial)

**Why it's critical**: This is the core billing feature - limit enforcement

**What should happen**:
- Free Trial: Can add 5 equipment, 6th shows error
- After upgrade to Professional: Can add 50 equipment

---

## 🔧 THE FIX (3 Simple Steps)

### STEP 1: Update EquipmentService Constructor (10 min)

**File**: `c:\Users\simwi\Desktop\Anchor Pro\AnchorPro\Services\EquipmentService.cs`

**Find** (around line 10):
```csharp
public class EquipmentService : IEquipmentService
{
    private readonly IDbContextFactory<ApplicationDbContext> _factory;

    public EquipmentService(IDbContextFactory<ApplicationDbContext> factory)
    {
        _factory = factory;
    }
```

**Replace with**:
```csharp
public class EquipmentService : IEquipmentService
{
    private readonly IDbContextFactory<ApplicationDbContext> _factory;
    private readonly ISubscriptionService _subscriptionService;

    public EquipmentService(
        IDbContextFactory<ApplicationDbContext> factory,
        ISubscriptionService subscriptionService)
    {
        _factory = factory;
        _subscriptionService = subscriptionService;
    }
```

---

### STEP 2: Update CreateEquipmentAsync Method (15 min)

**Same file**, find the `CreateEquipmentAsync` method (around line 40)

**Find this line**:
```csharp
var subscriptionService = new SubscriptionService(_context);
var canAdd = await subscriptionService.CheckLimitAsync("equipment", currentCount);
```

**Replace with**:
```csharp
var canAdd = await _subscriptionService.CheckLimitAsync("equipment", currentCount);
```

**Full method should look like**:
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

---

### STEP 3: Verify Service Registration (5 min)

**File**: `c:\Users\simwi\Desktop\Anchor Pro\AnchorPro\Program.cs`

**Find** (around line 50):
```csharp
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
```

**Make sure this line also exists**:
```csharp
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
```

If not, add it.

---

## ✅ TEST THE FIX (30 min)

### Test 1: Verify Limit on Free Trial

1. **Restart the application**:
   ```powershell
   # Stop current app (Ctrl+C in terminal)
   dotnet run
   ```

2. **Login**: admin@anchor.com / Admin@123

3. **Check current equipment count**:
   - Go to Equipment page
   - Count how many equipment items exist
   - If less than 5, add more until you have 5

4. **Try to add 6th equipment**:
   - Click "Add Equipment"
   - Fill in form:
     - Name: Test Equipment 6
     - Serial Number: TEST-006
     - Model: Test Model
     - Manufacturer: Test Mfg
     - Location: Test Site
   - Click Save

5. **Expected Result**: ❌ Error message appears:
   ```
   Equipment limit reached. Your current plan allows 5 equipment. 
   Upgrade your subscription to add more.
   ```

6. **If you see the error**: ✅ **SUCCESS!** Limit enforcement works!

7. **If no error**: ❌ Something's wrong, check the steps again

---

### Test 2: Verify Limit After Upgrade

1. **Go to Billing page**: `/billing`

2. **Upgrade to Professional**:
   - Click "Upgrade" on Professional plan
   - Click "Confirm" in modal
   - Should see success message

3. **Go back to Equipment page**

4. **Try to add 6th equipment again**:
   - Same form as before
   - Click Save

5. **Expected Result**: ✅ Equipment created successfully (no error)

6. **If equipment created**: ✅ **SUCCESS!** Upgrade works!

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot resolve ISubscriptionService"

**Problem**: Service not registered  
**Fix**: Check Program.cs, ensure line exists:
```csharp
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
```

### Error: "Object reference not set to an instance"

**Problem**: Subscription data missing  
**Fix**: Check database:
```sql
SELECT * FROM TenantSubscriptions;
SELECT * FROM SubscriptionPlans;
```
Should see data. If not, run migrations again.

### No Error Shown, But Should Be

**Problem**: Exception being caught somewhere  
**Fix**: Check browser console (F12) for errors

### Still Can Add Unlimited Equipment

**Problem**: Code not being called  
**Fix**: 
1. Add breakpoint in CreateEquipmentAsync
2. Debug and step through
3. Verify CheckLimitAsync is being called

---

## 📊 EXPECTED TIMELINE

- **Step 1**: Update constructor - 10 min
- **Step 2**: Update method - 15 min
- **Step 3**: Verify registration - 5 min
- **Restart app**: 2 min
- **Test 1**: Verify limit - 10 min
- **Test 2**: Verify upgrade - 10 min
- **Buffer for issues**: 30 min

**Total**: ~1.5 hours

---

## ✅ WHEN DONE

Report back:
- ✅ **Working**: Limit enforcement works, upgrade works
- ⚠️ **Partial**: Limit works but upgrade doesn't (or vice versa)
- ❌ **Not Working**: Still can add unlimited equipment

Then we'll move to the next fix!

---

**Ready? Let's fix this!** 🚀

**Open**: `AnchorPro\Services\EquipmentService.cs`

**Start with**: Step 1 above

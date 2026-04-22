# Anchor Pro - Multi-User Role Testing Plan

**Date**: 2026-02-04  
**Purpose**: Test all user roles to ensure proper access control  
**Status**: ⏳ Pending

---

## 🎭 User Roles in Anchor Pro

### 1. Admin Role
**Access Level**: Full access to everything  
**Test Account**: admin@anchor.com / Admin@123

**Should Have Access To**:
- ✅ Dashboard
- ✅ Equipment (view, add, edit, delete)
- ✅ Job Cards (view, create, assign, complete)
- ✅ Maintenance (view, schedule)
- ✅ Downtime (view, report)
- ✅ Inventory (view, add, edit)
- ✅ Safety/PTW (view, create, approve)
- ✅ Performance (view analytics)
- ✅ **Administration** (users, organization, settings)
- ✅ **Billing & Subscription** (view, upgrade plans)
- ✅ **System Control Panel** (/system - developer only)

---

### 2. Technician Role
**Access Level**: Operational access, no admin features  
**Test Account**: tech@anchor.com / Tech@123

**Should Have Access To**:
- ✅ Dashboard (view only)
- ✅ Equipment (view, maybe edit)
- ✅ Job Cards (view assigned jobs, update status, add notes)
- ✅ Inventory (view, request parts)
- ✅ Safety/PTW (view, create permits)

**Should NOT Have Access To**:
- ❌ Administration section
- ❌ Billing & Subscription
- ❌ System Control Panel
- ❌ User management
- ❌ Organization settings
- ❌ Delete equipment
- ❌ Approve permits (maybe)

---

### 3. Viewer Role
**Access Level**: Read-only access  
**Test Account**: viewer@anchor.com / Viewer@123

**Should Have Access To**:
- ✅ Dashboard (view only)
- ✅ Equipment (view only)
- ✅ Job Cards (view only)
- ✅ Reports (view only)

**Should NOT Have Access To**:
- ❌ Create/Edit/Delete anything
- ❌ Administration
- ❌ Billing
- ❌ System Control

---

## 🧪 ROLE-BASED TESTING CHECKLIST

### Test 1: Admin User (Already Tested ✅)
**Account**: admin@anchor.com / Admin@123

**Results from yesterday**:
- ✅ Can login
- ✅ See all menu items
- ✅ Can create equipment
- ✅ Can create job cards
- ✅ Can access billing
- ✅ Can access system control

**Status**: ✅ TESTED - Working

---

### Test 2: Technician User ⏳ TO TEST

**Account**: tech@anchor.com / Tech@123

#### Step 1: Login as Technician
1. Logout from admin account
2. Login with tech@anchor.com / Tech@123
3. Check if login successful

**Expected**: ✅ Login successful  
**Result**: 

#### Step 2: Check Menu Visibility
After login, check sidebar menu:

**Should See**:
- [ ] Dashboard
- [ ] Equipment (view)
- [ ] Job Cards
- [ ] Inventory (view)
- [ ] Safety/PTW

**Should NOT See**:
- [ ] ❌ Administration section
- [ ] ❌ Billing & Subscription
- [ ] ❌ Users
- [ ] ❌ Organization
- [ ] ❌ Settings

**Result**: 

#### Step 3: Test Equipment Access
1. Click "Equipment"
2. Try to view equipment list
3. Try to click "Add Equipment" (should not be visible or disabled)
4. Try to edit equipment (should not be allowed)
5. Try to delete equipment (should not be allowed)

**Expected**:
- ✅ Can view equipment list
- ❌ Cannot add equipment
- ❌ Cannot edit equipment
- ❌ Cannot delete equipment

**Result**: 

#### Step 4: Test Job Card Access
1. Click "Job Cards"
2. Check if can view job cards
3. Try to create new job card (might be allowed)
4. Try to update job card status (should be allowed)
5. Try to complete job card (should be allowed)

**Expected**:
- ✅ Can view job cards
- ✅ Can update assigned job cards
- ✅ Can complete job cards
- ⚠️ Maybe can create job cards

**Result**: 

#### Step 5: Test Inventory Access
1. Click "Inventory"
2. Check if can view inventory
3. Try to add inventory item (should not be allowed)
4. Try to edit inventory (should not be allowed)

**Expected**:
- ✅ Can view inventory
- ❌ Cannot add items
- ❌ Cannot edit items

**Result**: 

#### Step 6: Test Restricted Access
1. Try to navigate to `/admin/users` (should be blocked)
2. Try to navigate to `/billing` (should be blocked)
3. Try to navigate to `/system` (should be blocked)
4. Try to navigate to `/admin/settings` (should be blocked)

**Expected**: ❌ All should show "Access Denied" or redirect

**Result**: 

---

### Test 3: Viewer User ⏳ TO TEST

**Account**: viewer@anchor.com / Viewer@123

#### Step 1: Login as Viewer
1. Logout from previous account
2. Login with viewer@anchor.com / Viewer@123
3. Check if login successful

**Expected**: ✅ Login successful  
**Result**: 

#### Step 2: Check Menu Visibility
After login, check sidebar menu:

**Should See** (read-only):
- [ ] Dashboard
- [ ] Equipment (view only)
- [ ] Job Cards (view only)
- [ ] Reports (if exists)

**Should NOT See**:
- [ ] ❌ Any "Add" or "Create" buttons
- [ ] ❌ Any "Edit" or "Delete" buttons
- [ ] ❌ Administration
- [ ] ❌ Billing
- [ ] ❌ Settings

**Result**: 

#### Step 3: Test Read-Only Access
1. Click "Equipment" - should only view
2. Click "Job Cards" - should only view
3. Try to find any "Add" button (should not exist)
4. Try to find any "Edit" button (should not exist)

**Expected**: ✅ Can view everything, cannot modify anything

**Result**: 

#### Step 4: Test Restricted Access
1. Try to navigate to `/admin/users` (should be blocked)
2. Try to navigate to `/billing` (should be blocked)
3. Try to navigate to `/equipment/create` (should be blocked)
4. Try to navigate to `/jobcards/create` (should be blocked)

**Expected**: ❌ All should show "Access Denied" or redirect

**Result**: 

---

## 🔐 AUTHORIZATION TESTING

### Test 4: Direct URL Access ⏳ TO TEST

Test if users can bypass UI restrictions by typing URLs directly:

#### As Technician (tech@anchor.com)
1. Login as technician
2. Try to access: `http://localhost:5165/admin/users`
3. Try to access: `http://localhost:5165/billing`
4. Try to access: `http://localhost:5165/system`
5. Try to access: `http://localhost:5165/admin/settings`

**Expected**: ❌ All should be blocked with "Access Denied"  
**Result**: 

#### As Viewer (viewer@anchor.com)
1. Login as viewer
2. Try to access: `http://localhost:5165/equipment/create`
3. Try to access: `http://localhost:5165/jobcards/create`
4. Try to access: `http://localhost:5165/admin/users`
5. Try to access: `http://localhost:5165/billing`

**Expected**: ❌ All should be blocked with "Access Denied"  
**Result**: 

---

## 🚨 CRITICAL SECURITY ISSUES TO CHECK

### Issue 1: Missing Authorization Checks
**Risk**: Users might access pages they shouldn't  
**Test**: Try direct URLs as different roles  
**Fix**: Add `@attribute [Authorize(Roles = "Admin")]` to pages

### Issue 2: API Endpoint Security
**Risk**: Users might call APIs directly  
**Test**: Use Postman/Swagger with different user tokens  
**Fix**: Add `[Authorize(Roles = "Admin")]` to controllers

### Issue 3: Client-Side Only Restrictions
**Risk**: Hiding buttons doesn't prevent access  
**Test**: Direct URL access  
**Fix**: Server-side authorization required

---

## 📊 EXPECTED RESULTS SUMMARY

### Admin User
- ✅ Full access to everything
- ✅ Can see all menu items
- ✅ Can perform all actions
- ✅ Can access /system, /billing, /admin/*

### Technician User
- ✅ Can view most pages
- ✅ Can update job cards
- ✅ Can view equipment/inventory
- ❌ Cannot access admin features
- ❌ Cannot access billing
- ❌ Cannot delete equipment
- ❌ Cannot manage users

### Viewer User
- ✅ Can view dashboards and reports
- ✅ Can view equipment and job cards
- ❌ Cannot create/edit/delete anything
- ❌ Cannot access admin features
- ❌ Cannot access billing

---

## 🔧 COMMON AUTHORIZATION ISSUES

### If Technician Can Access Admin Pages
**Problem**: Missing role-based authorization  
**Fix**: Add to page:
```razor
@attribute [Authorize(Roles = "Admin")]
```

### If Viewer Can Edit Data
**Problem**: Missing authorization on actions  
**Fix**: Add to service methods:
```csharp
[Authorize(Roles = "Admin,Technician")]
public async Task UpdateAsync(...)
```

### If Direct URL Access Works
**Problem**: Client-side only restrictions  
**Fix**: Add server-side authorization to pages and APIs

---

## 📋 TESTING CHECKLIST

### Before Testing
- [ ] Ensure all 3 test accounts exist
- [ ] Verify passwords work
- [ ] Application is running

### During Testing
- [ ] Test each role systematically
- [ ] Document what works and what doesn't
- [ ] Take screenshots of access denied pages
- [ ] Note any security holes

### After Testing
- [ ] List all authorization issues found
- [ ] Prioritize security fixes
- [ ] Update fix plan
- [ ] Re-test after fixes

---

## 🎯 PRIORITY LEVELS

### 🔴 CRITICAL (Fix Immediately)
- Any user can access admin features
- Any user can access billing
- Viewer can edit/delete data
- Direct URL bypass works

### 🟡 MEDIUM (Fix Before Demo)
- Technician sees admin menu items
- Buttons visible but don't work
- Confusing error messages

### 🟢 LOW (Fix Later)
- UI polish for different roles
- Better error messages
- Role-specific dashboards

---

## 📞 WHAT TO REPORT

After testing all 3 roles, report:

### For Each Role:
1. **Can login?** Yes/No
2. **Menu items visible?** List them
3. **Can perform expected actions?** Yes/No
4. **Can access restricted pages?** Yes/No (should be No)
5. **Any security holes?** Describe them

### Overall:
1. **Is authorization working?** Yes/No/Partially
2. **Critical security issues?** List them
3. **Can we demo safely?** Yes/No
4. **What needs fixing?** Priority list

---

## 🚀 RECOMMENDED TESTING ORDER

1. **Admin** (already done ✅)
2. **Technician** (test next - 30 min)
3. **Viewer** (test last - 20 min)
4. **Direct URL bypass** (security test - 15 min)

**Total Time**: ~1 hour

---

**Start Testing**: Now  
**Complete By**: 10:00 AM  
**Then**: Fix any critical security issues before other fixes

**This is important for security and demo credibility!** 🔒

# Anchor Pro - Quick Manual Testing Checklist

**Application URL**: http://localhost:5165  
**Status**: ✅ Running

---

## 🔐 STEP 1: Login & Authentication

### Test Login
1. Open browser and go to: `http://localhost:5165`
2. You should see a login page
3. Try logging in with:
   - **Email**: `admin@anchor.com`
   - **Password**: `Admin@123`

**✅ PASS if**: You successfully login and see a dashboard  
**❌ FAIL if**: Login fails or shows errors

**What to check**:
- [ ] Login page loads
- [ ] Email and password fields visible
- [ ] Login button works
- [ ] Redirects to dashboard after login

---

## 📊 STEP 2: Dashboard & Navigation

### Check Sidebar Menu
After login, check if these menu items are visible:

- [ ] Dashboard
- [ ] Equipment
- [ ] Job Cards  
- [ ] Maintenance
- [ ] Downtime
- [ ] Inventory
- [ ] Safety (or Permit to Work)
- [ ] Performance
- [ ] Administration section with:
  - [ ] Billing & Subscription
  - [ ] Users
  - [ ] Organization
  - [ ] Settings

**✅ PASS if**: All menu items are visible  
**❌ FAIL if**: Menu items missing or broken

---

## 🔧 STEP 3: Equipment Management

### Test Equipment List
1. Click "Equipment" in sidebar
2. Check if equipment list loads

**What to check**:
- [ ] Page loads without errors
- [ ] Equipment list displays (may be empty)
- [ ] "Add Equipment" button visible
- [ ] Search/filter options available

### Test Add Equipment
1. Click "Add Equipment" button
2. Fill in the form:
   - **Name**: `Test Truck 001`
   - **Serial Number**: `TEST-001`
   - **Model Number**: `797F`
   - **Manufacturer**: `Caterpillar`
   - **Location**: `Test Site`
3. Click Save

**✅ PASS if**: Equipment is created successfully  
**❌ FAIL if**: Form doesn't work or shows errors

---

## 💳 STEP 4: Billing & Subscription (NEW FEATURE)

### Test Billing Page
1. Click "Billing & Subscription" in sidebar
2. Check what you see

**What to check**:
- [ ] Current plan shows "Free Trial"
- [ ] Trial days remaining displayed
- [ ] Three plans visible:
  - Free Trial (ZMW 0)
  - Professional (ZMW 2,500/month)
  - Enterprise (ZMW 8,000/month)
- [ ] Each plan shows limits (technicians, equipment, jobs)
- [ ] "Upgrade" buttons visible

### Test Plan Upgrade
1. Click "Upgrade" on Professional plan
2. Check if modal appears
3. Click "Confirm"

**✅ PASS if**: Plan upgrades successfully  
**❌ FAIL if**: Upgrade fails or no modal appears

### Test Limit Enforcement
1. Go back to Equipment
2. Try to add 6 equipment items (Free Trial limit is 5)
3. On the 6th item, you should see an error

**✅ PASS if**: Error message shows "Equipment limit reached"  
**❌ FAIL if**: Can add unlimited equipment

---

## ⚙️ STEP 5: System Control Panel (Developer Feature)

### Test System Settings
1. Manually navigate to: `http://localhost:5165/system`
2. Check if System Control Panel loads

**What to check**:
- [ ] Page loads (not in sidebar menu - direct URL only)
- [ ] Six module tabs visible:
  - Billing & Subscriptions
  - Tenant Limits
  - Platform Security
  - Integrations
  - Feature Flags
  - Audit Log
- [ ] "Manage Plans" button in header
- [ ] Settings are editable

### Test Plan Management
1. Click "Manage Plans" button
2. Should navigate to `/system/plans`

**What to check**:
- [ ] All 3 plans listed
- [ ] Can edit pricing fields
- [ ] Can edit limits
- [ ] Can toggle features
- [ ] "Save All Plans" button works

---

## 📋 STEP 6: Job Cards

### Test Job Card List
1. Click "Job Cards" in sidebar
2. Check if page loads

**What to check**:
- [ ] Job card list displays
- [ ] "Create Job Card" button visible
- [ ] Can view existing job cards

### Test Create Job Card
1. Click "Create Job Card"
2. Fill in basic information
3. Try to save

**✅ PASS if**: Job card created  
**❌ FAIL if**: Form broken or errors

---

## 📦 STEP 7: Inventory

### Test Inventory Page
1. Click "Inventory" in sidebar
2. Check if inventory list loads

**What to check**:
- [ ] Inventory items display
- [ ] "Add Item" button visible
- [ ] Can search/filter inventory

---

## ⚠️ STEP 8: Safety (Permit to Work)

### Test PTW Page
1. Click "Safety" or "Permit to Work" in sidebar
2. Check if page loads

**What to check**:
- [ ] PTW list displays
- [ ] "Create Permit" button visible

---

## 📈 STEP 9: Performance Dashboard

### Test Analytics
1. Click "Performance" in sidebar
2. Check if dashboard loads

**What to check**:
- [ ] Charts render
- [ ] Metrics display
- [ ] No JavaScript errors in console

---

## 🔌 STEP 10: API Documentation

### Test Swagger
1. Navigate to: `http://localhost:5165/swagger`
2. Check if Swagger UI loads

**What to check**:
- [ ] Swagger UI displays
- [ ] API endpoints listed
- [ ] Can expand and view endpoint details

---

## 📝 RESULTS SUMMARY

Fill this out after testing:

### Features Working ✅
*List all features that work correctly*

1. 
2. 
3. 

### Features Broken ❌
*List all features that don't work*

1. 
2. 
3. 

### Critical Issues 🔴
*Issues that block core functionality*

1. 
2. 

### Minor Issues 🟡
*Issues that are annoying but not blocking*

1. 
2. 

---

## 🎯 PRESENTATION READINESS

Based on testing, is the application ready for presentation?

- [ ] ✅ YES - All core features work
- [ ] ⚠️ MAYBE - Some issues but can demo
- [ ] ❌ NO - Too many broken features

**Confidence Level**: ___/10

**Recommended Next Steps**:
1. 
2. 
3. 

---

**Tested By**: _______________  
**Date**: 2026-02-03  
**Time Spent**: _____ minutes  
**Overall Rating**: ⭐⭐⭐⭐⭐ (circle stars)

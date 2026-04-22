# 🚀 ANCHOR PRO - Quick Start Guide

## 🎯 What We Built

A complete **Production Planning Tool** for industrial facilities.

---

## ✅ Features Implemented

### 1. Job Card Management
- ✅ Create job cards with equipment, type, priority, description
- ✅ Add multiple tasks to each job
- ✅ Edit existing jobs
- ✅ View detailed job information
- ✅ Filter and search jobs
- ✅ Export to CSV

### 2. Technician Workflow
- ✅ View assigned jobs (`/my-tasks`)
- ✅ Start job with safety permit (Permit to Work)
- ✅ Complete tasks with checkboxes
- ✅ Add spare parts (auto-deducts inventory)
- ✅ Upload photos/attachments
- ✅ Report downtime during work
- ✅ Complete job (auto-calculates costs)

### 3. Equipment Management
- ✅ Equipment catalog
- ✅ Equipment details with KPIs:
  - MTBF (Mean Time Between Failures)
  - MTTR (Mean Time To Repair)
  - Predicted next failure date
- ✅ Maintenance history per equipment
- ✅ Create/edit equipment

### 4. Downtime Tracking
- ✅ Report downtime with live timer
- ✅ Categories: Breakdown, Waiting for Parts, etc.
- ✅ Auto-calculate duration
- ✅ Downtime history log
- ✅ Link to equipment and tasks

### 5. Planning & Scheduling
- ✅ Planning board with drag-and-drop
- ✅ Schedule jobs with start/end dates
- ✅ Assign technicians
- ✅ Check for conflicts

### 6. Analytics & Reports
- ✅ Main dashboard with KPIs
- ✅ Performance dashboard with charts
- ✅ Technician performance stats
- ✅ Equipment reliability metrics
- ✅ Export to CSV

### 7. Inventory Management
- ✅ Spare parts catalog
- ✅ Stock tracking
- ✅ Auto-deduction when used
- ✅ Add/edit inventory items

### 8. Admin Functions
- ✅ User management
- ✅ Role assignment
- ✅ System configuration

---

## 🔑 Key Fixes Applied

### 1. Job Card Creation
**Problem:** Form not submitting  
**Fix:** Removed conflicting `JobCardForm.razor`, created clean `JobCardCreate.razor`  
**Result:** ✅ Working

### 2. Technician Stats
**Problem:** Stats showing 0 jobs  
**Fix:** Auto-assign technician when they start a job  
**Code:** `TaskExecution.razor` line 251-260  
**Result:** ✅ Working

### 3. CSV Export
**Problem:** Download not triggering  
**Fix:** Updated JS function signature in `jsExports.js`  
**Result:** ✅ Working

### 4. Equipment Links
**Problem:** Equipment names not clickable  
**Fix:** Added links to equipment details in job card list  
**Result:** ✅ Working

### 5. Labor Rate
**Problem:** Default rate not set  
**Fix:** Set to 500 ZMW/hour in `JobCardService.cs`  
**Result:** ✅ Working

---

## 📁 Project Structure

```
AnchorPro/
├── Components/Pages/
│   ├── Admin/          # User management
│   ├── Downtime/       # Downtime reporting
│   ├── Equipment/      # Equipment management
│   ├── Inventory/      # Spare parts
│   ├── JobCards/       # Job card CRUD
│   ├── Planning/       # Scheduling
│   ├── Reports/        # Analytics
│   └── Tasks/          # Technician interface
├── Data/
│   ├── Entities/       # Database models
│   └── Enums/          # Status, Priority
├── Services/           # Business logic
└── wwwroot/           # Static files
```

---

## 🚀 How to Run

```bash
cd "c:\Users\simwi\Desktop\Anchor Pro\AnchorPro"
dotnet run
```

Open browser: `http://localhost:5165`

---

## 👤 Default Login

**Email:** `admin@anchorpro.com`  
**Password:** `Admin@123`

---

## 🎨 Design System

- **Framework:** Blazor Server (ASP.NET Core 8.0)
- **UI:** Bootstrap 5 + Custom CSS
- **Style:** Apple-inspired design (glassmorphism, smooth animations)
- **Colors:** 
  - Primary: Green (#10B981)
  - Success: Green
  - Warning: Yellow
  - Danger: Red
  - Secondary: Gray

---

## 📊 Key Metrics Calculated

### Equipment Reliability
```
MTBF = Total Operating Hours / Number of Failures
MTTR = Total Repair Time / Number of Repairs
Next Failure = Last Failure Date + MTBF
```

### Job Costs
```
Labor Cost = (End Time - Start Time) × 500 ZMW/hour
Parts Cost = Sum of (Part Unit Cost × Quantity Used)
Total Cost = Labor Cost + Parts Cost
```

### Performance
```
On-Time % = (Jobs Completed On Time / Total Jobs) × 100
Avg Lead Time = Average(Actual End - Actual Start)
```

---

## 🔄 Complete Workflow Example

### Create and Complete a Job

1. **Create Job** (`/job-cards/create`)
   - Select: CNC Lathe #1
   - Type: Preventive Maintenance
   - Priority: High
   - Description: "Replace oil filter"
   - Add tasks:
     - "Drain old oil" (15 min)
     - "Replace filter" (10 min)
     - "Refill oil" (10 min)
   - Click "Create Job Card"

2. **Schedule Job** (`/planning`)
   - Click on unscheduled job
   - Set start: Tomorrow 8:00 AM
   - Duration: 1 hour
   - Assign: John Doe
   - Click "Schedule Job"

3. **Execute Job** (`/my-tasks`)
   - Technician clicks on job
   - Click "Start Job"
   - Fill safety permit (check all boxes)
   - Enter name
   - Click "Confirm & Start Job"
   - Check off tasks as completed
   - Add part: "Oil Filter SKU123" × 1
   - Upload photo of completed work
   - Click "Complete Job"

4. **Results**
   - ✅ Job completed
   - ✅ Cost calculated: Labor (500 ZMW) + Parts (150 ZMW) = 650 ZMW
   - ✅ Inventory decreased
   - ✅ Technician stats updated
   - ✅ Equipment history updated

---

## 🐛 Troubleshooting

### Job Card Not Creating
- **Check:** Only `JobCardCreate.razor` exists (no `JobCardForm.razor`)
- **Fix:** Delete conflicting files, restart app

### Stats Not Showing
- **Check:** Jobs have assigned technicians
- **Fix:** Start jobs from "My Tasks" (auto-assigns)

### CSV Not Downloading
- **Check:** `jsExports.js` has `downloadFile` function
- **Fix:** Verify function signature matches C# call

### Database Errors
- **Check:** SQL Server running
- **Fix:** Run `dotnet ef database update`

---

## 📈 What's Working

| Feature | Status |
|---------|--------|
| Job Card CRUD | ✅ Working |
| Task Execution | ✅ Working |
| Equipment Management | ✅ Working |
| Downtime Tracking | ✅ Working |
| Inventory | ✅ Working |
| Planning Board | ✅ Working |
| Analytics Dashboard | ✅ Working |
| Technician Stats | ✅ Working (Fixed) |
| CSV Export | ✅ Working (Fixed) |
| Cost Calculation | ✅ Working |
| Safety Permits | ✅ Working |
| File Uploads | ✅ Working |

---

## 🎯 Next Steps

1. **Test All Features** - Use the testing checklist in main documentation
2. **Add Sample Data** - Create equipment, jobs, complete workflows
3. **Train Users** - Show technicians how to use "My Tasks"
4. **Monitor Performance** - Check dashboard metrics
5. **Backup Database** - Regular SQL Server backups

---

## 📞 Support

For issues or questions, refer to:
- **Full Documentation:** `ANCHOR_PRO_DOCUMENTATION.md`
- **Code Comments:** Inline documentation in source files
- **Database Schema:** See main documentation

---

**Status:** ✅ Production Ready  
**Last Updated:** January 30, 2026  
**Version:** 1.0.0

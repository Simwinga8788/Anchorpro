# Anchor Pro - User Manual

## 📖 Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Intelligence Center](#intelligence-center)
4. [Job Cards](#job-cards)
5. [Safety & Permits to Work](#safety--permits-to-work)
6. [Planning Board](#planning-board)
7. [My Tasks](#my-tasks)
8. [Equipment Management](#equipment-management)
9. [Inventory Control](#inventory-control)
10. [Procurement Hub](#procurement-hub)
11. [Downtime Reporting](#downtime-reporting)
12. [Reporting & Analytics](#reporting--analytics)
13. [Time Tracking](#time-tracking)
14. [Team Management](#team-management)
15. [Tips & Best Practices](#tips--best-practices)

---

## 🚀 Getting Started

### Logging In
1. Navigate to `http://localhost:5165`
2. Click **Sign In** (top right)
3. Enter your credentials:
   - Email: `admin@anchor.com`
   - Password: `AnchorPro!123`
4. Click **Log in**

### Navigation
- **Sidebar Menu**: Click any menu item to navigate
- **Active Page**: Highlighted in emerald green with left indicator
- **User Profile**: Top right shows your name and role
- **Log Out**: Click "LOG OUT" button (top right)

---

## 📊 Dashboard

### Overview
The Dashboard provides a real-time snapshot of your maintenance operations.

### Key Metrics (KPI Cards)
1. **Active Jobs**: Number of jobs currently in progress
2. **Overdue**: Jobs past their due date (red indicator)
3. **Today's Schedule**: Jobs scheduled for today
4. **Completion Rate**: Percentage of completed vs total jobs

### Recent Activity Feed
- Shows last 5 job updates
- Color-coded status indicators:
  - 🟢 **Green**: In Progress
  - 🔵 **Blue**: Scheduled
  - ⚫ **Gray**: Unscheduled
  - ✅ **Checkmark**: Completed

---

## 🧠 Intelligence Center

### Overview
The Intelligence Center uses AI-driven models to predict equipment failures and monitor overall fleet health.

### Advanced Metrics
1.  **Fleet Health (Score/100)**: A composite score based on uptime, MTTR, and job history.
2.  **Relative MTBF**: Hours between failures compared to industry standards.
3.  **Failure Risk Index**: Real-time probability of an asset breaking down in the next 7 days.
4.  **Cost Control Rating**: Efficiency of parts usage vs. planned budget.

### Predicting Failures
- Assets with health < 60 will be flagged for immediate corrective maintenance.
- Review the **Radar Chart** to identify which dimension (Safety, Cost, etc.) is dragging down performance.

---

## 🔧 Job Cards

### Workload Distribution Chart
- **Donut Chart**: Visual breakdown of job types
- **Preventive**: Green segment
- **Corrective**: Blue segment
- **Other**: Gray segment
- **Center Number**: Total jobs in system

### Viewing Jobs
1. Click **Job Cards** in sidebar
2. Use filters to narrow results:
   - **Status**: All, Scheduled, In Progress, Completed, On Hold
   - **Priority**: All, Critical, High, Normal, Low
   - **Search**: Type job number or description

### Creating a New Job
1. Click **New Job Card** (green button, top right)
2. Fill in required fields:
   - **Job Type**: Select from dropdown
   - **Equipment**: Choose equipment (optional)
   - **Priority**: Critical, High, Normal, or Low
   - **Description**: Detailed work description
   - **Scheduled Date**: When to perform the job
3. Click **Create Job Card**

### Editing a Job
1. Find the job in the list
2. Click the **pencil icon** (Edit button)
3. Modify fields as needed
4. Click **Update Job Card**

### Deleting a Job
1. Find the job in the list
2. Click the **trash icon** (Delete button)
3. Confirm deletion

### Job Statuses
- **Unscheduled**: Not yet planned
- **Scheduled**: Planned for a specific date
- **In Progress**: Work has started
- **Completed**: Work finished
- **On Hold**: Temporarily paused

---

## 🛡️ Safety & Permits to Work

### Overview
High-risk jobs require a **Digital Permit to Work (PTW)** to ensure safety compliance before a technician begins work.

### Issuing a Permit
1.  Open a **Job Card**.
2.  Navigate to the **Safety** tab.
3.  Fill out the **Safety Checklist** (e.g., LOTO, PPE, Isolation).
4.  Specify the **Permit Duration**.
5.  Click **Issue Permit**.

### Safety Controls
- **Suspended Permits**: If a safety incident occurs, supervisors can "Suspend" a permit, which automatically pauses the associated Job Card.
- **PTW Number**: Every issued permit receives a unique identifier for auditing purposes.

---

## 📋 Planning Board

### Overview
Kanban-style board for visual job management.

### Columns
1. **To-Do**: Unscheduled jobs waiting for assignment
2. **Scheduled**: Jobs planned but not started
3. **In Progress**: Active jobs being worked on

### Job Cards
- **Color Strip**: Left edge shows priority
  - Red: Critical
  - Orange: High
  - Blue: Normal
  - Gray: Low
- **Job Info**: Type, equipment, description
- **Status Badge**: Current status

### Using the Board
- Review jobs in each column at a glance
- Each card shows the job number, asset name, job type, assigned technician, priority colour, and scheduled date
- **Move a job forward**: Click the blue forward button (e.g. "In Progress →") on any card
- **Move a job back**: Click the grey back button (e.g. "← Scheduled") to reverse a stage
- Status updates save to the database immediately — no page refresh needed
- Use the board during daily stand-ups to review pipeline health and spot bottlenecks
- Click **New Job Card** to create a job directly from this page

---

## ✅ My Tasks (Technician View)

### Accessing Your Tasks
1. Click **My Tasks** in sidebar
2. Select a job from the list (or use direct link)

### Task Execution
1. **Review Job Details**:
   - Job number
   - Equipment
   - Description
   - Status

2. **Complete Checklist**:
   - Click checkboxes as you complete each task
   - Completed tasks show green checkmark
   - Strikethrough text indicates done

3. **Control Job Status**:
   - **Start Job**: Changes status to "In Progress"
   - **Pause Job**: Sets status to "On Hold"
   - **Complete Job**: Marks job as "Completed"

### Best Practices
- ✅ Complete tasks in order
- ✅ Mark tasks as you finish them (real-time tracking)
- ✅ Use "Pause" if you need to stop temporarily
- ✅ Only click "Complete" when ALL tasks are done

---

## 🔩 Equipment Management

### Viewing Equipment
1. Click **Equipment** in sidebar
2. Browse the equipment list
3. Use search bar to find specific items

### Adding New Equipment
1. Click **New Equipment** (green button)
2. Fill in details:
   - **Name**: Equipment identifier
   - **Serial Number**: Unique S/N
   - **Model Number**: Model designation
   - **Manufacturer**: Brand/maker
   - **Location**: Where it's located
3. Click **Create Equipment**

### Editing Equipment
1. Find equipment in list
2. Click **pencil icon** (Edit)
3. Update information
4. Click **Update Equipment**

### Deleting Equipment
1. Find equipment in list
2. Click **trash icon** (Delete)
3. Confirm deletion
   - ⚠️ **Warning**: Cannot delete if equipment has active jobs

---

## 📦 Inventory Control

### Overview
The Inventory module allows you to track spare parts and consumables in your local warehouse.

### Managing Stock
1.  Click **Inventory** in the sidebar.
2.  View **Current Quantity** vs. **Reorder Levels**.
3.  Items below the reorder level will show a **yellow warning indicator**.

### Consuming Parts on Jobs
- When a technician adds a part to a Job Card, the stock is automatically deducted from the Inventory.
- Total cost for the job is updated in real-time based on the **Unit Cost** at the time of issue.

---

## 💰 Procurement Hub

### Overview
The Procurement Hub manages external purchases for parts, direct materials, and subcontracting services.

### Raising a Purchase Order (PO)
1.  Navigate to **Procurement**.
2.  Click **New PO**.
3.  Select a **Supplier** and the **PO Type** (Direct Purchase, Subcontracting, Stock).
4.  Link the PO to a specific **Job Card** or **Department**.
5.  Set the status to **Issued**.

### Receiving Items
- When goods arrive, update the PO status to **Received**.
- Received costs are automatically factored into the **Cost Trinity** of the linked Job Card as "External Costs."

---

## ⏱️ Downtime Reporting

### When to Report Downtime
- Equipment breaks down
- Production delays occur
- Material shortages happen
- Quality issues arise
- Any event that impacts operations

### Reporting a New Delay/Breakdown

#### Step 1: Access the Form
1. Click **Report Downtime** in sidebar
2. Form opens with current date/time

#### Step 2: Select Type
Choose the appropriate type:
- **Equipment Breakdown**: Unplanned equipment failure
- **Equipment Delay**: Planned equipment stoppage
- **Material Shortage**: Missing materials/parts
- **Staffing Issue**: Personnel-related delays
- **Quality Issue**: Product quality problems
- **Process Delay**: Process-related issues
- **Other**: Any other type

#### Step 3: Set Status
- **Ongoing**: Issue is currently active
- **Resolved**: Issue has already been fixed

#### Step 4: Select Equipment (if applicable)
- Choose equipment from dropdown
- Or select "Not Applicable" for non-equipment delays

#### Step 5: Set Severity
- **Critical**: Production completely stopped
- **High**: Major impact on operations
- **Medium**: Moderate impact
- **Low**: Minor impact

#### Step 6: Set Time
- **Start Time**: When the issue began
  - Shows **elapsed time** for ongoing issues
- **End Time**: When it was resolved
  - Click **"End Now"** button to auto-fill current time
  - Shows **duration** when both times are set

#### Step 7: Describe the Issue
- **Description**: What happened? (minimum 10 characters)
- **Root Cause**: Why did it happen? (optional)
- **Resolution Notes**: How was it fixed? (required for resolved issues)

#### Step 8: Impact Assessment (Optional)
- **Estimated Cost**: Financial impact in dollars
- **Production Loss**: Units or hours lost

#### Step 9: Submit
1. Review all information
2. Click **Submit Report**
3. Confirmation message appears
4. Redirects to dashboard

### Reporting a Breakdown (New Streamlined Flow)
1. Click the red **"Report Breakdown"** button (top right)
2. Select the **Job Card** the breakdown is linked to
3. Select the specific **Job Task** affected
4. Choose a **Downtime Category** (e.g. Mechanical, Electrical, Operator Error)
5. Optionally set a **Start Time** — leave blank to use current time
6. Add **Notes** describing the breakdown
7. Click **Report Breakdown** to submit
8. The record appears in the table with a **Live** status badge

### Resolving an Active Breakdown
1. Find the active record (marked **Live** in red) in the table
2. Click the **Resolve** button on that row
3. The system automatically calculates the duration from start to now
4. Status changes to **Resolved** with duration displayed in minutes

### Viewing Downtime History
- All resolved and active breakdowns are listed in the table
- Use the **Search** bar to filter by equipment name or notes
- Summary cards show: Active Breakdowns, Total Hours, Resolved Today

---

## 📂 Reporting & Analytics

### Overview
Access and export detailed operational data for management review.

### Generating Reports
1.  Click **Reports** in the sidebar.
2.  Select a report type:
    *   **Fleet Performance**: MTBF/MTTR stats by asset.
    *   **Financial Summary**: Cost Trinity breakdown.
    *   **Tech Utilization**: Productivity scores by employee.
3.  Choose a **Date Range**.

### Exporting Data
- Click the **Download CSV** or **Excel** button.
- Clean, structured data will be generated for use in external tools like PowerBI or Excel.

---

## ⏱️ Time Tracking

### Overview
Time Tracking lets technicians clock in and out of job cards, creating an accurate labour log for every job. Managers can view all entries; technicians see their own.

### Clocking In
1. Click **Time Tracking** in the sidebar
2. Click the **Clock In** button (top right)
3. In the modal:
   - Select a **Job Card** from the dropdown (only active jobs are shown)
   - Optionally add a **Note** (e.g. "Starting engine diagnostics")
4. Click **Clock In**
5. An **Active Session** banner appears in green showing the job and start time

### Clocking Out
1. While an active session is running, the top banner shows your open session
2. Optionally type **Clock-Out Notes**
3. Click **Clock Out**
4. Duration is automatically calculated and saved

### Viewing Time Logs
- **My Time Log** tab: your own entries only
- **All Entries** tab: all technicians (visible to Admin/Supervisor)
- Filter by job using the dropdown filter
- Summary cards show total hours logged, active sessions, and technician count
- Delete individual entries using the trash icon (Admin only)

---

## 👥 Team Management (Admin Only)

### Viewing Team Members
1. Click **Team** in the sidebar under Resources
2. Cards show each member's name, role, employee number, hourly rate, and status

### Adding a New Member
1. Click **Add Member** (top right)
2. Fill in the form:
   - **First & Last Name**
   - **Email Address** (used as login username)
   - **Employee Number** (e.g. EMP001)
   - **Hourly Rate** in Kwacha
   - **Role**: Technician, Admin, Supervisor, Storekeeper, Accountant, or Viewer
   - **Password** — leave blank to use the default `Anchor@1234!`
3. Click **Add Member**
4. The new user can log in immediately

### Deactivating a Member
1. Click the **⋯** menu on the member card
2. Select **Deactivate**
3. Confirm — the member can no longer log in
4. Their card is dimmed with a **Deactivated** badge

### Reactivating a Member
1. Click the **⋯** menu on a deactivated member's card
2. Select **Reactivate** — access is restored immediately

### Permanently Removing a Member
1. Click the **⋯** menu → **Remove**
2. Confirm the deletion
   - ⚠️ Cannot delete your own account or platform-level admin users

### User Roles & Permissions

| Feature | Admin | Supervisor | Storekeeper | Technician | Viewer |
|---------|-------|------------|-------------|------------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/Edit Jobs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Planning Board | ✅ | ✅ | ✅ | ❌ | ✅ |
| Move Job Status | ✅ | ✅ | ❌ | ✅ | ❌ |
| Task Execution | ✅ | ✅ | ✅ | ✅ | ❌ |
| Equipment CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| Inventory CRUD | ✅ | ✅ | ✅ | ❌ | ❌ |
| Report Downtime | ✅ | ✅ | ✅ | ✅ | ❌ |
| Time Tracking | ✅ | ✅ | ❌ | ✅ | ❌ |
| Team Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reports & Analytics | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 💡 Tips & Best Practices

### General
- 🔄 **Refresh Data**: Pages auto-update, but refresh browser if needed
- 💾 **Save Often**: Click save/update buttons to persist changes
- 🔍 **Use Search**: Filters and search save time
- 📱 **Responsive**: Works on tablets and desktops

### Job Management
- ✅ Set realistic scheduled dates
- ✅ Assign appropriate priority levels
- ✅ Link jobs to equipment for better tracking
- ✅ Update status as work progresses
- ✅ Complete all tasks before marking job complete

### Downtime Reporting
- ⏱️ Report delays as soon as they occur
- 📝 Be detailed in descriptions
- 🎯 Select accurate severity levels
- 💰 Estimate costs when possible
- 🔍 Document root causes for analysis
- ✅ Use "End Now" button for quick closure

### Equipment Management
- 📋 Keep serial numbers accurate
- 📍 Update locations when equipment moves
- 🔧 Link equipment to jobs for history
- 🗑️ Don't delete equipment with active jobs

### Security
- 🔐 Log out when finished
- 🔑 Don't share passwords
- 👤 Use appropriate role for each user
- 🛡️ Protect admin credentials

---

## 🆘 Troubleshooting

### Cannot Log In
- ✅ Check email and password spelling
- ✅ Ensure Caps Lock is off
- ✅ Contact admin to reset password

### Page Not Loading
- ✅ Refresh browser (F5)
- ✅ Clear browser cache
- ✅ Check internet connection
- ✅ Verify server is running

### Cannot Create/Edit
- ✅ Check your role permissions
- ✅ Ensure all required fields are filled
- ✅ Look for error messages (red text)
- ✅ Verify data format (dates, numbers)

### Buttons Not Visible
- ✅ Check if you have permission
- ✅ Refresh the page
- ✅ Try different browser
- ✅ Contact admin

---

## 📞 Support

### Getting Help
- 📧 Email: support@anchorpro.com
- 📱 Phone: (555) 123-4567
- 💬 In-app: Contact admin user

### Reporting Bugs
Include:
1. What you were trying to do
2. What happened instead
3. Screenshot if possible
4. Your role and username

---

---

## ✅ Release Notes — v1.3.0

### What's New in This Release

| Feature | Status |
|---------|--------|
| Time Tracking (clock in/out per job) | ✅ Live |
| Team Management (add, deactivate, remove members) | ✅ Live |
| Planning Board — move jobs between stages | ✅ Live |
| Report Breakdown modal (linked to job task + category) | ✅ Live |
| Resolve downtime with auto-duration calculation | ✅ Live |
| Error boundary — graceful crash recovery on all pages | ✅ Live |
| xUnit backend test suite (12 tests, 0 failures) | ✅ Live |
| MailKit vulnerability patched (v4.16.0) | ✅ Live |
| EF migrations aligned with production database | ✅ Live |

### Known Remaining Items (v1.4.0 Targets)
1. **End-to-end browser test suite** — Playwright tests exist; CI pipeline integration pending
2. **Rate limiting** — API throttling for production hardening
3. **2FA enforcement** — Two-factor authentication configurable per tenant
4. **Audit log viewer** — Admin UI for browsing system activity logs
5. **Push notifications** — In-app alerts for overdue jobs and breakdown events

**Version**: 1.3.0
**Last Updated**: April 2026
**For**: Anchor Pro Maintenance Management System


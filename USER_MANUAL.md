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
13. [User Management](#user-management)
14. [Tips & Best Practices](#tips--best-practices)

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
- Review jobs in each column
- Identify bottlenecks
- Plan resource allocation
- Monitor workflow progress

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

### Using the "End Now" Button
**For Ongoing Delays:**
1. When ready to close the delay
2. Click green **"End Now"** button
3. Automatically:
   - Sets end time to current moment
   - Changes status to "Resolved"
   - Shows resolution notes field
4. Add resolution notes
5. Submit

### Viewing Downtime History
- Click **View History** button (top right of form)
- Browse past downtime reports
- Analyze trends and patterns

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

## 👥 User Management (Admin Only)

### Viewing Users
1. Click **Users** under ADMIN section
2. See list of all system users
3. View roles and status

### Creating a New User
1. Click **New User** (green button)
2. Fill in user details:
   - First Name
   - Last Name
   - Email (will be username)
   - Password
   - Confirm Password
   - Role (Admin, Supervisor, Planner, Technician)
3. Click **Create User**

### Deleting a User
1. Find user in list
2. Click **trash icon** (Delete)
3. Confirm deletion
   - ⚠️ **Note**: Cannot delete admin@anchor.com (protected)

### User Roles & Permissions

| Feature | Admin | Supervisor | Planner | Technician |
|---------|-------|------------|---------|------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Jobs | ✅ | ✅ | ✅ | ✅ |
| Create Jobs | ✅ | ✅ | ❌ | ❌ |
| Edit Jobs | ✅ | ✅ | ❌ | ❌ |
| Delete Jobs | ✅ | ✅ | ❌ | ❌ |
| Planning Board | ✅ | ✅ | ✅ | ❌ |
| Task Execution | ✅ | ✅ | ✅ | ✅ |
| Equipment CRUD | ✅ | ✅ | ❌ | ❌ |
| Report Downtime | ✅ | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ | ❌ |

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

## 🛠️ Implementation & Feature Roadmap (Known Gaps)

As of version **1.0.0**, the following items documented in this manual are currently under development or awaiting full integration in the live software build:

1.  **⏱️ "End Now" Button (Downtime)**: The one-click automatic completion button for downtime reports is not yet active. Start and End times must currently be entered manually.
2.  **📝 Resolution Notes Enforcement**: Strict requirement for resolution notes upon issue closure is being finalized; currently, the system allows for optional entry.
3.  **📉 Downtime Impact Section**: The "Impact Assessment" area (Estimated Cost in Kwacha and Production Loss) on the downtime reporting form is currently a placeholder and will be functional in a future update.
4.  **🗑️ Equipment Deletion Guard**: The automated safety check preventing deletion of equipment with active jobs is currently being hardened. Use caution when managing the equipment registry.
5.  **🆘 Integrated Support Hub**: The "Get Help" and direct "Bug Reporting" triggers within the application UI are currently being mapped to the contact information provided in the Support section.

**Version**: 1.0.0  
**Last Updated**: April 2026  
**For**: Anchor Pro Maintenance Management System


# Anchor Pro - User Guide
**Version:** 1.0 (Phase 1 Release)  
**Date:** January 2026

---

## 1. Introduction
Welcome to **Anchor Pro**, your comprehensive Production Planning and Maintenance Management System. This guide will help you navigate the system effectively, whether you are a Supervisor creating work orders, a Planner scheduling maintenance, or a Technician executing tasks.

### Key Features
- **Job Card Management**: Create and track detailed maintenance jobs.
- **Planning Board**: Visual drag-and-drop style scheduling (list-based in v1).
- **Task Execution**: Technicians can view assignments and track completion.
- **Operational Dashboard**: Real-time overview of production status.
- **Billing & Subscription**: Manage your plan and equipment limits.

---

## 2. Getting Started

### Accessing the System
Navigate to the application URL (e.g., `http://localhost:5165` for local dev).

### User Roles
Your experience depends on your assigned role:
- **Admin**: Full system access, including user management and settings.
- **Supervisor**: Can create Job Cards and view reports.
- **Planner**: Schedules jobs and assigns technicians.
- **Technician**: Views assigned tasks and marks them as complete.

### First Time Login
Use your provided credentials. If you don't have an account, contact your System Administrator.

---

## 3. For Supervisors: Creating a Job Card

1.  **Navigate to Job Cards**: Click "Job Cards" in the sidebar.
2.  **Start New Job**: Click the **"+ New Job Card"** button.
3.  **Fill Details**:
    -   **Equipment**: Select the machine requiring maintenance.
    -   **Job Type**: Choose the category (e.g., Preventive Maintenance, Repair).
    -   **Priority**: Set urgency (Critical requiring immediate action, High, Normal, Low).
    -   **Description**: Provide detailed problem description.
4.  **Add Tasks**:
    -   Under "Task Breakdown", type a task name (e.g., "Inspect seals") and estimated time.
    -   Click "Add Task".
    -   Repeat for all steps required.
5.  **Submit**: Click **"Create Job Card"**.

> **Note**: The job status starts as **Unscheduled**.

---

## 4. For Planners: Scheduling & Assignment

1.  **Open Planning Board**: Click "Planning" in the sidebar.
2.  **View Unscheduled Jobs**: The main table lists all pending jobs.
    -   Jobs are sorted by Priority (Critical first) and Age (Oldest first).
3.  **Schedule a Job**:
    -   Click the **"Schedule"** button on a job row.
    -   **Assign Technician**: Select an available technician from the dropdown (shows current workload).
    -   **Set Date/Time**: Pick the Start Date & Time.
4.  **Confirm**: Click "Schedule Job".
5.  **Review Workload**: Scroll down to the "Technician Workload" section to see assignments per technician.

> **Status Change**: The job status updates to **Scheduled**.

---

## 5. For Technicians: Executing Jobs

1.  **View Assignments**: Click "My Tasks" in the sidebar.
    -   **Up Next**: Shows jobs scheduled for you.
    -   **In Progress**: Shows jobs you've started.
2.  **Start a Job**:
    -   Click **"View Details"** on a Scheduled job.
    -   Review the tasks and equipment info.
    -   Click the **"START JOB"** button. The status changes to **In Progress**.
3.  **Complete Tasks**:
    -   As you work, check the boxes next to each completed task.
    -   (Optional) If you take a break, you can "Pause Job" (Feature coming in Phase 2).
4.  **Reporting Downtime**:
    -   If work must stop (e.g., waiting for parts), click **"Report Delay / Pause"**.
    -   Select the task and the reason (e.g., "Waiting for Parts").
    -   Click **"Confirm Delay"**. The job status changes to **On Hold**.
    -   To restart, click **"RESUME JOB"**.
5.  **Finish Job**:
    -   Once *all* tasks are checked, the **"COMPLETE JOB"** button becomes active.
    -   Click it to finish the work order.

> **Success**: The job is moved to **Completed** history.

---

## 6. For Managers: Monitoring Operations

1.  **Dashboard**: The Home page provides a live KPI summary.
    -   **Scheduled Today**: Volume of planned work.
    -   **In Progress**: Real-time activity.
    -   **Active Techs**: Resource utilization.
2.  **Performance**: View "Performance" page for detailed metrics.
    -   **Completion Trend**: Job completion rates over time.
    -   **Asset Reliability**: Breakdown frequency per machine.
    -   **Technician Stats**: Efficiency ratings.
3.  **Recent Activity**: See a feed of the latest job updates (started, completed, scheduled).

---

## 7. Troubleshooting

**"I can't see the Schedule button"**
- Ensure you have the **Planner** role.

**"My list is empty"**
- Check your filters or ensure you are logged in to the correct account.

**"Equipment Limit Reached"**
- If you see this error, your subscription plan limit has been met.
- **Fix**: Go to **Billing & Subscription** and upgrade to the "Professional" or "Enterprise" plan.

**"Application Error"**
- Take a screenshot and contact IT Support at `support@anchor.com`.

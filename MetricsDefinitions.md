# Anchor Pro — Metric Definitions (Single Source of Truth)

**Version:** 1.0  
**Phase:** 2.0.1  
**Last Updated:** 2026-01-28

This document defines the core metrics used throughout the Anchor Pro application. All reports, dashboards, and logic must adhere strictly to these definitions to ensure consistency.

---

## 1. Time & Duration Metrics

### 1.1 Job Duration (Net Processing Time)
The actual time spent working on a job, *excluding* any delays.
*   **Formula:** `(ActualEndDate - ActualStartDate) - TotalDowntimeDuration`
*   **Format:** Hours and Minutes (e.g., "3h 15m")
*   **Rules:**
    *   If `ActualEndDate` is active (job still in progress), use `CurrentTime` for calculation.
    *   Negative results (if downtime > elapsed time due to data error) are clamped to 0.

### 1.2 Downtime Duration
The total time lost due to stops/pauses.
*   **Formula:** `Sum(DurationMinutes)` of all `DowntimeEntry` records linked to the Job (via its Tasks).
*   **Scope:** Includes all categories (e.g., "Waiting for Parts", "Break", "Equipment Breakdown").
*   **Paid/Unpaid:** Both are counted in total downtime, but may be filtered for specific cost reports.

### 1.3 Total Lead Time (Gross Duration)
The total wall-clock time from start to finish.
*   **Formula:** `ActualEndDate - ActualStartDate`
*   **Usage:** Used for customer-facing turnaround time estimates.

---

## 2. Resource Utilization Metrics

### 2.1 Technician Utilization
Percentage of available time a technician spends on *active* work (excluding downtime).
*   **Formula:** `(Sum of Job Duration for Period) / (Shift Hours * Days in Period)`
*   **Standard Shift:** 8 Hours (480 minutes) per day.
*   **Example:** 
    *   Technician worked 6 hours of job time in an 8-hour day.
    *   Utilization = 6 / 8 = **75%**

### 2.2 Equipment Utilization
Percentage of time a machine is running a job vs. being idle.
*   **Formula:** `(Sum of Job Duration on Equipment) / (Available Shop Hours)`
*   **Available Shop Hours:** 24 hours (if continuous) or Shift Hours (if manned only).
*   **Default Context:** Calculated based on standard 8-hour shift unless specified otherwise.

---

## 3. Status Logic

### 3.1 Overdue Job
A job is flagged as "Overdue" if:
1.  **Status** is `Scheduled` or `InProgress` (Not `Completed` or `Cancelled`).
2.  **AND** `CurrentTime` > `ScheduledEndDate`.

*   **Logic Note:** A job without a `ScheduledEndDate` cannot be overdue (but can be flagged as "Unscheduled Backlog").

### 3.2 Delayed Job
A job is flagged as "Delayed" if:
1.  **Status** is `OnHold`.
2.  **OR** It has an active (open-ended) `DowntimeEntry`.

---

## 4. Financial Metrics (Preview)

### 4.1 Job Cost (Labor)
*   **Formula:** `Job Duration (Hours) * Technician Hourly Rate`
*   **Note:** Downtime is generally *excluded* from direct labor cost unless it is a "Paid" downtime category (e.g., "Meeting", "Safety Briefing").

### 4.2 Job Cost (Loss)
*   **Formula:** `Downtime Duration (Hours) * Machine Hourly Rate (Burden)`
*   **Usage:** Estimated loss due to equipment sitting idle while assigned.

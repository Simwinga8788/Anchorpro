# 📋 Anchor Pro: Legacy Feature & Workflow Gaps

**Context:** This document tracks functionalities and automated workflows present in the original Blazor system (as per User Manual v1.0 and Metric Definitions) that are currently missing or manual in the new Next.js / .NET build.

---

## 1. Automated Status & State Workflows
These items represent "triggers" where an action in one part of the system should automatically update another.

| Feature Gap | Blazor Logic (Desired) | New System State (Current) |
|:---|:---|:---|
| **Downtime Closure** | "End Now" button sets time + toggles status to "Resolved" + requires notes. | Manual: User must set time, status, and notes separately. |
| **Delayed Job Flagging** | An open Downtime Entry automatically flags the parent Job Card as "Delayed". | Manual: Jobs and Downtime are tracked as separate data points. |
| **Status-Driven Pauses** | Moving a job to "On Hold" should stop the active labor timer. | Manual: Status change does not impact the net processing calculation. |

## 2. Technician Workflow & Execution
Internal logic that guides the technician through job completion.

| Feature Gap | Blazor Logic (Desired) | New System State (Current) |
|:---|:---|:---|
| **Task Sequencing** | Enforces a specific order (e.g., Task 1 must be checked before Task 2). | Free-form: Any task can be checked at any time. |
| **Checklist Feedback** | Completed tasks show green checkmarks and strikethrough text. | Simple Checkbox: No dynamic text formatting for finished items. |
| **Completion Validation** | "Complete Job" button is disabled until ALL tasks are checked. | Partial: Prevents update but doesn't handle the UI state dynamically. |

## 3. Financial & Resource Workflows
Automated calculations based on established formulas.

| Feature Gap | Blazor Logic (Desired) | New System State (Current) |
|:---|:---|:---|
| **Job Cost (Loss)** | `Downtime Duration * Equipment Hourly Rate`. | Not Calculated: Burden costs are not yet displayed. |
| **Net Duration** | Auto-subtracts downtime minutes from lead hours for Net Processing. | Inconsistent: Only recently added to backend; not yet in all UI views. |
| **Utilization Math** | Based on fixed 8-hour shift windows. | Variable: Some views still use 24-hour shop availability. |

## 4. Data Safety & Integrity (Guards)
Workflow "Safety Nets" to prevent user error.

| Feature Gap | Blazor Logic (Desired) | New System State (Current) |
|:---|:---|:---|
| **Deletion Protection** | Blocks deletion of equipment if linked to active Job Cards. | Destructive: Allows deletion without checking dependencies. |
| **Identity Protection** | Explicitly prevents deletion of the primary `admin@anchor.com` account. | Unprotected: Any user with access can attempt deletion. |
| **Permit Enforcement** | Prevents "Start Job" action if a required Permit is not Issued. | Optional: Permits exist but don't yet "lock" the Job Card. |

## 5. Organizational & Financial Intelligence (ERP Gaps)
High-level management and departmental tracking.

| Feature Gap | Blazor Logic (Desired) | New System State (Current) |
|:---|:---|:---|
| **Department Cost Codes** | Each department has a unique financial Cost Code (e.g. HM-001). | Backend Only: Field not yet present in the Departments UI. |
| **Report Scheduling** | Admin UI to schedule "Monthly Maintenance" or "Dept Audits". | Missing UI: Scheduled report generator is not yet user-configurable. |
| **Excel Snapshots** | Exported Excel file includes a multi-tab "Executive Dashboard" view. | Basic Export: Exports are currently single-sheet CSV/XLS data dumps. |
| **PO Cost Visibility** | Job Card shows *which* specific PO injected a subcontracted cost. | Aggregated: Shows a total subcontracted cost but lacks the PO trail. |

---

## 🚀 Priority Action Items
1. [ ] Implement **"End Now"** trigger on Downtime Form.
2. [ ] Add **Equipment Deletion Guard** (Dependency Check).
3. [ ] Build **Report Scheduling UI** (Admin > Automated Reports).
4. [ ] Add **Department Cost Code** to registry and reports.
5. [ ] Integrate **Job Cost (Loss)** into Financial Summaries.


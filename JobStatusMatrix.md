# Anchor Pro — Job Status Matrix (Logic Lock)

**Version:** 1.0  
**Phase:** 2.0.2  
**Last Updated:** 2026-01-28

This document creates a rigid definition of how every Job Status affects system logic, time tracking, and KPIs. All business logic must consult this matrix.

---

## 1. Status Definitions

| Status | Type | Description |
| :--- | :--- | :--- |
| **Unscheduled** | Backlog | Job created but no dates or technician assigned. |
| **Scheduled** | Planned | Dates assigned, technician assigned. Ready for execution. |
| **InProgress** | Active | Technician has started work. Clock is ticking. |
| **OnHold** | Paused | Work stopped due to an issue (linked to Downtime). Clock paused. |
| **Completed** | Terminal | Work finished, all tasks done. No further changes allowed. |
| **Cancelled** | Terminal | Job aborted. No further changes allowed. |

---

## 2. Logic & KPI Impact Matrix

| Status | Timer State | KPI: Lead Time | KPI: Tech Utilization | KPI: Overdue Check | Edit Allowed? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Unscheduled** | Stopped | ❌ Excluded | ❌ Excluded | ❌ No | ✅ Yes |
| **Scheduled** | Stopped | ❌ Excluded | ❌ Excluded | ✅ Valid | ✅ Yes |
| **InProgress** | **Running** | ✅ **Active** | ✅ **Counted** | ✅ Valid | ⚠️ Limited |
| **OnHold** | **Paused** | ✅ **Active** (Wall clock continues) | ❌ Excluded (Idle) | ✅ Valid | ⚠️ Limited |
| **Completed** | Stopped | ✅ **Finalized** | ❌ Excluded | ❌ N/A | ❌ No |
| **Cancelled** | Stopped | ❌ Excluded | ❌ Excluded | ❌ N/A | ❌ No |

### Key Explanations

1.  **Timer State**: Controls whether the "Actual Duration" counter is accumulating.
    *   *Note:* `OnHold` stops the "Work Duration" timer but the "Lead Time" (Customer view) continues to accumulate until completion.

2.  **Tech Utilization**: Only `InProgress` counts towards a technician's productive time. `OnHold` is considered downtime/idle.

3.  **Overdue Check**: A job can be marked "Overdue" if `CurrentTime > ScheduledEndDate` while in `Scheduled`, `InProgress`, or `OnHold` statuses. Terminal statuses cannot become overdue after the fact.

4.  **Edit Allowed**:
    *   *Limited*: Can update tasks, notes, usage. Cannot change crucial planning data like "Job Type" without resetting status.
    *   *No*: Record is locked for audit.

---

## 3. State Transitions (Valid Flows)

*   `Unscheduled` → `Scheduled` (Assign Dates/Tech)
*   `Scheduled` → `InProgress` (Start Job)
*   `InProgress` → `OnHold` (Raise Downtime)
*   `InProgress` → `Completed` (Finish Job - **Must check all tasks**)
*   `OnHold` → `InProgress` (Resume Job)
*   `*Any*` → `Cancelled` (Abort)

### Invalid Transitions (Forbidden)
*   `Completed` → `InProgress` (Re-opening jobs requires Admin override or new Job ID)
*   `Unscheduled` → `Completed` (Must have work history)

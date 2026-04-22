# 🔍 Anchor Pro: Backend Service Audit Report (v1.0)

**Date:** April 16, 2026  
**Subject:** Functional Gap Analysis (Backend Logic vs. Frontend Visibility)

---

## Executive Summary
A comprehensive forensic audit of the `AnchorPro/Services` directory compared against `AnchorPro/Controllers` and the `anchor-pro-web` frontend reveals that the system's "Intelligence" and "Workflow" cores are **±95% complete**. The perceived gaps are not due to missing code, but due to **Orphaned Services**—backend logic that has not yet been exposed via an API or implemented in the Next.js UI.

---

## 1. Major "Orphaned" Modules
These modules are fully coded in C# but are completely inaccessible from the current Dashboard.

### 🧠 Intelligence & Financial Hub (`IntelligenceService.cs`)
*   **Status:** Backend 100% | Frontend 0%
*   **Capabilities Found:**
    *   **Job Profitability**: Automatic Margin % and Gross Profit tracking for every job.
    *   **Technician Utilization**: Efficiency scoring calibrated to an 8-hour shift standard.
    *   **Asset Performance**: Formal MTTR/MTBF calculations and Downtime % analytics.
    *   **Inventory Intelligence**: Tracking spare parts consumption cost by Job Card.

### 📊 Reporting & Automation Engine (`ReportingService.cs`)
*   **Status:** Backend 100% | Frontend 0%
*   **Capabilities Found:**
    *   **Multi-Tab Excel Exports**: Complex XLSX generation including an "Executive Dashboard" tab with KPI cards.
    *   **Automated Email Audits**: Triggering HTML-formatted operational summaries to stakeholders.
    *   **Departmental Scoping**: Logic to filter any report by a specific cost-center/department.

### 🌱 Operational Accelerators (`DemoDataService.cs`)
*   **Status:** Backend 100% | Frontend 0%
*   **Capabilities Found:**
    *   **Instant Seeding**: One-click generation of industrial assets (Caterpillar, Komatsu), historical jobs, and inventory stock to populate a new tenant's workspace.

---

## 2. Incomplete Workflow Bridges
These modules have some UI presence but lack the "Logical Nerves" to trigger their backend counterparts.

| Feature Area | Backend Capability (Found) | Frontend Gap (Missing) |
|:---|:---|:---|
| **Downtime** | `ResolveWithNotes()` logic with time-stamping. | Manual data entry; no "End Now" trigger. |
| **Safety** | `SafetyService.cs` handling Permits to Work (PTW). | No "Safety Tab" or PTW issuance form on Job Cards. |
| **Billing** | `SubscriptionLifecycleService.cs` handling State Changes. | No Plan Selection UI or POP Upload forms. |
| **Branding** | `SystemSettings` storage for colors/names. | CSS highlights are hardcoded; ignore tenant settings. |

---

## 3. High-Priority "Bridge" Roadmap
To bring the system to 100% parity with the original vision, we should implement the following API-to-UI connections:

1.  **The Intelligence Bridge**: Expose `IntelligenceService` to populate the existing Intelligence Dashboard with live Profit/Utilization data.
2.  **The Reporting Bridge**: Create `ReportingController` to allow users to trigger and download the 55KB Reporting Engine's outputs.
3.  **The Safety/Workflow Bridge**: Connect the Job Card UI to `SafetyService` and `DowntimeService` (specifically the "End Now" automation).
4.  **The Governance Bridge**: Connect the Settings page to `DemoDataService` and `SubscriptionService`.

---

**Audit Conclusion:**  
The "Brain" of Anchor Pro is healthy and feature-complete. The remaining work is purely **architectural surface work** (Controllers + React Screens) to reveal the existing power of the system to the end-users.

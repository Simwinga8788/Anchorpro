# Anchor Pro Production Planning - Complete System Overview

## 1. System Architecture & Core Concepts
**Anchor Pro** is a multi-tenant SaaS (Software as a Service) application designed for industrial maintenance management.

*   **Technology Stack**: .NET 8 (Blazor Server), Entity Framework Core, SQL Server.
*   **Multi-Tenancy Model**: Single Database, Logical Isolation (Row-Level Security) via `TenantId`.
*   **Authentication**: ASP.NET Core Identity with Claims-based Authorization (`PlatformOwner`, `Admin`, `Technician`).

---

## 2. The SaaS Engine (Billing & Governance)
This module handles the commercial side of the platform, allowing the Platform Owner to monetize and manage the system.

### **2.1. Subscription Lifecycle**
The system implements a robust subscription state machine:
1.  **Trial**: New tenants start on a 14-day Free Trial.
2.  **Active**: Tenants who pay are moved to a paid plan (e.g., "Professional").
3.  **Grace Period**: If payment is missed, the system allows a configurable grace period.
4.  **Suspended**: Access is revoked if payment fails after grace.
5.  **Reactivation**: Uploading a valid Proof of Payment effectively "Un-Suspends" the tenant.

### **2.2. Payment Processing (Manual/Proof)**
*   **Workflow**: Tenant sees an invoice -> Uploads "Proof of Payment" (screenshot/slip).
*   **Approval**: Platform Owner reviews the proof in the **Platform Dashboard**.
    *   *Auto-Upgrade*: If the paid amount matches a higher plan, the system automatically upgrades the Tenant's subscription.
    *   *Concurrency Safety*: Uses transactional logic to ensure status, billing dates, and access rights update atomically.

### **2.3. Platform Administration**
*   **Tenant Management**: View, Edit, Suspend, or Reactivate any tenant manually.
*   **Impersonation**: "Log in as Tenant" feature allows support staff to debug tenant issues directly.
*   **Global Settings**: Configure SMTP, Storage limits, and Default Trial lengths.

---

## 3. The Operational Core (Tenant Space)
Once a tenant is onboarded, they have access to a full Production Planning suite.

### **3.1. Asset Management**
*   **Equipment Registry**: Detailed tracking of assets (Serial #, Model, Purchase Date).
*   **Status Tracking**: Operational / Down / Maintenance.
*   **History**: Full audit trail of all jobs performed on an asset.

### **3.2. Work Order (Job) Lifecycle**
The heart of the system is the Job Card flow:
1.  **Draft/Request**: A job is requested (e.g., "Leak in Pipe 2").
2.  **Scheduled**: Admin assigns a Technician and a Date.
3.  **In Progress**: Technician starts the timer (mobile-friendly view).
4.  **Input Data**:
    *   *Tasks*: Checklists (Pass/Fail).
    *   *Parts*: Consumes Inventory (deducts stock).
    *   *Labor*: Logs hours automatically.
5.  **Completed**: Job is signed off.
6.  **Closed**: Financials are calculated and indexed for reporting.

### **3.3. Inventory System**
*   **Stock Tracking**: Real-time quantity on hand.
*   **Low Stock Alerts**: Auto-emails Purchasing when stock falls below `ReorderLevel` (Safe implementation with try-catch).
*   **Job Integration**: Parts used in jobs automatically reduce inventory.

---



## 4. Tenant-Level Customization (Configuration over Customization)
Anchor Pro follows a strict **"Configuration over Customization"** principle (similar to SAP/Enterprise SaaS). This allows tenants to tailor the system to their operational identity without fracturing the core platform.

### **4.1. Customization Scope**
Customization is intentionally limited to preserve system stability while offering flexibility:

*   **Branding & Identity**: Tenants can configure their workspace to look like their own internal tool.
    *   *Configurable*: Company Name, Logo, Primary Brand Color (dashboard highlights), Contact Details.
    *   *Use Case*: "Anchor Corp" sees green branding; "Mining Co" sees blue branding.
*   **Feature Toggles (Plan-Based)**: Features are enabled/disabled via the Subscription Plan.
    *   *Starter*: Basic Jobs.
    *   *Professional*: Inventory Management ✅.
    *   *Enterprise*: Advanced Analytics & Audit Logs ✅.
*   **Workflow Configuration**: Tenants customize *labels* and *rules*, not code logic.
    *   *Job Priorities*: Default is [Low/Med/High], but a tenant can define [Routine/Urgent/Critical].
    *   *Safety Rules*: Toggle "Require Permit to Work" on/off.
    *   *Constraint*: Tenants cannot change core state machine logic (e.g., Job must always go Start -> Complete).
*   **Notification Preferences**: Tenants control *when* they are notified (Job Assignment, Low Stock) via simple toggles.

### **4.2. Technical Architecture**
To achieve this without schema changes per tenant, the system uses a flexible Key/Value setting store.

*   **Database Model**: `SystemSettings` table.
    *   `TenantId`: Isolates settings to the workspace.
    *   `Key`: Dot-notation identifier (e.g., `Org.PrimaryColor`, `Safe.PermitRequired`).
    *   `Value`: String or JSON payload for complex configs.
*   **Runtime Resolution**:
    1.  User logs in.
    2.  System resolves `TenantId`.
    3.  `SettingsService` loads all settings for that Tenant.
    4.  UI and Logic adapters apply the configs (e.g., hiding the "Inventory" menu if disabled).

### **4.3. Platform Owner Control**
The Platform Owner maintains ultimate authority:
*   Defines which settings are exposed to tenants.
*   Sets strict limits based on Plans.
*   Can override or reset tenant settings for support.

### **4.4. Why This Design Works**
*   ✅ **Scalable**: Single codebase serves all tenants.
*   ✅ **Secure**: Data stays isolated; no risk of SQL injection via custom code.
*   ✅ **Maintainable**: Upgrading the core platform upgrades everyone instantly.

---

## 5. Analytics & Demo Data
To demonstrate value immediately, the system includes powerful visualization tools.

### **5.1. Dashboards**
*   **Platform Dashboard**: Real-time MRR (Monthly Recurring Revenue), Active Tenant counts, and System Health.
*   **Tenant Dashboard**: Job Completion rates, Technician Workload, and Asset Uptime stats.

### **5.2. Demo Data Generator**
*   **Purpose**: Allows instant visualization of the system's capabilities for new trials or sales demos.
*   **Mechanism**: A service (`DemoDataService`) injected into the Tenant Settings page.
*   **Generated Data**:
    *   5+ Realistic Industrial Assets (CAT Trucks, Conveyors).
    *   20+ Historical Jobs (Backdated to populate "Last 30 Days" charts).
    *   Stock Inventory.

---

## 6. End-to-End User Journey (Walkthrough)

### Phase 1: Onboarding (The Startup)
1.  **Sign Up**: User registers `anchorcorp@anchor.com`.
2.  **Tenant Creation**: System provisions "Anchor Corp" workspace with a "Free Trial".
3.  **First Login**: User lands on an empty Dashboard.

### Phase 2: Configuration (The Setup)
4.  **Seeding**: User goes to `Settings > Demo Data` and clicks **"Generate Sample Data"**.
5.  **Result**: Dashboard immediately lights up with charts, assets, and pending actions.

### Phase 3: Operations (The Work)
6.  **Job Assignment**: Admin sees a "Breakdown" job generated by the seeder. Assigns it to `tech@anchor.com`.
7.  **Execution**: Technician logs in, opens the Job, clicks "Start".
8.  **Completion**: Technician checks off tasks, uses a "Filter" from inventory, and completes the job.

### Phase 4: Billing (The Growth)
9.  **Upgrade**: Admin decides to buy "Enterprise Plan".
10. **Payment**: Uploads a Proof of Payment for $500.
11. **Approval**: Platform Owner (`owner@platform.com`) logs in, sees the pending payment, and clicks **"Approve"**.
12. **Result**: "Anchor Corp" is instantly upgraded to "Enterprise", billing dates extended, and a confirmation email sent.

---

## 7. Validated Validation Status
| Feature Area | Status | Notes |
| :--- | :--- | :--- |
| **Multi-Tenancy** | ✅ Validated | Data strictly isolated between tenants. |
| **SaaS Billing** | ✅ Validated | Upgrade logic, Payment Approval, Suspension all working. |
| **Job Lifecycle** | ✅ Validated | Creation -> Completion -> Inventory Deduction confirmed. |
| **Platform Ops** | ✅ Validated | Impersonation and Global Settings functional. |
| **Demo Seeding** | ✅ Validated | Generation service successfully populates data. |

## 8. Validated Customization Capabilities
Feature customization has been fully implemented and verified against the "Configuration over Customization" principle. All features are driven by the `SystemSettings` database table and are fully functional (no mocks).

| Feature | Implementation | Validated |
| :--- | :--- | :--- |
| **Branding Identity** | `NavMenu` dynamically reads `Org.CompanyName` and `Org.PrimaryColor` from `SystemSettings`. | ✅ Live |
| **Feature Toggles** | Inventory/Report menus hidden/shown based on `Feature.*` settings. | ✅ Live |
| **Workflow Labels** | Job Priority dropdowns & badges translate Enum (Low/High) to Tenant Labels (Routine/Critical) via `LabelService`. | ✅ Live |
| **Notifications** | Emails for Assignment/Completion only sent if `Notify.*` toggle is enabled in `SystemSettings`. | ✅ Live |

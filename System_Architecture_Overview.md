# AnchorPro: System Architecture & Capabilities Overview

AnchorPro is a robust, multi-tenant SaaS platform built with ASP.NET Core, designed for precision tracking, automated reporting, and comprehensive asset management in high-output industrial operations.

This document outlines the end-to-end backend logic, API surface, and core workflows that power the platform.

---

## 1. Core Architecture & Multi-Tenancy

The system is built on a **Multi-Tenant Architecture** where a single codebase and database instance serve multiple distinct business entities (Tenants).

*   **Tenant Isolation**: Data isolation is enforced at the ORM layer using Entity Framework Core **Global Query Filters**. Every `BaseEntity` has an optional `TenantId`. The `ApplicationDbContext` automatically filters out data that doesn't belong to the `ICurrentTenantService`'s resolved Tenant.
*   **Platform Owner (Super Admin)**: Users without a `TenantId` (e.g., `simwinga8788@gmail.com`) act as platform owners. The query filter allows them to manage global settings, oversee all tenants, and perform impersonation. `anchorcorp@anchor.com` is the Admin of the default "Anchor Corp" tenant.
*   **Authentication & Security**: Security is handled via ASP.NET Core Identity. It relies on secure, HttpOnly cookies for session management with anti-forgery tokens to protect against CSRF attacks.

---

## 2. Core Operational Modules & Workflows

### A. Job Card Lifecycle Management
The heart of AnchorPro is the Job Card system, which tracks maintenance or repair work from creation to completion and invoicing.

*   **Creation & Assignment**: A Job Card is created for a specific piece of equipment or customer. It can be assigned to a technician (linked to their Identity account).
*   **Workflow States**: Moves through statuses: `Pending` → `InProgress` → `Completed` → `Invoiced` (or `Cancelled`).
*   **Tasks & Parts**: 
    *   **Tasks**: Specific checklists or actions required for the job.
    *   **Parts**: Technicians can withdraw `InventoryItems` from the warehouse, which automatically updates stock levels and adds to the `PartsCost` of the job.
*   **Compliance (Permits to Work)**: Critical jobs require safety compliance. A `PermitToWork` must be approved before a job can transition to `InProgress`.
*   **Field Technician API**: Technicians use the REST API to update job statuses, check off tasks, and upload photos/reports directly from their mobile devices.

### B. The "Cost Trinity" & Financials
Every completed Job Card calculates a precise profit margin based on four cost pillars:
1.  **Labor Cost**: Calculated from the assigned technician's hourly rate × hours worked.
2.  **Parts Cost**: Calculated from the cost of inventory items consumed.
3.  **Direct Purchases**: External parts bought specifically for the job (via Purchase Orders).
4.  **Subcontracting**: External labor hired for the job.

*   **Invoicing**: Once a job is completed, it can be converted into an `Invoice`. The system supports automatic VAT calculations and tracks payment statuses (`Unpaid`, `Partial`, `Paid`).
*   **Recurring Billing**: The `Contracts` module allows assigning monthly Service Level Agreements (SLAs) to customers. A background worker automatically generates monthly invoices for active contracts.
*   **Revenue Tracking**: The API provides real-time snapshots of Month-to-Date (MTD) revenue, collected payments, and outstanding balances.

### C. File & Photo Management (Uploads)
The system features a robust, mobile-optimized file upload API (`UploadController`).
*   **Phone-Safe Logic**: Automatically handles generic `application/octet-stream` blobs or empty filenames commonly sent by mobile device cameras.
*   **Format Support**: Accepts standard documents (PDF, Excel) and modern mobile image formats (including iPhone's `.heic` / `.heif`).
*   **Job Linking**: Files can be uploaded and instantly linked to a Job Card as a `JobAttachment` (e.g., "Proof of Work" or "Damage Report"), stored securely on the local disk.

### D. Automated Alerts & Background Workers
AnchorPro actively monitors operations and notifies stakeholders without requiring manual oversight.

*   **Persistent Alerts**: The `Alerts` system stores notifications in the database, allowing the frontend to display a "Notification Bell" with unread counts.
*   **Low Margin Detection**: If a job completes with < 15% profit margin, the system flags it and alerts management.
*   **Overdue SLA Monitoring**: Flags jobs that have breached their scheduled completion dates.
*   **Reporting Worker**: A background service (`ReportingWorker`) evaluates `ReportDefinitions` (cron schedules) and automatically compiles and emails data exports (like inventory shortages or daily revenue).

---

## 3. The REST API Surface

The API acts as the bridge for both the internal Blazor UI (in some areas) and external/mobile clients. It is fully 100% E2E covered for the core SaaS lifecycle.

*   **`GET /api/jobcards`**: Filterable by `status` or `priority` (crucial for technician work-lists).
*   **`GET /api/jobcards/{id}/attachments` & `/parts`**: Retrieves all linked assets and inventory used for a specific job.
*   **`POST /api/upload/job/{jobId}`**: Multipart form upload to attach field photos.
*   **`POST /api/financial/invoices/from-contract/{contractId}`**: Triggers manual or automated recurring billing.
*   **`GET /api/alerts` & `/api/alerts/unread-count`**: Powers the real-time notification UI.
*   **`POST /api/tenants/{id}/assign-plan`**: Platform Owner endpoint to manage SaaS subscription access.
*   **`POST /api/auth/reset-password`**: Self-service account recovery.

## 4. Scalability & Production Readiness
*   **Database**: Designed for PostgreSQL (Supabase) leveraging native features and optimized indexes.
*   **Kestrel Configuration**: Hardened to accept large payload sizes (up to 10MB per file) to support high-res field photos without crashing.
*   **State Management**: Financial totals are calculated via database aggregates where possible to ensure data integrity over time.

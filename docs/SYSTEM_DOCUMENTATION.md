# Anchor Pro — System Documentation

**Version:** 1.3  
**Last Updated:** April 2026  
**Stack:** ASP.NET Core 8 · Next.js 14 · PostgreSQL · Stripe

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [Backend — API Reference](#4-backend--api-reference)
5. [Backend — Services](#5-backend--services)
6. [Frontend — Pages & Components](#6-frontend--pages--components)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Multi-Tenancy](#8-multi-tenancy)
9. [Billing & Subscriptions (Stripe)](#9-billing--subscriptions-stripe)
10. [Email (SMTP / MailKit)](#10-email-smtp--mailkit)
11. [File Storage](#11-file-storage)
12. [Background Workers](#12-background-workers)
13. [Test Suite](#13-test-suite)
14. [Database Migrations](#14-database-migrations)
15. [Environment Configuration](#15-environment-configuration)
16. [Deployment Guide](#16-deployment-guide)
17. [Known Constraints & Gotchas](#17-known-constraints--gotchas)

---

## 1. System Overview

Anchor Pro is a B2B SaaS platform targeting field service and maintenance companies. It centralises the operations workflow from job creation through scheduling, execution, time tracking, asset management, and invoicing.

**Core value:**  
A single platform that replaces disparate spreadsheets, WhatsApp job assignments, and paper-based time sheets with a structured, auditable digital workflow.

**Supported company roles:**

| Role | Primary Use Case |
|------|----------------|
| Platform Owner | Platform admin — manages tenants, billing plans, and system health |
| Tenant Admin | Company owner/manager — full operational control |
| Supervisor | Oversees job execution, assigns technicians |
| Planner | Schedules jobs on the planning board |
| Technician | Executes jobs, logs time, reports downtime |

---

## 2. Architecture

### System Diagram

```
Browser (Next.js 14)
    │
    │  HTTP/HTTPS  (same-origin proxy via next.config.ts rewrites)
    │
ASP.NET Core 8  (Port 5165)
    │
    ├── Identity Middleware  →  HTTP-only cookie
    ├── CORS Policy  →  allows localhost:3000
    ├── 25 REST Controllers  →  /api/*
    ├── 24 Scoped Services  →  business logic
    └── EF Core 8  →  Npgsql  →  PostgreSQL (Supabase)
                                      │
                              PgBouncer (port 6543)  — connection pooling
```

### Request Flow

1. User POSTs to `/api/auth/login` — server sets `.AspNetCore.Identity.Application` HTTP-only cookie
2. All subsequent `fetch` calls in `api.ts` send `credentials: 'include'`
3. Backend reads `TenantId` and `Role` from cookie claims
4. Each service filters its EF queries with `WHERE TenantId = @tenantId`
5. Response JSON is returned — frontend renders

### Frontend Proxy

`anchor-pro-web/next.config.ts` rewrites `/api/*` → `http://localhost:5165/api/*`, so the browser never sees cross-origin requests during development. In production, a reverse proxy (nginx / Vercel rewrites) serves the same purpose.

---

## 3. Data Model

### Entity Hierarchy

All tenant-scoped entities extend `BaseEntity`:

```csharp
public abstract class BaseEntity
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
```

### Entities

| Entity | Table | Key Relationships |
|--------|-------|------------------|
| `ApplicationUser` | `AspNetUsers` | Extends IdentityUser; has TenantId, Role, EmployeeNumber, HourlyRate |
| `Tenant` | `Tenants` | Root of multi-tenancy; has SubscriptionPlan |
| `TenantSubscription` | `TenantSubscriptions` | Links Tenant ↔ SubscriptionPlan; holds Stripe IDs |
| `SubscriptionPlan` | `SubscriptionPlans` | Platform-defined plans (limits, features, price) |
| `JobCard` | `JobCards` | Core work order; links to Customer, Equipment, Technician |
| `JobTask` | `JobTasks` | Checklist item within a JobCard |
| `JobAttachment` | `JobAttachments` | Files linked to a JobCard |
| `JobCardPart` | `JobCardParts` | Inventory parts consumed by a JobCard |
| `Equipment` | `Equipment` | Asset/machine registry |
| `DowntimeEntry` | `DowntimeEntries` | Equipment downtime event with start/end/duration |
| `DowntimeCategory` | `DowntimeCategories` | Reference lookup for downtime reasons |
| `TimeEntry` | `TimeEntries` | Technician clock-in/out session |
| `InventoryItem` | `InventoryItems` | Parts and stock with quantity tracking |
| `Customer` | `Customers` | CRM — company and contact details |
| `Contract` | `Contracts` | Service agreement linked to Customer |
| `PurchaseOrder` | `PurchaseOrders` | Procurement orders to suppliers |
| `Supplier` | `Suppliers` | Vendor / parts supplier |
| `Invoice` | `Invoices` | Billing document for completed work |
| `InvoicePayment` | `InvoicePayments` | Payment records against an Invoice |
| `PermitToWork` | `PermitsToWork` | Safety permit with approval workflow |
| `ReportDefinition` | `ReportDefinitions` | Saved report configurations |
| `SystemSetting` | `SystemSettings` | Key-value settings per tenant |
| `SystemAuditLog` | `SystemAuditLogs` | Immutable action log |
| `PaymentTransaction` | `PaymentTransactions` | Stripe payment events |
| `JobType` | `JobTypes` | Reference data for job classification |
| `Department` | `Departments` | Organisational unit |

### Enums

```csharp
enum JobStatus    { Unscheduled=0, Scheduled=1, InProgress=2, Completed=3, Cancelled=4, OnHold=5 }
enum JobPriority  { Low=0, Normal=1, High=2, Critical=3 }
```

### ApplicationDbContext

Registers all 26 `DbSet<T>` properties. Configures:
- Cascade delete rules (soft where appropriate)
- Unique indexes (e.g. JobNumber within tenant)
- Value conversions for enums

---

## 4. Backend — API Reference

Base URL: `http://localhost:5165/api`  
Auth: HTTP-only cookie (set by `/api/auth/login`)

### AuthController — `/api/auth`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/login` | Public | Authenticates user, sets cookie |
| POST | `/logout` | Any | Clears cookie |
| GET | `/me` | Any | Returns current user info + claims |
| POST | `/register` | Public | Creates new tenant + admin user |
| POST | `/register-technician` | Admin | Adds a technician to current tenant |

### DashboardController — `/api/dashboard`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/stats` | KPI cards: active jobs, open downtime, technician utilization, etc. |
| GET | `/activity` | Recent activity feed (last 20 events) |
| GET | `/technicians` | List of technicians for current tenant |

### JobCardsController — `/api/jobcards`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List all job cards (filterable by status, priority, search) |
| GET | `/{id}` | Single job card with tasks and attachments |
| POST | `/` | Create new job card |
| PUT | `/{id}` | Update job card fields |
| DELETE | `/{id}` | Delete job card |
| PUT | `/{id}/status` | Update status only (used by planning board) |
| POST | `/{id}/attachments` | Upload file attachment |
| GET | `/{id}/attachments` | List attachments for a job |

### JobTasksController — `/api/jobtasks`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List tasks (filterable by jobCardId) |
| POST | `/` | Create task |
| PUT | `/{id}` | Update task (mark complete, etc.) |
| DELETE | `/{id}` | Delete task |

### TeamController — `/api/team`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List all team members for tenant |
| POST | `/invite` | Create and invite a new team member |
| PUT | `/{id}` | Update member details (name, role, hourly rate) |
| POST | `/{id}/deactivate` | Suspend account (preserves history) |
| POST | `/{id}/reactivate` | Reactivate suspended account |
| DELETE | `/{id}` | Permanently remove member |

### TimeTrackingController — `/api/timetracking`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List time entries (optional filters: jobCardId, technicianId) |
| GET | `/my` | Current user's own time entries |
| GET | `/job/{jobCardId}` | All entries for a specific job |
| POST | `/clock-in` | Start a time entry session |
| POST | `/clock-out` | End active session, calculates duration |
| DELETE | `/{id}` | Delete a time entry (admin only) |

### DowntimeController — `/api/downtime`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List all downtime entries |
| POST | `/` | Report a new downtime event |
| PUT | `/{id}/resolve` | Resolve active downtime (sets end time, calculates duration) |
| DELETE | `/{id}` | Delete entry |

### EquipmentApiController — `/api/equipment`

Standard CRUD: GET list, GET by id, POST create, PUT update, DELETE.  
Each asset has: name, code, category, location, manufacturer, model, serial number, purchase date, status.

### InventoryApiController — `/api/inventory`

Standard CRUD plus:
- `POST /{id}/adjust` — adjust stock quantity up or down with reason

### ProcurementController — `/api/procurement`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/orders` | List purchase orders |
| POST | `/orders` | Create purchase order |
| PUT | `/orders/{id}` | Update PO |
| GET | `/suppliers` | List suppliers |
| POST | `/suppliers` | Add supplier |

### CustomersController — `/api/customers`

Standard CRUD. Customer fields: company name, contact name, email, phone, address, credit limit.

### ContractsController — `/api/contracts`

Standard CRUD. Linked to Customer. Fields: contract number, type, start/end dates, value, SLA terms.

### FinancialController — `/api/financial`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/invoices` | List invoices |
| POST | `/invoices` | Create invoice |
| PUT | `/invoices/{id}` | Update invoice |
| POST | `/invoices/{id}/payments` | Record a payment |
| GET | `/summary` | Financial summary KPIs |

### ReportsController — `/api/reports`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List saved report definitions |
| GET | `/job-completion` | Job completion rate data |
| GET | `/technician-performance` | Hours, jobs per tech |
| GET | `/downtime-analysis` | Downtime by category/asset |
| GET | `/export/{type}` | CSV export (jobs, time, etc.) |

### SafetyController — `/api/safety`

Standard CRUD for `PermitToWork`. Includes approval workflow fields: requested by, approved by, approval date, expiry, status.

### IntelligenceController — `/api/intelligence`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/profitability` | Revenue vs cost per job type |
| GET | `/utilization` | Technician utilization rates |
| GET | `/trends` | Job volume and completion trends |
| GET | `/alerts` | System-generated performance alerts |

### BillingController — `/api/billing`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/plans` | List available Stripe subscription plans |
| GET | `/subscription` | Current tenant subscription |
| POST | `/checkout` | Create Stripe Checkout session |
| POST | `/portal` | Create Stripe Customer Portal session |
| POST | `/webhook` | Stripe webhook endpoint (public, signature-verified) |

### SubscriptionController — `/api/subscription`

Manages subscription lifecycle events internally (plan changes, cancellation, renewal).

### SettingsController — `/api/settings`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Get all settings for tenant |
| PUT | `/{key}` | Update a single setting |

### OrgController — `/api/org`

GET and PUT for tenant organisation profile (name, logo, address, timezone).

### ReferenceDataController — `/api/referencedata`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/jobtypes` | Job type lookup list |
| GET | `/downtimecategories` | Downtime reason categories |
| GET | `/departments` | Department list |

### AdminAccessController — `/api/admin`

Platform Owner only (`[Authorize(Policy = "PlatformOwner")]`).
- GET `/tenants` — list all tenants
- POST `/tenants/{id}/suspend` — suspend a tenant
- GET `/health` — system health metrics

### PlatformConfigController — `/api/platformconfig`

Platform Owner only. Manage subscription plan definitions, global settings, and feature flags.

---

## 5. Backend — Services

Each service is registered as `Scoped` and injected via its interface.

| Interface | Implementation | Responsibility |
|-----------|---------------|----------------|
| `IJobCardService` | `JobCardService` | Job card CRUD, status transitions, number generation |
| `IJobTaskService` | `JobTaskService` | Task CRUD within a job |
| `IEquipmentService` | `EquipmentService` | Asset registry management |
| `IDowntimeService` | `DowntimeService` | Downtime reporting and resolution |
| `IInventoryService` | `InventoryService` | Stock management and adjustments |
| `ICustomerService` | `CustomerService` | CRM operations |
| `IFinancialService` | `FinancialService` | Invoice and payment logic |
| `IDashboardService` | `DashboardService` | KPI aggregation queries |
| `IReportingService` | `ReportingService` | Report data aggregation |
| `IIntelligenceService` | `IntelligenceService` | Analytics and BI queries |
| `IProcurementService` | `ProcurementService` | PO and supplier management |
| `ISafetyService` | `SafetyService` | Permit to work lifecycle |
| `IAlertService` | `AlertService` | Notification generation and delivery |
| `ISubscriptionService` | `SubscriptionService` | Stripe subscription operations |
| `ISubscriptionLifecycleService` | `SubscriptionLifecycleService` | Plan change, cancellation flows |
| `IEmailService` | `SmtpEmailService` | Outbound email via MailKit |
| `IFileService` | `LocalFileService` | File upload/storage |
| `IExportService` | `CsvExportService` | CSV data export |
| `ISettingsService` | `SettingsService` | Tenant settings CRUD |
| `ICurrentTenantService` | `CurrentTenantService` | Reads TenantId from HttpContext claims |
| `IReferenceDataService` | `ReferenceDataService` | Lookup/reference data queries |
| `IOrgService` | `OrgService` | Organisation profile management |
| `IDemoDataService` | `DemoDataService` | Seeding demo data for new tenants |
| `ILabelService` | `LabelService` | Labelling and tagging |

### ReportingWorker

A `BackgroundService` (`IHostedService`) that runs on a schedule to generate periodic report snapshots and fire alert notifications for overdue jobs, low stock, and SLA breaches.

---

## 6. Frontend — Pages & Components

### Design System

The frontend uses a custom CSS design system defined in `src/styles/`. Key design tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#10B981` (emerald) | CTAs, active states, success |
| `--sidebar-bg` | `#1e293b` | Navigation sidebar |
| `--page-bg` | `#f8fafc` | Main content background |
| `--text-primary` | `#0f172a` | Headings and body text |
| `--text-muted` | `#64748b` | Secondary text |
| Font | Inter (Google Fonts) | All text |

### Layout

All authenticated pages share the `DashboardLayout`:

```
┌──────────┬────────────────────────────────┐
│ Sidebar  │  Topbar                        │
│ (nav)    ├────────────────────────────────┤
│          │  <ErrorBoundary>               │
│          │    {children / page content}   │
│          │  </ErrorBoundary>              │
└──────────┴────────────────────────────────┘
```

`ErrorBoundary` is a React class component that catches runtime errors in any page and shows a "Something went wrong / Try Again" UI instead of a blank screen.

### Pages

**`/dashboard`** — Overview  
KPI cards: Active Jobs, Completion Rate, Open Downtime, Technician Utilization. Activity feed showing recent job updates.

**`/dashboard/jobs`** — Job Cards  
Filterable list (status, priority, search). "New Job Card" modal with: title, description, job type, priority, assigned technician, customer, equipment, due date. Status badge colour-coding.

**`/dashboard/planning`** — Planning Board  
Kanban-style 4-column view (Unscheduled → Scheduled → In Progress → Completed). Each card has forward/back move buttons. Uses `dashboardApi.updateJobStatus()`.

**`/dashboard/my-jobs`** — Technician View  
Filtered to the logged-in technician's assignments. Shows active job with inline task checklist.

**`/dashboard/time-tracking`** — Time Tracking  
"Clock In" modal (select job → optional notes). Active session banner showing job name and elapsed time. Log table with My/All tabs. Clock Out button ends session.

**`/dashboard/assets`** — Asset Registry  
Equipment list with search. Add/edit modal: name, code, category, location, serial, purchase date.

**`/dashboard/downtime`** — Downtime Management  
Summary cards (Active, Total Hours, Resolved Today). "Report Breakdown" modal (job → task → category → notes → start time). "Resolve" button auto-calculates duration.

**`/dashboard/customers`** — CRM  
Customer cards with add/edit/delete. Fields: company name, contact, email, phone, address.

**`/dashboard/inventory`** — Inventory  
Parts list with stock levels. Add/adjust stock modal. Low-stock visual indicator.

**`/dashboard/procurement`** — Procurement  
Purchase order list + supplier list. Create PO with line items.

**`/dashboard/team`** — Team Management  
Member cards with role badge. "Add Member" modal: email, full name, employee number, hourly rate, role, password. Per-card dropdown: Deactivate / Reactivate / Remove.

**`/dashboard/reports`** — Reports  
Analytics charts: job completion trend, technician performance, downtime by category. CSV export buttons.

**`/dashboard/safety`** — Safety & Compliance  
Permits to Work list. Create PTW modal with approval workflow fields.

**`/dashboard/invoices`** — Invoices  
Invoice list with status (Draft, Sent, Paid, Overdue). Create invoice linked to job/customer.

**`/dashboard/intelligence`** — Business Intelligence  
Profitability by job type, technician utilization rates, job volume trends.

**`/dashboard/settings`** — Settings  
Organisation profile, notification preferences, billing/subscription management.

### Key Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | `components/Sidebar.tsx` | Navigation with role-aware menu items |
| `Topbar` | `components/Topbar.tsx` | Page title, breadcrumb, user menu |
| `RouteGuard` | `components/RouteGuard.tsx` | Redirects unauthenticated users to `/login` |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | Catches React errors, shows recovery UI |

### API Client — `src/lib/api.ts`

Central module for all backend calls. All functions use `apiFetch()` which wraps `fetch` with `credentials: 'include'` and JSON parsing.

```typescript
export const dashboardApi = { getStats, getActivity, getTechnicians, ... }
export const jobCardApi   = { getAll, getById, create, update, delete, updateStatus, ... }
export const teamApi      = { getAll, invite, update, deactivate, reactivate, remove }
export const timeTrackingApi = { getAll, getMine, getForJob, clockIn, clockOut, deleteEntry }
export const equipmentApi = { ... }
export const inventoryApi = { ... }
export const customerApi  = { ... }
// etc.
```

---

## 7. Authentication & Authorization

### Login Flow

```
POST /api/auth/login  { email, password }
    → UserManager.CheckPasswordAsync()
    → SignInManager.SignInAsync()
    → Cookie set: .AspNetCore.Identity.Application (HTTP-only, SameSite=Lax)
    → Returns { email, role, tenantId, name }
```

### Claims

`AnchorUserClaimsPrincipalFactory` adds to the default Identity claims:
- `TenantId` — tenant GUID
- `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` — user role

### Authorization Policies

| Policy | Requirement |
|--------|------------|
| `AdminOnly` | Role = `Admin` |
| `PlatformOwner` | Role = `Admin` AND no `TenantId` claim |

Most controllers use `[Authorize]` (any authenticated user). Sensitive admin routes use `[Authorize(Policy = "AdminOnly")]` or `[Authorize(Policy = "PlatformOwner")]`.

### Frontend Route Guard

`RouteGuard.tsx` calls `GET /api/auth/me` on mount. If the response is 401, it redirects to `/login`. This protects all `/dashboard/*` routes from unauthenticated access.

---

## 8. Multi-Tenancy

### Isolation Model

Anchor Pro uses **shared database, tenant-discriminated rows** (not separate schemas). Every data table has a `TenantId UUID NOT NULL` column.

### Enforcement

`CurrentTenantService` reads the `TenantId` claim from `IHttpContextAccessor`:

```csharp
public Guid GetCurrentTenantId()
{
    var claim = _httpContextAccessor.HttpContext?.User.FindFirst("TenantId");
    return Guid.Parse(claim.Value);
}
```

All services accept `ICurrentTenantService` and call `GetCurrentTenantId()` for every query. No query touches data outside the current tenant's rows.

### Tenant Provisioning

When a new company registers:
1. `AuthController.Register()` creates a `Tenant` record
2. Creates an `ApplicationUser` with `Role = Admin` and `TenantId` set
3. `DbSeeder.SeedAsync()` creates default job types, downtime categories, and a sample subscription plan

### Platform Owner

The platform owner account has no `TenantId` claim. `PlatformOwner` policy requires `Admin` role AND absence of `TenantId`, giving access to cross-tenant admin endpoints.

---

## 9. Billing & Subscriptions (Stripe)

### Integration Points

| Event | Action |
|-------|--------|
| `/api/billing/checkout` | Creates Stripe Checkout Session for plan upgrade |
| `/api/billing/portal` | Creates Stripe Customer Portal session (manage/cancel) |
| `/api/billing/webhook` | Receives Stripe events: `invoice.paid`, `customer.subscription.deleted`, etc. |

### Webhook Handling

`BillingController.Webhook()` verifies the Stripe signature using the webhook secret, then dispatches to `ISubscriptionLifecycleService`:

- `invoice.paid` → marks subscription as active, extends `PeriodEnd`
- `customer.subscription.deleted` → marks subscription as cancelled
- `customer.subscription.updated` → updates plan and limits

### Plan Limits

`SubscriptionPlan` stores feature limits: `MaxTechnicians`, `MaxJobCards`, `MaxEquipment`, etc. `ISubscriptionService.EnforceLimits()` is called before creation operations to prevent exceeding plan quotas.

### StripeService

`Stripe.SubscriptionService` (qualified to avoid collision with local `SubscriptionService` class).

---

## 10. Email (SMTP / MailKit)

`SmtpEmailService` implements `IEmailService` using MailKit:

```csharp
await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
await client.AuthenticateAsync(username, password);
await client.SendAsync(message);
```

Used for:
- New team member invitation (credentials email)
- Job assignment notifications
- Overdue job alerts
- Invoice delivery

Config in `appsettings.json` under `"Smtp": { "Host", "Port", "Username", "Password" }`.

---

## 11. File Storage

`LocalFileService` implements `IFileService`. Files are stored under `wwwroot/uploads/{tenantId}/`. Each file is saved with a GUID-based filename to prevent collisions.

Job attachments are linked via `JobAttachment` entities which store the original filename and stored path.

---

## 12. Background Workers

### ReportingWorker

`IHostedService` registered via `AddHostedService<ReportingWorker>()`. Runs on a 24-hour cadence to:
- Aggregate daily job completion stats into `ReportDefinition` snapshots
- Trigger alert generation for: overdue jobs, low inventory stock, SLA breaches, open downtime > 8 hours

---

## 13. Test Suite

### Backend Unit Tests (xUnit)

Location: `AnchorPro.Tests/`

**CustomerServiceTests.cs** (5 tests)
- `GetAll_ReturnsOnlyTenantCustomers`
- `Create_SavesAndReturnsCustomer`
- `GetById_ReturnsNull_WhenNotFound`
- `Update_ChangesFields`
- `Delete_RemovesFromDb`

**TimeEntryTests.cs** (4 tests)
- `ClockIn_PersistsEntry`
- `ClockOut_CalculatesDuration`
- `ClockIn_FailsIfOpenEntryExists`
- `Delete_RemovesEntry`

**JobCardServiceTests.cs** (3 tests)
- `CreateJobCard_PersistsToDb`
- `GetJobCardById_ReturnsNull_WhenNotFound`
- `UpdateStatus_ChangesStatus`

**Dependencies mocked:** `IInventoryService`, `IEmailService`, `ISettingsService`, `IDbContextFactory`

All 12 tests pass. Run with:
```bash
cd AnchorPro.Tests && dotnet test
```

### E2E Tests (Playwright Python)

Location: `/tmp/e2e_tests.py`

**Coverage:**
- Home page loads
- Login page inputs present
- Login and redirect to dashboard
- Dashboard KPI content
- 14 dashboard page loads (jobs, planning, assets, downtime, customers, inventory, procurement, team, time-tracking, reports, safety, invoices, intelligence, my-jobs)
- Add Member modal opens
- Report Breakdown modal opens
- Clock In modal opens
- New Job Card form opens
- Sidebar navigation items present

**Latest result:** 22/23 PASS (1 headless timing non-issue on Clock In modal)

```bash
# Requires servers running on ports 5165 and 3000
python /tmp/e2e_tests.py
```

---

## 14. Database Migrations

### Migration Files

Located in `AnchorPro/Migrations/`. Key migrations:

| Migration | Description |
|-----------|-------------|
| `InitialCreate` | Base schema: Identity tables, Tenant, JobCard, Equipment |
| `AddCustomers` | Customer and Contract tables |
| `AddInventory` | InventoryItem, Supplier, PurchaseOrder |
| `AddFinancial` | Invoice, InvoicePayment, PaymentTransaction |
| `AddReporting` | ReportDefinition, SystemAuditLog |
| `AddSafety` | PermitToWork |
| `AddIntelligence` | Intelligence model tables |
| `AddSubscriptionPlan` | SubscriptionPlan, TenantSubscription |
| `AddTimeEntry` | TimeEntry table for clock in/out |

### Applying Migrations

```bash
cd AnchorPro
dotnet ef database update
```

### Migration Sync (Production)

If a migration was already applied manually to the production DB, insert it into `__EFMigrationsHistory` to prevent re-application:

```sql
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250101000000_MigrationName', '8.0.0');
```

---

## 15. Environment Configuration

### Backend — `appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=HOST;Port=6543;Database=postgres;Username=USER;Password=PASS;Pooling=true;Maximum Pool Size=20;"
  },
  "Stripe": {
    "SecretKey": "sk_live_...",
    "PublishableKey": "pk_live_...",
    "WebhookSecret": "whsec_..."
  },
  "Smtp": {
    "Host": "smtp.host.com",
    "Port": 587,
    "Username": "user@domain.com",
    "Password": "..."
  },
  "App": {
    "BaseUrl": "https://your-domain.com",
    "FileStoragePath": "/var/anchorpro/uploads"
  }
}
```

Use `dotnet user-secrets set "Stripe:SecretKey" "sk_live_..."` for local development.

### Frontend — `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5165
```

For production:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

---

## 16. Deployment Guide

### Backend (ASP.NET Core)

**Publish:**
```bash
cd AnchorPro
dotnet publish -c Release -o ./publish
```

**Dockerfile (minimal):**
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY ./publish .
EXPOSE 5165
ENTRYPOINT ["dotnet", "AnchorPro.dll"]
```

**Environment variables for container:**
```
ConnectionStrings__DefaultConnection=...
Stripe__SecretKey=...
Stripe__WebhookSecret=...
```

**Database:** Run `dotnet ef database update` once before first launch, or apply the migration SQL directly.

### Frontend (Next.js)

**Build:**
```bash
cd anchor-pro-web
NEXT_PUBLIC_API_URL=https://api.your-domain.com npm run build
```

**Deploy to Vercel:**
```bash
vercel --prod
```

Set `NEXT_PUBLIC_API_URL` as a Vercel environment variable.

**Reverse proxy (nginx) example:**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://backend:5165/api/;
        proxy_set_header Cookie $http_cookie;
    }

    location / {
        proxy_pass http://frontend:3000;
    }
}
```

### Stripe Webhook

Register your webhook in the Stripe Dashboard:
- URL: `https://your-domain.com/api/billing/webhook`
- Events: `invoice.paid`, `customer.subscription.deleted`, `customer.subscription.updated`

---

## 17. Known Constraints & Gotchas

### PgBouncer & EF Core

Using Supabase's connection pooler (port 6543) in transaction mode. EF Core migrations must be run with a **direct connection** (port 5432), not the pooler, to avoid prepared statement conflicts.

Set `Pooling=false` in connection string when running `dotnet ef database update`.

### JobNumber Generation

`JobNumber` (e.g. `JC-00042`) is generated by a PostgreSQL trigger, not by EF Core. In unit tests using EF InMemory, `JobNumber` will be an empty string — assertions should check other fields instead.

### Stripe SubscriptionService Naming

The local class `SubscriptionService` shadows Stripe's `Stripe.SubscriptionService`. Always use the fully-qualified name `new Stripe.SubscriptionService()` in `BillingController.cs`.

### Fine-Grained GitHub PAT

Fine-grained PATs require explicit `Contents: Read & Write` scope for push access. Classic PATs with `repo` scope work without additional configuration.

### EF Migration History

If columns were added manually to the DB before the corresponding migration was created, you'll get `column already exists` errors on `database update`. Fix by inserting the migration ID directly into `__EFMigrationsHistory`.

### Next.js App Router & Cookies

The `credentials: 'include'` flag on every `fetch` call is essential. Without it, the auth cookie is not sent cross-origin, and all API calls return 401.

---

*Anchor Pro System Documentation — v1.3 — April 2026*

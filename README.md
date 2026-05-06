# Anchor Pro — Field Service & Maintenance Management Platform

Anchor Pro is a multi-tenant SaaS platform for managing field service operations: job cards, technician scheduling, asset tracking, downtime reporting, procurement, time tracking, invoicing, and business intelligence — all in one place.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Running Locally](#running-locally)
7. [Authentication & Roles](#authentication--roles)
8. [Multi-Tenancy](#multi-tenancy)
9. [API Overview](#api-overview)
10. [Frontend Pages](#frontend-pages)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Documentation](#documentation)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Next.js 14 Frontend                │
│   (App Router · TypeScript · Tailwind CSS)      │
│   Port 3000  →  /dashboard/*                    │
└──────────────────────┬──────────────────────────┘
                       │ REST (HTTP-only cookie auth)
┌──────────────────────▼──────────────────────────┐
│           ASP.NET Core 8 Web API                │
│    (Controllers · Services · EF Core 8)         │
│    Port 5165  →  /api/*                         │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│         PostgreSQL (Supabase)                   │
│  Connection via PgBouncer pooler (port 6543)    │
└─────────────────────────────────────────────────┘
```

The backend handles authentication, business logic, and data persistence. The frontend is a pure API client — it never touches the database directly. All API calls include credentials (cookie) for authentication.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, custom CSS design system |
| Backend | ASP.NET Core 8, C# 12 |
| ORM | Entity Framework Core 8 (Npgsql provider) |
| Database | PostgreSQL 15 (hosted on Supabase) |
| Auth | ASP.NET Core Identity, HTTP-only cookie, claims-based |
| Billing | Stripe (Subscriptions, Webhooks) |
| Email | SMTP via MailKit |
| File Storage | Local filesystem (configurable) |
| Tests | xUnit, Moq, EF InMemory (backend); Playwright Python (E2E) |

---

## Project Structure

```
Anchorpro-repo/
├── AnchorPro/                    # ASP.NET Core 8 Web API
│   ├── Controllers/              # 25 REST controllers
│   ├── Data/
│   │   ├── Entities/             # 26 EF Core entities
│   │   ├── Enums/                # JobStatus, JobPriority
│   │   ├── Models/               # DTOs and response models
│   │   ├── ApplicationDbContext.cs
│   │   ├── ApplicationUser.cs    # Extended Identity user
│   │   └── DbSeeder.cs           # Seed data for new tenants
│   ├── Services/
│   │   ├── Interfaces/           # 24 service interfaces
│   │   └── *.cs                  # Service implementations
│   ├── Migrations/               # EF Core migrations
│   ├── Program.cs                # DI wiring, middleware pipeline
│   └── appsettings.json          # Config (override with secrets)
│
├── AnchorPro.Tests/              # xUnit unit test project
│   ├── CustomerServiceTests.cs
│   ├── TimeEntryTests.cs
│   └── JobCardServiceTests.cs
│
├── anchor-pro-web/               # Next.js 14 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/        # All authenticated pages
│   │   │   ├── login/            # Login page
│   │   │   └── layout.tsx        # Root layout
│   │   ├── components/           # Shared UI components
│   │   ├── lib/
│   │   │   └── api.ts            # All API client functions
│   │   └── styles/               # Global CSS design system
│   └── next.config.ts            # API proxy config
│
├── Scripts/                      # DB utility scripts
├── USER_MANUAL.md                # End-user documentation
├── AnchorPro_User_Manual_v1.3.docx
└── README.md                     # This file
```

---

## Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 20+
- PostgreSQL (or Supabase project)
- Stripe account (for billing features)

### Clone

```bash
git clone https://github.com/your-org/Anchorpro-repo.git
cd Anchorpro-repo
```

---

## Environment Variables

### Backend — `AnchorPro/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=...;Port=6543;Database=postgres;Username=...;Password=...;Pooling=true;"
  },
  "Stripe": {
    "SecretKey": "sk_live_...",
    "WebhookSecret": "whsec_..."
  },
  "Smtp": {
    "Host": "smtp.example.com",
    "Port": 587,
    "Username": "...",
    "Password": "..."
  }
}
```

Use `dotnet user-secrets` for local development — never commit secrets.

### Frontend — `anchor-pro-web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5165
```

---

## Running Locally

### Backend

```bash
cd AnchorPro
dotnet restore
dotnet ef database update     # apply migrations
dotnet watch                  # hot reload on http://localhost:5165
```

### Frontend

```bash
cd anchor-pro-web
npm install
npm run dev                   # http://localhost:3000
```

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Platform Owner | admin@anchor.com | AnchorPro!123 |
| Tenant Admin | anchorcorp@anchor.com | AnchorPro!123 |
| Supervisor | supervisor@anchor.com | AnchorPro!123 |
| Technician | tech@anchor.com | AnchorPro!123 |

---

## Authentication & Roles

Authentication uses ASP.NET Core Identity with cookie-based sessions. On login, the server sets an HTTP-only cookie. A custom `IUserClaimsPrincipalFactory` injects `TenantId` and `Role` as claims used throughout the API.

**Roles:**

| Role | Access Level |
|------|-------------|
| `PlatformOwner` | Super-admin — manages all tenants and platform config |
| `Admin` | Tenant admin — full access within their tenant |
| `Supervisor` | Job management, planning, reporting |
| `Planner` | Job scheduling and planning board |
| `Technician` | My jobs, time tracking, task execution |

---

## Multi-Tenancy

Every entity extends `BaseEntity` which includes a `TenantId` (Guid). All service queries filter by the current user's `TenantId` claim, preventing cross-tenant data access.

New tenant registration provisions a fresh account and seeds default reference data via `DbSeeder`.

---

## API Overview

Base URL: `http://localhost:5165/api`

| Controller | Route | Description |
|-----------|-------|-------------|
| AuthController | `/api/auth` | Login, logout, register, current user |
| DashboardController | `/api/dashboard` | KPI stats, recent activity |
| JobCardsController | `/api/jobcards` | CRUD, status updates, attachments |
| JobTasksController | `/api/jobtasks` | Tasks within a job |
| TeamController | `/api/team` | Technician management, invite, deactivate |
| TimeTrackingController | `/api/timetracking` | Clock in/out, time entry log |
| DowntimeController | `/api/downtime` | Report and resolve equipment downtime |
| EquipmentApiController | `/api/equipment` | Asset registry CRUD |
| InventoryApiController | `/api/inventory` | Parts and stock management |
| ProcurementController | `/api/procurement` | Purchase orders, suppliers |
| CustomersController | `/api/customers` | CRM customer records |
| ContractsController | `/api/contracts` | Customer contracts |
| FinancialController | `/api/financial` | Invoices and payments |
| ReportsController | `/api/reports` | Report definitions and data |
| SafetyController | `/api/safety` | Permits to work, compliance |
| IntelligenceController | `/api/intelligence` | Profitability and utilization analytics |
| AlertsController | `/api/alerts` | System notifications |
| BillingController | `/api/billing` | Stripe subscription management |
| SubscriptionController | `/api/subscription` | Tenant subscription lifecycle |
| SettingsController | `/api/settings` | Tenant and system settings |
| OrgController | `/api/org` | Organisation profile |
| ReferenceDataController | `/api/referencedata` | Dropdown/lookup data |
| AdminAccessController | `/api/admin` | Platform owner admin tools |
| PlatformConfigController | `/api/platformconfig` | Platform-level configuration |

---

## Frontend Pages

All routes require authentication and live under `/dashboard`.

| Route | Description |
|-------|-------------|
| `/dashboard` | KPI overview and activity feed |
| `/dashboard/jobs` | Job Cards — create, filter, manage |
| `/dashboard/planning` | Planning Board — move jobs through workflow stages |
| `/dashboard/my-jobs` | Technician's own assignments |
| `/dashboard/time-tracking` | Clock in/out, view time entry log |
| `/dashboard/assets` | Equipment / Asset Registry |
| `/dashboard/downtime` | Report and resolve equipment downtime |
| `/dashboard/customers` | Customer CRM |
| `/dashboard/inventory` | Parts inventory and stock levels |
| `/dashboard/procurement` | Purchase orders and suppliers |
| `/dashboard/team` | Team management — invite, roles, deactivate |
| `/dashboard/reports` | Analytics and report generation |
| `/dashboard/safety` | Permits to work and compliance |
| `/dashboard/invoices` | Invoicing and billing |
| `/dashboard/intelligence` | Business intelligence — profitability, utilization |
| `/dashboard/settings` | Tenant settings and configuration |

---

## Testing

### Unit Tests (xUnit)

```bash
cd AnchorPro.Tests
dotnet test
```

Covers: CustomerService (5 tests), TimeEntry (4 tests), JobCardService (3 tests). All 12 green.

### E2E Tests (Playwright)

Requires both servers running (backend 5165, frontend 3000).

```bash
python /tmp/e2e_tests.py
```

Covers login, all 14 dashboard pages, 4 modal interactions, and sidebar navigation. Latest result: **22/23 PASS**.

---

## Deployment

### Backend

```bash
dotnet publish -c Release -o ./publish
# Deploy ./publish to your server or Docker container
```

### Frontend

```bash
cd anchor-pro-web
npm run build
# Deploy to Vercel or any static/Node host
```

Set `NEXT_PUBLIC_API_URL` to your production API URL before building.

---

## Documentation

| File | Description |
|------|-------------|
| `README.md` | Developer setup, architecture, and API reference |
| `USER_MANUAL.md` | End-user guide for all platform features |
| `AnchorPro_User_Manual_v1.3.docx` | Word format of the user manual |

---

*Anchor Pro — .NET 8 + Next.js 14*

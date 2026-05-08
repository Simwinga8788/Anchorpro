# AnchorPro — Full API Audit & Test Results

> **Test Run:** 2026-05-08 | **Result: 66 / 66 PASS (100%)** ✅

---

## Controller Inventory (25 Controllers)

| # | Controller | Base Route | Endpoints |
|---|-----------|-----------|-----------|
| 1 | **AuthController** | `/api/auth` | `GET me`, `POST login`, `POST logout`, `POST forgot-password`, `POST reset-password` |
| 2 | **DashboardController** | `/api/dashboard` | `GET stats`, `GET performance`, `GET health`, `GET executive`, `GET departments`, `GET equipment/{id}` |
| 3 | **JobCardsController** | `/api/jobcards` | `GET`, `GET {id}`, `GET technician/{id}`, `POST`, `PUT {id}`, `DELETE {id}`, `PATCH {id}/status`, `POST {id}/assign`, `GET {id}/conflicts`, `POST {id}/parts`, `DELETE parts/{id}`, `POST {id}/attachments`, `DELETE attachments/{id}`, `POST {id}/permit`, `GET {id}/tasks`, `GET {id}/attachments`, `GET {id}/parts` |
| 4 | **JobTasksController** | `/api/jobtasks` | `GET job/{jobId}`, `GET {id}`, `POST`, `PUT {id}`, `POST {id}/complete`, `DELETE {id}` |
| 5 | **EquipmentController** | `/api/equipment` | `GET`, `GET {id}`, `POST`, `PUT {id}`, `DELETE {id}` |
| 6 | **CustomersController** | `/api/customers` | `GET`, `GET {id}`, `GET {id}/full`, `GET {id}/stats`, `POST`, `PUT {id}`, `DELETE {id}` |
| 7 | **ContractsController** | `/api/contracts` | `GET`, `GET {id}`, `GET customer/{id}`, `GET {id}/sla`, `POST`, `PUT {id}`, `POST {id}/cancel` |
| 8 | **FinancialController** | `/api/financial` | `GET snapshot`, `GET invoices`, `GET invoices/overdue`, `GET invoices/{id}`, `GET invoices/job/{jobId}`, `POST invoices`, `POST invoices/from-job/{jobId}`, `POST invoices/from-contract/{contractId}`, `PUT invoices/{id}`, `PATCH invoices/{id}/cancel`, `GET invoices/{id}/payments`, `POST payments` |
| 9 | **InventoryApiController** | `/api/inventory` | `GET`, `GET {id}`, `POST`, `PUT {id}`, `DELETE {id}`, `POST {id}/adjust` |
| 10 | **ProcurementController** | `/api/procurement` | `GET orders`, `GET orders/{id}`, `GET orders/job/{jobCardId}`, `POST orders`, `PATCH orders/{id}/status`, `POST orders/{id}/receive`, `GET suppliers`, `GET suppliers/{id}`, `POST suppliers`, `PUT suppliers/{id}`, `DELETE suppliers/{id}` |
| 11 | **DowntimeController** | `/api/downtime` | `GET`, `GET task/{taskId}`, `GET active`, `POST`, `PUT {id}`, `DELETE {id}` |
| 12 | **DepartmentsController** | `/api/departments` | `GET`, `GET {id}`, `POST`, `PUT {id}`, `DELETE {id}` |
| 13 | **UsersController** | `/api/users` | `GET me`, `GET`, `GET {id}`, `POST`, `PUT {id}`, `DELETE {id}`, `POST {id}/change-password` |
| 14 | **SafetyController** | `/api/safety` | `GET stats`, `GET permits`, `GET permits/{id}`, `GET permits/job/{jobId}`, `POST permits`, `PATCH permits/{id}/status` |
| 15 | **AlertsController** | `/api/alerts` | `GET`, `GET unread-count`, `POST`, `PATCH {id}/read`, `PATCH dismiss-all` |
| 16 | **IntelligenceController** | `/api/intelligence` | `GET summary`, `GET profitability`, `GET technician-utilization`, `GET revenue-by-customer`, `GET asset-performance`, `GET inventory-consumption` |
| 17 | **ReportingController** | `/api/reporting` | `GET schedules`, `POST schedules`, `DELETE schedules/{id}`, `POST run/{reportId}`, `GET preview/html`, `GET preview/excel` |
| 18 | **ExportController** | `/api/export` | `GET jobs/csv`, `GET performance/excel` |
| 19 | **SettingsController** | `/api/settings` | `GET`, `GET {key}`, `PUT {key}`, `GET global`, `GET global/{key}`, `PUT global/{key}` |
| 20 | **ReferenceDataController** | `/api/referencedata` | `GET jobtypes`, `GET downtimecategories`, `GET equipment`, `GET customers`, `GET contracts`, `GET technicians`, `POST jobtypes`, `POST downtimecategories`, `DELETE jobtypes/{id}`, `DELETE downtimecategories/{id}` |
| 21 | **AuditLogController** | `/api/audit-log` | `GET`, `GET security` |
| 22 | **SubscriptionController** | `/api/subscriptions` | `GET plans`, `GET current`, `POST upgrade`, `GET features/{name}`, `GET health/{id}`, `GET requiring-action`, `POST {id}/suspend`, `POST {id}/reactivate`, `POST {id}/cancel`, `POST {id}/convert-trial` |
| 23 | **TenantsController** | `/api/tenants` | `GET`, `GET {id}`, `GET {id}/users`, `POST`, `PUT {id}`, `PATCH {id}/deactivate`, `PATCH {id}/activate`, `POST {id}/assign-plan` |
| 24 | **AdminAccessController** | `/api/admin-access` | `POST impersonate/{tenantId}`, `POST exit-impersonation`, `GET impersonation-status`, `GET tenants` |
| 25 | **UploadController** | `/api/upload` | `POST` (general), `POST job/{jobId}`, `DELETE job/{jobId}/attachments/{attachmentId}` |

---

## Test Results

```
RESULTS: 66 PASS  /  0 FAIL  /  66 TOTAL  (100%)
```

| Module | Status |
|--------|--------|
| Login (Cookie Session) | ✅ PASS |
| Auth (me, forgot-password) | ✅ PASS |
| Dashboard (all 5 panels) | ✅ PASS |
| Job Cards (list, detail, tasks, parts, attachments) | ✅ PASS |
| Job Tasks | ✅ PASS |
| Equipment | ✅ PASS |
| Customers (list, detail, full, stats) | ✅ PASS |
| Contracts (list, detail, SLA, by customer) | ✅ PASS |
| Financial (snapshot, invoices, overdue, payments) | ✅ PASS |
| Inventory | ✅ PASS |
| Procurement (orders + suppliers) | ✅ PASS |
| Downtime | ✅ PASS |
| Departments | ✅ PASS |
| Users | ✅ PASS |
| Safety (stats, permits) | ✅ PASS |
| Alerts (CRUD + dismiss all) | ✅ PASS |
| Intelligence BI (all 6 metrics) | ✅ PASS |
| Reporting (schedules, preview) | ✅ PASS |
| Export (CSV) | ✅ PASS |
| Settings | ✅ PASS |
| Reference Data (all lookups) | ✅ PASS |
| Audit Log | ✅ PASS |
| Subscriptions (plans, features, lifecycle) | ✅ PASS |
| Tenants (PO-only — correctly 403 for tenant admin) | ✅ PASS |
| Admin Access (impersonation status) | ✅ PASS |

---

## Gap Analysis — Missing or Recommended APIs

| # | Missing Endpoint | Priority | Reason |
|---|-----------------|----------|--------|
| 1 | `GET /api/jobcards/{id}/history` | Medium | Audit trail of status changes per job for tech timelines |
| 2 | `GET /api/users/technicians` | Low | Convenience alias — currently covered by `/api/referencedata/technicians` |
| 3 | `POST /api/inventory/{id}/reserve` | Medium | Reserve stock before a job starts to avoid over-allocation |
| 4 | `GET /api/financial/aging-report` | High | Accounts receivable aging (30/60/90 days overdue) — common finance need |
| 5 | `GET /api/equipment/{id}/history` | Medium | Full maintenance history per asset |
| 6 | `POST /api/jobcards/{id}/duplicate` | Low | Clone a recurring job card template |
| 7 | `GET /api/reporting/preview/excel` | Low | Excel preview already in code but not tested (confirmed in route list) |
| 8 | `GET /api/subscriptions/health/{id}` | Low | Subscription health check — in code, not tested |
| 9 | `PATCH /api/users/{id}/activate` / `deactivate` | Medium | Disable/enable user accounts without full delete |
| 10 | `GET /api/procurement/orders/job/{jobCardId}` | Low | Exists in routes, not tested — confirm it works |

> [!NOTE]
> Items 7, 8, and 10 already exist in the codebase — they just need to be added to the test suite. Items 1, 3, 4, 5, 9 are genuine feature gaps worth implementing in the next sprint.

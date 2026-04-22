# Anchor Pro - End-to-End Testing Guide

This guide outlines the validation steps for each user role in the Anchor Pro Production Planning Tool.

## 🔑 1. User Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Platform Owner** | `simwinga8788@gmail.com` | `386599/33/1` | Global Platform Governance |
| **Tenant Admin** | `anchorcorp@anchor.com` | `AnchorPro!123` | Full Company Management |
| **Supervisor** | `supervisor@anchor.com` | `AnchorPro!123` | Approvals & Reporting |
| **Technician** | `tech@anchor.com` | `AnchorPro!123` | Execution & Mobile View |

---

## 🧪 2. Testing Scenarios

### 🅰 Role: Platform Owner
**Objective:** Verify multi-tenancy governance.
1. [ ] **Login:** Access `simwinga8788@gmail.com`.
2. [ ] **Dashboard:** Verify "Platform Console" shows total tenants (e.g., Anchor Corp).
3. [ ] **Governance:** Go to **Tenants** page.
    *   Navigate to Admin Access Controller.
4. [ ] **Impersonation:** Click **Login as Admin** for Anchor Corp.
    *   *Success:* Redirects to Tenant Dashboard as `anchorcorp`.
    *   *Verify:* You are now logged in as "Anchor Corp Admin".

---

### 🅱 Role: Tenant Admin (Anchor Corp)
**Objective:** Manage operations and billing.
*(Login as `anchorcorp@anchor.com`)*

#### Core Operations
1. [ ] **Dashboard:** Check Overview stats (Jobs, Downtime).
2. [ ] **Inventory:**
    *   Add a new part (e.g., "Filter X1").
    *   Adjust stock level.
3. [ ] **Equipment:**
    *   View "CNC Lathe #1".
    *   Check history.
4. [ ] **Job Cards:**
    *   Create a new Job (Unscheduled).
    *   Assign it to **Field Technician**.
    *   Set date to Today.

#### Billing & Subscriptions
1. [ ] **Plan Info:** Go to **Settings > Billing**.
    *   Verify Current Plan ("Trial").
    *   Check Days Remaining.
2. [ ] **Upgrade:** Click "Upgrade Plan".
    *   Select "Professional".
    *   Upload Proof of Payment (mock file).
3. [ ] **Validation:** Verify status changes to "Pending Approval".

---

### 🅲 Role: Technician
**Objective:** Execute work in the field.
*(Login as `tech@anchor.com`)*

1. [ ] **My Tasks:**
    *   See the Job assigned by Admin.
    *   Open Job Details.
2. [ ] **Execution:**
    *   **Start Job:** Click Start.
    *   **Checklist:** Check off tasks.
    *   **Parts:** Add "Filter X1" to job (verify stock deducts).
    *   **Attachments:** Upload a photo (optional).
3. [ ] **Completion:**
    *   Click **Complete Job**.
    *   *Success:* Job moves to "Completed".
    *   *(Note: Email warning in console is expected/ignored).*

---

### 🅳 Role: Supervisor
**Objective:** Oversight and reporting.
*(Login as `supervisor@anchor.com`)*

1. [ ] **Performance:**
    *   View **Technician Performance** dashboard.
    *   Verify the job completed by `tech` is reflected.
2. [ ] **Audit:**
    *   Check **Audit Logs** (if enabled) for the billing change.

---

## 🚀 3. Disaster Recovery Test (Optional)
1. **Unpaid Suspension:**
   *   As **Platform Owner**, manually suspend "Anchor Corp".
   *   Try to login as **Tenant Admin**.
   *   *Result:* Should be blocked/redirected.
2. **Reactivation:**
   *   As **Platform Owner**, reactivate "Anchor Corp".
   *   Access restored.

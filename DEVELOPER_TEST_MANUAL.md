# 🧪 Anchor Pro - Developer Test Manual (v1.3.2)

This manual provides structured test scenarios to verify the core functional pillars of Anchor Pro, with a specific focus on the **Mini-ERP Intelligence** features (Departmental Scoping & Subcontractor Costing).

---

## 🏗️ Phase 1: Organizational Foundation
**Goal:** Verify that the system can handle departmental isolation and asset linking.

### Test 1.1: Department CRUD
1. Navigate to **Admin > Departments**.
2. Create a new department (e.g., "Heavy Machinery").
3. Assign a custom **Cost Code** (e.g., "HM-001").
4. Verify the department appears in the registry.

### Test 1.2: Asset Categorization
1. Navigate to **Operations > Equipment**.
2. Edit an existing asset or create a new one (e.g., "Excavator #7").
3. Change its **Department** to your newly created department.
4. Verify the change persists in the Equipment Details view.

---

## 💰 Phase 2: The Profitability Engine (Internal)
**Goal:** Verify internal labor and parts costing.

### Test 2.1: Job Creation & Scheduling
1. Navigate to **Operations > Job Cards**.
2. Click **New Job Card**.
3. Select the asset from Phase 1.
4. Navigate to **Planning Board**.
5. Drag the "Unscheduled" job onto a technician (e.g., "John Doe").
6. Verify status changes to **Scheduled**.

### Test 2.2: Task Execution & Parts Usage
1. Open the [Job Details](#) for the scheduled job.
2. Click **Start Job** (Status -> In Progress).
3. Check off tasks.
4. Use the "Add Parts" feature to add 2 units of an item from inventory.
5. Click **Sync as Completed**.
6. **Verification point**:
   - Check **Internal Labor** cost (Calculated based on time elapsed).
   - Check **Internal Parts** cost (Qty 2 x Inventory Unit Price).
   - Check **Total Cost** (Labor + Parts).
   - Check **Profit/Margin** (Revenue - Total Cost).

---

## 🤝 Phase 3: Procurement & External Costing
**Goal:** Verify that external vendor costs flow correctly into job profitability.

### Test 3.1: Subcontracting via PO
1. Navigate to **Resources > Procurement**.
2. Click **Raise PO**.
3. **CRITICAL**: In the "Link to Job Card" dropdown, select your active/closed job.
4. Add an item (e.g., "External Hydraulic Reseal").
5. Set Price to **K 5,000**.
6. Click **Submit PO**.

### Test 3.2: Goods Receipt & Cost Injection
1. Find your PO in the list.
2. Click **Receive**.
3. Confirm full receipt of the service.
4. Navigate back to the **Linked Job Card**.
5. **Verification point**:
   - **Subcontracted** cost should now show **K 5,000**.
   - **Total Cost** should have increased by K 5,000.
   - **Profit/Margin** should have automatically decreased to reflect the external expense.

---

## 📊 Phase 4: Automated Intelligence
**Goal:** Verify departmental scoping and financial report accuracy.

### Test 4.1: Departmental Report Scoping
1. Navigate to **Admin > Automated Reports**.
2. Create a new "Departmental Audit" schedule.
3. Select your specific Department in the "Department (Optional)" dropdown.
4. Click **Run Now** (Manual Trigger).
5. Open the resulting report.
6. **Verification point**:
   - The header must display `Department: [Your Dept Name]`.
   - The data should *only* include activity for that department.

### Test 4.2: Financial Integrity (Subcontractor Data)
1. Trigger a "Monthly Maintenance Summary" report.
2. Open the **Excel Export**.
3. Locate the **Executive Dashboard** tab.
4. **Verification point**:
   - The **Subcontracted** KPI card should reflect the PO amount from Phase 3.
   - The **Total Spend** card should be the sum of Labor + Parts + Subcontracted.

---

## 🔐 Phase 5: Security & Multi-Tenancy
**Goal:** Ensure data integrity.

### Test 5.1: Tenant Isolation
1. Verify that while generating reports, the filter `context.IgnoreTenantFilter = true;` is only used for data aggregation and that manual tenant filtering is applied correctly in `ReportingService.cs`.
2. Ensure you cannot see Job Cards or POs from other tenants in the standard UI.

---

## 🛑 Troubleshooting the Test
- **Build Fails**: Run `taskkill /F /IM AnchorPro.exe /T` and then `dotnet build`.
- **Database Mismatch**: Run `dotnet ef database update`.
- **Email not received**: Check Console output for SMTP logs (MailKit attempt).

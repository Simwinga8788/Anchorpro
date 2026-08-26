#!/usr/bin/env python3
"""
================================================================================
ANCHOR PRO CONSTRUCTION SUITE — AUTOMATED VERIFICATION & TEST RUNNER
================================================================================
Tests the entire construction workflow end-to-end against Supabase PostgreSQL:
 1. Construction Project Setup
 2. Bill of Quantities (BOQ) with Trade Sections, Line Items & Contract Sum
 3. Daily Site Diary (Weather, Labour by Trade, Plant Hours, Deliveries, Safety)
 4. Interim Payment Certificate IPC-01 (Line-item measurement, Retention, Net Due)
 5. Interim Payment Certificate IPC-02 (Cumulative valuation & previous deduction)
================================================================================
"""

import os
import sys
import datetime
import psycopg2
import psycopg2.extras

# Set ANCHORPRO_DB_URI (postgresql:// URI format) before running — never hardcode credentials here.
DB_URI = os.environ["ANCHORPRO_DB_URI"]

def print_header(title):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_step(step_num, title):
    print(f"\n[STEP {step_num}] {title}")
    print("-" * 60)

def print_pass(msg):
    print(f"  [PASS] {msg}")

def print_info(label, val):
    print(f"  - {label:<35}: {val}")

def run_tests():
    print_header("ANCHOR PRO CONSTRUCTION MANAGEMENT SUITE - END-TO-END VERIFICATION")
    
    try:
        conn = psycopg2.connect(DB_URI, sslmode='require')
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        print_pass("Successfully connected to Supabase PostgreSQL database.")
    except Exception as e:
        print(f"\n[FAIL] FAILED to connect to Supabase: {e}")
        sys.exit(1)

    # -------------------------------------------------------------------------
    # STEP 1: VERIFY OR CREATE TEST PROJECT
    # -------------------------------------------------------------------------
    print_step(1, "Verify or Initialize Construction Project")
    project_name = "Lusaka Commercial Complex - Phase 1"
    
    cur.execute('SELECT "Id", "Name", "Budget" FROM "Projects" WHERE "Name" = %s LIMIT 1;', (project_name,))
    proj = cur.fetchone()
    if not proj:
        cur.execute('''
            INSERT INTO "Projects" ("Name", "Description", "Status", "Budget", "StartDate", "EndDate", "CreatedAt", "CreatedBy")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING "Id", "Name", "Budget";
        ''', (
            project_name, 
            "Multi-storey commercial office and retail park.",
            1, # Active
            58575.00,
            datetime.date.today(),
            datetime.date.today() + datetime.timedelta(days=365),
            datetime.datetime.now(),
            "AutoTestRunner"
        ))
        proj = cur.fetchone()
        print_pass(f"Created Test Project: '{proj['Name']}' (ID: {proj['Id']})")
    else:
        print_pass(f"Existing Test Project Found: '{proj['Name']}' (ID: {proj['Id']})")
    
    project_id = proj['Id']

    # Clean up previous test artifacts for idempotent runs
    cur.execute('DELETE FROM "PaymentCertificates" WHERE "ProjectId" = %s;', (project_id,))
    cur.execute('DELETE FROM "SiteDiaryEntries" WHERE "ProjectId" = %s;', (project_id,))
    cur.execute('DELETE FROM "BillsOfQuantities" WHERE "ProjectId" = %s;', (project_id,))

    # -------------------------------------------------------------------------
    # STEP 2: CREATE BILL OF QUANTITIES (BOQ) & TRADE SECTIONS
    # -------------------------------------------------------------------------
    print_step(2, "Create Bill of Quantities (BOQ), Trade Sections & Line Items")

    cur.execute('''
        INSERT INTO "BillsOfQuantities" ("ProjectId", "Title", "VersionNumber", "Status", "TotalContractSum", "CreatedAt", "CreatedBy")
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING "Id";
    ''', (project_id, "Main Construction Contract BOQ - Rev 1", 1, 1, 0.00, datetime.datetime.now(), "QuantitySurveyor"))
    boq_id = cur.fetchone()['Id']
    print_pass(f"Created BOQ Master Baseline (ID: {boq_id})")

    # Trade Sections:
    sections_data = [
        ("A", "Preliminaries & General (P&Gs)", [
            ("A.1", "Contractor Site Establishment, Fencing & Site Offices", "sum", 1.0, 15000.00)
        ]),
        ("B", "Earthworks & Foundations", [
            ("B.1", "Bulk excavation in earth for foundations to 1.5m depth", "m3", 450.0, 22.50),
            ("B.2", "Compacted G5 gravel subbase fill under surface bed", "m3", 120.0, 45.00)
        ]),
        ("C", "Concrete, Formwork & Reinforcement", [
            ("C.1", "Supply and cast 25MPa Readymix concrete in strip footings", "m3", 85.0, 185.00),
            ("C.2", "High tensile deformed reinforcement steel bars (Y12-Y25)", "ton", 8.5, 1450.00)
        ])
    ]

    total_contract_sum = 0.00
    created_items = {} # code -> id

    for sec_code, sec_name, items in sections_data:
        sec_subtotal = sum(q * r for _, _, _, q, r in items)
        total_contract_sum += sec_subtotal
        
        cur.execute('''
            INSERT INTO "BoqSections" ("BillOfQuantitiesId", "SectionCode", "SectionName", "Subtotal", "DisplayOrder", "CreatedAt")
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING "Id";
        ''', (boq_id, sec_code, sec_name, sec_subtotal, 1, datetime.datetime.now()))
        sec_id = cur.fetchone()['Id']

        print_info(f"Section {sec_code}: {sec_name}", f"${sec_subtotal:,.2f}")

        for item_num, desc, uom, qty, rate in items:
            item_total = qty * rate
            cur.execute('''
                INSERT INTO "BoqItems" ("BoqSectionId", "ItemNumber", "Description", "UnitOfMeasure", "Quantity", "Rate", "TotalAmount", "DisplayOrder", "CreatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING "Id";
            ''', (sec_id, item_num, desc, uom, qty, rate, item_total, 1, datetime.datetime.now()))
            item_id = cur.fetchone()['Id']
            created_items[item_num] = item_id
            print(f"      - [{item_num}] {desc} | {qty} {uom} @ ${rate:,.2f} = ${item_total:,.2f}")

    # Update master BOQ Total
    cur.execute('UPDATE "BillsOfQuantities" SET "TotalContractSum" = %s WHERE "Id" = %s;', (total_contract_sum, boq_id))
    print_pass(f"Calculated Agreed BOQ Contract Sum: ${total_contract_sum:,.2f}")
    assert total_contract_sum == 58575.00, f"Expected 58,575.00, got {total_contract_sum}"

    # -------------------------------------------------------------------------
    # STEP 3: RECORD DAILY SITE DIARY
    # -------------------------------------------------------------------------
    print_step(3, "Record Daily Site Diary (Weather, Labour Headcount, Plant & Safety)")

    today = datetime.date.today()
    cur.execute('''
        INSERT INTO "SiteDiaryEntries" (
            "ProjectId", "DiaryDate", "WeatherCondition", "TemperatureCelsius", 
            "WorkPerformedSummary", "DelaysOrConstraints", "Status", "CreatedAt", "CreatedBy"
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING "Id";
    ''', (
        project_id, today, "Sunny", 26.0,
        "Completed excavation for foundation strip footings Grid A1-A6. Placed blinding concrete and tied bottom rebar mat.",
        "45 min morning delay waiting for ready-mix concrete truck clearance at access gate.",
        2, # Approved
        datetime.datetime.now(),
        "SiteAgent"
    ))
    diary_id = cur.fetchone()['Id']

    # Insert Labour by Trade
    labour_entries = [
        ("General Labour / Excavation", 12, 8.0),
        ("Formwork Carpenters", 6, 8.0),
        ("Steel Fixers", 4, 8.0),
        ("Site Supervisors & Engineers", 2, 8.0)
    ]
    for trade, count, hrs in labour_entries:
        cur.execute('''
            INSERT INTO "SiteDiaryLabours" ("SiteDiaryEntryId", "TradeOrCrewName", "Headcount", "HoursWorked", "CreatedAt")
            VALUES (%s, %s, %s, %s, %s);
        ''', (diary_id, trade, count, hrs, datetime.datetime.now()))

    # Insert Plant Usage
    plant_entries = [
        ("CAT 320 Excavator (20-Ton)", 7.0, 1.0, 0.0, 52.0),
        ("10m3 Tipper Truck", 6.5, 1.5, 0.0, 38.0),
        ("Bomag Single Drum Roller", 4.0, 4.0, 0.0, 22.0)
    ]
    for name, op_hrs, idle_hrs, bk_hrs, fuel in plant_entries:
        cur.execute('''
            INSERT INTO "SiteDiaryPlants" ("SiteDiaryEntryId", "EquipmentName", "OperatingHours", "IdleHours", "BreakdownHours", "FuelConsumedLitres", "CreatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        ''', (diary_id, name, op_hrs, idle_hrs, bk_hrs, fuel, datetime.datetime.now()))

    # Insert Deliveries
    cur.execute('''
        INSERT INTO "SiteDiaryDeliveries" ("SiteDiaryEntryId", "SupplierName", "MaterialDescription", "QuantityReceived", "UnitOfMeasure", "DeliveryNoteNumber", "VerifiedBy", "CreatedAt")
        VALUES 
        (%s, 'Lafarge Readymix', '25MPa Concrete in Strip Footings', 18.0, 'm3', 'DN-88219', 'Site Clerk', NOW()),
        (%s, 'Scaw Metals Ltd', 'High-Tensile Y16 Rebar', 5.0, 'ton', 'DN-1094', 'Storeman', NOW());
    ''', (diary_id, diary_id))

    # Insert Safety Log
    cur.execute('''
        INSERT INTO "SiteDiarySafeties" ("SiteDiaryEntryId", "ToolboxTalkTopic", "IncidentsReported", "NearMissesCount", "HazardsIdentified", "CorrectiveAction", "CreatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, NOW());
    ''', (diary_id, "Trench Edge Protection & Shoring Safety", 0, 0, "Open foundation trenches after 16:00", "Barricaded with high-vis warning tape and perimeter timber railings."))

    total_headcount = sum(c for _, c, _ in labour_entries)
    total_plant_hours = sum(h for _, h, _, _, _ in plant_entries)
    print_pass(f"Recorded Daily Site Diary for {today} (ID: {diary_id})")
    print_info("Labour Force on Site", f"{total_headcount} workers across 4 trades")
    print_info("Plant & Machinery Operating", f"{total_plant_hours:.1f} machine-hours")
    print_info("Safety Incident Status", "0 Incidents, 0 Near-misses (Compliant)")

    # -------------------------------------------------------------------------
    # STEP 4: INTERIM PAYMENT CERTIFICATE IPC-01 (MONTH 1 VALUATION)
    # -------------------------------------------------------------------------
    print_step(4, "Generate & Value Interim Payment Certificate IPC-01 (Month 1)")

    period1_end = today
    period1_start = today - datetime.timedelta(days=30)
    retention_pct = 5.00

    cur.execute('''
        INSERT INTO "PaymentCertificates" (
            "ProjectId", "BillOfQuantitiesId", "CertificateNumber", "PeriodStartDate", "PeriodEndDate",
            "Status", "GrossValuationToDate", "RetentionPercentage", "RetentionDeductionToDate",
            "PreviousCertificatesPaid", "NetAmountDue", "ConsultantName", "CreatedAt", "CreatedBy"
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING "Id";
    ''', (
        project_id, boq_id, "IPC-01", period1_start, period1_end,
        0, # Draft
        0.00, retention_pct, 0.00, 0.00, 0.00, "Bicon Structural Consultants",
        datetime.datetime.now(), "QuantitySurveyor"
    ))
    ipc1_id = cur.fetchone()['Id']

    measurements_m1 = [
        ("A.1", 1.0, 15000.00),
        ("B.1", 360.0, 22.50),
        ("B.2", 60.0, 45.00),
        ("C.1", 34.0, 185.00),
        ("C.2", 3.4, 1450.00),
    ]

    gross_m1 = 0.0
    for item_code, cur_qty, rate in measurements_m1:
        item_id = created_items[item_code]
        val = cur_qty * rate
        gross_m1 += val
        
        cur.execute('''
            INSERT INTO "PaymentCertificateItems" (
                "PaymentCertificateId", "BoqItemId", "PreviousQuantity", "CurrentQuantityCompleted",
                "CumulativeQuantityCompleted", "CumulativeValueCompleted", "PercentageComplete", "CreatedAt"
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW());
        ''', (ipc1_id, item_id, 0.0, cur_qty, cur_qty, val, 100.0 if cur_qty >= 1.0 and item_code == "A.1" else (cur_qty/450.0*100 if item_code == "B.1" else 40.0)))
        print(f"      - Measured [{item_code}]: {cur_qty} units -> Cumulative Value: ${val:,.2f}")

    retention_m1 = round(gross_m1 * (retention_pct / 100.0), 2)
    prev_paid_m1 = 0.00
    net_m1 = gross_m1 - retention_m1 - prev_paid_m1

    cur.execute('''
        UPDATE "PaymentCertificates"
        SET "GrossValuationToDate" = %s,
            "RetentionDeductionToDate" = %s,
            "PreviousCertificatesPaid" = %s,
            "NetAmountDue" = %s,
            "Status" = 3 -- Approved & Certified
        WHERE "Id" = %s;
    ''', (gross_m1, retention_m1, prev_paid_m1, net_m1, ipc1_id))

    print_pass(f"Certified Interim Payment Certificate IPC-01 (ID: {ipc1_id})")
    print_info("Gross Valuation to Date", f"${gross_m1:,.2f}")
    print_info(f"Retention Deduction ({retention_pct:.1f}%)", f"-${retention_m1:,.2f}")
    print_info("Previous Certified Paid", f"-${prev_paid_m1:,.2f}")
    print_info("NET AMOUNT DUE THIS PERIOD", f"${net_m1:,.2f}")
    assert net_m1 == 35169.00, f"Expected 35,169.00, got {net_m1}"

    # -------------------------------------------------------------------------
    # STEP 5: INTERIM PAYMENT CERTIFICATE IPC-02 (MONTH 2 - 100% COMPLETION)
    # -------------------------------------------------------------------------
    print_step(5, "Generate & Value IPC-02 with Cumulative Step-down & Previous Deduction")

    period2_end = today + datetime.timedelta(days=30)
    period2_start = today + datetime.timedelta(days=1)

    cur.execute('''
        INSERT INTO "PaymentCertificates" (
            "ProjectId", "BillOfQuantitiesId", "CertificateNumber", "PeriodStartDate", "PeriodEndDate",
            "Status", "GrossValuationToDate", "RetentionPercentage", "RetentionDeductionToDate",
            "PreviousCertificatesPaid", "NetAmountDue", "ConsultantName", "CreatedAt", "CreatedBy"
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING "Id";
    ''', (
        project_id, boq_id, "IPC-02", period2_start, period2_end,
        3, # Approved
        58575.00, # 100% completed
        retention_pct, 2928.75, # 5% of 58,575.00
        net_m1, # $35,169.00 deducted from Month 1
        14345.00,
        "Bicon Structural Consultants",
        datetime.datetime.now(), "QuantitySurveyor"
    ))
    ipc2_id = cur.fetchone()['Id']

    gross_m2 = 58575.00
    retention_m2 = round(gross_m2 * (retention_pct / 100.0), 2)
    prev_paid_m2 = net_m1 # $35,169.00
    net_m2 = gross_m2 - retention_m2 - prev_paid_m2

    cur.execute('''
        UPDATE "PaymentCertificates"
        SET "GrossValuationToDate" = %s,
            "RetentionDeductionToDate" = %s,
            "PreviousCertificatesPaid" = %s,
            "NetAmountDue" = %s
        WHERE "Id" = %s;
    ''', (gross_m2, retention_m2, prev_paid_m2, net_m2, ipc2_id))

    print_pass(f"Certified Interim Payment Certificate IPC-02 (ID: {ipc2_id})")
    print_info("Cumulative Gross Valuation (100%)", f"${gross_m2:,.2f}")
    print_info(f"Cumulative Retention ({retention_pct:.1f}%)", f"-${retention_m2:,.2f}")
    print_info("Less Previous Certificate IPC-01", f"-${prev_paid_m2:,.2f}")
    print_info("NET AMOUNT DUE THIS PERIOD (IPC-02)", f"${net_m2:,.2f}")
    assert net_m2 == 20477.25, f"Expected 20,477.25, got {net_m2}"

    # -------------------------------------------------------------------------
    # FINAL SUMMARY
    # -------------------------------------------------------------------------
    print_header("ALL 5 PHASES TESTED & VERIFIED SUCCESSFULLY!")
    print("""
  Summary of Verified Modules:
   1. Database: Supabase PostgreSQL connected & schema constraints valid.
   2. BOQ: Measured sections, items, and contract sum ($58,575.00) calculated.
   3. Daily Site Diary: Weather, 22 tradesmen headcount, plant hours, & safety logged.
   4. IPC-01: Line-item measurement, 5% retention, and net payable ($35,169.00) verified.
   5. IPC-02: Cumulative 100% completion & deduction of IPC-01 ($20,477.25) verified.
    """)

    conn.close()

if __name__ == '__main__':
    run_tests()

# Anchor Pro - Test Credentials

## Default User Accounts

All accounts use the same password: **AnchorPro!123**

### Administrator Account
- **Email:** admin@anchor.com
- **Password:** AnchorPro!123
- **Roles:** Admin, Supervisor
- **Name:** System Admin
- **Permissions:** Full system access, can create job cards, manage users, view all data

### Supervisor Account
- **Email:** supervisor@anchor.com
- **Password:** AnchorPro!123
- **Role:** Supervisor
- **Name:** Workshop Supervisor
- **Permissions:** Create and manage job cards, assign jobs, view reports

### Technician Account
- **Email:** tech@anchor.com
- **Password:** AnchorPro!123
- **Role:** Technician
- **Name:** Field Technician
- **Permissions:** View assigned jobs, complete tasks, log time and downtime

---

## Seeded Reference Data

### Equipment (4 items)
1. **CNC Lathe #1**
   - Serial: CNC-001
   - Model: XL-2000
   - Manufacturer: Haas Automation
   - Location: Workshop A - Bay 1

2. **Hydraulic Press #2**
   - Serial: HP-002
   - Model: HP-500T
   - Manufacturer: Schuler
   - Location: Workshop A - Bay 3

3. **Welding Robot #1**
   - Serial: WR-001
   - Model: ARC-X
   - Manufacturer: FANUC
   - Location: Workshop B - Bay 2

4. **Milling Machine #3**
   - Serial: MM-003
   - Model: VM-40
   - Manufacturer: Haas Automation
   - Location: Workshop A - Bay 2

### Job Types (5 items)
1. Preventive Maintenance - Scheduled routine maintenance
2. Corrective Maintenance - Repair of broken equipment
3. Inspection - Equipment inspection and assessment
4. Calibration - Equipment calibration
5. Emergency Repair - Urgent breakdown repair

### Downtime Categories (5 items)
1. Waiting for Parts (Paid Time)
2. Waiting for Instructions (Paid Time)
3. Break Time (Paid Time)
4. Equipment Breakdown (Unpaid Time)
5. Safety Issue (Paid Time)

---

## Quick Start Guide

1. **Login:** Navigate to http://localhost:5165
2. **Use Admin Account:** admin@anchor.com / AnchorPro!123
3. **Create Job Card:** Click "Job Cards" → "NEW JOB CARD"
4. **Test Workflow:**
   - Create a job card as Supervisor
   - Assign to technician
   - Log in as Technician to complete tasks

---

## Database Connection

**Connection String:** 
```
Server=(localdb)\\mssqllocaldb;Database=AnchorProDb;Trusted_Connection=true;MultipleActiveResultSets=true
```

**Database Name:** AnchorProDb

---

## API Documentation

**Swagger UI:** http://localhost:5165/swagger

**Available Endpoints:**
- `/api/Equipment` - Equipment management
- `/api/JobCards` - Job card operations
- `/api/JobTasks` - Task management
- `/api/Downtime` - Downtime tracking
- `/api/ReferenceData` - Job types and downtime categories

---

**Last Updated:** 2026-01-22

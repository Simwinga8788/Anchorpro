# Anchor Pro: The Complete Production Planning Guide

Anchor Pro is a professional, multi-tenant SaaS (Software as a Service) Production Planning Tool. It is engineered to provide industrial-grade asset tracking, job card automation, and financial analytics for businesses ranging from small workshops to large-scale construction and mining operations.

---

## 🚀 1. The Vision: One System, Every Industry
Anchor Pro was built from the ground up to solve the "Rigid Software" problem. Most maintenance systems are either too simple for mining or too complex for a local service center. 

**Anchor Pro solves this through its "Configuration over Customization" engine.**

### How we handle different industries:
- **Construction & Mining**: Focus on heavy machinery (Excavators, Drill Rigs). The system tracks deep history, hourly labor costs, and parts consumption to identify which machines are "money pits".
- **Workshops & Service Centers**: Focus on high-volume throughput. Terminology like "Assets" can be rebranded to "Client Vehicles" or "Units" via the Settings module.
- **Facilities Management**: Organize by "Locations" and "Zones" rather than just machine types. Track building subsystem uptime (HVAC, Elevators).

---

## 🏗 2. Core Modules (Start to Finish)

### **Module A: Asset & Equipment Management**
The foundation of the system.
- **Unified Registry**: Track every machine with unique IDs, Serial Numbers, and Model info.
- **Maintenance History**: A digital "health record" for every asset. See every repair, every part used, and every technician who ever touched it.
- **Cost Analysis**: Automated tracking of life-to-date maintenance costs.

### **Module B: Job Card Automation**
The operational execution engine.
- **Full Lifecycle**: Request -> Scheduled -> In-Progress -> Completed -> Closed.
- **Real-time Costing**: As Technicians add parts and log hours, the system automatically calculates the total cost of the job in **Kwacha (K)**.
- **Task Checklists**: Integrated "SOP" checklists ensure quality and safety compliance on every job.

### **Module C: Inventory & Parts Control**
Stop losing money on missing parts.
- **Live Stock Levels**: Real-time quantity tracking.
- **Automated Reordering**: When stock of a critical item (like a Filter or Oil) falls low, Anchor Pro sends an automated alert to the procurement team.
- **Consumption Accuracy**: Parts are deducted from stock *only* when they are billed to a specific Job Card.

### **Module D: Automated Reporting & Analytics (The Dashboard)**
Professional insights delivered to your inbox.
- **Executive Dashboard**: A visual 2x2 grid in Excel showing:
    - **Total Jobs**: Volume tracking.
    - **Completion Rate**: Team efficiency.
    - **Open/Pending**: Identifying bottlenecks.
    - **Total Spend**: Financial oversight in **Kwacha**.
- **Technician KPIs**: Leaderboard showing who is finishing jobs on time and who has the highest workload.
- **Asset Leaderboard**: Instant list of the top 10 most expensive assets to maintain.

---

## 🏢 3. The SaaS & Multi-Tenant Engine
Anchor Pro is a scalable platform that serves multiple companies simultaneously while keeping data strictly private.

### **Tenant Isolation**
Using **Row-Level Security (RLS)** via a `TenantId`, the system ensures that "Company A" can never see the machines, staff, or financial data of "Company B", even though they share the same backend.

### **Subscription & Billing**
- **Trial System**: Automatic 14-day trials for new users.
- **Tiered Plans**: Unlock features like Advanced Analytics or Inventory management as you grow.
- **Proof of Payment (POP)**: Tenants upload payment slips; the Platform Owner approves them to instantly upgrade account status.

---

## 🛠 4. Technical Excellence
Anchor Pro is built on high-performance modern tech:
- **Engine**: .NET 8 (Blazor Server) for a fast, desktop-like web experience.
- **Database**: SQL Server with Entity Framework Core for robust data integrity.
- **Reporting**: ClosedXML for generation of professional Excel dashboards.
- **Communications**: Integrated SMTP and Email Service for automated alerts and PDF/Excel report delivery.

---

## � 5. Feature Timeline: What We Built
1.  **Phase 1**: Core identity, authentication, and tenant isolation.
2.  **Phase 2**: Asset registry and basic Job Card workflows.
3.  **Phase 3**: Inventory integration and cost calculation logic.
4.  **Phase 4**: SaaS billing engine, platform dashboard, and payment proof workflow.
5.  **Phase 5**: Advanced Automated Reporting with professional Excel dashboards, Technician KPIs, and Kwacha currency integration.

---

## 📖 6. How to Use the System
- **For Admins**: Set up your team, define your asset list, and monitor the automated reports arriving in your mail.
- **For Technicians**: Access your assigned jobs on any device, update progress on the fly, and log parts used without paperwork.
- **For Owners**: Review the "Manager Summary" every week to see where your money is going and which assets need replacement.

---
*Anchor Pro: Maintain with Confidence.*
*Documentation Version: 2.0 (Feb 2026)*
*Software Version: 1.0.0-Stable*

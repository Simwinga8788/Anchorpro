# AnchorPro: Business & Platform Overview

## 1. Executive Summary
**AnchorPro** is a modern, multi-tenant Software-as-a-Service (SaaS) platform designed to revolutionize Field Service Management (FSM) and Enterprise Asset Management (EAM). Built for engineering firms, maintenance contractors, and heavy-machinery operators, AnchorPro bridges the gap between the field and the back office. It provides an end-to-end ecosystem that manages everything from equipment lifecycles and technician dispatching to safety compliance and financial invoicing.

By consolidating disparate workflows—job scheduling, inventory management, health and safety (HSE) permits, and profitability analytics—into a single, unified interface, AnchorPro empowers service-based organizations to reduce operational downtime, enforce strict compliance, and maximize profit margins.

---

## 2. Target Market & Audience
AnchorPro is explicitly designed for service and maintenance-centric organizations, including:
* **Heavy Machinery & Equipment Contractors:** Firms managing fleets of generators, earthmovers, or industrial manufacturing equipment.
* **HVAC & Facilities Management:** Companies executing preventive and corrective maintenance contracts for commercial buildings.
* **Engineering & Field Services:** Teams dispatching technicians to remote sites requiring strict safety protocols and real-time job tracking.

---

## 3. Core Value Proposition
* **Operational Visibility:** Real-time tracking of technicians, equipment downtime, and active job cards.
* **Integrated Financials (Mini-ERP):** Avoids the need for external accounting software by natively handling job costing (labor + parts), invoicing, and accounts receivable aging.
* **Safety First (HSE):** Distinctive native integration of "Permit to Work" (PTW) protocols directly into the job execution workflow, ensuring compliance before wrenches turn.
* **Multi-Tenant Architecture:** Secure, isolated environments for individual companies, centrally managed by a Platform Owner with seamless subscription and tenant administration.

---

## 4. Platform Capabilities (Core Modules)

### ⚙️ Field Operations & Maintenance
* **Job Card Management:** Full lifecycle tracking from unscheduled breakdowns to completed, invoiced jobs. Supports task checklists, attachments, and part allocations.
* **Equipment & Asset Tracking:** Comprehensive database of client equipment, tracking historical maintenance, downtime occurrences, and current operational status.
* **Scheduling & Dispatch:** Technician assignment with conflict resolution and schedule optimization.

### 💰 Financial & Mini-ERP
* **Automated Costing:** Real-time calculation of gross profit margins based on consumed inventory costs and technician hourly labor rates.
* **Invoicing Engine:** Direct generation of invoices from completed job cards or recurring SLA contracts.
* **Accounts Receivable:** Real-time aging reports (30/60/90 days) and automated overdue tracking.

### 📦 Inventory & Procurement
* **Stock Management:** Multi-location inventory tracking with low-stock reorder thresholds.
* **Job Reservations:** Immediate deduction/reservation of parts against scheduled jobs to prevent over-allocation.
* **Procurement:** End-to-end Purchase Order (PO) generation and Supplier management.

### 🛡️ Safety & Compliance (HSE)
* **Permit to Work (PTW):** Digital safety permits that must be authorized before hazardous tasks commence.
* **Audit Trails:** Immutable, system-wide logging of all high-level actions, status changes, and security events.

### 📊 Business Intelligence (BI) & Reporting
* **Executive Dashboards:** Real-time visualization of job completion rates, financial health, and technician utilization.
* **Automated Reporting:** Scheduled delivery of HTML/Excel reports to stakeholders.
* **Predictive Insights:** AI-ready data structures tracking asset performance and failure rates over time.

---

## 5. Monetization & Business Model (SaaS)
AnchorPro operates on a recurring B2B SaaS revenue model, utilizing tiered feature gating and usage limits to drive upsells:

1. **Free Trial:** 14-day access (e.g., max 2 technicians, 10 active jobs) to onboard smaller teams.
2. **Professional Plan:** Geared toward growing operations. Includes core features, data exports, and standard usage limits (e.g., 10 technicians, 100 jobs/month).
3. **Enterprise Plan:** Unlimited scale, API access, predictive intelligence engines, and priority SLA support for large-scale corporate fleets.

---

## 6. Technical Advantage
AnchorPro is built on a highly scalable, enterprise-grade architecture (ASP.NET Core, PostgreSQL, Entity Framework Core). The codebase features:
* **Strict Tenant Isolation:** Global query filters guaranteeing data privacy across organizations.
* **Platform Owner Administration:** "God-mode" impersonation and dashboard tools for the AnchorPro team to provide world-class support and manage subscriptions natively.
* **API-First Design:** 100% test-verified RESTful API coverage allowing seamless future integrations with mobile apps or third-party enterprise tools.

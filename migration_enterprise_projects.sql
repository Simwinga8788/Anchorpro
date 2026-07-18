CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "TrialEndDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "TrialConvertedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "SuspendedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "StartDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "ReactivatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "NextBillingDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "LastPaymentRetryDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "LastPaymentDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "GracePeriodStartDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "GracePeriodEndDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "EndDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "TenantSubscriptions" ALTER COLUMN "CancelledAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Tenants" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Tenants" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "SystemAuditLogs" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "SystemAuditLogs" ALTER COLUMN "Timestamp" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "SystemAuditLogs" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Suppliers" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Suppliers" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "SubscriptionPlans" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "SubscriptionPlans" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "ReportDefinitions" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "ReportDefinitions" ALTER COLUMN "NextRun" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "ReportDefinitions" ALTER COLUMN "LastRun" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "ReportDefinitions" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PurchaseOrders" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PurchaseOrders" ALTER COLUMN "ReceivedDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PurchaseOrders" ALTER COLUMN "OrderDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PurchaseOrders" ALTER COLUMN "ExpectedDeliveryDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PurchaseOrders" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PurchaseOrderItems" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PurchaseOrderItems" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PermitsToWork" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PermitsToWork" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PermitsToWork" ALTER COLUMN "ClosedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "PermitsToWork" ALTER COLUMN "AuthorizedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Payments" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Payments" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Payments" ALTER COLUMN "ApprovedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobTypes" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobTypes" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobTasks" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobTasks" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobTasks" ALTER COLUMN "CompletedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobCards" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobCards" ALTER COLUMN "ScheduledStartDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobCards" ALTER COLUMN "ScheduledEndDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobCards" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobCards" ALTER COLUMN "ActualStartDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobCards" ALTER COLUMN "ActualEndDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobCardParts" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobCardParts" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobAttachments" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "JobAttachments" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Invoices" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Invoices" ALTER COLUMN "InvoiceDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Invoices" ALTER COLUMN "DueDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Invoices" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "InvoicePayments" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "InvoicePayments" ALTER COLUMN "PaymentDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "InvoicePayments" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "InventoryItems" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "InventoryItems" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Equipment" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Equipment" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "DowntimeEntries" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "DowntimeEntries" ALTER COLUMN "StartTime" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "DowntimeEntries" ALTER COLUMN "EndTime" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "DowntimeEntries" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "DowntimeCategories" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "DowntimeCategories" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Departments" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Departments" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Customers" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Customers" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Contracts" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Contracts" ALTER COLUMN "StartDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Contracts" ALTER COLUMN "EndDate" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "Contracts" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "AspNetUsers" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    ALTER TABLE "AspNetUsers" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    CREATE TABLE "Alerts" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "Title" character varying(200) NOT NULL,
        "Message" character varying(1000) NOT NULL,
        "Severity" character varying(20) NOT NULL,
        "Category" character varying(50) NOT NULL,
        "JobCardId" integer,
        "CustomerId" integer,
        "IsRead" boolean NOT NULL,
        "ReadAt" timestamp without time zone,
        "ReadByUserId" character varying(85),
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_Alerts" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Alerts_Customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id"),
        CONSTRAINT "FK_Alerts_JobCards_JobCardId" FOREIGN KEY ("JobCardId") REFERENCES "JobCards" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    CREATE TABLE "Tools" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "Name" character varying(100) NOT NULL,
        "Description" character varying(500),
        "ToolTag" character varying(50) NOT NULL,
        "Status" integer NOT NULL,
        "Condition" integer NOT NULL,
        "ReceivedDate" timestamp without time zone NOT NULL,
        "PurchaseDate" timestamp without time zone,
        "PurchaseCost" numeric,
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_Tools" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    CREATE TABLE "ToolTransactions" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "ToolId" integer NOT NULL,
        "AssignedToUserId" character varying(85) NOT NULL,
        "IssuedAt" timestamp without time zone NOT NULL,
        "IssuedByUserId" character varying(85) NOT NULL,
        "ConditionOnIssue" integer NOT NULL,
        "ExpectedReturnDate" timestamp without time zone,
        "ReturnedAt" timestamp without time zone,
        "ReceivedByUserId" character varying(85),
        "ConditionOnReturn" integer,
        "Notes" character varying(1000),
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_ToolTransactions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ToolTransactions_AspNetUsers_AssignedToUserId" FOREIGN KEY ("AssignedToUserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_ToolTransactions_AspNetUsers_IssuedByUserId" FOREIGN KEY ("IssuedByUserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_ToolTransactions_AspNetUsers_ReceivedByUserId" FOREIGN KEY ("ReceivedByUserId") REFERENCES "AspNetUsers" ("Id"),
        CONSTRAINT "FK_ToolTransactions_Tools_ToolId" FOREIGN KEY ("ToolId") REFERENCES "Tools" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    CREATE INDEX "IX_Alerts_CustomerId" ON "Alerts" ("CustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    CREATE INDEX "IX_Alerts_JobCardId" ON "Alerts" ("JobCardId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    CREATE INDEX "IX_ToolTransactions_AssignedToUserId" ON "ToolTransactions" ("AssignedToUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    CREATE INDEX "IX_ToolTransactions_IssuedByUserId" ON "ToolTransactions" ("IssuedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    CREATE INDEX "IX_ToolTransactions_ReceivedByUserId" ON "ToolTransactions" ("ReceivedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    CREATE INDEX "IX_ToolTransactions_ToolId" ON "ToolTransactions" ("ToolId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608221552_AddToolManagement') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260608221552_AddToolManagement', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609000441_AddPartsIssuingAndTaskPhotos') THEN
    ALTER TABLE "JobTasks" ADD "PhotoPath" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609000441_AddPartsIssuingAndTaskPhotos') THEN
    ALTER TABLE "JobCardParts" ADD "IsIssued" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609000441_AddPartsIssuingAndTaskPhotos') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260609000441_AddPartsIssuingAndTaskPhotos', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609203855_AddCustomerNumberAndQuotations') THEN
    ALTER TABLE "JobCards" ALTER COLUMN "JobNumber" DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609203855_AddCustomerNumberAndQuotations') THEN
    ALTER TABLE "Invoices" ALTER COLUMN "InvoiceNumber" DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609203855_AddCustomerNumberAndQuotations') THEN
    ALTER TABLE "Customers" ADD "CustomerNumber" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609203855_AddCustomerNumberAndQuotations') THEN
    CREATE TABLE "Quotations" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "QuotationNumber" character varying(30) NOT NULL,
        "JobCardId" integer NOT NULL,
        "CustomerId" integer,
        "QuoteDate" timestamp without time zone NOT NULL,
        "ExpiryDate" timestamp without time zone NOT NULL,
        "Subtotal" numeric(18,2) NOT NULL,
        "TaxRate" numeric(5,2) NOT NULL,
        "TaxAmount" numeric(18,2) NOT NULL,
        "Total" numeric(18,2) NOT NULL,
        "Status" integer NOT NULL,
        "RejectionReason" character varying(500),
        "Notes" character varying(500),
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_Quotations" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Quotations_Customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id"),
        CONSTRAINT "FK_Quotations_JobCards_JobCardId" FOREIGN KEY ("JobCardId") REFERENCES "JobCards" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609203855_AddCustomerNumberAndQuotations') THEN
    CREATE INDEX "IX_Quotations_CustomerId" ON "Quotations" ("CustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609203855_AddCustomerNumberAndQuotations') THEN
    CREATE INDEX "IX_Quotations_JobCardId" ON "Quotations" ("JobCardId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609203855_AddCustomerNumberAndQuotations') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260609203855_AddCustomerNumberAndQuotations', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260616000737_AddDataProtectionKeys') THEN
    CREATE TABLE "DataProtectionKeys" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "FriendlyName" text,
        "Xml" text,
        CONSTRAINT "PK_DataProtectionKeys" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260616000737_AddDataProtectionKeys') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260616000737_AddDataProtectionKeys', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623214611_AddToolRequests') THEN
    CREATE TABLE "ToolRequests" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "RequestedByUserId" character varying(85) NOT NULL,
        "RequestedToolName" character varying(200) NOT NULL,
        "Notes" character varying(1000),
        "Status" integer NOT NULL,
        "RequestedAt" timestamp without time zone NOT NULL,
        "ResolvedAt" timestamp without time zone,
        "IssuedToolTransactionId" integer,
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_ToolRequests" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ToolRequests_AspNetUsers_RequestedByUserId" FOREIGN KEY ("RequestedByUserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_ToolRequests_ToolTransactions_IssuedToolTransactionId" FOREIGN KEY ("IssuedToolTransactionId") REFERENCES "ToolTransactions" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623214611_AddToolRequests') THEN
    CREATE INDEX "IX_ToolRequests_IssuedToolTransactionId" ON "ToolRequests" ("IssuedToolTransactionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623214611_AddToolRequests') THEN
    CREATE INDEX "IX_ToolRequests_RequestedByUserId" ON "ToolRequests" ("RequestedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623214611_AddToolRequests') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260623214611_AddToolRequests', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623223939_AddHRModule') THEN
    CREATE TABLE "EmployeeProfiles" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "UserId" character varying(85) NOT NULL,
        "DateOfBirth" timestamp without time zone,
        "Gender" character varying(20),
        "Nationality" character varying(100),
        "NationalIdNumber" character varying(50),
        "MaritalStatus" character varying(30),
        "PersonalPhone" character varying(20),
        "PersonalEmail" character varying(200),
        "HomeAddress" character varying(500),
        "EmergencyContactName" character varying(150),
        "EmergencyContactRelation" character varying(50),
        "EmergencyContactPhone" character varying(20),
        "BankName" character varying(100),
        "BankBranch" character varying(100),
        "BankAccountNumber" character varying(30),
        "BankAccountType" character varying(30),
        "JobTitle" character varying(150),
        "EmploymentType" integer NOT NULL,
        "EmploymentStartDate" timestamp without time zone,
        "ProfilePhotoUrl" character varying(500),
        "IdDocumentUrl" character varying(500),
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" text,
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" text,
        CONSTRAINT "PK_EmployeeProfiles" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_EmployeeProfiles_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623223939_AddHRModule') THEN
    CREATE TABLE "EmploymentContracts" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "UserId" character varying(85) NOT NULL,
        "JobTitle" character varying(150) NOT NULL,
        "ContractType" integer NOT NULL,
        "Status" integer NOT NULL,
        "StartDate" timestamp without time zone NOT NULL,
        "EndDate" timestamp without time zone,
        "AgreedMonthlySalary" numeric(18,2) NOT NULL,
        "HourlyRate" numeric(18,2) NOT NULL,
        "NoticePeriodDays" integer NOT NULL,
        "DocumentUrl" character varying(500),
        "Notes" character varying(1000),
        "TerminationReason" character varying(500),
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" text,
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" text,
        CONSTRAINT "PK_EmploymentContracts" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_EmploymentContracts_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623223939_AddHRModule') THEN
    CREATE TABLE "PayrollRuns" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "PeriodMonth" integer NOT NULL,
        "PeriodYear" integer NOT NULL,
        "RunDate" timestamp without time zone NOT NULL,
        "Status" integer NOT NULL,
        "TotalGross" numeric(18,2) NOT NULL,
        "TotalDeductions" numeric(18,2) NOT NULL,
        "TotalNet" numeric(18,2) NOT NULL,
        "TotalEmployerNapsa" numeric(18,2) NOT NULL,
        "Notes" character varying(1000),
        "FinalisedAt" timestamp without time zone,
        "FinalisedBy" text,
        "PaidAt" timestamp without time zone,
        "PaidBy" text,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" text,
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" text,
        CONSTRAINT "PK_PayrollRuns" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623223939_AddHRModule') THEN
    CREATE TABLE "PayslipEntries" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "PayrollRunId" integer NOT NULL,
        "UserId" character varying(85) NOT NULL,
        "BasicSalary" numeric(18,2) NOT NULL,
        "OvertimeHours" numeric NOT NULL,
        "OvertimeRate" numeric(18,2) NOT NULL,
        "OvertimePay" numeric(18,2) NOT NULL,
        "TransportAllowance" numeric(18,2) NOT NULL,
        "HousingAllowance" numeric(18,2) NOT NULL,
        "OtherAllowances" numeric(18,2) NOT NULL,
        "GrossPay" numeric(18,2) NOT NULL,
        "PayeTax" numeric(18,2) NOT NULL,
        "NapsaEmployee" numeric(18,2) NOT NULL,
        "NapsaEmployer" numeric(18,2) NOT NULL,
        "NhimaContribution" numeric(18,2) NOT NULL,
        "OtherDeductions" numeric(18,2) NOT NULL,
        "OtherDeductionsNote" character varying(500),
        "TotalDeductions" numeric(18,2) NOT NULL,
        "NetPay" numeric(18,2) NOT NULL,
        "Status" integer NOT NULL,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" text,
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" text,
        CONSTRAINT "PK_PayslipEntries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_PayslipEntries_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_PayslipEntries_PayrollRuns_PayrollRunId" FOREIGN KEY ("PayrollRunId") REFERENCES "PayrollRuns" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623223939_AddHRModule') THEN
    CREATE INDEX "IX_EmployeeProfiles_UserId" ON "EmployeeProfiles" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623223939_AddHRModule') THEN
    CREATE INDEX "IX_EmploymentContracts_UserId" ON "EmploymentContracts" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623223939_AddHRModule') THEN
    CREATE INDEX "IX_PayslipEntries_PayrollRunId" ON "PayslipEntries" ("PayrollRunId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623223939_AddHRModule') THEN
    CREATE INDEX "IX_PayslipEntries_UserId" ON "PayslipEntries" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623223939_AddHRModule') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260623223939_AddHRModule', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    CREATE TABLE "Expenses" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "Description" character varying(200) NOT NULL,
        "Category" integer NOT NULL,
        "Amount" numeric(18,2) NOT NULL,
        "ExpenseDate" timestamp without time zone NOT NULL,
        "ReceiptUrl" character varying(500),
        "JobCardId" integer,
        "RecordedBy" character varying(100),
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_Expenses" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Expenses_JobCards_JobCardId" FOREIGN KEY ("JobCardId") REFERENCES "JobCards" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    CREATE TABLE "VendorBills" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "BillNumber" character varying(50) NOT NULL,
        "SupplierId" integer NOT NULL,
        "PurchaseOrderId" integer,
        "TotalAmount" numeric(18,2) NOT NULL,
        "AmountPaid" numeric(18,2) NOT NULL,
        "BillDate" timestamp without time zone NOT NULL,
        "DueDate" timestamp without time zone NOT NULL,
        "Status" integer NOT NULL,
        "Notes" character varying(500),
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_VendorBills" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_VendorBills_PurchaseOrders_PurchaseOrderId" FOREIGN KEY ("PurchaseOrderId") REFERENCES "PurchaseOrders" ("Id"),
        CONSTRAINT "FK_VendorBills_Suppliers_SupplierId" FOREIGN KEY ("SupplierId") REFERENCES "Suppliers" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    CREATE TABLE "LedgerEntries" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "TransactionDate" timestamp without time zone NOT NULL,
        "Type" integer NOT NULL,
        "Amount" numeric(18,2) NOT NULL,
        "Category" character varying(100) NOT NULL,
        "Description" character varying(200) NOT NULL,
        "InvoiceId" integer,
        "VendorBillId" integer,
        "PayrollRunId" integer,
        "ExpenseId" integer,
        "RecordedBy" character varying(100),
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_LedgerEntries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_LedgerEntries_Expenses_ExpenseId" FOREIGN KEY ("ExpenseId") REFERENCES "Expenses" ("Id"),
        CONSTRAINT "FK_LedgerEntries_Invoices_InvoiceId" FOREIGN KEY ("InvoiceId") REFERENCES "Invoices" ("Id"),
        CONSTRAINT "FK_LedgerEntries_PayrollRuns_PayrollRunId" FOREIGN KEY ("PayrollRunId") REFERENCES "PayrollRuns" ("Id"),
        CONSTRAINT "FK_LedgerEntries_VendorBills_VendorBillId" FOREIGN KEY ("VendorBillId") REFERENCES "VendorBills" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    CREATE INDEX "IX_Expenses_JobCardId" ON "Expenses" ("JobCardId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    CREATE INDEX "IX_LedgerEntries_ExpenseId" ON "LedgerEntries" ("ExpenseId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    CREATE INDEX "IX_LedgerEntries_InvoiceId" ON "LedgerEntries" ("InvoiceId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    CREATE INDEX "IX_LedgerEntries_PayrollRunId" ON "LedgerEntries" ("PayrollRunId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    CREATE INDEX "IX_LedgerEntries_VendorBillId" ON "LedgerEntries" ("VendorBillId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    CREATE INDEX "IX_VendorBills_PurchaseOrderId" ON "VendorBills" ("PurchaseOrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    CREATE INDEX "IX_VendorBills_SupplierId" ON "VendorBills" ("SupplierId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260623230709_AddFinanceModule') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260623230709_AddFinanceModule', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624123821_AddInventoryCategory') THEN
    ALTER TABLE "InventoryItems" ADD "Category" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624123821_AddInventoryCategory') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260624123821_AddInventoryCategory', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "PayslipEntries" ALTER COLUMN "UpdatedBy" TYPE character varying(85);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "PayslipEntries" ALTER COLUMN "CreatedBy" TYPE character varying(85);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "PayslipEntries" ADD "TenantId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "PayrollRuns" ALTER COLUMN "UpdatedBy" TYPE character varying(85);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "PayrollRuns" ALTER COLUMN "CreatedBy" TYPE character varying(85);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "PayrollRuns" ADD "TenantId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "EmploymentContracts" ALTER COLUMN "UpdatedBy" TYPE character varying(85);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "EmploymentContracts" ALTER COLUMN "CreatedBy" TYPE character varying(85);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "EmploymentContracts" ADD "TenantId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "EmployeeProfiles" ALTER COLUMN "UpdatedBy" TYPE character varying(85);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "EmployeeProfiles" ALTER COLUMN "CreatedBy" TYPE character varying(85);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    ALTER TABLE "EmployeeProfiles" ADD "TenantId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624124115_AddHRMultiTenancy') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260624124115_AddHRMultiTenancy', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    ALTER TABLE "PurchaseOrders" ADD "PurchaseRequisitionId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    ALTER TABLE "JobCards" ADD "EstimatedLaborHours" numeric(18,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    CREATE TABLE "PurchaseRequisitions" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "RequisitionNumber" character varying(30) NOT NULL,
        "JobCardId" integer,
        "DepartmentId" integer,
        "RequestedById" character varying(85) NOT NULL,
        "RequiredDate" timestamp without time zone NOT NULL,
        "Status" integer NOT NULL,
        "ApprovedById" character varying(85),
        "ApprovedDate" timestamp without time zone,
        "Notes" character varying(500),
        "TotalEstimatedAmount" numeric(18,2) NOT NULL,
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_PurchaseRequisitions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_PurchaseRequisitions_AspNetUsers_ApprovedById" FOREIGN KEY ("ApprovedById") REFERENCES "AspNetUsers" ("Id"),
        CONSTRAINT "FK_PurchaseRequisitions_AspNetUsers_RequestedById" FOREIGN KEY ("RequestedById") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_PurchaseRequisitions_Departments_DepartmentId" FOREIGN KEY ("DepartmentId") REFERENCES "Departments" ("Id"),
        CONSTRAINT "FK_PurchaseRequisitions_JobCards_JobCardId" FOREIGN KEY ("JobCardId") REFERENCES "JobCards" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    CREATE TABLE "PurchaseRequisitionItems" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "PurchaseRequisitionId" integer NOT NULL,
        "InventoryItemId" integer,
        "Description" character varying(200) NOT NULL,
        "QuantityRequested" integer NOT NULL,
        "EstimatedUnitCost" numeric(18,2) NOT NULL,
        "LineTotal" numeric(18,2) NOT NULL,
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_PurchaseRequisitionItems" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_PurchaseRequisitionItems_InventoryItems_InventoryItemId" FOREIGN KEY ("InventoryItemId") REFERENCES "InventoryItems" ("Id"),
        CONSTRAINT "FK_PurchaseRequisitionItems_PurchaseRequisitions_PurchaseRequi~" FOREIGN KEY ("PurchaseRequisitionId") REFERENCES "PurchaseRequisitions" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    CREATE INDEX "IX_PurchaseOrders_PurchaseRequisitionId" ON "PurchaseOrders" ("PurchaseRequisitionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    CREATE INDEX "IX_PurchaseRequisitionItems_InventoryItemId" ON "PurchaseRequisitionItems" ("InventoryItemId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    CREATE INDEX "IX_PurchaseRequisitionItems_PurchaseRequisitionId" ON "PurchaseRequisitionItems" ("PurchaseRequisitionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    CREATE INDEX "IX_PurchaseRequisitions_ApprovedById" ON "PurchaseRequisitions" ("ApprovedById");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    CREATE INDEX "IX_PurchaseRequisitions_DepartmentId" ON "PurchaseRequisitions" ("DepartmentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    CREATE INDEX "IX_PurchaseRequisitions_JobCardId" ON "PurchaseRequisitions" ("JobCardId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    CREATE INDEX "IX_PurchaseRequisitions_RequestedById" ON "PurchaseRequisitions" ("RequestedById");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    ALTER TABLE "PurchaseOrders" ADD CONSTRAINT "FK_PurchaseOrders_PurchaseRequisitions_PurchaseRequisitionId" FOREIGN KEY ("PurchaseRequisitionId") REFERENCES "PurchaseRequisitions" ("Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260624211648_AddCorporateProcurementAndMargins') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260624211648_AddCorporateProcurementAndMargins', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260625000247_AddTenantRolePermissions') THEN
    CREATE TABLE "TenantRolePermissions" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "RoleName" text NOT NULL,
        "AllowedRoutesJson" text NOT NULL,
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_TenantRolePermissions" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260625000247_AddTenantRolePermissions') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260625000247_AddTenantRolePermissions', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260628221750_AddContractHoursAndMultiplier') THEN
    ALTER TABLE "EmploymentContracts" ADD "OvertimeMultiplier" numeric(18,2);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260628221750_AddContractHoursAndMultiplier') THEN
    ALTER TABLE "EmploymentContracts" ADD "StandardHoursPerMonth" double precision;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260628221750_AddContractHoursAndMultiplier') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260628221750_AddContractHoursAndMultiplier', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260630013343_AddContractBody') THEN
    ALTER TABLE "EmploymentContracts" ADD "ContractBody" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260630013343_AddContractBody') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260630013343_AddContractBody', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260630015533_AddTenantLogoUrl') THEN
    ALTER TABLE "Tenants" ADD "LogoUrl" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260630015533_AddTenantLogoUrl') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260630015533_AddTenantLogoUrl', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260630025538_AddEmployeeDocumentsJson') THEN
    ALTER TABLE "EmployeeProfiles" ADD "DocumentsJson" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260630025538_AddEmployeeDocumentsJson') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260630025538_AddEmployeeDocumentsJson', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714224453_AddOperationModeAndShiftLog') THEN
    ALTER TABLE "Tenants" ALTER COLUMN "LogoUrl" TYPE text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714224453_AddOperationModeAndShiftLog') THEN
    ALTER TABLE "Tenants" ADD "Industry" character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714224453_AddOperationModeAndShiftLog') THEN
    ALTER TABLE "Tenants" ADD "OperationMode" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714224453_AddOperationModeAndShiftLog') THEN
    CREATE TABLE "ShiftProductionLogs" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "LogNumber" character varying(30) NOT NULL,
        "ShiftDate" timestamp without time zone NOT NULL,
        "Shift" integer NOT NULL,
        "EquipmentId" integer,
        "QuantityProduced" numeric(18,3) NOT NULL,
        "UnitOfMeasure" character varying(30) NOT NULL,
        "TargetQuantity" numeric(18,3),
        "FuelConsumedLitres" numeric(18,2) NOT NULL,
        "OperatingHours" numeric(8,2) NOT NULL,
        "DowntimeHours" numeric(8,2) NOT NULL,
        "OperatorName" character varying(150),
        "SupervisorName" character varying(150),
        "CrewCount" integer,
        "Location" character varying(200),
        "ActivityType" character varying(100),
        "Remarks" character varying(1000),
        "Status" integer NOT NULL,
        "ApprovedBy" character varying(450),
        "ApprovedAt" timestamp without time zone,
        "RejectionReason" character varying(500),
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_ShiftProductionLogs" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ShiftProductionLogs_Equipment_EquipmentId" FOREIGN KEY ("EquipmentId") REFERENCES "Equipment" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714224453_AddOperationModeAndShiftLog') THEN
    CREATE TABLE "WorkDocumentCostEntries" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "WorkDocumentId" integer NOT NULL,
        "WorkDocumentType" integer NOT NULL,
        "CostCategory" character varying(50) NOT NULL,
        "Description" character varying(500),
        "Amount" numeric(18,2) NOT NULL,
        "SourceReference" character varying(100),
        "ShiftProductionLogId" integer,
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_WorkDocumentCostEntries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_WorkDocumentCostEntries_ShiftProductionLogs_ShiftProduction~" FOREIGN KEY ("ShiftProductionLogId") REFERENCES "ShiftProductionLogs" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714224453_AddOperationModeAndShiftLog') THEN
    CREATE INDEX "IX_ShiftProductionLogs_EquipmentId" ON "ShiftProductionLogs" ("EquipmentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714224453_AddOperationModeAndShiftLog') THEN
    CREATE INDEX "IX_WorkDocumentCostEntries_ShiftProductionLogId" ON "WorkDocumentCostEntries" ("ShiftProductionLogId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714224453_AddOperationModeAndShiftLog') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260714224453_AddOperationModeAndShiftLog', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714234742_AddShiftLogMiningFields') THEN
    ALTER TABLE "ShiftProductionLogs" ADD "DestinationLocation" character varying(200);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714234742_AddShiftLogMiningFields') THEN
    ALTER TABLE "ShiftProductionLogs" ADD "LoadCount" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714234742_AddShiftLogMiningFields') THEN
    ALTER TABLE "ShiftProductionLogs" ADD "PayloadFactor" numeric;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714234742_AddShiftLogMiningFields') THEN
    ALTER TABLE "ShiftProductionLogs" ADD "SourceLocation" character varying(200);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714234742_AddShiftLogMiningFields') THEN
    ALTER TABLE "Equipment" ADD "PayloadCapacity" numeric;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260714234742_AddShiftLogMiningFields') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260714234742_AddShiftLogMiningFields', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715174005_AddProductionBillingFields') THEN
    ALTER TABLE "ShiftProductionLogs" ADD "InvoiceId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715174005_AddProductionBillingFields') THEN
    ALTER TABLE "Contracts" ADD "UnitOfMeasure" character varying(30);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715174005_AddProductionBillingFields') THEN
    ALTER TABLE "Contracts" ADD "UnitRate" numeric(18,2);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715174005_AddProductionBillingFields') THEN
    CREATE INDEX "IX_ShiftProductionLogs_InvoiceId" ON "ShiftProductionLogs" ("InvoiceId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715174005_AddProductionBillingFields') THEN
    ALTER TABLE "ShiftProductionLogs" ADD CONSTRAINT "FK_ShiftProductionLogs_Invoices_InvoiceId" FOREIGN KEY ("InvoiceId") REFERENCES "Invoices" ("Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715174005_AddProductionBillingFields') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260715174005_AddProductionBillingFields', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717182428_AddProjectManagement') THEN
    ALTER TABLE "JobCards" ADD "ProjectId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717182428_AddProjectManagement') THEN
    CREATE TABLE "Projects" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "Name" character varying(200) NOT NULL,
        "Description" text NOT NULL,
        "Status" integer NOT NULL,
        "StartDate" timestamp without time zone,
        "EndDate" timestamp without time zone,
        "Budget" numeric(18,2) NOT NULL,
        "CustomerId" integer,
        "ManagerId" character varying(85),
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_Projects" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Projects_AspNetUsers_ManagerId" FOREIGN KEY ("ManagerId") REFERENCES "AspNetUsers" ("Id"),
        CONSTRAINT "FK_Projects_Customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717182428_AddProjectManagement') THEN
    CREATE INDEX "IX_JobCards_ProjectId" ON "JobCards" ("ProjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717182428_AddProjectManagement') THEN
    CREATE INDEX "IX_Projects_CustomerId" ON "Projects" ("CustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717182428_AddProjectManagement') THEN
    CREATE INDEX "IX_Projects_ManagerId" ON "Projects" ("ManagerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717182428_AddProjectManagement') THEN
    ALTER TABLE "JobCards" ADD CONSTRAINT "FK_JobCards_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717182428_AddProjectManagement') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260717182428_AddProjectManagement', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    ALTER TABLE "ShiftProductionLogs" ADD "ProjectId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    CREATE TABLE "ProjectMembers" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "ProjectId" integer NOT NULL,
        "UserId" character varying(85) NOT NULL,
        "ProjectRole" character varying(50) NOT NULL,
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_ProjectMembers" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ProjectMembers_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_ProjectMembers_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    CREATE TABLE "ProjectMilestones" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "ProjectId" integer NOT NULL,
        "Title" character varying(200) NOT NULL,
        "Date" timestamp without time zone NOT NULL,
        "IsCompleted" boolean NOT NULL,
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_ProjectMilestones" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ProjectMilestones_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    CREATE TABLE "ProjectTasks" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "Title" character varying(200) NOT NULL,
        "Description" text NOT NULL,
        "Status" integer NOT NULL,
        "Priority" integer NOT NULL,
        "StartDate" timestamp without time zone,
        "DueDate" timestamp without time zone,
        "EstimatedHours" numeric(18,2) NOT NULL,
        "ActualHours" numeric(18,2) NOT NULL,
        "ProjectId" integer NOT NULL,
        "AssignedToId" character varying(85),
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_ProjectTasks" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ProjectTasks_AspNetUsers_AssignedToId" FOREIGN KEY ("AssignedToId") REFERENCES "AspNetUsers" ("Id"),
        CONSTRAINT "FK_ProjectTasks_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    CREATE INDEX "IX_ShiftProductionLogs_ProjectId" ON "ShiftProductionLogs" ("ProjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    CREATE INDEX "IX_ProjectMembers_ProjectId" ON "ProjectMembers" ("ProjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    CREATE INDEX "IX_ProjectMembers_UserId" ON "ProjectMembers" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    CREATE INDEX "IX_ProjectMilestones_ProjectId" ON "ProjectMilestones" ("ProjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    CREATE INDEX "IX_ProjectTasks_AssignedToId" ON "ProjectTasks" ("AssignedToId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    CREATE INDEX "IX_ProjectTasks_ProjectId" ON "ProjectTasks" ("ProjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    ALTER TABLE "ShiftProductionLogs" ADD CONSTRAINT "FK_ShiftProductionLogs_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717202024_AddFullProjectManagement') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260717202024_AddFullProjectManagement', '8.0.11');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260718113635_EnterpriseProjectFeatures') THEN
    ALTER TABLE "Invoices" ADD "ProjectId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260718113635_EnterpriseProjectFeatures') THEN
    ALTER TABLE "Expenses" ADD "ProjectId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260718113635_EnterpriseProjectFeatures') THEN
    CREATE TABLE "ProjectDocuments" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "ProjectId" integer NOT NULL,
        "FileName" character varying(255) NOT NULL,
        "FileUrl" character varying(1000) NOT NULL,
        "UploadedAt" timestamp without time zone NOT NULL,
        "UploadedById" character varying(85),
        "TenantId" integer,
        "CreatedAt" timestamp without time zone NOT NULL,
        "CreatedBy" character varying(85),
        "UpdatedAt" timestamp without time zone,
        "UpdatedBy" character varying(85),
        CONSTRAINT "PK_ProjectDocuments" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ProjectDocuments_AspNetUsers_UploadedById" FOREIGN KEY ("UploadedById") REFERENCES "AspNetUsers" ("Id"),
        CONSTRAINT "FK_ProjectDocuments_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260718113635_EnterpriseProjectFeatures') THEN
    CREATE INDEX "IX_Invoices_ProjectId" ON "Invoices" ("ProjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260718113635_EnterpriseProjectFeatures') THEN
    CREATE INDEX "IX_Expenses_ProjectId" ON "Expenses" ("ProjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260718113635_EnterpriseProjectFeatures') THEN
    CREATE INDEX "IX_ProjectDocuments_ProjectId" ON "ProjectDocuments" ("ProjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260718113635_EnterpriseProjectFeatures') THEN
    CREATE INDEX "IX_ProjectDocuments_UploadedById" ON "ProjectDocuments" ("UploadedById");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260718113635_EnterpriseProjectFeatures') THEN
    ALTER TABLE "Expenses" ADD CONSTRAINT "FK_Expenses_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260718113635_EnterpriseProjectFeatures') THEN
    ALTER TABLE "Invoices" ADD CONSTRAINT "FK_Invoices_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260718113635_EnterpriseProjectFeatures') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260718113635_EnterpriseProjectFeatures', '8.0.11');
    END IF;
END $EF$;
COMMIT;


namespace AnchorPro.Services
{
    /// <summary>
    /// Single source of truth for a role's default allowed routes/permissions when no
    /// TenantRolePermission row exists yet for it — used both as the fallback a brand-new
    /// tenant gets on login (AuthController) right after registering, and as the seed shown
    /// in the Roles &amp; Permissions editor (RolesController). Keep this in sync with the real
    /// construction Sidebar (anchor-pro-web/src/components/Sidebar.tsx) and with every
    /// hasPermission(...) call site in the frontend — a route/permission missing here means a
    /// freshly registered tenant's Admin silently loses that page or button until someone
    /// visits Roles &amp; Permissions (which calls sync-defaults).
    /// </summary>
    public static class DefaultRolePermissions
    {
        public static readonly List<string> AllConstructionBaseRoutes = new()
        {
            "/dashboard", "/dashboard/schedule", "/dashboard/safety",
            "/dashboard/boq", "/dashboard/certificates", "/dashboard/variations", "/dashboard/contracts",
            "/dashboard/projects", "/dashboard/site-diary", "/dashboard/reports/weekly", "/dashboard/reports/monthly",
            "/dashboard/assets", "/dashboard/procurement", "/dashboard/inventory", "/dashboard/tools",
            "/dashboard/finance", "/dashboard/customers", "/dashboard/hr", "/dashboard/roles",
            "/dashboard/settings",
        };

        public static readonly List<string> AllGranularPermissions = new()
        {
            "/dashboard/procurement:approve_reject", "/dashboard/procurement:create_requisitions",
            "/dashboard/procurement:create_orders", "/dashboard/procurement:receive_goods",
            "/dashboard/finance:record_expense",
            "/dashboard/hr:view_contracts", "/dashboard/hr:view_payroll", "/dashboard/hr:view_user_management",
            "/dashboard/hr:view_department_assets", "/dashboard/hr:view_department_procurement", "/dashboard/hr:view_department_financials",
        };

        public static List<string> GetDefaultRoutes(string roleName)
        {
            return roleName switch
            {
                // Admin: everything — every base route and every granular permission.
                "Admin" => AllConstructionBaseRoutes.Concat(AllGranularPermissions).Distinct().ToList(),

                // HR: staff, contracts, payroll, department views. No commercial/QS or roles admin.
                "HR" => new List<string> {
                    "/dashboard", "/dashboard/hr", "/dashboard/customers", "/dashboard/assets",
                    "/dashboard/procurement", "/dashboard/finance",
                    "/dashboard/hr:view_contracts", "/dashboard/hr:view_payroll", "/dashboard/hr:view_user_management",
                    "/dashboard/hr:view_department_assets", "/dashboard/hr:view_department_procurement", "/dashboard/hr:view_department_financials",
                },

                // Planner: runs the program/schedule, BOQ and commercial docs, and reporting.
                "Planner" => new List<string> {
                    "/dashboard", "/dashboard/schedule", "/dashboard/boq", "/dashboard/certificates",
                    "/dashboard/variations", "/dashboard/contracts", "/dashboard/projects",
                    "/dashboard/reports/weekly", "/dashboard/reports/monthly", "/dashboard/safety",
                    "/dashboard/assets", "/dashboard/procurement", "/dashboard/inventory", "/dashboard/tools",
                    "/dashboard/procurement:create_requisitions",
                },

                // Supervisor: on-site — diary, safety, schedule visibility, materials/plant on site.
                "Supervisor" => new List<string> {
                    "/dashboard", "/dashboard/site-diary", "/dashboard/schedule", "/dashboard/safety",
                    "/dashboard/projects", "/dashboard/reports/weekly", "/dashboard/assets",
                    "/dashboard/procurement", "/dashboard/inventory", "/dashboard/tools",
                    "/dashboard/procurement:create_requisitions",
                },

                // Technician: field-level — diary entries, safety, small tools.
                "Technician" => new List<string> {
                    "/dashboard/site-diary", "/dashboard/safety", "/dashboard/tools", "/dashboard/procurement",
                    "/dashboard/procurement:create_requisitions",
                },

                // Purchasing: the full procurement lifecycle plus what it touches.
                "Purchasing" => new List<string> {
                    "/dashboard", "/dashboard/procurement", "/dashboard/inventory", "/dashboard/assets", "/dashboard/tools",
                    "/dashboard/procurement:create_requisitions", "/dashboard/procurement:create_orders",
                },

                // Storeman: goods-in and stock on hand.
                "Storeman" => new List<string> {
                    "/dashboard", "/dashboard/inventory", "/dashboard/procurement", "/dashboard/tools", "/dashboard/assets",
                    "/dashboard/procurement:receive_goods",
                },

                // Finance: cost/ledger, procurement approvals, certificates, client accounts.
                "Finance" => new List<string> {
                    "/dashboard", "/dashboard/finance", "/dashboard/procurement", "/dashboard/certificates",
                    "/dashboard/customers", "/dashboard/contracts",
                    "/dashboard/procurement:approve_reject", "/dashboard/finance:record_expense",
                },

                _ => new List<string>()
            };
        }
    }
}

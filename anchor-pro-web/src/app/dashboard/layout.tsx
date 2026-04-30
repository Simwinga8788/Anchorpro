'use client';

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import RouteGuard from "@/components/RouteGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarProvider, useSidebar } from "@/lib/SidebarContext";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; breadcrumb: string }> = {
  '/dashboard':              { title: 'Dashboard',           breadcrumb: 'Anchor Pro' },
  '/dashboard/my-jobs':      { title: 'My Assignments',      breadcrumb: 'Workspace' },
  '/dashboard/intelligence': { title: 'Intelligence Center', breadcrumb: 'Workspace' },
  '/dashboard/jobs':         { title: 'Job Cards',           breadcrumb: 'Operations' },
  '/dashboard/planning':     { title: 'Planning Board',      breadcrumb: 'Operations' },
  '/dashboard/assets':       { title: 'Asset Registry',      breadcrumb: 'Operations' },
  '/dashboard/downtime':     { title: 'Downtime Log',        breadcrumb: 'Operations' },
  '/dashboard/customers':    { title: 'CRM & Customers',     breadcrumb: 'Operations' },
  '/dashboard/inventory':    { title: 'Inventory & Parts',   breadcrumb: 'Resources' },
  '/dashboard/procurement':  { title: 'Procurement Hub',     breadcrumb: 'Resources' },
  '/dashboard/team':         { title: 'Team',                breadcrumb: 'Resources' },
  '/dashboard/time-tracking':{ title: 'Time Tracking',       breadcrumb: 'Resources' },
  '/dashboard/reports':      { title: 'Reports & Analytics', breadcrumb: 'Governance' },
  '/dashboard/safety':       { title: 'Safety & Compliance', breadcrumb: 'Governance' },
  '/dashboard/invoices':     { title: 'Invoices & Billing',  breadcrumb: 'Governance' },
  '/dashboard/contracts':    { title: 'Contracts',           breadcrumb: 'Governance' },
  '/dashboard/roles':        { title: 'Roles & Permissions', breadcrumb: 'Governance' },
  '/dashboard/settings':     { title: 'Settings',            breadcrumb: 'Anchor Pro' },
};

function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const meta = pageTitles[pathname] ?? { title: 'Dashboard', breadcrumb: 'Anchor Pro' };

  return (
    <RouteGuard>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Topbar
            title={meta.title}
            breadcrumb={meta.breadcrumb}
            onMenuToggle={toggleSidebar}
          />
          <div className="page-content">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardInner>{children}</DashboardInner>
    </SidebarProvider>
  );
}

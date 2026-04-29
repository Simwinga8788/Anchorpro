import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import RouteGuard from "@/components/RouteGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Topbar title="Dashboard" breadcrumb="Anchor Pro" />
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

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Wrench, ClipboardList, BarChart3,
  Building2, Package, Users, ShieldCheck, Zap,
  Settings, LogOut, Activity, Globe, ChevronDown,
  Hash, TrendingUp, Pause, DollarSign, Timer, X, FileText, Shield, UserCog
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import { canAccess } from '@/lib/rbac';
import { useSidebar } from '@/lib/SidebarContext';
import { useState, useEffect } from 'react';
import { adminAccessApi } from '@/lib/api';

// ── Enum constants matching the backend OperationMode enum ────────────────────
const OP = {
  JobCard:            0,
  ShiftProductionLog: 1,
  TripSheet:          2,
  SiteDiary:          3,
  MaintenanceRecord:  4,
  GeneralWorkOrder:   5,
} as const;

// ── Static sections shared by ALL operation modes ─────────────────────────────
const SHARED_SECTIONS = [
  {
    label: 'Project Management',
    items: [
      { href: '/dashboard/projects',          label: 'Projects Portfolio',   icon: Building2 },
      { href: '/dashboard/projects/my-tasks', label: 'My Project Tasks',     icon: Hash },
    ],
  },
  {
    label: 'Human Resources',
    items: [
      { href: '/dashboard/hr',           label: 'HR & Team',            icon: UserCog },
      { href: '/dashboard/roles',        label: 'Roles & Permissions',  icon: Shield },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/finance',      label: 'Cashbook & Payables',  icon: DollarSign },
      { href: '/dashboard/invoices',     label: 'Invoices & Billing',   icon: DollarSign },
      { href: '/dashboard/intelligence', label: 'Intelligence',         icon: TrendingUp },
    ],
  },
  {
    label: 'Sales & Customer',
    items: [
      { href: '/dashboard/customers',    label: 'CRM & Customers',      icon: Users },
      { href: '/dashboard/contracts',    label: 'Client Contracts',     icon: FileText },
    ],
  },
  {
    label: 'Enterprise Asset Mgt',
    items: [
      { href: '/dashboard/assets',       label: 'Asset Registry',       icon: Building2 },
      { href: '/dashboard/inventory',    label: 'Inventory & Parts',    icon: Package },
      { href: '/dashboard/tools',        label: 'Tools Registry',       icon: Wrench },
      { href: '/dashboard/procurement',  label: 'Procurement',          icon: Zap },
    ],
  },
];

// ── Per-mode operations & planning sections ───────────────────────────────────
const OPS_SECTIONS: Record<number, { label: string; items: { href: string; label: string; icon: any }[] }> = {
  // 0 — Workshop / Engineering / Field Service (default)
  [OP.JobCard]: {
    label: 'Operations & Planning',
    items: [
      { href: '/dashboard',               label: 'Dashboard',            icon: LayoutDashboard },
      { href: '/dashboard/performance',   label: 'Performance Metrics',  icon: Activity },
      { href: '/dashboard/my-jobs',       label: 'My Assignments',       icon: ClipboardList },
      { href: '/dashboard/jobs',          label: 'Job Cards',            icon: ClipboardList },
      { href: '/dashboard/planning',      label: 'Planning Board',       icon: Activity },
      { href: '/dashboard/time-tracking', label: 'Time Tracking',        icon: Timer },
      { href: '/dashboard/downtime',      label: 'Downtime Log',         icon: Pause },
      { href: '/dashboard/safety',        label: 'Safety & Compliance',  icon: ShieldCheck },
    ],
  },
  // 1 — Mining & Extraction
  [OP.ShiftProductionLog]: {
    label: 'Mining Operations',
    items: [
      { href: '/dashboard/performance',   label: 'Dashboard',            icon: LayoutDashboard },
      { href: '/dashboard/shift-logs',    label: 'Shift Production Logs',icon: ClipboardList },
      { href: '/dashboard/my-jobs',       label: 'My Shifts',            icon: Hash },
      { href: '/dashboard/planning',      label: 'Shift Scheduling',     icon: Activity },
      { href: '/dashboard/downtime',      label: 'Equipment Downtime',   icon: Pause },
      { href: '/dashboard/safety',        label: 'Safety & Compliance',  icon: ShieldCheck },
      { href: '/dashboard/time-tracking', label: 'Time Tracking',        icon: Timer },
    ],
  },
  // 2 — Transport & Logistics
  [OP.TripSheet]: {
    label: 'Fleet Operations',
    items: [
      { href: '/dashboard',               label: 'Dashboard',            icon: LayoutDashboard },
      { href: '/dashboard/performance',   label: 'Fleet Performance',    icon: Activity },
      { href: '/dashboard/my-jobs',       label: 'My Trips',             icon: ClipboardList },
      { href: '/dashboard/planning',      label: 'Route Planning',       icon: Activity },
      { href: '/dashboard/downtime',      label: 'Vehicle Downtime',     icon: Pause },
      { href: '/dashboard/safety',        label: 'Safety & Compliance',  icon: ShieldCheck },
      { href: '/dashboard/time-tracking', label: 'Driver Hours',         icon: Timer },
    ],
  },
  // 3 — Construction & Civil Works
  [OP.SiteDiary]: {
    label: 'Site Operations',
    items: [
      { href: '/dashboard',               label: 'Dashboard',            icon: LayoutDashboard },
      { href: '/dashboard/performance',   label: 'Site Performance',     icon: Activity },
      { href: '/dashboard/my-jobs',       label: 'My Tasks',             icon: ClipboardList },
      { href: '/dashboard/jobs',          label: 'Work Orders',          icon: ClipboardList },
      { href: '/dashboard/planning',      label: 'Site Schedule',        icon: Activity },
      { href: '/dashboard/downtime',      label: 'Equipment Downtime',   icon: Pause },
      { href: '/dashboard/safety',        label: 'Safety & Compliance',  icon: ShieldCheck },
      { href: '/dashboard/time-tracking', label: 'Labour Hours',         icon: Timer },
    ],
  },
  // 4 — Facilities Management
  [OP.MaintenanceRecord]: {
    label: 'Facilities Operations',
    items: [
      { href: '/dashboard',               label: 'Dashboard',            icon: LayoutDashboard },
      { href: '/dashboard/performance',   label: 'Performance Metrics',  icon: Activity },
      { href: '/dashboard/my-jobs',       label: 'My Work Orders',       icon: ClipboardList },
      { href: '/dashboard/jobs',          label: 'Maintenance Records',  icon: ClipboardList },
      { href: '/dashboard/planning',      label: 'PM Schedule',          icon: Activity },
      { href: '/dashboard/downtime',      label: 'Asset Downtime',       icon: Pause },
      { href: '/dashboard/safety',        label: 'Safety & Compliance',  icon: ShieldCheck },
      { href: '/dashboard/time-tracking', label: 'Technician Hours',     icon: Timer },
    ],
  },
  // 5 — General / fallback
  [OP.GeneralWorkOrder]: {
    label: 'Operations',
    items: [
      { href: '/dashboard',               label: 'Dashboard',            icon: LayoutDashboard },
      { href: '/dashboard/performance',   label: 'Performance Metrics',  icon: Activity },
      { href: '/dashboard/my-jobs',       label: 'My Assignments',       icon: ClipboardList },
      { href: '/dashboard/jobs',          label: 'Work Orders',          icon: ClipboardList },
      { href: '/dashboard/planning',      label: 'Planning Board',       icon: Activity },
      { href: '/dashboard/downtime',      label: 'Downtime Log',         icon: Pause },
      { href: '/dashboard/safety',        label: 'Safety & Compliance',  icon: ShieldCheck },
      { href: '/dashboard/time-tracking', label: 'Time Tracking',        icon: Timer },
    ],
  },
};

const MODE_LABEL: Record<number, { text: string; color: string }> = {
  [OP.JobCard]:            { text: 'Workshop',       color: '#6366f1' },
  [OP.ShiftProductionLog]: { text: 'Mining',         color: '#f59e0b' },
  [OP.TripSheet]:          { text: 'Logistics',      color: '#10b981' },
  [OP.SiteDiary]:          { text: 'Construction',   color: '#ef4444' },
  [OP.MaintenanceRecord]:  { text: 'Facilities',     color: '#8b5cf6' },
  [OP.GeneralWorkOrder]:   { text: 'General',        color: '#6b7280' },
};

function getNavSections(operationMode: number) {
  const opsSection = OPS_SECTIONS[operationMode] ?? OPS_SECTIONS[OP.JobCard];
  return [opsSection, ...SHARED_SECTIONS];
}


export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout, isPlatformOwner } = useAuth();
  const { t } = useDictionary();
  const { mobileOpen, closeSidebar } = useSidebar();
  const [userExpanded, setUserExpanded] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    adminAccessApi.getStatus()
      .then((s: any) => setImpersonating(s?.isImpersonating ?? false))
      .catch(() => {});
  }, []);

  const userRoles   = user?.roles ?? [];
  const displayName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
    : 'Loading…';
  const initials = (
    user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'
  );

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* ── Workspace header ── */}
      <div style={{ padding: '6px 10px 0' }}>
        {/* Mobile close button */}
        <button
          onClick={closeSidebar}
          style={{
            display: 'none',
            position: 'absolute', top: 8, right: 10,
            background: 'transparent', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)',
            padding: 4, borderRadius: 4,
          }}
          className="sidebar-close-btn"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
        {/* Workspace logo */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '10px 10px 4px',
        }}
        >
          <img src="/AnchorPro_logo.png" alt="Anchor Pro Logo" style={{ height: '90px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Operation Mode badge — shows industry context */}
        {user && !isPlatformOwner && (() => {
          const mode = MODE_LABEL[user.operationMode ?? 0] ?? MODE_LABEL[0];
          return (
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 4,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.8px',
                textTransform: 'uppercase', padding: '2px 10px', borderRadius: 20,
                background: `${mode.color}22`, color: mode.color,
                border: `1px solid ${mode.color}44`,
              }}>
                {mode.text}
              </span>
            </div>
          );
        })()}

        {/* Platform Console link */}
        {isPlatformOwner && (
          <Link href="/platform" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 8px', marginTop: 2,
            borderRadius: 6, textDecoration: 'none',
            color: 'var(--accent-blue)', fontSize: 13, fontWeight: 500,
            background: 'var(--accent-blue-dim)',
            transition: 'background 0.1s',
          }}>
            <Globe size={13} />
            Platform Console
          </Link>
        )}
      </div>

      {/* ── Impersonation banner ── */}
      {impersonating && (
        <div style={{
          margin: '4px 10px',
          background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 8,
          padding: '8px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)' }}>Viewing as tenant admin</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Platform Owner session active</div>
          </div>
          <button
            className="btn btn-sm"
            style={{ fontSize: 10, background: 'rgba(245,158,11,0.2)', color: 'var(--accent-amber)', border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={async () => {
              await adminAccessApi.exitImpersonation();
              window.location.href = '/platform/tenants';
            }}
          >
            Exit ↩
          </button>
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

      {/* ── Navigation ── */}
      <div style={{ flex: 1, padding: '6px 6px', overflowY: 'auto' }}>
        {getNavSections(user?.operationMode ?? 0).map((section) => {
          const visibleItems = section.items.filter(item =>
            canAccess(item.href, user?.allowedRoutes || [], isPlatformOwner)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} className="sidebar-section">
              <div className="sidebar-section-label">{t(section.label)}</div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href
                  || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                // Dynamically compute label using DictionaryContext
                let displayLabel = t(item.label);
                if (item.href === '/dashboard/assets') {
                  const equipmentName = t('Equipment', 'Equipment');
                  displayLabel = `${equipmentName} Registry`;
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={15} />
                    <span>{displayLabel}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>


      <div style={{ height: 1, background: 'var(--border-subtle)' }} />

      {/* ── User footer ── */}
      <div style={{ padding: '8px 6px' }}>
        {canAccess('/dashboard/settings', user?.allowedRoutes || [], isPlatformOwner) && (
          <Link href="/dashboard/settings" className="sidebar-nav-item">
            <Settings size={15} /> <span>Settings</span>
          </Link>
        )}

        {/* User row */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
            transition: 'background 0.1s', marginTop: 2,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          onClick={() => window.location.href = '/dashboard/settings'}
        >
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {displayName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {isPlatformOwner ? 'Platform Owner' : (userRoles[0] ?? 'User')}
            </div>
          </div>
          <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>

        {userExpanded && (
          <button
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)', marginTop: 2 }}
          >
            <LogOut size={14} /> <span>Sign out</span>
          </button>
        )}
      </div>
    </aside>
    </>
  );
}

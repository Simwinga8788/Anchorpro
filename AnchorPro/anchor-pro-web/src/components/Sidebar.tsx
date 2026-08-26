'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Wrench, ClipboardList, BarChart3,
  Building2, Package, Users, ShieldCheck, Zap,
  Settings, LogOut, Activity, Globe, ChevronDown,
  Hash, TrendingUp, Pause, DollarSign, Timer, X, FileText, Shield, UserCog,
  Calendar, Camera, FileCheck, Truck, HardHat, FileSpreadsheet, Layers
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import { canAccess } from '@/lib/rbac';
import { useSidebar } from '@/lib/SidebarContext';
import { useState, useEffect } from 'react';
import { adminAccessApi } from '@/lib/api';

// ── Construction Management Suite Navigation ─────────────────────────────────
const CONSTRUCTION_NAV_SECTIONS = [
  {
    label: 'Site & Field Operations',
    items: [
      { href: '/dashboard',               label: 'Site Overview',         icon: LayoutDashboard },
      { href: '/dashboard/site-diary',    label: 'Daily Site Diary',      icon: ClipboardList },
      { href: '/dashboard/shift-logs',    label: 'Daily Shift Logs',      icon: FileCheck },
      { href: '/dashboard/schedule',      label: 'Program & Schedule',    icon: Calendar },
      { href: '/dashboard/time-tracking', label: 'Site Labour Hours',     icon: Timer },
      { href: '/dashboard/downtime',      label: 'Delays & Constraints',  icon: Pause },
      { href: '/dashboard/safety',        label: 'Safety & Incidents',    icon: ShieldCheck },
    ],
  },
  {
    label: 'Commercial & Quantity Surveying',
    items: [
      { href: '/dashboard/boq',           label: 'Bill of Quantities (BOQ)', icon: FileSpreadsheet },
      { href: '/dashboard/certificates',  label: 'Payment Certificates', icon: FileText },
      { href: '/dashboard/variations',    label: 'Variations & Claims',  icon: Layers },
      { href: '/dashboard/contracts',     label: 'Contracts & Terms',    icon: FileCheck },
    ],
  },
  {
    label: 'Project Management & Reporting',
    items: [
      { href: '/dashboard/projects',          label: 'Projects Portfolio',   icon: Building2 },
      { href: '/dashboard/reports/weekly',    label: 'Weekly Progress Report', icon: BarChart3 },
      { href: '/dashboard/reports/monthly',   label: 'Monthly Client Report', icon: FileText },
      { href: '/dashboard/intelligence',      label: 'Project Intelligence', icon: TrendingUp },
    ],
  },
  {
    label: 'Plant, Materials & Procurement',
    items: [
      { href: '/dashboard/assets',       label: 'Plant & Equipment',    icon: Truck },
      { href: '/dashboard/procurement',  label: 'Material Procurement', icon: Zap },
      { href: '/dashboard/inventory',    label: 'Site Materials Store', icon: Package },
      { href: '/dashboard/tools',        label: 'Small Tools Registry', icon: Wrench },
    ],
  },
  {
    label: 'Finance & Administration',
    items: [
      { href: '/dashboard/finance',      label: 'Project Cost & Ledger', icon: DollarSign },
      { href: '/dashboard/invoices',     label: 'Billing & Claims',     icon: DollarSign },
      { href: '/dashboard/customers',    label: 'Clients & Consultants',icon: Users },
      { href: '/dashboard/hr',           label: 'Site Team & HR',       icon: UserCog },
      { href: '/dashboard/roles',        label: 'Roles & Permissions',  icon: Shield },
    ],
  },
];

function getNavSections() {
  return CONSTRUCTION_NAV_SECTIONS;
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

        {/* Construction ERP Suite badge */}
        {user && (
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 4,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.8px',
              textTransform: 'uppercase', padding: '2px 10px', borderRadius: 20,
              background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              Construction Management
            </span>
          </div>
        )}

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
        {getNavSections().map((section) => {
          const visibleItems = section.items.filter(item =>
            canAccess(item.href, user?.allowedRoutes || [], isPlatformOwner, user?.operationMode ?? 0)
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
                    onClick={() => {
                      if (window.innerWidth <= 768) {
                        closeSidebar();
                      }
                    }}
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

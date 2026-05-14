'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Wrench, ClipboardList, BarChart3,
  Building2, Package, Users, ShieldCheck, Zap,
  Settings, LogOut, Activity, Globe, ChevronDown,
  Hash, TrendingUp, Pause, DollarSign, Timer, X, FileText, Shield
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import { canAccess } from '@/lib/rbac';
import { useSidebar } from '@/lib/SidebarContext';
import { useState } from 'react';

const navSections = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard',              label: 'Dashboard',      icon: LayoutDashboard },
      { href: '/dashboard/my-jobs',      label: 'My Assignments', icon: ClipboardList },
      { href: '/dashboard/intelligence', label: 'Intelligence',   icon: TrendingUp },
    ]
  },
  {
    label: 'Operations',
    items: [
      { href: '/dashboard/jobs',          label: 'Job Cards',       icon: ClipboardList },
      { href: '/dashboard/planning',      label: 'Planning Board',  icon: Activity },
      { href: '/dashboard/time-tracking', label: 'Time Tracking',   icon: Timer },
      { href: '/dashboard/assets',        label: 'Asset Registry',  icon: Building2 },
      { href: '/dashboard/downtime',      label: 'Downtime Log',    icon: Pause },
      { href: '/dashboard/customers',     label: 'CRM & Customers', icon: Users },
    ]
  },
  {
    label: 'Resources',
    items: [
      { href: '/dashboard/inventory',   label: 'Inventory & Parts', icon: Package },
      { href: '/dashboard/procurement', label: 'Procurement',       icon: Zap },
      { href: '/dashboard/team',        label: 'Team',              icon: Users },
    ]
  },
  {
    label: 'Governance',
    items: [
      { href: '/dashboard/reports',   label: 'Reports',             icon: BarChart3 },
      { href: '/dashboard/safety',    label: 'Safety & Compliance', icon: ShieldCheck },
      { href: '/dashboard/invoices',  label: 'Invoices & Billing',  icon: DollarSign },
      { href: '/dashboard/contracts', label: 'Contracts',           icon: FileText },
      { href: '/dashboard/roles',     label: 'Roles & Permissions', icon: Shield },
    ]
  }
];

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout, isPlatformOwner } = useAuth();
  const { t } = useDictionary();
  const { mobileOpen, closeSidebar } = useSidebar();
  const [userExpanded, setUserExpanded] = useState(false);

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
      <div style={{ padding: '14px 10px 8px' }}>
        {/* Mobile close button */}
        <button
          onClick={closeSidebar}
          style={{
            display: 'none',
            position: 'absolute', top: 12, right: 10,
            background: 'transparent', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)',
            padding: 4, borderRadius: 4,
          }}
          className="sidebar-close-btn"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
        {/* Workspace name */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
          transition: 'background 0.1s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="sidebar-logo-mark">A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-logo-text">Anchor Pro</div>
            <div className="sidebar-logo-sub">Operations Platform</div>
          </div>
          <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>

        {/* Platform Console link */}
        {isPlatformOwner && (
          <Link href="/platform" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 8px', marginTop: 4,
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

      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

      {/* ── Navigation ── */}
      <div style={{ flex: 1, padding: '6px 6px', overflowY: 'auto' }}>
        {navSections.map((section) => {
          const visibleItems = section.items.filter(item =>
            canAccess(item.href, userRoles, isPlatformOwner)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} className="sidebar-section">
              <div className="sidebar-section-label">{t(section.label)}</div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href
                  || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={15} />
                    <span>{t(item.label)}</span>
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
        <Link href="/dashboard/settings" className="sidebar-nav-item">
          <Settings size={15} /> <span>Settings</span>
        </Link>

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
          <div className="avatar" style={{ width: 24, height: 24, fontSize: 10, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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

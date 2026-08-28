'use client';
import "../globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { useState } from "react";
import { Menu, X, LayoutDashboard, Building2, CreditCard, ClipboardList, Settings, Shield, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <AuthProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
              zIndex: 49, display: 'block',
            }}
          />
        )}

        {/* Platform Sidebar */}
        <aside style={{
          width: 220, minWidth: 220, background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, height: '100vh',
          zIndex: 50,
          transition: 'transform 0.25s cubic-bezier(0.32,0.72,0,1)',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
        }}
          className={`platform-sidebar ${sidebarOpen ? 'platform-sidebar-open' : ''}`}
        >
          {/* Logo */}
          <div style={{ padding: '6px 10px 0' }}>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="platform-sidebar-close"
              style={{
                display: 'none',
                position: 'absolute', top: 8, right: 10,
                background: 'transparent', border: 'none',
                cursor: 'pointer', color: 'var(--text-muted)',
                padding: 4, borderRadius: 4,
              }}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '10px 10px 4px',
            }}>
              <img src="/AnchorPro_logo.png" alt="Anchor Pro Logo" style={{ height: '90px', width: 'auto', objectFit: 'contain' }} />
            </div>
            
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 4,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.8px',
                textTransform: 'uppercase', padding: '2px 10px', borderRadius: 20,
                background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}>
                Platform Console
              </span>
            </div>
          </div>
          
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '12px 0 4px' }} />

          {/* Nav */}
          <div style={{ flex: 1, padding: '6px 6px', overflowY: 'auto' }}>
            {[
              { label: 'Overview', section: true },
              { href: '/platform', label: 'Dashboard', icon: LayoutDashboard },
              { label: 'Governance', section: true },
              { href: '/platform/tenants', label: 'Tenants', icon: Building2 },
              { href: '/platform/payments', label: 'Payments', icon: CreditCard },
              { label: 'Configuration', section: true },
              { href: '/platform/plans', label: 'Plans', icon: ClipboardList },
              { href: '/platform/settings', label: 'Settings', icon: Settings },
              { label: 'Compliance', section: true },
              { href: '/platform/audit', label: 'Audit Logs', icon: Shield },
            ].map((item, i) => {
              if (item.section) {
                return <div key={i} className="sidebar-section-label">{item.label}</div>;
              }
              const Icon = item.icon as any;
              const isActive = pathname === item.href;
              return (
                <div key={i} className="sidebar-section">
                  <Link
                    href={item.href!}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)' }} />

          {/* Exit console */}
          <div style={{ padding: '8px 6px' }}>
            <Link href="/dashboard" className="sidebar-nav-item" style={{ color: 'var(--accent-rose)' }}>
              <LogOut size={15} /> <span>Exit Console</span>
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="platform-main" style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
          {/* Topbar */}
          <div style={{
            height: 52, borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', position: 'sticky', top: 0,
            background: 'var(--topbar-bg)', backdropFilter: 'blur(12px)', zIndex: 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Hamburger — mobile only */}
              <button
                className="platform-hamburger"
                onClick={() => setSidebarOpen(true)}
                style={{
                  display: 'none', background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'var(--text-secondary)',
                  padding: 6, borderRadius: 4, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Menu size={18} />
              </button>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Platform Command Center
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 6px rgba(16,185,129,0.8)', flexShrink: 0 }} />
              <span className="platform-email" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>simwinga8788@gmail.com</span>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>S</div>
            </div>
          </div>
          <div style={{ padding: 28 }}>{children}</div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .platform-sidebar {
            transform: translateX(-100%);
          }
          .platform-sidebar.platform-sidebar-open {
            transform: translateX(0) !important;
          }
          .platform-sidebar-close {
            display: flex !important;
          }
          .platform-main {
            margin-left: 0 !important;
          }
          .platform-hamburger {
            display: flex !important;
          }
          .platform-email {
            display: none;
          }
        }
      `}</style>
    </AuthProvider>
  );
}

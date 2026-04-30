'use client';
import "../globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          width: 220, minWidth: 220, background: '#080808',
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
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0,
              }}>A</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Platform Console</div>
                <div style={{ fontSize: 9, color: 'var(--accent-blue)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Super Admin</div>
              </div>
            </div>
            {/* Close button — mobile only */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="platform-sidebar-close"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'none',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
            {[
              { label: 'Overview', section: true },
              { href: '/platform', label: 'Dashboard', emoji: '⬛' },
              { label: 'Governance', section: true },
              { href: '/platform/tenants', label: 'Tenants', emoji: '🏢' },
              { href: '/platform/payments', label: 'Payments', emoji: '💳' },
              { label: 'Configuration', section: true },
              { href: '/platform/plans', label: 'Plans', emoji: '📋' },
              { href: '/platform/settings', label: 'Settings', emoji: '⚙️' },
              { label: 'Compliance', section: true },
              { href: '/platform/audit', label: 'Audit Logs', emoji: '📜' },
            ].map((item, i) => {
              if (item.section) {
                return <div key={i} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', padding: '12px 8px 5px' }}>{item.label}</div>;
              }
              return (
                <a key={i} href={item.href} className="sidebar-nav-item" onClick={() => setSidebarOpen(false)}>
                  <span style={{ fontSize: 14 }}>{item.emoji}</span> {item.label}
                </a>
              );
            })}
          </nav>

          {/* Exit console */}
          <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)' }}>
            <a href="/dashboard" style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
              borderRadius: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent-rose)',
              textDecoration: 'none',
            }}>← Exit Console</a>
          </div>
        </aside>

        {/* Main */}
        <div className="platform-main" style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
          {/* Topbar */}
          <div style={{
            height: 52, borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', position: 'sticky', top: 0,
            background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)', zIndex: 40,
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

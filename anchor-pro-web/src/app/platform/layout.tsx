'use client';
import "../globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {/* Platform Sidebar */}
        <aside style={{
          width: 220, minWidth: 220, background: '#080808',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, height: '100vh',
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: 'white',
              }}>A</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Platform Console</div>
                <div style={{ fontSize: 9, color: 'var(--accent-blue)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Super Admin</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 8px' }}>
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
                <a key={i} href={item.href} className="sidebar-nav-item">
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
        <div style={{ marginLeft: 220, flex: 1 }}>
          {/* Topbar */}
          <div style={{
            height: 52, borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', position: 'sticky', top: 0,
            background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)', zIndex: 40,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Platform Command Center
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>simwinga8788@gmail.com</span>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>S</div>
            </div>
          </div>
          <div style={{ padding: 28 }}>{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}

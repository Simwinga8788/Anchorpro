'use client';

import { Activity, CheckCircle2, AlertCircle, AlertTriangle, Shield, User, Database } from 'lucide-react';
import { useState } from 'react';

const allLogs = [
  { action: 'User Login',          user: 'simwinga8788@gmail.com',  tenant: 'Platform',        detail: 'Platform Owner authenticated successfully',        time: '2m ago',  level: 'info',    category: 'Auth' },
  { action: 'Tenant Activated',    user: 'System',                  tenant: 'Anchor Corp',     detail: 'Professional plan subscription activated',         time: '1h ago',  level: 'success', category: 'Billing' },
  { action: 'Payment Approved',    user: 'simwinga8788@gmail.com',  tenant: 'Anchor Corp',     detail: 'K2,500 bank transfer verified and approved',        time: '3h ago',  level: 'success', category: 'Billing' },
  { action: 'New User Registered', user: 'tech@anchor.com',         tenant: 'Anchor Corp',     detail: 'Technician role assigned automatically',            time: '5h ago',  level: 'info',    category: 'Users' },
  { action: 'Failed Login',        user: 'unknown@test.com',        tenant: '—',               detail: '3 failed attempts — IP temporarily blocked',       time: '6h ago',  level: 'warning', category: 'Auth' },
  { action: 'Job Card Created',    user: 'planner@anchor.com',      tenant: 'Anchor Corp',     detail: '#JOB-2604-NEW1 Komatsu Excavator repair raised',   time: '8h ago',  level: 'info',    category: 'Operations' },
  { action: 'Plan Viewed',         user: 'simwinga8788@gmail.com',  tenant: 'Platform',        detail: 'Professional plan pricing configuration accessed',  time: '10h ago', level: 'info',    category: 'Config' },
  { action: 'DB Backup Complete',  user: 'System',                  tenant: 'Platform',        detail: 'Nightly backup completed successfully — 840 MB',    time: '12h ago', level: 'success', category: 'System' },
  { action: 'User Login',          user: 'admin@anchorpro.co.zm',   tenant: 'Anchor Pro',      detail: 'Admin authenticated',                              time: '14h ago', level: 'info',    category: 'Auth' },
  { action: 'Inventory Alert',     user: 'System',                  tenant: 'Anchor Corp',     detail: 'Hydraulic Fluid 46 below reorder level (6 drums)', time: '1d ago',  level: 'warning', category: 'Operations' },
];

const categories = ['All', 'Auth', 'Billing', 'Users', 'Operations', 'System', 'Config'];

const levelConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  success: { color: 'var(--accent-emerald)', icon: <CheckCircle2 size={14}/> },
  info:    { color: 'var(--accent-blue)',    icon: <Activity size={14}/> },
  warning: { color: 'var(--accent-amber)',   icon: <AlertTriangle size={14}/> },
  error:   { color: 'var(--accent-rose)',    icon: <AlertCircle size={14}/> },
};

const categoryIcon: Record<string, React.ReactNode> = {
  Auth:       <Shield size={11}/>,
  Billing:    <CheckCircle2 size={11}/>,
  Users:      <User size={11}/>,
  Operations: <Activity size={11}/>,
  System:     <Database size={11}/>,
  Config:     <AlertCircle size={11}/>,
};

export default function AuditLogsPage() {
  const [cat, setCat] = useState('All');
  const filtered = allLogs.filter(l => cat === 'All' || l.category === cat);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Audit Logs</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Complete event trail across all tenants and platform operations</p>
        </div>
        <span className="badge badge-blue" style={{ padding: '6px 12px' }}>
          <span className="status-dot blue" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}/>
          Live Stream
        </span>
      </div>

      <div className="card">
        {/* Filter bar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)} className="btn btn-sm" style={{
              background: cat === c ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
              color: cat === c ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${cat === c ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {categoryIcon[c]} {c}
            </button>
          ))}
        </div>

        {/* Log List */}
        <div>
          {filtered.map((log, i) => {
            const lc = levelConfig[log.level] ?? levelConfig['info'];
            return (
              <div key={i} style={{
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                transition: 'background 0.12s',
              }}>
                {/* Level icon */}
                <div style={{ flexShrink: 0, marginTop: 2, color: lc.color }}>{lc.icon}</div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{log.action}</span>
                    <span className="badge badge-muted" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      {categoryIcon[log.category]} {log.category}
                    </span>
                    {log.tenant !== 'Platform' && (
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>{log.tenant}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 3 }}>{log.detail}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {log.user}</div>
                </div>

                {/* Timestamp */}
                <div style={{ flexShrink: 0, fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: 2 }}>{log.time}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {allLogs.length} events
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

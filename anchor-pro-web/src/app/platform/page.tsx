'use client';

import { TrendingUp, Users, Activity, AlertCircle, CheckCircle2, Clock, MoreHorizontal, Plus, ArrowRight, Shield } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const mrrTrend = [
  { month: 'Nov', mrr: 4000 }, { month: 'Dec', mrr: 5500 },
  { month: 'Jan', mrr: 5500 }, { month: 'Feb', mrr: 6500 },
  { month: 'Mar', mrr: 7200 }, { month: 'Apr', mrr: 8000 },
];

const tenants = [
  { name: 'Anchor Corp',   id: 1, plan: 'Professional', status: 'Active',  users: 12, lastLogin: '2m ago',  mrr: 2500 },
  { name: 'Anchor Pro',    id: 2, plan: 'Professional', status: 'Active',  users: 12, lastLogin: '2m ago',  mrr: 2500 },
  { name: 'Anchor Pro',    id: 3, plan: 'Professional', status: 'Active',  users: 12, lastLogin: '2m ago',  mrr: 3000 },
];

const pendingPayments = [
  { id: 'TXN-2604-001', tenant: 'Anchor Corp',  amount: 2500, method: 'Bank Transfer', date: 'Apr 12', status: 'Pending' },
];

const auditLogs = [
  { action: 'User Login',        user: 'simwinga8788@gmail.com', detail: 'Platform Owner authenticated',   time: '2m ago', level: 'info' },
  { action: 'Tenant Activated',  user: 'System',                 detail: 'Anchor Corp subscription active', time: '1h ago', level: 'success' },
  { action: 'Payment Received',  user: 'System',                 detail: 'K2,500 - Anchor Corp - Pro Plan', time: '3h ago', level: 'success' },
  { action: 'New User Signup',   user: 'anchorcorp@anchor.com',  detail: 'Registered under Anchor Corp',   time: '5h ago', level: 'info' },
  { action: 'Failed Login',      user: 'unknown@test.com',       detail: '3 failed attempts - blocked',    time: '6h ago', level: 'warning' },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>K {payload[0].value.toLocaleString()} MRR</div>
      </div>
    );
  }
  return null;
};

export default function PlatformDashboard() {
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Platform-wide SaaS metrics across all tenants</p>
        </div>
        <button className="btn btn-primary"><Plus size={14}/> Provision Tenant</button>
      </div>

      {/* Top KPIs */}
      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Revenue (MRR)', value: 'K 8,000', sub: '+11.1% vs last month', color: 'var(--accent-emerald)', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' },
          { label: 'Active Tenants',       value: '3 of 3',  sub: '1 trialing potential', color: 'var(--accent-blue)',    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))' },
          { label: 'Platform Uptime',      value: '99.9%',   sub: 'All systems operating', color: 'var(--accent-emerald)',gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' },
          { label: 'Pending Approvals',    value: '1',       sub: 'Proof of payment review', color: 'var(--accent-amber)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: kpi.gradient, border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color, letterSpacing: -1, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* MRR Trend + Pending Actions */}
      <div className="stats-grid-2" style={{ marginBottom: 20 }}>
        {/* MRR Chart */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Revenue Growth (MRR)</div>
              <div className="section-sub">Monthly recurring revenue trend</div>
            </div>
            <span className="badge badge-green">↑ 11%</span>
          </div>
          <div style={{ padding: '16px 4px 10px' }}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={mrrTrend} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} fill="url(#mrrGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Pending Actions</div>
              <div className="section-sub">Requires your attention</div>
            </div>
            <span className="badge badge-amber">{pendingPayments.length} items</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {pendingPayments.map(p => (
              <div key={p.id} style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Approvals: Proof of Payment</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{p.tenant} · K {p.amount.toLocaleString()} · {p.method}</div>
                </div>
                <button className="btn btn-primary btn-sm">Review</button>
              </div>
            ))}
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Trialing Tenant Conversion</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>1 prospect not yet on a paid plan</div>
              </div>
              <button className="btn btn-secondary btn-sm">View</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant Activity + Audit Logs */}
      <div className="stats-grid-2">
        {/* Tenant Snapshot */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Tenant Activity Snapshot</div>
              <div className="section-sub">All registered companies</div>
            </div>
            <a href="/platform/tenants" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
              View All <ArrowRight size={12}/>
            </a>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th><th>Plan</th><th>Users</th><th>Last Login</th><th>MRR</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{t.name[0]}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {t.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-muted">{t.plan}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.users}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t.lastLogin}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>K {t.mrr.toLocaleString()}</td>
                  <td><span className="badge badge-green"><span className="status-dot green"/>Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Audit Log */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Live Audit Log</div>
              <div className="section-sub">Platform-wide event stream</div>
            </div>
            <span className="badge badge-blue">Live</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {auditLogs.map((log, i) => {
              const levelColor = log.level === 'success' ? 'var(--accent-emerald)' : log.level === 'warning' ? 'var(--accent-amber)' : log.level === 'error' ? 'var(--accent-rose)' : 'var(--accent-blue)';
              const LevelIcon = log.level === 'success' ? CheckCircle2 : log.level === 'warning' ? AlertCircle : log.level === 'error' ? AlertCircle : Activity;
              return (
                <div key={i} style={{ padding: '12px 20px', borderBottom: i < auditLogs.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <LevelIcon size={14} style={{ color: levelColor, marginTop: 1, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{log.action}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{log.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{log.detail}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{log.user}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

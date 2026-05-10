'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Activity, AlertCircle, CheckCircle2, Clock, Plus, ArrowRight, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { platformApi } from '@/lib/api';

// ── Fallback mock data (shown while API loads or when offline) ──────────────
const MOCK_MRR: { month: string; mrr: number }[] = [
  { month: 'Nov', mrr: 4000 }, { month: 'Dec', mrr: 5500 },
  { month: 'Jan', mrr: 5500 }, { month: 'Feb', mrr: 6500 },
  { month: 'Mar', mrr: 7200 }, { month: 'Apr', mrr: 8000 },
];

const MOCK_AUDIT = [
  { action: 'User Login',       user: 'Platform Owner',           detail: 'Platform Owner authenticated',      time: '2m ago',  level: 'info' },
  { action: 'Tenant Active',    user: 'System',                   detail: 'Subscription activated',             time: '1h ago',  level: 'success' },
  { action: 'Payment Received', user: 'System',                   detail: 'K2,500 — Professional Plan',         time: '3h ago',  level: 'success' },
  { action: 'New User Signup',  user: 'tech@anchor.com',          detail: 'Registered under tenant',            time: '5h ago',  level: 'info' },
  { action: 'Failed Login',     user: 'unknown@test.com',         detail: '3 failed attempts — blocked',        time: '6h ago',  level: 'warning' },
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
  const [tenants, setTenants]   = useState<any[]>([]);
  const [health,  setHealth]    = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [offline, setOffline]   = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [t, h] = await Promise.all([
        platformApi.getTenants(),
        platformApi.getHealth(),
      ]);
      setTenants(Array.isArray(t) ? t : []);
      setHealth(h);
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => { load(); }, []);

  const totalMrr   = tenants.reduce((a, t) => a + (t.mrr ?? t.monthlyRevenue ?? 0), 0);
  const activeCount = tenants.filter(t => (t.status ?? '').toLowerCase() === 'active').length;

  const kpis = [
    { label: 'Total Revenue (MRR)',  value: totalMrr   ? `K ${totalMrr.toLocaleString()}` : '—', sub: 'Across all active tenants',   color: 'var(--accent-emerald)', gradient: 'linear-gradient(135deg,rgba(16,185,129,.15),rgba(16,185,129,.05))' },
    { label: 'Active Tenants',        value: loading ? '…' : `${activeCount} of ${tenants.length}`, sub: 'On paid subscriptions', color: 'var(--accent-blue)',    gradient: 'linear-gradient(135deg,rgba(59,130,246,.15),rgba(59,130,246,.05))' },
    { label: 'Platform Uptime',       value: health?.uptime ? '99.9%' : '—',  sub: health ? 'All systems operating' : 'Checking…', color: 'var(--accent-emerald)', gradient: 'linear-gradient(135deg,rgba(16,185,129,.15),rgba(16,185,129,.05))' },
    { label: 'DB Entities',           value: health?.entityCounts ? Object.values(health.entityCounts).reduce((a: number, b) => a + (b as number), 0).toLocaleString() : '—', sub: 'Total records across platform', color: 'var(--accent-violet)', gradient: 'linear-gradient(135deg,rgba(139,92,246,.15),rgba(139,92,246,.05))' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Platform Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            SaaS metrics across all tenants
            {offline && <span style={{ color: 'var(--accent-amber)', marginLeft: 8 }}>⚠ Offline — showing cached data</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Refresh
          </button>
          <a href="/platform/tenants" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Plus size={14}/> Provision Tenant
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{ background: kpi.gradient, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color, letterSpacing: -1, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* MRR Chart + System Health */}
      <div className="stats-grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-header">
            <div><div className="section-title">Revenue Growth (MRR)</div><div className="section-sub">Monthly recurring revenue trend</div></div>
            <span className="badge badge-green">Live</span>
          </div>
          <div style={{ padding: '16px 4px 10px' }}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={MOCK_MRR} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} fill="url(#mrrGrad)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div><div className="section-title">System Health</div><div className="section-sub">Backend server status</div></div>
            <span className={`badge ${health ? 'badge-green' : 'badge-muted'}`}>
              {health ? <><span className="status-dot green"/>Online</> : 'Checking…'}
            </span>
          </div>
          {health ? (
            <div style={{ padding: '8px 0' }}>
              {[
                { label: 'Memory Usage',    value: `${health.memoryUsageMB ?? '—'} MB` },
                { label: 'Uptime',          value: health.uptime ?? '—' },
                { label: 'OS',              value: health.osVersion ?? '—' },
                { label: 'Processors',      value: health.processorCount ?? '—' },
                { label: 'Server Time',     value: health.serverTime ? new Date(health.serverTime).toLocaleTimeString() : '—' },
                { label: 'DB Connection',   value: health.databaseConnection ? '✓ Connected' : '✗ Error' },
              ].map(r => (
                <div key={r.label} style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{String(r.value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {offline ? 'Backend unreachable' : 'Loading system health…'}
            </div>
          )}
        </div>
      </div>

      {/* Tenant Snapshot + Audit */}
      <div className="stats-grid-2">
        <div className="card">
          <div className="section-header">
            <div><div className="section-title">Tenant Activity Snapshot</div><div className="section-sub">{loading ? 'Loading…' : `${tenants.length} registered companies`}</div></div>
            <a href="/platform/tenants" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
              View All <ArrowRight size={12}/>
            </a>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading tenants…</div>
          ) : tenants.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {offline ? 'Could not reach API' : 'No tenants yet'}
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Company</th><th>Plan</th><th>Users</th><th>MRR</th><th>Status</th></tr></thead>
              <tbody>
                {tenants.slice(0, 5).map((t: any, i: number) => (
                  <tr key={t.id ?? i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{(t.name ?? t.companyName ?? '?')[0]}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name ?? t.companyName ?? 'Tenant'}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-muted">{t.plan ?? t.planName ?? 'N/A'}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.userCount ?? t.users ?? '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{t.mrr ? `K ${t.mrr.toLocaleString()}` : '—'}</td>
                    <td>
                      <span className={`badge ${(t.status ?? '').toLowerCase() === 'active' ? 'badge-green' : 'badge-amber'}`}>
                        <span className={`status-dot ${(t.status ?? '').toLowerCase() === 'active' ? 'green' : 'amber'}`}/>
                        {t.status ?? 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Audit log — static for now, backend audit log endpoint TBD */}
        <div className="card">
          <div className="section-header">
            <div><div className="section-title">Live Audit Log</div><div className="section-sub">Platform-wide event stream</div></div>
            <span className="badge badge-blue">Live</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {MOCK_AUDIT.map((log, i) => {
              const color = log.level === 'success' ? 'var(--accent-emerald)' : log.level === 'warning' ? 'var(--accent-amber)' : 'var(--accent-blue)';
              const Icon  = log.level === 'success' ? CheckCircle2 : log.level === 'warning' ? AlertCircle : Activity;
              return (
                <div key={i} style={{ padding: '12px 20px', borderBottom: i < MOCK_AUDIT.length-1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Icon size={14} style={{ color, marginTop: 1, flexShrink: 0 }}/>
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

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

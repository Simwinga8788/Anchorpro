'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Activity, AlertCircle, CheckCircle2, Clock, Plus, ArrowRight, RefreshCw } from 'lucide-react';
import { platformApi } from '@/lib/api';
import { subscriptionsApi, auditLogApi } from '@/lib/api';

export default function PlatformDashboard() {
  const [tenants, setTenants]   = useState<any[]>([]);
  const [health,  setHealth]    = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [offline, setOffline]   = useState(false);
  const [mrrTrend, setMrrTrend] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [t, h, mrr, auditRes] = await Promise.all([
        platformApi.getTenants(),
        platformApi.getHealth(),
        subscriptionsApi.getMrrTrend(),
        auditLogApi.getLogs({ pageSize: '5' })
      ]);
      setTenants(Array.isArray(t) ? t : []);
      setHealth(h);
      setMrrTrend(Array.isArray(mrr) ? mrr : []);
      setAuditLogs(auditRes?.logs || []);
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
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, padding: '20px 16px 10px', gap: 4 }}>
              {mrrTrend.map((t: any, i: number) => {
                const maxVal = Math.max(...mrrTrend.map((d: any) => d.mrr), 1);
                const hPct = (t.mrr / maxVal) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 8, height: '100%' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', opacity: t.mrr > 0 ? 1 : 0 }}>${t.mrr}k</div>
                    <div style={{ width: '100%', maxWidth: 24, height: `${hPct}%`, background: '#10b981', borderRadius: '4px 4px 0 0', opacity: 0.8 }} title={`$${t.mrr}k in ${t.month}`} />
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{t.month}</div>
                  </div>
                );
              })}
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
            {auditLogs.length === 0 ? (
               <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No recent activity</div>
            ) : auditLogs.map((log: any, i: number) => {
              const isWarning = log.action.toLowerCase().includes('fail') || log.action.toLowerCase().includes('delete');
              const isSuccess = log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('active');
              const color = isSuccess ? 'var(--accent-emerald)' : isWarning ? 'var(--accent-amber)' : 'var(--accent-blue)';
              const Icon  = isSuccess ? CheckCircle2 : isWarning ? AlertCircle : Activity;
              return (
                <div key={log.id ?? i} style={{ padding: '12px 20px', borderBottom: i < auditLogs.length-1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Icon size={14} style={{ color, marginTop: 1, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{log.action}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{log.module} — {log.newValue ? `Value: ${log.newValue}` : 'Logged'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>By: {log.changedBy}</div>
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

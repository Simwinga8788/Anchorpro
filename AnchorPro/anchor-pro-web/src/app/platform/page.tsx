'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, Users, Building2, Activity, Database,
  Server, Cpu, Clock, CheckCircle, XCircle, AlertTriangle,
  TrendingUp, Plus, ArrowRight, Shield
} from 'lucide-react';
import { platformApi, subscriptionsApi, auditLogApi, tenantsApi } from '@/lib/api';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtUptime(uptime: any): string {
  if (!uptime) return '—';
  if (typeof uptime === 'object') {
    const d = uptime.days ?? 0;
    const h = uptime.hours ?? 0;
    const m = uptime.minutes ?? 0;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
  if (typeof uptime !== 'string') return '—';
  const parts = uptime.split(':');
  if (parts.length < 2) return uptime;
  const dayParts = parts[0].split('.');
  if (dayParts.length === 2) {
    const d = parseInt(dayParts[0]);
    const h = parseInt(dayParts[1]);
    return d > 0 ? `${d}d ${h}h` : `${h}h`;
  }
  const h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmrr(v: number) {
  if (!v) return 'K 0';
  if (v >= 1_000_000) return `K ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `K ${(v / 1000).toFixed(1)}k`;
  return `K ${v.toFixed(0)}`;
}

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub: string; color: string; icon: any }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function SectionCard({ title, sub, action, children }: { title: string; sub: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="section-header">
        <div>
          <div className="section-title">{title}</div>
          <div className="section-sub">{sub}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: ok ? '#10b981' : '#ef4444',
      marginRight: 6, flexShrink: 0,
    }} />
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function PlatformDashboard() {
  const [tenants,   setTenants]   = useState<any[]>([]);
  const [health,    setHealth]    = useState<any>(null);
  const [mrrTrend,  setMrrTrend]  = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [offline,   setOffline]   = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, h, mrr, audit] = await Promise.all([
        platformApi.getTenants().catch(() => []),
        platformApi.getHealth().catch(() => null),
        subscriptionsApi.getMrrTrend().catch(() => []),
        auditLogApi.getLogs({ pageSize: '8' }).catch(() => null),
      ]);
      setTenants(Array.isArray(t) ? t : []);
      setHealth(h);
      setMrrTrend(Array.isArray(mrr) ? mrr : []);
      setAuditLogs(audit?.logs ?? []);
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── derived stats — computed from actual data only ─────────────────────────
  const activeCount     = tenants.filter(t => (t.status ?? '').toLowerCase() === 'active').length;
  const totalUsers      = tenants.reduce((s, t) => s + (t.users ?? 0), 0);
  const totalMrr        = tenants.reduce((s, t) => s + (t.mrr ?? 0), 0);
  const entityTotal     = health?.entityCounts
    ? Object.values(health.entityCounts as Record<string, number>).reduce((a, b) => a + b, 0)
    : 0;
  const mrrMax          = Math.max(...mrrTrend.map((d: any) => d.mrr ?? 0), 1);
  const currentMrr      = mrrTrend.length ? mrrTrend[mrrTrend.length - 1]?.mrr ?? 0 : totalMrr;
  const prevMrr         = mrrTrend.length > 1 ? mrrTrend[mrrTrend.length - 2]?.mrr ?? 0 : 0;
  const mrrGrowth       = prevMrr > 0 ? (((currentMrr - prevMrr) / prevMrr) * 100).toFixed(1) : null;

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.4, marginBottom: 4 }}>
            Platform Overview
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {offline
              ? <span style={{ color: '#f59e0b' }}>⚠ Cannot reach backend — showing stale data</span>
              : <>Last refreshed {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={load}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            id="platform-refresh-btn"
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <a
            href="/platform/tenants"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            id="platform-provision-btn"
          >
            <Plus size={14} /> Provision Tenant
          </a>
        </div>
      </div>

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        <KpiCard
          label="Total MRR"
          value={loading ? '…' : fmrr(currentMrr || totalMrr)}
          sub={mrrGrowth ? `${mrrGrowth}% vs last month` : 'Monthly recurring revenue'}
          color="#10b981"
          icon={TrendingUp}
        />
        <KpiCard
          label="Active Tenants"
          value={loading ? '…' : `${activeCount} / ${tenants.length}`}
          sub="On paid or trial plans"
          color="#3b82f6"
          icon={Building2}
        />
        <KpiCard
          label="Total Users"
          value={loading ? '…' : totalUsers.toLocaleString()}
          sub="Across all tenant accounts"
          color="#8b5cf6"
          icon={Users}
        />
        <KpiCard
          label="DB Records"
          value={loading ? '…' : (health ? entityTotal.toLocaleString() : '—')}
          sub={health?.databaseConnection ? 'Database connected' : (health ? 'DB error' : 'Checking…')}
          color={health?.databaseConnection ? '#10b981' : '#ef4444'}
          icon={Database}
        />
      </div>

      {/* ── MRR chart + System Health ─────────────────────────────────────── */}
      <div className="stats-grid-2" style={{ marginBottom: 20 }}>

        {/* MRR bar chart — uses real mrrTrend data from /api/subscriptions/mrr-trend */}
        <SectionCard
          title="MRR Trend"
          sub="6-month monthly recurring revenue"
          action={
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <StatusDot ok={true} /> Live
            </span>
          }
        >
          {mrrTrend.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {loading ? 'Loading…' : 'No MRR data available'}
            </div>
          ) : (
            <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
              {mrrTrend.map((pt: any, i: number) => {
                const pct = mrrMax > 0 ? Math.max(4, (pt.mrr / mrrMax) * 100) : 4;
                const isLast = i === mrrTrend.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                    {pt.mrr > 0 && (
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmrr(pt.mrr)}</span>
                    )}
                    <div
                      title={`${pt.month}: ${fmrr(pt.mrr)}`}
                      style={{
                        width: '100%',
                        height: `${pct}%`,
                        background: isLast ? '#10b981' : 'var(--border-default)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease',
                        minHeight: 4,
                      }}
                    />
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{pt.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* System Health — uses real /api/dashboard/health data */}
        <SectionCard
          title="System Health"
          sub="Backend server diagnostics"
          action={
            health ? (
              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <StatusDot ok={true} /> Online
              </span>
            ) : (
              <span className="badge badge-muted">{loading ? 'Checking…' : 'Offline'}</span>
            )
          }
        >
          {!health ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {loading ? 'Loading…' : 'Backend unreachable'}
            </div>
          ) : (
            <div>
              {([
                { label: 'Memory Usage',   value: `${health.memoryUsageMB ?? '—'} MB`,    icon: Cpu,      ok: true },
                { label: 'Process Uptime', value: fmtUptime(health.uptime),                 icon: Clock,    ok: true },
                { label: 'Processors',     value: `${health.processorCount ?? '—'} cores`, icon: Server,   ok: true },
                { label: 'DB Connection',  value: health.databaseConnection ? 'Connected' : 'Error', icon: Database, ok: health.databaseConnection },
                { label: 'Server Time',    value: health.serverTime ? new Date(health.serverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—', icon: Activity, ok: true },
              ] as { label: string; value: string; icon: any; ok: boolean }[]).map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <row.icon size={13} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{row.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!row.ok && <XCircle size={12} style={{ color: '#ef4444' }} />}
                    {row.ok  && <CheckCircle size={12} style={{ color: '#10b981' }} />}
                    <span style={{ fontSize: 12, fontWeight: 600, color: row.ok ? 'var(--text-primary)' : '#ef4444' }}>{row.value}</span>
                  </div>
                </div>
              ))}
              {/* DB entity counts */}
              {health.entityCounts && (
                <div style={{ padding: '10px 20px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Record Counts</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                    {Object.entries(health.entityCounts as Record<string, number>).map(([k, v]) => (
                      <div key={k} style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v.toLocaleString()}</span> {k}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Tenant list + Audit log ───────────────────────────────────────── */}
      <div className="stats-grid-2">

        {/* Tenants — from GET /api/admin-access/tenants */}
        <SectionCard
          title="Tenant Roster"
          sub={loading ? 'Loading…' : `${tenants.length} registered companies`}
          action={
            <a href="/platform/tenants" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
              Manage <ArrowRight size={12} />
            </a>
          }
        >
          {loading ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading tenants…</div>
          ) : tenants.length === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {offline ? 'Cannot reach API' : 'No tenants provisioned yet'}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Plan</th>
                  <th style={{ textAlign: 'right' }}>Users</th>
                  <th style={{ textAlign: 'right' }}>MRR</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t: any, i: number) => {
                  const isActive = (t.status ?? '').toLowerCase() === 'active';
                  return (
                    <tr key={t.id ?? i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 26, height: 26, fontSize: 10, flexShrink: 0 }}>
                            {(t.name ?? '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name ?? 'Tenant'}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID #{t.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-muted" style={{ fontSize: 10 }}>{t.plan ?? 'N/A'}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t.users ?? '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                        {t.mrr ? fmrr(t.mrr) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-green' : 'badge-amber'}`} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                          <StatusDot ok={isActive} />{t.status ?? 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </SectionCard>

        {/* Audit Log — from GET /api/audit-log */}
        <SectionCard
          title="Recent Audit Events"
          sub="Platform-wide activity stream"
          action={
            <a href="/platform/audit" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
              Full Log <ArrowRight size={12} />
            </a>
          }
        >
          {loading ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
          ) : auditLogs.length === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {offline ? 'Cannot reach API' : 'No recent audit events'}
            </div>
          ) : (
            <div>
              {auditLogs.map((log: any, i: number) => {
                const action = (log.action ?? '').toLowerCase();
                const isBad  = action.includes('fail') || action.includes('delete') || action.includes('suspend');
                const isGood = action.includes('create') || action.includes('active') || action.includes('login');
                const color  = isBad ? '#ef4444' : isGood ? '#10b981' : '#3b82f6';
                const Icon   = isBad ? AlertTriangle : isGood ? CheckCircle : Shield;
                return (
                  <div
                    key={log.id ?? i}
                    style={{
                      display: 'flex', gap: 10, padding: '11px 20px',
                      borderBottom: i < auditLogs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Icon size={13} style={{ color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.action}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {log.timestamp ? timeAgo(log.timestamp) : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {log.module}{log.changedBy ? ` · ${log.changedBy}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, Building2, Users, TrendingUp,
  Plus, ArrowRight, CheckCircle, XCircle, AlertTriangle,
  Shield, Activity, Zap
} from 'lucide-react';
import { platformApi, subscriptionsApi, auditLogApi } from '@/lib/api';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmrr(v: number) {
  if (!v) return 'K 0';
  if (v >= 1_000_000) return `K ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `K ${(v / 1000).toFixed(1)}k`;
  return `K ${v.toFixed(0)}`;
}

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function PlatformDashboard() {
  const [tenants,   setTenants]   = useState<any[]>([]);
  const [health,    setHealth]    = useState<any>(null);
  const [mrrTrend,  setMrrTrend]  = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [offline,   setOffline]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, h, mrr, audit] = await Promise.all([
        platformApi.getTenants().catch(() => []),
        platformApi.getHealth().catch(() => null),
        subscriptionsApi.getMrrTrend().catch(() => []),
        auditLogApi.getLogs({ pageSize: '10' }).catch(() => null),
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
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── derived ──────────────────────────────────────────────────────────────
  const activeCount = tenants.filter(t => (t.status ?? '').toLowerCase() === 'active').length;
  const totalUsers  = tenants.reduce((s, t) => s + (t.users ?? 0), 0);
  const mrrNow      = mrrTrend.length ? (mrrTrend[mrrTrend.length - 1]?.mrr ?? 0) : tenants.reduce((s, t) => s + (t.mrr ?? 0), 0);
  const mrrPrev     = mrrTrend.length > 1 ? (mrrTrend[mrrTrend.length - 2]?.mrr ?? 0) : 0;
  const mrrDelta    = mrrPrev > 0 ? (((mrrNow - mrrPrev) / mrrPrev) * 100).toFixed(1) : null;
  const mrrMax      = Math.max(...mrrTrend.map((d: any) => d.mrr ?? 0), 1);
  const dbOk        = health?.databaseConnection;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.4 }}>
            Platform Overview
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            {offline
              ? <span style={{ color: 'var(--accent-amber)' }}>⚠ Cannot reach backend</span>
              : <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: dbOk ? '#10b981' : '#888', display: 'inline-block' }} />
                  {dbOk ? 'All systems online' : 'Checking…'}
                </span>
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={load}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <a
            href="/platform/tenants"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <Plus size={14} /> New Tenant
          </a>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {([
          {
            label: 'Monthly Revenue',
            value: loading ? '…' : fmrr(mrrNow),
            sub:   mrrDelta ? `${Number(mrrDelta) >= 0 ? '+' : ''}${mrrDelta}% vs last month` : 'MRR across active tenants',
            color: '#10b981',
            icon:  TrendingUp,
          },
          {
            label: 'Active Tenants',
            value: loading ? '…' : `${activeCount}`,
            sub:   loading ? '' : `${tenants.length - activeCount} inactive`,
            color: '#4D9EFF',
            icon:  Building2,
          },
          {
            label: 'Total Users',
            value: loading ? '…' : totalUsers.toLocaleString(),
            sub:   'Across all tenant accounts',
            color: '#A78BFA',
            icon:  Users,
          },
        ] as { label: string; value: string; sub: string; color: string; icon: any }[]).map(kpi => (
          <div
            key={kpi.label}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{kpi.label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${kpi.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={13} style={{ color: kpi.color }} />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -1, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 7 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── MRR sparkline bar ────────────────────────────────────────────── */}
      {mrrTrend.length > 0 && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Revenue Trend</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>6 months</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72 }}>
            {mrrTrend.map((pt: any, i: number) => {
              const pct    = mrrMax > 0 ? Math.max(5, (pt.mrr / mrrMax) * 100) : 5;
              const isLast = i === mrrTrend.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    title={`${pt.month}: ${fmrr(pt.mrr)}`}
                    style={{
                      width: '100%',
                      height: `${pct}%`,
                      minHeight: 4,
                      background: isLast ? '#10b981' : 'var(--border-default)',
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{pt.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tenant table + Audit feed ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>

        {/* Tenants */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Tenants</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{loading ? 'Loading…' : `${tenants.length} registered`}</div>
            </div>
            <a href="/platform/tenants" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
              Manage <ArrowRight size={12} />
            </a>
          </div>

          {loading ? (
            <div style={{ padding: '30px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
          ) : tenants.length === 0 ? (
            <div style={{ padding: '30px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {offline ? 'Cannot reach API' : 'No tenants provisioned'}
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
                  const active = (t.status ?? '').toLowerCase() === 'active';
                  return (
                    <tr key={t.id ?? i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div
                            className="avatar"
                            style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0, background: `hsl(${(t.id ?? i) * 57 % 360},55%,30%)` }}
                          >
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
                        <span
                          className={`badge ${active ? 'badge-green' : 'badge-amber'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                          {t.status ?? 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Audit feed */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Activity</div>
            <a href="/platform/audit" style={{ fontSize: 11, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
              Full log →
            </a>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading…</div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No recent activity</div>
            ) : auditLogs.map((log: any, i: number) => {
              const action = (log.action ?? '').toLowerCase();
              const isBad  = action.includes('fail') || action.includes('delete') || action.includes('suspend');
              const isGood = action.includes('create') || action.includes('active') || action.includes('login');
              const color  = isBad ? '#ef4444' : isGood ? '#10b981' : '#4D9EFF';
              const Icon   = isBad ? AlertTriangle : isGood ? CheckCircle : (action.includes('impersonat') ? Shield : Activity);
              return (
                <div
                  key={log.id ?? i}
                  style={{
                    display: 'flex', gap: 10, padding: '10px 16px',
                    borderBottom: i < auditLogs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon size={11} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {log.timestamp ? timeAgo(log.timestamp) : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.module}{log.changedBy ? ` · ${log.changedBy}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

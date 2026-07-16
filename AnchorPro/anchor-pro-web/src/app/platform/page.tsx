'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw, Building2, Users, TrendingUp, DollarSign,
  Plus, ArrowRight, AlertTriangle, Shield, Activity,
  CheckCircle, XCircle, Clock, CreditCard, Zap,
  ChevronRight, MoreHorizontal, Circle
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

function getActionMeta(action: string) {
  const a = (action ?? '').toLowerCase();
  if (a.includes('fail') || a.includes('delete') || a.includes('suspend') || a.includes('cancel'))
    return { color: '#ef4444', bg: '#ef444418', Icon: XCircle };
  if (a.includes('create') || a.includes('active') || a.includes('login') || a.includes('upgrade'))
    return { color: '#10b981', bg: '#10b98118', Icon: CheckCircle };
  if (a.includes('impersonat'))
    return { color: '#f59e0b', bg: '#f59e0b18', Icon: Shield };
  return { color: '#4D9EFF', bg: '#4D9EFF18', Icon: Activity };
}

// ─── mini bar chart ──────────────────────────────────────────────────────────

function BarChart({ data, color = '#10b981' }: { data: { month: string; mrr: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.mrr), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
      {data.map((pt, i) => {
        const pct = Math.max(4, (pt.mrr / max) * 100);
        const isLast = i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <div
              title={`${pt.month}: ${fmrr(pt.mrr)}`}
              style={{
                width: '100%',
                height: `${pct}%`,
                minHeight: 4,
                background: isLast ? color : `${color}55`,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.4s ease',
                cursor: 'default',
              }}
            />
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: isLast ? 700 : 400 }}>{pt.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon: Icon, loading }: any) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '12px 12px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -1.2, lineHeight: 1, marginBottom: 8 }}>
        {loading ? <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>—</span> : value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
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
        auditLogApi.getLogs({ pageSize: '12' }).catch(() => null),
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
  const activeCount  = tenants.filter(t => (t.status ?? '').toLowerCase() === 'active').length;
  const trialCount   = tenants.filter(t => (t.plan ?? '').toLowerCase().includes('trial') || (t.status ?? '').toLowerCase() === 'trial').length;
  const totalUsers   = tenants.reduce((s, t) => s + (t.users ?? 0), 0);
  const totalMRR     = tenants.reduce((s, t) => s + (t.mrr ?? 0), 0);
  const mrrNow       = mrrTrend.length ? (mrrTrend[mrrTrend.length - 1]?.mrr ?? 0) : totalMRR;
  const mrrPrev      = mrrTrend.length > 1 ? (mrrTrend[mrrTrend.length - 2]?.mrr ?? 0) : 0;
  const mrrDeltaPct  = mrrPrev > 0 ? (((mrrNow - mrrPrev) / mrrPrev) * 100).toFixed(1) : null;
  const dbOk         = health?.databaseConnection;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, margin: 0 }}>
            Platform Overview
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            {offline
              ? <><AlertTriangle size={11} style={{ color: '#f59e0b' }} /> Cannot reach backend</>
              : <>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: dbOk ? '#10b981' : '#888', display: 'inline-block', flexShrink: 0 }} />
                  {dbOk ? 'All systems operational' : 'Checking status…'}
                </>
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
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

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Collected This Month" value={fmrr(mrrNow)} sub={mrrDeltaPct ? `${Number(mrrDeltaPct) >= 0 ? '↑' : '↓'} ${Math.abs(Number(mrrDeltaPct))}% vs last month` : 'Cash collected this month'} color="#10b981" icon={DollarSign} loading={loading} />
        <StatCard label="Active Tenants"       value={`${activeCount}`} sub={`${tenants.length - activeCount} inactive · ${trialCount} on trial`} color="#4D9EFF" icon={Building2} loading={loading} />
        <StatCard label="Total Users"          value={totalUsers.toLocaleString()} sub="Across all tenant accounts" color="#A78BFA" icon={Users} loading={loading} />
        <StatCard label="Monthly Plan MRR"     value={fmrr(totalMRR)} sub="Sum of active plan prices" color="#f59e0b" icon={TrendingUp} loading={loading} />
      </div>

      {/* ── Revenue Trend + Quick Stats ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14 }}>

        {/* Revenue chart */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Revenue Collected</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Last 6 months · cash received</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', letterSpacing: -0.8 }}>{fmrr(mrrNow)}</div>
          </div>
          {mrrTrend.length > 0
            ? <BarChart data={mrrTrend} color="#10b981" />
            : <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                {loading ? 'Loading chart…' : 'No payment data yet'}
              </div>
          }
        </div>

        {/* Platform health */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>System Health</div>
          {[
            { label: 'Database', ok: dbOk, note: dbOk ? 'Connected' : 'Checking…' },
            { label: 'Active Tenants', ok: activeCount > 0, note: `${activeCount} of ${tenants.length}` },
            { label: 'Total Platform Users', ok: totalUsers > 0, note: `${totalUsers} users` },
          ].map(({ label, ok, note }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: ok ? '#10b981' : '#888', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 'auto' }}>
            <a href="/platform/audit" style={{ fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View Audit Logs <ChevronRight size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* ── Tenant table + Activity feed ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

        {/* Tenants table */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Tenants</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {loading ? 'Loading…' : `${tenants.length} registered · ${activeCount} active`}
              </div>
            </div>
            <a href="/platform/tenants" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
              Manage <ArrowRight size={12} />
            </a>
          </div>

          {loading ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading tenants…</div>
          ) : tenants.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {offline ? '⚠ Cannot reach API' : 'No tenants provisioned yet'}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Plan</th>
                  <th style={{ textAlign: 'center' }}>Users</th>
                  <th style={{ textAlign: 'right' }}>MRR</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t: any, i: number) => {
                  const statusStr = (t.status ?? 'unknown').toLowerCase();
                  const isActive  = statusStr === 'active';
                  const isTrial   = statusStr === 'trial';
                  const statusColor = isActive ? '#10b981' : isTrial ? '#f59e0b' : '#6b7280';
                  const badgeClass  = isActive ? 'badge-green' : isTrial ? 'badge-amber' : 'badge-muted';
                  return (
                    <tr key={t.id ?? i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            className="avatar"
                            style={{ width: 30, height: 30, fontSize: 12, flexShrink: 0, background: `hsl(${(t.id ?? i) * 57 % 360},52%,28%)`, fontWeight: 700 }}
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
                        <span className="badge badge-muted" style={{ fontSize: 10 }}>{t.plan ?? 'No plan'}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {t.users != null ? t.users : <span style={{ color: 'var(--text-muted)' }}>0</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: t.mrr ? '#10b981' : 'var(--text-muted)' }}>
                        {t.mrr ? fmrr(t.mrr) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
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

        {/* Activity feed */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Live audit trail</div>
            </div>
            <a href="/platform/audit" style={{ fontSize: 11, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
              Full log →
            </a>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading…</div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No recent activity recorded</div>
            ) : auditLogs.map((log: any, i: number) => {
              const { color, bg, Icon } = getActionMeta(log.action);
              return (
                <div
                  key={log.id ?? i}
                  style={{
                    display: 'flex', gap: 10, padding: '11px 18px',
                    borderBottom: i < auditLogs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon size={12} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {log.timestamp ? timeAgo(log.timestamp) : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      <span style={{ color }}>{log.module}</span>
                      {log.changedBy ? ` · ${log.changedBy}` : ''}
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

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  RefreshCw, Building2, Users, TrendingUp, DollarSign,
  Plus, ArrowRight, AlertTriangle, Shield, Activity,
  CheckCircle, XCircle, CreditCard, Zap,
  ChevronRight, Circle, Search, LogIn, Loader2,
  ClipboardList, Settings, ShieldAlert, Cpu, Clock,
} from 'lucide-react';
import { platformApi, subscriptionsApi, auditLogApi } from '@/lib/api';
import Link from 'next/link';

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

function daysLeft(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function humanUptime(ts?: string | null): string {
  if (!ts) return '—';
  // Backend serializes TimeSpan as "d.hh:mm:ss.fffffff" or "hh:mm:ss.fffffff"
  const [dayPart, rest] = ts.includes('.') && ts.split('.')[0].length <= 2 && ts.indexOf(':') > 3
    ? ts.split(/\.(?=\d{2}:\d{2}:\d{2})/)
    : [null, ts];
  const parts = (rest ?? ts).split(':');
  const h = parseInt(parts[0] ?? '0', 10) + (dayPart ? parseInt(dayPart, 10) * 24 : 0);
  const m = parseInt(parts[1] ?? '0', 10);
  if (h > 0) return `${h}h ${m}m`;
  const s = Math.round(parseFloat(parts[2] ?? '0'));
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
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
      minWidth: 0,
    }}>
      {/* accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '12px 12px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

// ─── quick management link card ──────────────────────────────────────────────

function ManageCard({ href, label, sub, icon: Icon, color, badge }: any) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
        borderRadius: 12, padding: '14px 16px', cursor: 'pointer', height: '100%',
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
      >
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
          <Icon size={16} style={{ color }} />
          {badge != null && badge > 0 && (
            <span style={{
              position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8,
              background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              border: '2px solid var(--bg-secondary)',
            }}>{badge}</span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
        </div>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </div>
    </Link>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function PlatformDashboard() {
  const [tenants,   setTenants]   = useState<any[]>([]);
  const [health,    setHealth]    = useState<any>(null);
  const [mrrTrend,  setMrrTrend]  = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pendingProofs, setPendingProofs] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [offline,   setOffline]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [actId,      setActId]      = useState<number | null>(null);
  const [enteringId, setEnteringId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, h, mrr, audit, proofs] = await Promise.all([
        platformApi.getTenants().catch(() => []),
        platformApi.getHealth().catch(() => null),
        subscriptionsApi.getMrrTrend().catch(() => []),
        auditLogApi.getLogs({ pageSize: '12' }).catch(() => null),
        subscriptionsApi.getPaymentProofs('Pending').catch(() => []),
      ]);
      setTenants(Array.isArray(t) ? t : []);
      setHealth(h);
      setMrrTrend(Array.isArray(mrr) ? mrr : []);
      setAuditLogs(audit?.logs ?? []);
      setPendingProofs(Array.isArray(proofs) ? proofs : []);
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleQuickAction = async (id: number, currentStatus: string) => {
    setActId(id);
    try {
      if ((currentStatus ?? '').toLowerCase() === 'active') {
        await platformApi.suspendTenant(id);
      } else {
        await platformApi.activateTenant(id);
      }
      await load();
    } catch {
      await load();
    } finally {
      setActId(null);
    }
  };

  const handleEnterWorkspace = async (id: number) => {
    setEnteringId(id);
    try {
      await platformApi.impersonate(id);
      window.location.href = '/dashboard';
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to enter workspace');
      setEnteringId(null);
    }
  };

  // ─── derived ──────────────────────────────────────────────────────────────
  const activeCount  = tenants.filter(t => (t.status ?? '').toLowerCase() === 'active').length;
  const trialCount   = tenants.filter(t => (t.subscriptionStatus ?? '').toLowerCase() === 'trial').length;
  const totalUsers   = tenants.reduce((s, t) => s + (t.users ?? 0), 0);
  const totalMRR     = tenants.reduce((s, t) => s + (t.mrr ?? 0), 0);
  const mrrNow       = mrrTrend.length ? (mrrTrend[mrrTrend.length - 1]?.mrr ?? 0) : totalMRR;
  const mrrPrev      = mrrTrend.length > 1 ? (mrrTrend[mrrTrend.length - 2]?.mrr ?? 0) : 0;
  const mrrDeltaPct  = mrrPrev > 0 ? (((mrrNow - mrrPrev) / mrrPrev) * 100).toFixed(1) : null;
  const dbOk         = health?.databaseConnection;

  const trialsEndingSoon = useMemo(() => tenants.filter(t => {
    if ((t.subscriptionStatus ?? '').toLowerCase() !== 'trial') return false;
    const d = daysLeft(t.trialEndDate);
    return d != null && d <= 3;
  }), [tenants]);

  const atRiskTenants = useMemo(() => tenants.filter(t =>
    ['graceperiod', 'suspended'].includes((t.subscriptionStatus ?? '').toLowerCase())
  ), [tenants]);

  const filteredTenants = useMemo(() => {
    if (!search.trim()) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(t => (t.name ?? '').toLowerCase().includes(q));
  }, [tenants, search]);

  const attentionItems = [
    ...(pendingProofs.length > 0 ? [{
      key: 'proofs', href: '/platform/payments', color: '#f59e0b', Icon: CreditCard,
      title: `${pendingProofs.length} payment ${pendingProofs.length === 1 ? 'proof needs' : 'proofs need'} your review`,
      sub: pendingProofs.slice(0, 3).map((p: any) => p.tenantName).filter(Boolean).join(', ')
        + (pendingProofs.length > 3 ? ` and ${pendingProofs.length - 3} more` : ''),
    }] : []),
    ...(trialsEndingSoon.length > 0 ? [{
      key: 'trials', href: '/platform/tenants', color: '#4D9EFF', Icon: Clock,
      title: `${trialsEndingSoon.length} trial${trialsEndingSoon.length === 1 ? '' : 's'} ending within 3 days`,
      sub: trialsEndingSoon.slice(0, 3).map((t: any) => t.name).filter(Boolean).join(', ')
        + (trialsEndingSoon.length > 3 ? ` and ${trialsEndingSoon.length - 3} more` : ''),
    }] : []),
    ...(atRiskTenants.length > 0 ? [{
      key: 'atrisk', href: '/platform/tenants', color: '#ef4444', Icon: AlertTriangle,
      title: `${atRiskTenants.length} account${atRiskTenants.length === 1 ? '' : 's'} in grace period or suspended`,
      sub: atRiskTenants.slice(0, 3).map((t: any) => t.name).filter(Boolean).join(', ')
        + (atRiskTenants.length > 3 ? ` and ${atRiskTenants.length - 3} more` : ''),
    }] : []),
  ];

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

      {/* ── Needs your attention ──────────────────────────────────────────── */}
      {!loading && attentionItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {attentionItems.map(item => (
            <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                background: `linear-gradient(135deg, ${item.color}24, ${item.color}0a)`,
                border: `1px solid ${item.color}59`, borderRadius: 12, padding: '14px 20px', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${item.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.Icon size={16} style={{ color: item.color }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: item.color, flexShrink: 0 }}>
                  Review now <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <StatCard label="Collected This Month" value={fmrr(mrrNow)} sub={mrrDeltaPct ? `${Number(mrrDeltaPct) >= 0 ? '↑' : '↓'} ${Math.abs(Number(mrrDeltaPct))}% vs last month` : 'Cash collected this month'} color="#10b981" icon={DollarSign} loading={loading} />
        <StatCard label="Active Tenants"       value={`${activeCount}`} sub={`${tenants.length - activeCount} inactive · ${trialCount} on trial`} color="#4D9EFF" icon={Building2} loading={loading} />
        <StatCard label="Total Users"          value={totalUsers.toLocaleString()} sub="Across all tenant accounts" color="#A78BFA" icon={Users} loading={loading} />
        <StatCard label="Monthly Plan MRR"     value={fmrr(totalMRR)} sub="Sum of active plan prices" color="#f59e0b" icon={TrendingUp} loading={loading} />
        <StatCard label="At Risk"              value={`${atRiskTenants.length + trialsEndingSoon.length}`} sub={`${atRiskTenants.length} grace/suspended · ${trialsEndingSoon.length} trial ending soon`} color="#ef4444" icon={ShieldAlert} loading={loading} />
      </div>

      {/* ── Revenue Trend + System Health ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>

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
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>System Health</div>
          {[
            { label: 'Database', ok: dbOk, note: dbOk ? 'Connected' : 'Checking…' },
            { label: 'Server Uptime', ok: true, note: humanUptime(health?.uptime) },
            { label: 'Memory Usage', ok: true, note: health?.memoryUsageMB ? `${Math.round(health.memoryUsageMB)} MB` : '—' },
            { label: 'Pending Payment Proofs', ok: pendingProofs.length === 0, note: `${pendingProofs.length}` },
            { label: 'Trials Ending ≤3d', ok: trialsEndingSoon.length === 0, note: `${trialsEndingSoon.length}` },
            { label: 'Grace / Suspended', ok: atRiskTenants.length === 0, note: `${atRiskTenants.length}` },
          ].map(({ label, ok, note }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: ok ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{note}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 'auto' }}>
            <a href="/platform/audit" style={{ fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View Audit Logs <ChevronRight size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* ── Quick management ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <ManageCard href="/platform/tenants" label="Tenants" sub={`${tenants.length} registered companies`} icon={Building2} color="#4D9EFF" />
        <ManageCard href="/platform/payments" label="Payments" sub="Review proof-of-payment submissions" icon={CreditCard} color="#f59e0b" badge={pendingProofs.length} />
        <ManageCard href="/platform/plans" label="Plans" sub="Manage subscription tiers & pricing" icon={ClipboardList} color="#A78BFA" />
        <ManageCard href="/platform/settings" label="Settings" sub="Platform-wide configuration" icon={Settings} color="#10b981" />
        <ManageCard href="/platform/audit" label="Audit Logs" sub="Full activity trail" icon={Shield} color="#6b7280" />
      </div>

      {/* ── Tenant table + Activity feed ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

        {/* Tenants table */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Tenants</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {loading ? 'Loading…' : `${tenants.length} registered · ${activeCount} active`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tenants…"
                  className="search-input"
                  style={{ paddingLeft: 26, fontSize: 12, height: 30, width: 160 }}
                />
              </div>
              <a href="/platform/tenants" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}>
                Manage <ArrowRight size={12} />
              </a>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading tenants…</div>
          ) : filteredTenants.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {offline ? '⚠ Cannot reach API' : search ? 'No tenants match your search' : 'No tenants provisioned yet'}
            </div>
          ) : (
            <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Plan</th>
                  <th style={{ textAlign: 'center' }}>Users</th>
                  <th style={{ textAlign: 'right' }}>MRR</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((t: any, i: number) => {
                  const subStatus  = (t.subscriptionStatus ?? '').toLowerCase();
                  const statusStr  = (t.status ?? 'unknown').toLowerCase();
                  const isActive   = statusStr === 'active';
                  const isTrial    = subStatus === 'trial';
                  const isAtRisk   = ['graceperiod', 'suspended'].includes(subStatus);
                  const trialDays  = isTrial ? daysLeft(t.trialEndDate) : null;
                  const statusColor = isAtRisk ? '#ef4444' : isActive ? '#10b981' : isTrial ? '#f59e0b' : '#6b7280';
                  const badgeClass  = isAtRisk ? 'badge-red' : isActive ? 'badge-green' : isTrial ? 'badge-amber' : 'badge-muted';
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
                        {trialDays != null && (
                          <div style={{ fontSize: 9.5, color: trialDays <= 3 ? '#ef4444' : 'var(--text-muted)', marginTop: 3, fontWeight: 600 }}>
                            {trialDays > 0 ? `${trialDays}d left` : 'Expired'}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 11, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}
                            disabled={enteringId === t.id}
                            onClick={() => handleEnterWorkspace(t.id)}
                            title="Enter this tenant's workspace as their admin"
                          >
                            {enteringId === t.id
                              ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                              : <LogIn size={12} />}
                          </button>
                          {isActive ? (
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--accent-amber)', padding: '4px 8px' }}
                              disabled={actId === t.id}
                              onClick={() => handleQuickAction(t.id, t.status)}>
                              {actId === t.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Suspend'}
                            </button>
                          ) : (
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--accent-emerald)', padding: '4px 8px' }}
                              disabled={actId === t.id}
                              onClick={() => handleQuickAction(t.id, t.status)}>
                              {actId === t.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
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

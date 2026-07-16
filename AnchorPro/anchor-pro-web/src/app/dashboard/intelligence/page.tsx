'use client';

import { useState, useEffect } from 'react';
import {
  Activity, TrendingUp, DollarSign, Users, Bell,
  Cpu, RefreshCw, AlertTriangle, CheckCircle2, Info
} from 'lucide-react';
// recharts removed — using plain visual cards instead
import { intelligenceApi } from '@/lib/api';
import { useDictionary } from '@/lib/DictionaryContext';

function HealthBar({ value, color = '#3b82f6' }: { value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(Math.max(value, 0), 100)}%`,
          height: '100%', borderRadius: 3, background: color, transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 34, textAlign: 'right' }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: string }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6,
      background: 'rgba(255,255,255,0.07)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

const ALERT_COLORS: Record<string, string> = {
  critical: 'var(--accent-rose)',
  high:     'var(--accent-amber)',
  medium:   'var(--accent-blue)',
  low:      'var(--text-muted)',
  info:     'var(--accent-blue)',
};

function severityColor(s: string) {
  return ALERT_COLORS[(s ?? '').toLowerCase()] ?? 'var(--text-muted)';
}

const CHART_COLORS = ['#2383E2', '#0F9D67', '#DFAB01', '#9065B0', '#EB5757'];

export default function IntelligencePage() {
  const { t } = useDictionary();
  const [days, setDays]                   = useState(30);
  const [profitability, setProfitability] = useState<any[]>([]);
  const [utilization, setUtilization]     = useState<any[]>([]);
  const [bottlenecks, setBottlenecks]     = useState<any[]>([]);
  const [revenueByCustomer, setRevenueByCustomer] = useState<any[]>([]);
  const [assetPerformance, setAssetPerformance]   = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);

  const loadData = (period: number) => {
    setLoading(true);
    Promise.all([
      intelligenceApi.getProfitability(period),
      intelligenceApi.getTechnicianUtilization(period),
      intelligenceApi.getBottlenecks(period),
      intelligenceApi.getRevenueByCustomer(period),
      intelligenceApi.getAssetPerformance(period),
    ])
      .then(([prof, util, bottl, rev, assetPerf]) => {
        setProfitability(Array.isArray(prof) ? prof : []);
        setUtilization(Array.isArray(util) ? util : []);
        setBottlenecks(Array.isArray(bottl) ? bottl : []);
        setRevenueByCustomer(Array.isArray(rev) ? rev : []);
        setAssetPerformance(Array.isArray(assetPerf) ? assetPerf.sort((a: any, b: any) => (b.totalMaintenanceCost || 0) - (a.totalMaintenanceCost || 0)) : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(days); }, [days]);

  // ── Derived metrics ──────────────────────────────────────────────────────────
  // JobProfitabilityReport: jobId, jobNumber, customerName, description, revenue, totalCost, profit, marginPercent, completedAt
  const totalRevenue  = profitability.reduce((a, c) => a + (c.revenue ?? 0), 0);
  const totalCost     = profitability.reduce((a, c) => a + (c.totalCost ?? 0), 0);
  const totalProfit   = profitability.reduce((a, c) => a + (c.profit ?? 0), 0);
  const avgMargin     = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // TechUtilizationReport: technicianId, technicianName, totalJobs, hoursWorked, totalLaborCost, utilizationPercent
  const avgUtil = utilization.length > 0
    ? utilization.reduce((a, t) => a + Number(t.utilizationPercent ?? 0), 0) / utilization.length
    : 0;

  // Bottlenecks: categoryName, totalDowntimeHours, occurrences, percentageOfTotalDowntime
  const criticalAlerts = bottlenecks.filter(a => Number(a.percentageOfTotalDowntime ?? 0) > 30).length;


  // Utilization chart shape
  const utilChart = utilization.slice(0, 8).map(t => ({
    name: t.technicianName ?? '—',
    util: Math.round(Number(t.utilizationPercent ?? 0)),
    jobs: t.totalJobs ?? 0,
  }));

  // Revenue by customer chart shape (RevenueByCustomerReport: customerName, jobCount, totalRevenue, totalCost, totalProfit, concentrationPercent)
  const trendChart = revenueByCustomer.slice(0, 10).map(t => ({
    date:      t.customerName ?? '—',
    completed: t.totalRevenue ?? 0,
    created:   t.jobCount ?? 0,
  }));

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Intelligence Center</h1>
          <p className="page-subtitle">
            Profitability · {t('Technicians', 'technician').toLowerCase()} utilization · operational trends
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: '1M', value: 30 },
            { label: '3M', value: 90 },
            { label: '6M', value: 180 },
            { label: '1Y', value: 365 }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`btn btn-sm ${days === opt.value ? 'btn-primary' : 'btn-secondary'}`}
            >
              {opt.label}
            </button>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={() => loadData(days)}>
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {[
          {
            label: 'Revenue (Period)', icon: DollarSign,
            value: loading ? null : `K ${totalRevenue.toLocaleString()}`,
            sub: loading ? '…' : `${profitability.length} ${t('Job Cards', 'jobs').toLowerCase()}`,
            color: 'var(--accent-emerald)',
          },
          {
            label: 'Gross Profit', icon: TrendingUp,
            value: loading ? null : `K ${totalProfit.toLocaleString()}`,
            sub: loading ? '…' : `${avgMargin.toFixed(1)}% margin`,
            color: 'var(--accent-blue)',
          },
          {
            label: `Avg ${t('Technicians', 'Tech')} Utilization`, icon: Users,
            value: loading ? null : `${avgUtil.toFixed(1)}%`,
            sub: `${utilization.length} ${t('Technicians', 'technicians').toLowerCase()}`,
            color: avgUtil >= 70 ? 'var(--accent-emerald)' : avgUtil >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)',
          },
          {
            label: 'Active Alerts', icon: Bell,
            value: loading ? null : String(bottlenecks.length),
            sub: loading ? '…' : criticalAlerts > 0 ? `${criticalAlerts} critical` : 'All clear',
            color: criticalAlerts > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
          },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="stat-label">{s.label}</div>
                  {s.value === null
                    ? <Skeleton h={36} w="100px" />
                    : <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  }
                  <div className="stat-change">{s.sub}</div>
                </div>
                <div className="stat-icon" style={{ background: s.color + '20', width: 48, height: 48, borderRadius: 12 }}>
                  <Icon size={24} style={{ color: s.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ marginBottom: 20 }}>

        {/* Technician Utilization */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">{t('Technicians', 'Technician')} Utilization</div>
              <div className="section-sub">{t('Job Cards', 'Jobs')} completed · efficiency %</div>
            </div>
            <span className="badge badge-blue">Live</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} h={40} />)
            ) : utilChart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                No utilization data available
              </div>
            ) : (
              utilChart.map((t, i) => {
                const color = t.util >= 80
                  ? 'var(--accent-emerald)'
                  : t.util >= 50 ? 'var(--accent-blue)'
                  : t.util >= 30 ? 'var(--accent-amber)'
                  : 'var(--accent-rose)';
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {t.jobs} {t('Job Cards', 'jobs').toLowerCase()}
                      </span>
                    </div>
                    <HealthBar value={t.util} color={color} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Top Customers by Revenue ── */}
      {(loading || revenueByCustomer.length > 0) && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-header">
            <div>
              <div className="section-title">Top Customers by Revenue</div>
              <div className="section-sub">Who is generating the most work this period</div>
            </div>
            <span className="badge badge-blue">Last {days}d</span>
          </div>
          <div style={{ padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              [1,2,3].map(i => <Skeleton key={i} h={48} />)
            ) : revenueByCustomer.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>No data for this period</div>
            ) : (() => {
              const maxRev = Math.max(...revenueByCustomer.map((c: any) => c.totalRevenue ?? 0)) || 1;
              return revenueByCustomer.slice(0, 6).map((c: any, i: number) => {
                const pct = Math.round(((c.totalRevenue ?? 0) / maxRev) * 100);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {c.customerName ?? 'Unknown'}
                      </span>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.jobCount ?? 0} jobs</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                          K {(c.totalRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                    <HealthBar value={pct} color="var(--accent-emerald)" />
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ── Alerts Panel ── */}
      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={14} style={{ color: criticalAlerts > 0 ? 'var(--accent-rose)' : 'var(--accent-blue)' }} />
            <span className="section-title" style={{ fontSize: 14 }}>Intelligence Alerts</span>
          </div>
          {bottlenecks.length > 0 && (
            <span className={`badge ${criticalAlerts > 0 ? 'badge-rose' : 'badge-blue'}`}>
              {bottlenecks.length} active
            </span>
          )}
        </div>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton h={48} /><Skeleton h={48} /><Skeleton h={48} />
          </div>
        ) : bottlenecks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={28} style={{ marginBottom: 10, color: 'var(--accent-emerald)', opacity: 0.7 }} />
            <div style={{ fontSize: 13 }}>No active alerts — system is healthy</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {bottlenecks.slice(0, 10).map((a: any, i: number) => {
              const pct = Number(a.percentageOfTotalDowntime ?? 0);
              const col = pct > 30 ? 'var(--accent-rose)' : pct > 15 ? 'var(--accent-amber)' : 'var(--accent-blue)';
              const sev = pct > 30 ? 'critical' : pct > 15 ? 'high' : 'medium';
              return (
                <div
                  key={i}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: col, flexShrink: 0, marginTop: 5,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {a.categoryName ?? 'Uncategorized'}
                      </span>
                      <span className={`badge`} style={{ background: col + '20', color: col, fontSize: 10 }}>
                        {sev}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {a.occurrences ?? 0} occurrences · {Math.round(a.totalDowntimeHours ?? 0)}h down time · {pct.toFixed(1)}% of total
                    </div>
                    {(a.createdAt ?? a.timestamp) && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {new Date(a.createdAt ?? a.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Asset Cost Ranking — "Money Pit" Identifier */}
      <div className="card-elevated" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Asset Maintenance Cost Ranking</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Identifies &quot;money pit&quot; assets — sorted by total maintenance spend</div>
          </div>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <Skeleton key={i} h={48} />)}
          </div>
        ) : assetPerformance.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No completed jobs in this period.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(() => {
              const maxCost = assetPerformance[0]?.totalMaintenanceCost || 1;
              return assetPerformance.slice(0, 10).map((a: any, i: number) => {
                const pct = Math.round(((a.totalMaintenanceCost || 0) / maxCost) * 100);
                const isTop = i === 0;
                return (
                  <div key={a.equipmentId} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-elevated)', border: `1px solid ${isTop ? 'var(--accent-rose)' : 'var(--border-subtle)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', minWidth: 20 }}>#{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: isTop ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                          {a.equipmentName}
                        </span>
                        {isTop && <span style={{ fontSize: 10, background: 'var(--accent-rose-dim)', color: 'var(--accent-rose)', border: '1px solid var(--accent-rose)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>⚠ HIGHEST</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isTop ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                          K {(a.totalMaintenanceCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {a.failureCount ?? 0} failures · MTTR {(a.mTTR ?? a.mttr ?? 0).toFixed(1)}h
                        </div>
                      </div>
                    </div>
                    <HealthBar value={pct} color={isTop ? '#f43f5e' : '#3b82f6'} />
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

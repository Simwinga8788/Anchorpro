'use client';

import { useState, useEffect } from 'react';
import {
  Activity, TrendingUp, DollarSign, Users, Bell,
  Cpu, RefreshCw, AlertTriangle, CheckCircle2, Info
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { intelligenceApi } from '@/lib/api';

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

  // Profitability chart shape
  const profitChart = profitability.slice(0, 8).map(p => ({
    label:   p.jobNumber ?? '—',
    revenue: p.revenue ?? 0,
    cost:    p.totalCost ?? 0,
    profit:  p.profit ?? 0,
  }));

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
            Profitability · technician utilization · operational trends
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-secondary'}`}
            >
              {d}d
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
            sub: loading ? '…' : `${profitability.length} jobs`,
            color: 'var(--accent-emerald)',
          },
          {
            label: 'Gross Profit', icon: TrendingUp,
            value: loading ? null : `K ${totalProfit.toLocaleString()}`,
            sub: loading ? '…' : `${avgMargin.toFixed(1)}% margin`,
            color: 'var(--accent-blue)',
          },
          {
            label: 'Avg Tech Utilization', icon: Users,
            value: loading ? null : `${avgUtil.toFixed(1)}%`,
            sub: `${utilization.length} technicians`,
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-label">{s.label}</div>
                  {s.value === null
                    ? <Skeleton h={28} w="70px" />
                    : <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
                  }
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>{s.sub}</div>
                </div>
                <div className="stat-icon" style={{ background: s.color + '20' }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="stats-grid-2" style={{ marginBottom: 20 }}>

        {/* Revenue vs Cost */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Revenue vs Cost</div>
              <div className="section-sub">Top {Math.min(profitability.length, 8)} jobs · last {days}d</div>
            </div>
            <span className="badge badge-green">Profitability</span>
          </div>
          <div style={{ padding: '16px 4px 10px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
                <Skeleton /><Skeleton w="80%" /><Skeleton w="60%" />
              </div>
            ) : profitChart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                No completed jobs in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={profitChart} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: '#6b6b6b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `K${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any, name: string) => [`K ${Number(v).toLocaleString()}`, name]}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#0F9D67" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="cost"    name="Cost"    fill="#EB5757" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Technician Utilization */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Technician Utilization</div>
              <div className="section-sub">Jobs completed · efficiency %</div>
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
                        {t.jobs} jobs
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

      {/* ── Trends ── */}
      {(loading || trendChart.length > 0) && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-header">
            <div>
              <div className="section-title">Operational Trends</div>
              <div className="section-sub">Jobs created vs completed over time</div>
            </div>
            <span className="badge badge-blue">Trends</span>
          </div>
          <div style={{ padding: '16px 4px 10px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
                <Skeleton /><Skeleton w="85%" /><Skeleton w="70%" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendChart} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F9D67" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0F9D67" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2383E2" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2383E2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#0F9D67" strokeWidth={2} fill="url(#completedGrad)" dot={false} />
                  <Area type="monotone" dataKey="created"   name="Created"   stroke="#2383E2" strokeWidth={2} fill="url(#createdGrad)"   dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
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
                      {a.occurrences ?? 0} occurrences · {Math.round(a.totalDowntimeHours ?? 0)}h downtime · {pct.toFixed(1)}% of total
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

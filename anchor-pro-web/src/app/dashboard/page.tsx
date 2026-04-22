'use client';

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Wrench, AlertTriangle,
  CheckCircle2, Clock, Users, Zap, BarChart3,
  Activity, Package, RefreshCw, MoreHorizontal, Wifi, WifiOff
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, BarChart, Bar, Cell
} from 'recharts';
import { dashboardApi, DashboardStats, ExecutiveSnapshot, PerformanceMetrics } from '@/lib/api';
import { useApiData } from '@/lib/useApiData';
import SlideOver from '@/components/SlideOver';
import JobCardForm from '@/components/JobCardForm';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number | undefined, prefix = '') {
  if (n === undefined || n === null) return '—';
  return `${prefix}${n.toLocaleString()}`;
}

function fmtK(n: number | undefined) {
  if (n === undefined || n === null) return '—';
  return `K ${n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Completed': 'badge-green', 'InProgress': 'badge-blue', 'In Progress': 'badge-blue',
    'Scheduled': 'badge-amber', 'Cancelled': 'badge-rose',
  };
  const dotMap: Record<string, string> = {
    'Completed': 'green', 'InProgress': 'blue', 'In Progress': 'blue',
    'Scheduled': 'amber', 'Cancelled': 'rose',
  };
  const label = status === 'InProgress' ? 'In Progress' : status;
  return (
    <span className={`badge ${map[status] ?? 'badge-muted'}`}>
      <span className={`status-dot ${dotMap[status] ?? 'muted'}`} />
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    Critical: 'badge-rose', High: 'badge-amber', Medium: 'badge-blue', Low: 'badge-muted',
  };
  return <span className={`badge ${map[priority] ?? 'badge-muted'}`}>{priority}</span>;
}

function Skeleton({ w = '100%', h = 20 }: { w?: string | number; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: 'rgba(255,255,255,0.05)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
        borderRadius: 8, padding: '10px 14px', fontSize: 12,
      }}>
        <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          {payload[0].value} jobs completed
        </div>
      </div>
    );
  }
  return null;
};

const COST_TRINITY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const COST_TRINITY_LABELS = ['Internal Labor', 'Stock Parts', 'Direct Purchase', 'Subcontracting'];

  // ─── Main Dashboard ─────────────────────────────────────────────────────────────
  
  export default function DashboardPage() {
    const stats    = useApiData(() => dashboardApi.getStats());
    const exec     = useApiData(() => dashboardApi.getExecutive());
    const perf     = useApiData(() => dashboardApi.getPerformance(14));
    
    // State for Notion-style side peek (SlideOver)
    const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  
    const isApiDown = stats.error !== null;
  
    const refresh = () => {
      stats.refresh();
      exec.refresh();
      perf.refresh();
    };
  
    // Build real Cost Trinity from live executive data
    const totalTrinity = (exec.data?.laborCostTotal ?? 0) + 
                         (exec.data?.partsCostTotal ?? 0) + 
                         (exec.data?.directPurchaseCostTotal ?? 0) + 
                         (exec.data?.subcontractingCostTotal ?? 0);
    
    const getPct = (val: number) => totalTrinity > 0 ? Math.round((val / totalTrinity) * 100) : 0;
  
    const costTrinityData = [
      { name: 'Internal Labor',   value: getPct(exec.data?.laborCostTotal ?? 0), color: '#2383E2' },
      { name: 'Stock Parts',     value: getPct(exec.data?.partsCostTotal ?? 0), color: '#0F9D67' },
      { name: 'Direct Purchase', value: getPct(exec.data?.directPurchaseCostTotal ?? 0), color: '#DFAB01' },
      { name: 'Subcontracting',  value: getPct(exec.data?.subcontractingCostTotal ?? 0), color: '#9065B0' },
    ];
  
    // Trend data from perf API, or empty
    const trendData = perf.data?.completionTrend?.slice(-14).map(t => ({
      date: new Date(t.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      completed: t.completedCount,
    })) ?? [];
  
    return (
      <div>
        <SlideOver 
          open={isNewJobOpen} 
          onClose={() => setIsNewJobOpen(false)} 
          title="New Job Card"
          subtitle="Define maintenance steps, assign technicians, and schedule work."
          width={600}
        >
          <JobCardForm 
            onSuccess={() => { refresh(); setIsNewJobOpen(false); }} 
            onCancel={() => setIsNewJobOpen(false)} 
          />
        </SlideOver>
  
        {/* ── Header ── */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Operations Overview</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <p className="page-subtitle">Production & service intelligence dashboard</p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '1px 8px', borderRadius: 4,
                fontSize: 11, fontWeight: 500,
                background: isApiDown ? 'var(--accent-rose-dim)' : 'var(--accent-emerald-dim)',
                color: isApiDown ? 'var(--accent-rose)' : 'var(--accent-emerald)',
              }}>
                {isApiDown ? 'Offline' : 'Live'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={refresh}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setIsNewJobOpen(true)}>
              <Zap size={13} /> Create Job
            </button>
          </div>
        </div>

      {/* ── KPI Row ── */}
      <div className="stats-grid-4 animate-in stagger-1" style={{ marginBottom: 20 }}>

        {/* Active Jobs */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Jobs In Progress</div>
              {stats.loading
                ? <Skeleton h={32} w={60} />
                : <div className="stat-value">{fmt(stats.data?.jobsInProgress)}</div>
              }
              <div className="stat-change neutral" style={{ marginTop: 8 }}>
                <Clock size={12} /> {fmt(stats.data?.jobsScheduledToday)} scheduled today
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--accent-blue-dim)' }}>
              <Wrench size={16} style={{ color: 'var(--accent-blue)' }} />
            </div>
          </div>
        </div>

        {/* Revenue MTD */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Revenue MTD</div>
              {exec.loading
                ? <Skeleton h={32} w={100} />
                : <div className="stat-value" style={{ fontSize: 24 }}>{fmtK(exec.data?.revenueMTD)}</div>
              }
              <div className="stat-change up" style={{ marginTop: 8 }}>
                <TrendingUp size={12} />
                {exec.data?.grossMarginPercent !== undefined
                  ? `${exec.data.grossMarginPercent}% gross margin`
                  : 'Loading margin…'}
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--accent-emerald-dim)' }}>
              <TrendingUp size={16} style={{ color: 'var(--accent-emerald)' }} />
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Overdue Jobs</div>
              {stats.loading
                ? <Skeleton h={32} w={40} />
                : <div className="stat-value" style={{ color: (stats.data?.overdueJobs ?? 0) > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                    {fmt(stats.data?.overdueJobs)}
                  </div>
              }
              <div className="stat-change down" style={{ marginTop: 8 }}>
                <TrendingDown size={12} />
                {(stats.data?.overdueJobs ?? 0) > 0 ? 'Needs immediate action' : 'All on schedule ✓'}
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--accent-rose-dim)' }}>
              <AlertTriangle size={16} style={{ color: 'var(--accent-rose)' }} />
            </div>
          </div>
        </div>

        {/* On-Time Rate */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">On-Time Rate</div>
              {perf.loading
                ? <Skeleton h={32} w={80} />
                : <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                    {perf.data?.onTimeCompletionPercentage ?? '—'}%
                  </div>
              }
              <div className="stat-change neutral" style={{ marginTop: 8 }}>
                <Activity size={12} />
                {fmt(perf.data?.completedJobsInPeriod)} completed in 14 days
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--accent-emerald-dim)' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="stats-grid-2 animate-in stagger-2" style={{ marginBottom: 20 }}>

        {/* Completion Trend */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Job Completion Trend</div>
              <div className="section-sub">Last 14 days · from live API</div>
            </div>
            <span className="badge badge-green">Live</span>
          </div>
          <div style={{ padding: '16px 4px 10px' }}>
            {perf.loading ? (
              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton h={16} /><Skeleton h={16} w="80%" /><Skeleton h={16} w="60%" />
              </div>
            ) : trendData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                No completed jobs in the last 14 days
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trendData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} fill="url(#blueGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Cost Trinity */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Cost Trinity Breakdown</div>
              <div className="section-sub">% share of total spend</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div style={{ padding: '16px 16px 10px' }}>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={costTrinityData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <XAxis type="number" tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#a3a3a3', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  formatter={(v) => [`${v}%`, 'Share']}
                  contentStyle={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                  {costTrinityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, padding: '0 8px' }}>
              {costTrinityData.map((item) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Jobs Table + Sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }} className="animate-in stagger-3">

        {/* Recent Jobs */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Recent Job Cards</div>
              <div className="section-sub">Latest activity across all assets</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => window.location.href='/dashboard/jobs'}>View All</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Asset</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {stats.loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => <td key={j}><Skeleton h={14} /></td>)}
                  </tr>
                ))
              ) : stats.error ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
                    <WifiOff size={20} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    API offline — showing cached view
                  </td>
                </tr>
              ) : (
                (stats.data?.recentActivity ?? []).map((job) => (
                  <tr key={job.jobNumber} style={{ cursor: 'pointer' }}>
                    <td>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600, fontSize: 13 }}>
                        #{job.jobNumber}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {job.equipment?.name ?? '—'}
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{job.jobType?.name ?? '—'}</td>
                    <td><PriorityBadge priority={job.priority} /></td>
                    <td><StatusBadge status={job.status} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {fmtK(job.totalCost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Technician Stats */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="section-title">Top Technicians</div>
              <span className="badge badge-blue">14 days</span>
            </div>
            {perf.loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3].map(i => <Skeleton key={i} h={40} />)}
              </div>
            ) : (perf.data?.technicianStats ?? []).length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                No technician data available
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(perf.data?.technicianStats ?? []).slice(0, 4).map((tech, i) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                  const initial = (tech.technicianName ?? '?')[0].toUpperCase();
                  return (
                    <div key={tech.technicianName} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: colors[i % colors.length], width: 28, height: 28, fontSize: 10 }}>
                        {initial}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tech.technicianName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {tech.jobsCompleted} jobs · {tech.totalHoursWorked}h
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {tech.utilizationPercentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Executive Snapshot */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Executive Snapshot</div>
            {[
              { label: 'Avg MTTR',        value: perf.data ? `${perf.data.avgLeadTimeHours}h` : '—',   icon: Clock,         color: 'var(--accent-blue)' },
              { label: 'Outstanding AR',  value: exec.data ? fmtK(exec.data.outstandingInvoices) : '—', icon: Zap,           color: 'var(--accent-amber)' },
              { label: 'On-Time Rate',    value: perf.data ? `${perf.data.onTimeCompletionPercentage}%` : '—', icon: CheckCircle2, color: 'var(--accent-emerald)' },
              { label: 'Total Jobs',      value: fmt(stats.data?.totalJobs),                            icon: Wrench,        color: 'var(--accent-violet)' },
              { label: 'Active Techs',    value: fmt(stats.data?.activeTechnicians),                    icon: Users,         color: 'var(--accent-blue)' },
              { label: 'Safety Incidents',value: fmt(exec.data?.safetyIncidents),                      icon: AlertTriangle, color: 'var(--accent-rose)' },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={13} style={{ color: metric.color }} />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{metric.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{metric.value}</span>
                </div>
              );
            })}
          </div>
        </div>
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

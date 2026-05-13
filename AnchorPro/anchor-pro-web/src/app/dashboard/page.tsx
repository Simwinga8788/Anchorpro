'use client';

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Wrench, AlertTriangle,
  CheckCircle2, Clock, Users, Zap, BarChart3,
  Activity, RefreshCw, WifiOff
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import { dashboardApi, intelligenceApi, referenceDataApi, DashboardStats } from '@/lib/api';
import { useApiData } from '@/lib/useApiData';
import SlideOver from '@/components/SlideOver';
import JobCardForm from '@/components/JobCardForm';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null, prefix = '') {
  if (n === undefined || n === null) return '—';
  return `${prefix}${n.toLocaleString()}`;
}

function fmtK(n: number | undefined | null) {
  if (n === undefined || n === null) return '—';
  return `K ${n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Completed': 'badge-green', 'InProgress': 'badge-blue', 'In Progress': 'badge-blue',
    'Scheduled': 'badge-amber', 'Cancelled': 'badge-rose', 'Unscheduled': 'badge-muted',
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
      background: 'rgba(255,255,255,0.07)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
        borderRadius: 8, padding: '10px 14px', fontSize: 12,
      }}>
        <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // Only documented endpoints
  const stats      = useApiData(() => dashboardApi.getStats());
  const profitData = useApiData(() => intelligenceApi.getProfitability(30));
  const utilData   = useApiData(() => intelligenceApi.getTechnicianUtilization(30));
  const techData   = useApiData(() => referenceDataApi.getTechnicians());

  const [isNewJobOpen, setIsNewJobOpen] = useState(false);

  const isApiDown = stats.error !== null;

  const refresh = () => {
    stats.refresh();
    profitData.refresh();
    utilData.refresh();
    techData.refresh();
  };

  // Job type distribution from stats (documented field)
  const jobTypeData = (stats.data?.jobTypeDistribution ?? []).map((j: any) => ({
    name: j.jobTypeName ?? j.name ?? 'Other',
    value: j.count ?? j.value ?? 0,
  }));

  const PIE_COLORS = ['#2383E2', '#0F9D67', '#DFAB01', '#9065B0', '#EB5757', '#3b82f6'];

  // Profitability trend from /api/intelligence/profitability
  const profitChart = (profitData.data ?? []).slice(0, 8).map((p: any) => ({
    name: p.jobTypeName ?? p.name ?? p.label ?? '—',
    revenue: p.revenue ?? p.totalRevenue ?? 0,
    cost: p.cost ?? p.totalCost ?? 0,
  }));

  // Utilization from /api/intelligence/utilization
  const utilChart = (utilData.data ?? []).slice(0, 6).map((u: any) => ({
    name: u.technicianName ?? u.name ?? '—',
    pct: u.utilizationPercentage ?? u.utilization ?? u.percentage ?? 0,
    jobs: u.jobsCompleted ?? u.jobs ?? 0,
  }));

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Operations Overview</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <p className="page-subtitle">Live operational intelligence dashboard</p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '1px 8px', borderRadius: 4,
              fontSize: 11, fontWeight: 500,
              background: isApiDown ? 'var(--accent-rose-dim)' : 'var(--accent-emerald-dim)',
              color: isApiDown ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            }}>
              {isApiDown ? '⚠ Offline' : '● Live'}
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

      {/* ── KPI Row — from /api/dashboard/stats ── */}
      <div className="stats-grid-4 animate-in stagger-1" style={{ marginBottom: 20 }}>

        {/* Jobs In Progress */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Jobs In Progress</div>
              {stats.loading ? <Skeleton h={32} w={60} /> :
                <div className="stat-value">{fmt(stats.data?.jobsInProgress)}</div>
              }
              <div className="stat-change" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
                <Clock size={12} /> {fmt(stats.data?.jobsScheduledToday)} scheduled today
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--accent-blue-dim)' }}>
              <Wrench size={16} style={{ color: 'var(--accent-blue)' }} />
            </div>
          </div>
        </div>

        {/* Completed Today */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Completed Today</div>
              {stats.loading ? <Skeleton h={32} w={60} /> :
                <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                  {fmt(stats.data?.jobsCompletedToday)}
                </div>
              }
              <div className="stat-change" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-emerald)' }}>
                <TrendingUp size={12} /> {fmt(stats.data?.completedJobs)} total completed
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--accent-emerald-dim)' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} />
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Overdue Jobs</div>
              {stats.loading ? <Skeleton h={32} w={40} /> :
                <div className="stat-value" style={{
                  color: (stats.data?.overdueJobs ?? 0) > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                }}>
                  {fmt(stats.data?.overdueJobs)}
                </div>
              }
              <div className="stat-change" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
                <TrendingDown size={12} />
                {(stats.data?.overdueJobs ?? 0) > 0 ? 'Needs immediate action' : 'All on schedule'}
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--accent-rose-dim)' }}>
              <AlertTriangle size={16} style={{ color: 'var(--accent-rose)' }} />
            </div>
          </div>
        </div>

        {/* Active Breakdowns */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Active Breakdowns</div>
              {stats.loading ? <Skeleton h={32} w={40} /> :
                <div className="stat-value" style={{
                  color: (stats.data?.activeBreakdownsCount ?? 0) > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                }}>
                  {fmt(stats.data?.activeBreakdownsCount)}
                </div>
              }
              <div className="stat-change" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
                <Activity size={12} /> {fmt(stats.data?.activeTechnicians)} active technicians
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--accent-amber-dim)' }}>
              <BarChart3 size={16} style={{ color: 'var(--accent-amber)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="stats-grid-2 animate-in stagger-2" style={{ marginBottom: 20 }}>

        {/* Job Type Distribution — from stats.jobTypeDistribution */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Work Type Breakdown</div>
              <div className="section-sub">Distribution across job categories · live</div>
            </div>
            <span className="badge badge-blue">Live</span>
          </div>
          <div style={{ padding: '16px 0 10px' }}>
            {stats.loading ? (
              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton h={16} /><Skeleton h={16} w="80%" /><Skeleton h={16} w="60%" />
              </div>
            ) : jobTypeData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                No job data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={jobTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {jobTypeData.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => [v, 'Jobs']}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Profitability by Job Type — from /api/intelligence/profitability */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Revenue vs Cost (30d)</div>
              <div className="section-sub">By job type · intelligence engine</div>
            </div>
            <span className="badge badge-green">Intelligence</span>
          </div>
          <div style={{ padding: '16px 4px 10px' }}>
            {profitData.loading ? (
              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton h={16} /><Skeleton h={16} w="80%" /><Skeleton h={16} w="60%" />
              </div>
            ) : profitChart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                No profitability data yet — complete some jobs first
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={profitChart} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2383E2" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2383E2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EB5757" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#EB5757" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2383E2" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
                  <Area type="monotone" dataKey="cost" name="Cost" stroke="#EB5757" strokeWidth={2} fill="url(#costGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Technician Availability — from /api/dashboard/technicians ── */}
      {!techData.loading && (techData.data ?? []).length > 0 && (
        <div className="card animate-in stagger-2" style={{ marginBottom: 14, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="section-title">Technician Availability</div>
              <div className="section-sub">Live workforce status · {(techData.data ?? []).length} members</div>
            </div>
            <span className="badge badge-blue">Live</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {(techData.data ?? []).map((t: any, i: number) => {
              const name = t.firstName ? `${t.firstName} ${t.lastName || ''}`.trim() : t.userName ?? 'Technician';
              const initial = (name[0] ?? '?').toUpperCase();
              const busy = t.activeJobsCount > 0 || t.status === 'Busy';
              const COLORS = ['#2383E2', '#0F9D67', '#DFAB01', '#9065B0', '#EB5757'];
              return (
                <div key={t.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
                  <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0, background: COLORS[i % COLORS.length] }}>{initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{t.roles?.[0] ?? 'Technician'}</div>
                  </div>
                  <span className={`badge ${busy ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 9, flexShrink: 0 }}>
                    {busy ? 'Busy' : 'Free'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Jobs Table + Sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }} className="animate-in stagger-3 dashboard-bottom-grid">

        {/* Recent Jobs — from stats.recentActivity */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Recent Job Cards</div>
              <div className="section-sub">Latest activity across all assets</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = '/dashboard/jobs'}>View All</button>
          </div>
          <div className="table-scroll">
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
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5, 6].map(j => <td key={j}><Skeleton h={14} /></td>)}
                    </tr>
                  ))
                ) : stats.error ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
                      <WifiOff size={20} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                      API offline — connect the backend to see live data
                    </td>
                  </tr>
                ) : (stats.data?.recentActivity ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 13 }}>
                      No jobs yet — create your first job card
                    </td>
                  </tr>
                ) : (
                  (stats.data?.recentActivity ?? []).map((job) => (
                    <tr key={job.jobNumber} style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/dashboard/jobs'}>
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
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Technician Utilization — from /api/intelligence/utilization */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="section-title">Technician Utilization</div>
              <span className="badge badge-blue">Live</span>
            </div>
            {utilData.loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} h={40} />)}
              </div>
            ) : utilChart.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                No utilization data yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {utilChart.map((tech, i) => {
                  const colors = ['#2383E2', '#0F9D67', '#DFAB01', '#9065B0', '#EB5757', '#3b82f6'];
                  const initial = (tech.name ?? '?')[0].toUpperCase();
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: colors[i % colors.length], width: 28, height: 28, fontSize: 10, flexShrink: 0 }}>
                        {initial}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tech.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {tech.jobs} jobs completed
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', flexShrink: 0 }}>
                        {tech.pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Quick Stats</div>
            {[
              { label: 'Total Jobs',        value: fmt(stats.data?.totalJobs),              icon: Wrench,       color: 'var(--accent-blue)' },
              { label: 'Completed',         value: fmt(stats.data?.completedJobs),          icon: CheckCircle2, color: 'var(--accent-emerald)' },
              { label: 'Overdue',           value: fmt(stats.data?.overdueJobs),            icon: AlertTriangle,color: 'var(--accent-rose)' },
              { label: 'Active Techs',      value: fmt(stats.data?.activeTechnicians),      icon: Users,        color: 'var(--accent-blue)' },
              { label: 'Breakdowns',        value: fmt(stats.data?.activeBreakdownsCount),  icon: Activity,     color: 'var(--accent-amber)' },
              { label: 'Scheduled Today',   value: fmt(stats.data?.jobsScheduledToday),     icon: Clock,        color: 'var(--accent-violet)' },
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stats.loading ? '…' : metric.value}
                  </span>
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

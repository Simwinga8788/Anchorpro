'use client';

import { useState } from 'react';
import {
  BarChart3, Download, TrendingUp, Clock, CheckCircle2,
  Users, Activity, AlertTriangle, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { reportingApi, intelligenceApi, downtimeApi } from '@/lib/api';
import { useApiData } from '@/lib/useApiData';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null, prefix = '') {
  if (n === undefined || n === null) return '—';
  return `${prefix}${n.toLocaleString()}`;
}

function fmtPct(n: number | undefined | null) {
  if (n === undefined || n === null) return '—';
  return `${Math.round(n)}%`;
}

const PIE_COLORS = ['#2383E2', '#0F9D67', '#DFAB01', '#9065B0', '#EB5757', '#3b82f6'];

function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: string }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 6,
      background: 'rgba(255,255,255,0.07)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const scheduledReports = useApiData(() => reportingApi.getSchedules());
  const jobCompletion    = useApiData(() => intelligenceApi.getSummary());
  const techPerformance  = useApiData(() => intelligenceApi.getTechnicianUtilization(90));
  const downtimeAnalysis = useApiData(() => intelligenceApi.getBottlenecks(90));
  const [exporting, setExporting] = useState<string | null>(null);

  const downloadReport = async (type: string, filename: string) => {
    setExporting(type);
    try {
      const res = await fetch(reportingApi.previewExcelUrl(type), {
        credentials: 'include',
        headers: { 'Accept': 'application/octet-stream,*/*' },
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  const refresh = () => {
    jobCompletion.refresh();
    techPerformance.refresh();
    downtimeAnalysis.refresh();
  };

  // ── Job Completion derived data (ExecutiveKpiSummary) ──
  const jc = jobCompletion.data as any;
  const completionTrend: Array<{ date: string; count: number }> = []; // summary endpoint has no trend array
  const typeDistribution: Array<{ name: string; value: number }> = []; // no type breakdown in summary

  const completionRate: number = jc?.avgMarginPercent ?? 0;
  const totalCompleted: number = jc?.activeJobsCount ?? 0;
  const avgLeadTime: number   = jc?.avgCompletionTimeHours ?? 0;

  // ── Technician Performance derived data (TechUtilizationReport[]) ──
  const tp = techPerformance.data as any;
  const techStats: Array<{ name: string; jobs: number; hours: number; util: number }> =
    (Array.isArray(tp) ? tp : []).map((t: any) => ({
      name: t.technicianName ?? '—',
      jobs: t.totalJobs ?? 0,
      hours: Math.round(t.hoursWorked ?? 0),
      util: Math.round(Number(t.utilizationPercent ?? 0)),
    })).slice(0, 8);

  // ── Downtime Analysis derived data (DowntimeBottleneckReport[]) ──
  const da = downtimeAnalysis.data as any;
  const downtimeBreakdown: Array<{ name: string; occurrences: number; hours: number }> =
    (Array.isArray(da) ? da : []).map((d: any) => ({
      name: d.categoryName ?? d.category ?? 'Unknown',
      occurrences: d.occurrences ?? 0,
      hours: Math.round(d.totalDowntimeHours ?? 0),
    })).slice(0, 6);

  const totalDowntimeHours: number = downtimeBreakdown.reduce((a, b) => a + b.hours, 0);
  const totalDowntimeEvents: number = downtimeBreakdown.reduce((a, b) => a + b.occurrences, 0);

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Reports & Intelligence</h1>
          <p className="page-subtitle">Live analytics from the intelligence engine</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={refresh}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" disabled={!!exporting}
            onClick={() => downloadReport('maintenance', 'maintenance-report.xlsx')}>
            <Download size={13} /> {exporting === 'maintenance' ? 'Downloading...' : 'Export'}
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {[
          {
            label: 'Jobs Completed', icon: CheckCircle2,
            value: jobCompletion.loading ? null : fmt(totalCompleted),
            color: 'var(--accent-emerald)', dimColor: 'var(--accent-emerald-dim)',
            sub: jobCompletion.loading ? '…' : `${fmtPct(completionRate)} on time`,
          },
          {
            label: 'Avg Lead Time', icon: Clock,
            value: jobCompletion.loading ? null : `${Math.round(avgLeadTime)}h`,
            color: 'var(--accent-blue)', dimColor: 'var(--accent-blue-dim)',
            sub: 'Mean time to completion',
          },
          {
            label: 'Active Technicians', icon: Users,
            value: techPerformance.loading ? null : fmt(techStats.length),
            color: 'var(--accent-violet)', dimColor: 'var(--accent-violet-dim)',
            sub: 'With performance data',
          },
          {
            label: 'Downtime Events', icon: AlertTriangle,
            value: downtimeAnalysis.loading ? null : fmt(totalDowntimeEvents),
            color: 'var(--accent-rose)', dimColor: 'var(--accent-rose-dim)',
            sub: `${fmt(totalDowntimeHours)}h total lost`,
          },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div className="stat-label">{s.label}</div>
                  {s.value === null
                    ? <Skeleton h={32} w="60px" />
                    : <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  }
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>{s.sub}</div>
                </div>
                <div className="stat-icon" style={{ background: s.dimColor }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="stats-grid-2" style={{ marginBottom: 20 }}>

        {/* Job Completion Trend */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Job Completion Trend</div>
              <div className="section-sub">Daily completed jobs over period</div>
            </div>
            <span className="badge badge-green">Live</span>
          </div>
          <div style={{ padding: '16px 4px 10px' }}>
            {jobCompletion.loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 16px' }}>
                <Skeleton /><Skeleton w="80%" /><Skeleton w="60%" />
              </div>
            ) : completionTrend.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                No trend data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={completionTrend} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F9D67" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0F9D67" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                    cursor={{ stroke: 'rgba(255,255,255,0.05)' }}
                  />
                  <Area type="monotone" dataKey="count" name="Completed" stroke="#0F9D67" strokeWidth={2} fill="url(#completionGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Job Type Distribution */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Work Type Breakdown</div>
              <div className="section-sub">Completed jobs by category</div>
            </div>
            <span className="badge badge-blue">Analytics</span>
          </div>
          <div style={{ padding: '16px 0 10px' }}>
            {jobCompletion.loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 16px' }}>
                <Skeleton /><Skeleton w="80%" /><Skeleton w="60%" />
              </div>
            ) : typeDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                No type data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {typeDistribution.map((_: any, i: number) => (
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
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="stats-grid-2" style={{ marginBottom: 20 }}>

        {/* Technician Performance */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Technician Performance</div>
              <div className="section-sub">Jobs completed · utilization</div>
            </div>
            <span className="badge badge-blue">Live</span>
          </div>
          <div style={{ padding: '16px 4px 10px' }}>
            {techPerformance.loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 16px' }}>
                <Skeleton /><Skeleton w="80%" /><Skeleton w="60%" />
              </div>
            ) : techStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                No technician data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={techStats} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#6b6b6b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="jobs" name="Jobs Completed" fill="#2383E2" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="util" name="Utilization %" fill="#0F9D67" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Downtime Breakdown */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Downtime Analysis</div>
              <div className="section-sub">By category · duration and events</div>
            </div>
            <span className="badge badge-rose">Critical</span>
          </div>
          <div style={{ padding: '16px 4px 10px' }}>
            {downtimeAnalysis.loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 16px' }}>
                <Skeleton /><Skeleton w="80%" /><Skeleton w="60%" />
              </div>
            ) : downtimeBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                No downtime recorded — great sign
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={downtimeBreakdown} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#6b6b6b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="hours" name="Total Hours" fill="#EB5757" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="occurrences" name="Events" fill="#DFAB01" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Technician Detail Table ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <div>
            <div className="section-title">Technician Detail</div>
            <div className="section-sub">Full performance breakdown</div>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Technician</th>
                <th style={{ textAlign: 'right' }}>Jobs Done</th>
                <th style={{ textAlign: 'right' }}>Hours Worked</th>
                <th style={{ textAlign: 'right' }}>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {techPerformance.loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    {[1, 2, 3, 4].map(j => <td key={j}><Skeleton h={14} /></td>)}
                  </tr>
                ))
              ) : techStats.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    No technician performance data yet
                  </td>
                </tr>
              ) : (
                techStats.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: PIE_COLORS[i % PIE_COLORS.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {(t.name ?? '?')[0].toUpperCase()}
                        </div>
                        {t.name}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{t.jobs}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>{t.hours}h</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        fontWeight: 700,
                        color: t.util >= 80 ? 'var(--accent-emerald)' : t.util >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                      }}>
                        {t.util}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Quick Export ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Job Completion Report', type: 'job-completion',          file: 'job-completion.xlsx' },
          { label: 'Technician Performance', type: 'technician-performance', file: 'tech-performance.xlsx' },
          { label: 'Downtime Analysis',      type: 'downtime-analysis',      file: 'downtime-analysis.xlsx' },
        ].map(r => (
          <div key={r.type} className="card" style={{ padding: 20, textAlign: 'center' }}>
            <FileSpreadsheet size={22} style={{ color: 'var(--accent-blue)', marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{r.label}</div>
            <button
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              disabled={!!exporting}
              onClick={() => downloadReport(r.type, r.file)}
            >
              <Download size={12} /> {exporting === r.type ? 'Downloading...' : 'Export'}
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .badge-rose { background: var(--accent-rose-dim); color: var(--accent-rose); }
      `}</style>
    </div>
  );
}

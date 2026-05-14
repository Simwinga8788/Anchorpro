'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock, RefreshCw, Users, CheckCircle2, Wrench,
  TrendingUp, Calendar, Search, ChevronDown, Activity
} from 'lucide-react';
import { jobCardsApi, referenceDataApi, intelligenceApi } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Job {
  id: number;
  jobNumber: string;
  description: string;
  status: number;
  priority: number;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  assignedTechnician?: { id: string; firstName?: string; lastName?: string; userName: string } | null;
  equipment?: { name: string };
  jobType?: { name: string };
  customer?: { name: string };
}

interface Technician {
  id: string;
  firstName?: string;
  lastName?: string;
  userName: string;
}

interface TechRow {
  id: string;
  name: string;
  jobs: Job[];
  totalJobs: number;
  completed: number;
  inProgress: number;
  scheduled: number;
  estimatedHours: number;
  utilPct: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function techName(t?: { firstName?: string; lastName?: string; userName: string } | null) {
  if (!t) return 'Unassigned';
  return `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || t.userName;
}

function hoursFromJob(job: Job): number {
  const start = job.actualStartDate ?? job.scheduledStartDate;
  const end   = job.actualEndDate   ?? job.scheduledEndDate;
  if (!start || !end) return 4; // default estimate
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
  return Math.max(0, Math.round(diff * 10) / 10);
}

const statusConfig: Record<number, { label: string; badge: string; dot: string }> = {
  0: { label: 'Unscheduled', badge: 'badge-muted',  dot: 'muted'  },
  1: { label: 'Scheduled',   badge: 'badge-amber',  dot: 'amber'  },
  2: { label: 'In Progress', badge: 'badge-blue',   dot: 'blue'   },
  3: { label: 'Completed',   badge: 'badge-green',  dot: 'green'  },
  4: { label: 'Cancelled',   badge: 'badge-rose',   dot: 'rose'   },
  5: { label: 'On Hold',     badge: 'badge-amber',  dot: 'amber'  },
};

const PERIOD_DAYS: Record<string, number> = {
  '7d': 7, '30d': 30, '90d': 90,
};

// ─── Utilisation bar ─────────────────────────────────────────────────────────

function UtilBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'var(--accent-emerald)' : pct >= 50 ? 'var(--accent-blue)' : 'var(--accent-amber)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

// ─── Expandable technician row ────────────────────────────────────────────────

function TechRow({ row }: { row: TechRow }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar" style={{ width: 30, height: 30, fontSize: 12, flexShrink: 0 }}>
              {row.name[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.totalJobs} job{row.totalJobs !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </td>
        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.totalJobs}</td>
        <td><span className="badge badge-green">{row.completed}</span></td>
        <td><span className="badge badge-blue">{row.inProgress}</span></td>
        <td><span className="badge badge-amber">{row.scheduled}</span></td>
        <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{row.estimatedHours}h</td>
        <td style={{ minWidth: 140 }}><UtilBar pct={row.utilPct} /></td>
        <td>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </td>
      </tr>
      {open && row.jobs.length > 0 && (
        <tr>
          <td colSpan={8} style={{ background: 'var(--bg-secondary)', padding: 0 }}>
            <div style={{ padding: '12px 16px' }}>
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Job #</th>
                    <th>Description</th>
                    <th>Equipment</th>
                    <th>Status</th>
                    <th>Scheduled Start</th>
                    <th>Est. Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {row.jobs.map(job => {
                    const sc = statusConfig[job.status] ?? statusConfig[0];
                    return (
                      <tr key={job.id}>
                        <td className="mono">{job.jobNumber}</td>
                        <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.description}</td>
                        <td style={{ color: 'var(--text-tertiary)' }}>{job.equipment?.name ?? '—'}</td>
                        <td><span className={`badge ${sc.badge}`}><span className={`status-dot ${sc.dot}`} />{sc.label}</span></td>
                        <td style={{ color: 'var(--text-tertiary)' }}>
                          {job.scheduledStartDate ? new Date(job.scheduledStartDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{hoursFromJob(job)}h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TimeTrackingPage() {
  const [jobs, setJobs]                 = useState<Job[]>([]);
  const [technicians, setTechnicians]   = useState<Technician[]>([]);
  const [utilData, setUtilData]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [period, setPeriod]             = useState('30d');
  const [search, setSearch]             = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const days = PERIOD_DAYS[period] ?? 30;
      const [j, t, u] = await Promise.all([
        jobCardsApi.getAll(),
        referenceDataApi.getTechnicians(),
        intelligenceApi.getTechnicianUtilization(days).catch(() => []),
      ]);
      setJobs(Array.isArray(j) ? j : []);
      setTechnicians(Array.isArray(t) ? t : []);
      setUtilData(Array.isArray(u) ? u : []);
    } catch { /* silently degrade */ } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  // Build per-technician rows
  const techRows: TechRow[] = technicians
    .map(tech => {
      const techJobs = jobs.filter(j => j.assignedTechnician?.id === tech.id);
      const completed  = techJobs.filter(j => j.status === 3).length;
      const inProgress = techJobs.filter(j => j.status === 2).length;
      const scheduled  = techJobs.filter(j => j.status === 1).length;
      const estimatedHours = techJobs.reduce((sum, j) => sum + hoursFromJob(j), 0);

      // utilisation from intelligence API if available
      const utilRecord = utilData.find((u: any) =>
        u.technicianId === tech.id ||
        (u.technicianName && techName(tech).toLowerCase().includes(u.technicianName?.toLowerCase()))
      );
      const utilPct = utilRecord?.utilizationPercentage
        ? Math.round(utilRecord.utilizationPercentage)
        : techJobs.length > 0
          ? Math.min(100, Math.round((completed / techJobs.length) * 100))
          : 0;

      return {
        id: tech.id,
        name: techName(tech),
        jobs: techJobs,
        totalJobs: techJobs.length,
        completed,
        inProgress,
        scheduled,
        estimatedHours: Math.round(estimatedHours * 10) / 10,
        utilPct,
      };
    })
    .filter(r => {
      if (!search) return true;
      return r.name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => b.totalJobs - a.totalJobs);

  // Unassigned jobs
  const unassigned = jobs.filter(j => !j.assignedTechnician && j.status !== 3 && j.status !== 4);

  // Summary KPIs
  const totalAssigned   = jobs.filter(j => j.assignedTechnician).length;
  const totalCompleted  = jobs.filter(j => j.status === 3).length;
  const activeTechs     = techRows.filter(r => r.inProgress > 0).length;
  const totalHours      = techRows.reduce((s, r) => s + r.estimatedHours, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Time Tracking</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Technician workload and job hours derived from job card assignments</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Period selector */}
          {Object.keys(PERIOD_DAYS).map(p => (
            <button
              key={p}
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Active Technicians', value: loading ? '…' : activeTechs,   icon: <Users size={16} />,        color: 'var(--accent-blue)',    bg: 'linear-gradient(135deg,rgba(59,130,246,.15),rgba(59,130,246,.05))' },
          { label: 'Assigned Jobs',      value: loading ? '…' : totalAssigned,  icon: <Wrench size={16} />,       color: 'var(--accent-violet)',   bg: 'linear-gradient(135deg,rgba(139,92,246,.15),rgba(139,92,246,.05))' },
          { label: 'Jobs Completed',     value: loading ? '…' : totalCompleted, icon: <CheckCircle2 size={16} />, color: 'var(--accent-emerald)', bg: 'linear-gradient(135deg,rgba(16,185,129,.15),rgba(16,185,129,.05))' },
          { label: 'Est. Total Hours',   value: loading ? '…' : `${totalHours}h`, icon: <Clock size={16} />,      color: 'var(--accent-amber)',   bg: 'linear-gradient(135deg,rgba(245,166,35,.15),rgba(245,166,35,.05))' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: kpi.bg, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color, letterSpacing: -1 }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Technician table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div className="section-header" style={{ padding: '14px 20px', marginBottom: 0 }}>
          <div>
            <div className="section-title">Technician Workload</div>
            <div className="section-sub">Click a row to see assigned jobs</div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Search technician…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 30, height: 32, fontSize: 13, width: 180 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
        ) : techRows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {search ? 'No technicians match your search' : 'No technicians found'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Total Jobs</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>Scheduled</th>
                  <th>Est. Hours</th>
                  <th style={{ minWidth: 160 }}>Utilisation</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {techRows.map(row => <TechRow key={row.id} row={row} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unassigned jobs */}
      {unassigned.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="section-header" style={{ padding: '14px 20px', marginBottom: 0 }}>
            <div>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} style={{ color: 'var(--accent-amber)' }} /> Unassigned Jobs
              </div>
              <div className="section-sub">{unassigned.length} job{unassigned.length !== 1 ? 's' : ''} without a technician</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job #</th>
                  <th>Description</th>
                  <th>Equipment</th>
                  <th>Status</th>
                  <th>Scheduled Start</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map(job => {
                  const sc = statusConfig[job.status] ?? statusConfig[0];
                  return (
                    <tr key={job.id}>
                      <td className="mono">{job.jobNumber}</td>
                      <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.description}</td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{job.equipment?.name ?? '—'}</td>
                      <td><span className={`badge ${sc.badge}`}><span className={`status-dot ${sc.dot}`} />{sc.label}</span></td>
                      <td style={{ color: 'var(--text-tertiary)' }}>
                        {job.scheduledStartDate ? new Date(job.scheduledStartDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

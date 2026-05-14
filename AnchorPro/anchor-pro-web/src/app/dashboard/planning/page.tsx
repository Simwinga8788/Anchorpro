'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, Wrench,
  RefreshCw, LayoutGrid, Search, User
} from 'lucide-react';
import { jobCardsApi, referenceDataApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Job {
  id: number;
  jobNumber: string;
  description: string;
  status: number;
  priority: number;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
  assignedTechnician?: { id: string; firstName?: string; lastName?: string; userName: string };
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<number, { label: string; badge: string; dot: string }> = {
  0: { label: 'Unscheduled', badge: 'badge-muted',  dot: 'muted'  },
  1: { label: 'Scheduled',   badge: 'badge-amber',  dot: 'amber'  },
  2: { label: 'In Progress', badge: 'badge-blue',   dot: 'blue'   },
  3: { label: 'Completed',   badge: 'badge-green',  dot: 'green'  },
  4: { label: 'Cancelled',   badge: 'badge-rose',   dot: 'rose'   },
  5: { label: 'On Hold',     badge: 'badge-amber',  dot: 'amber'  },
};

const priorityConfig: Record<number, { label: string; color: string }> = {
  0: { label: 'Low',      color: 'var(--text-muted)'   },
  1: { label: 'Normal',   color: 'var(--accent-blue)'  },
  2: { label: 'High',     color: 'var(--accent-amber)' },
  3: { label: 'Critical', color: 'var(--accent-rose)'  },
};

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function techName(t?: Technician | null) {
  if (!t) return 'Unassigned';
  return `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || t.userName;
}

function startOf(date: Date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function jobDateKey(job: Job): string | null {
  const d = job.scheduledStartDate;
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

// ─── Job chip shown in calendar cell ─────────────────────────────────────────

function JobChip({ job, onClick }: { job: Job; onClick: () => void }) {
  const pc = priorityConfig[job.priority] ?? priorityConfig[1];
  const sc = statusConfig[job.status] ?? statusConfig[0];
  return (
    <button
      onClick={onClick}
      title={job.description}
      style={{
        width: '100%', textAlign: 'left', background: 'var(--bg-elevated)',
        border: `1px solid var(--border-default)`,
        borderLeft: `3px solid ${pc.color}`,
        borderRadius: 5, padding: '3px 6px', cursor: 'pointer',
        marginBottom: 3, fontSize: 11, lineHeight: 1.3,
        color: 'var(--text-primary)', display: 'block',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
    >
      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {job.jobNumber}
      </div>
      <div style={{ color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {job.description}
      </div>
      <span className={`badge ${sc.badge}`} style={{ fontSize: 9, padding: '1px 5px', marginTop: 2 }}>
        <span className={`status-dot ${sc.dot}`} style={{ width: 5, height: 5 }} />
        {sc.label}
      </span>
    </button>
  );
}

// ─── Job detail slide-over content ────────────────────────────────────────────

function JobDetailPanel({ job }: { job: Job }) {
  const sc = statusConfig[job.status] ?? statusConfig[0];
  const pc = priorityConfig[job.priority] ?? priorityConfig[1];
  const rows = [
    { label: 'Job Number',      value: job.jobNumber },
    { label: 'Equipment',       value: job.equipment?.name ?? '—' },
    { label: 'Job Type',        value: job.jobType?.name ?? '—' },
    { label: 'Customer',        value: job.customer?.name ?? '—' },
    { label: 'Technician',      value: techName(job.assignedTechnician) },
    { label: 'Scheduled Start', value: job.scheduledStartDate ? new Date(job.scheduledStartDate).toLocaleString() : '—' },
    { label: 'Scheduled End',   value: job.scheduledEndDate   ? new Date(job.scheduledEndDate).toLocaleString()   : '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: 16, background: 'var(--bg-app)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>JOB CARD</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{job.jobNumber}</div>
          </div>
          <span className={`badge ${sc.badge}`}>
            <span className={`status-dot ${sc.dot}`} />{sc.label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{job.description}</p>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: pc.color }}>{pc.label} Priority</span>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: 'flex', justifyContent: 'space-between', padding: '10px 16px',
            borderBottom: i < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{r.value}</span>
          </div>
        ))}
      </div>
      <a href="/dashboard/jobs" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <Wrench size={14} /> Open in Job Cards
      </a>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ title, badge, jobs, onJobClick }: {
  title: string; badge: string; jobs: Job[]; onJobClick: (j: Job) => void;
}) {
  return (
    <div style={{
      flex: '0 0 240px', background: 'var(--bg-secondary)',
      borderRadius: 10, border: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 220px)',
    }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</span>
        <span className={`badge ${badge}`} style={{ fontSize: 11 }}>{jobs.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>No jobs</div>
        ) : jobs.map(job => (
          <div
            key={job.id}
            onClick={() => onJobClick(job)}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: 12, marginBottom: 8, cursor: 'pointer',
              transition: 'border-color 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
              (e.currentTarget as HTMLElement).style.transform = '';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{job.jobNumber}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: priorityConfig[job.priority]?.color ?? 'var(--text-muted)' }}>
                {priorityConfig[job.priority]?.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.4 }}>
              {job.description.length > 60 ? job.description.slice(0, 60) + '…' : job.description}
            </div>
            {job.equipment && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                <Wrench size={10} style={{ display: 'inline', marginRight: 4 }} />{job.equipment.name}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={10} />{techName(job.assignedTechnician)}
              </div>
              {job.scheduledStartDate && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={9} />{new Date(job.scheduledStartDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlanningPage() {
  const [jobs, setJobs]               = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState<'calendar' | 'kanban'>('calendar');
  const [currentDate, setCurrentDate] = useState(() => startOf(new Date()));
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [techFilter, setTechFilter]   = useState('');
  const [search, setSearch]           = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [j, t] = await Promise.all([
        jobCardsApi.getAll(),
        referenceDataApi.getTechnicians(),
      ]);
      setJobs(Array.isArray(j) ? j : []);
      setTechnicians(Array.isArray(t) ? t : []);
    } catch { /* silently degrade */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = jobs.filter(j => {
    if (techFilter && j.assignedTechnician?.id !== techFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!j.jobNumber.toLowerCase().includes(q) && !j.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const jobsByDate: Record<string, Job[]> = {};
  filtered.forEach(job => {
    const key = jobDateKey(job);
    if (key) {
      if (!jobsByDate[key]) jobsByDate[key] = [];
      jobsByDate[key].push(job);
    }
  });

  const unscheduled = filtered.filter(j => !j.scheduledStartDate && j.status !== 3 && j.status !== 4);
  const today = new Date().toISOString().slice(0, 10);

  const kanbanCols = [
    { key: 0, title: 'Unscheduled', badge: 'badge-muted'  },
    { key: 1, title: 'Scheduled',   badge: 'badge-amber'  },
    { key: 2, title: 'In Progress', badge: 'badge-blue'   },
    { key: 3, title: 'Completed',   badge: 'badge-green'  },
    { key: 5, title: 'On Hold',     badge: 'badge-amber'  },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Planning Board</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Schedule and track job assignments across the team</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 2, gap: 2 }}>
            <button
              onClick={() => setView('calendar')}
              className={`btn btn-sm ${view === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}
            >
              <CalendarDays size={13} /> Calendar
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`btn btn-sm ${view === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}
            >
              <LayoutGrid size={13} /> Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search jobs…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 30, width: '100%', height: 34, fontSize: 13 }} />
        </div>
        <select className="input" value={techFilter} onChange={e => setTechFilter(e.target.value)}
          style={{ height: 34, fontSize: 13, flex: '0 0 auto', paddingRight: 28 }}>
          <option value="">All Technicians</option>
          {technicians.map(t => <option key={t.id} value={t.id}>{techName(t)}</option>)}
        </select>
      </div>

      {/* KPI strip */}
      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Jobs',  value: filtered.length,                             color: 'var(--accent-blue)',    bg: 'linear-gradient(135deg,rgba(59,130,246,.15),rgba(59,130,246,.05))' },
          { label: 'Unscheduled', value: filtered.filter(j => j.status === 0).length, color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
          { label: 'In Progress', value: filtered.filter(j => j.status === 2).length, color: 'var(--accent-blue)',    bg: 'linear-gradient(135deg,rgba(59,130,246,.15),rgba(59,130,246,.05))' },
          { label: 'Completed',   value: filtered.filter(j => j.status === 3).length, color: 'var(--accent-emerald)', bg: 'linear-gradient(135deg,rgba(16,185,129,.15),rgba(16,185,129,.05))' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: kpi.bg, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color, letterSpacing: -1 }}>{loading ? '…' : kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}>
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{MONTHS[month]} {year}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((date, i) => {
              if (!date) {
                return <div key={`e-${i}`} style={{ minHeight: 100, borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', opacity: 0.4 }} />;
              }
              const key = date.toISOString().slice(0, 10);
              const dayJobs = jobsByDate[key] ?? [];
              const isToday   = key === today;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <div key={key} style={{
                  minHeight: 100, padding: 6,
                  borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)',
                  background: isToday ? 'rgba(59,130,246,0.05)' : isWeekend ? 'var(--bg-secondary)' : 'var(--bg-card)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, marginBottom: 4, color: isToday ? 'var(--accent-blue)' : 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{date.getDate()}</span>
                    {dayJobs.length > 0 && (
                      <span style={{ fontSize: 10, background: 'var(--accent-blue)', color: '#fff', borderRadius: 10, padding: '1px 5px', fontWeight: 700 }}>{dayJobs.length}</span>
                    )}
                  </div>
                  {dayJobs.slice(0, 3).map(job => (
                    <JobChip key={job.id} job={job} onClick={() => setSelectedJob(job)} />
                  ))}
                  {dayJobs.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '2px 0' }}>+{dayJobs.length - 3} more</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Unscheduled tray */}
          {unscheduled.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-default)', padding: '12px 16px', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
                Unscheduled Jobs ({unscheduled.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {unscheduled.map(job => (
                  <button key={job.id} onClick={() => setSelectedJob(job)}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  >
                    <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{job.jobNumber}</span>
                    <span style={{ color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
            {kanbanCols.map(col => (
              <KanbanColumn
                key={col.key}
                title={col.title}
                badge={col.badge}
                jobs={filtered.filter(j => j.status === col.key)}
                onJobClick={setSelectedJob}
              />
            ))}
          </div>
        </div>
      )}

      {/* Job detail slide-over */}
      <SlideOver open={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob?.jobNumber ?? 'Job Detail'}>
        {selectedJob && <JobDetailPanel job={selectedJob} />}
      </SlideOver>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

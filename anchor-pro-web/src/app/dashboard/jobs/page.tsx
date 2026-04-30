'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Wrench, AlertTriangle, Clock,
  CheckCircle2, XCircle, MoreHorizontal, User, Calendar, Tag
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';
import JobCardForm from '@/components/JobCardForm';

const STATUSES = ['All', 'Unscheduled', 'Scheduled', 'In Progress', 'Completed', 'Confirmed', 'Cancelled'];
const PRIORITIES = ['All', 'Low', 'Normal', 'High', 'Critical'];

const statusConfig: Record<number, { label: string; badge: string; dot: string; icon: React.ReactNode; value: number }> = {
  0: { label: 'Unscheduled', badge: 'badge-muted',   dot: 'muted',   icon: <Clock size={12} />,         value: 0 },
  1: { label: 'Scheduled',   badge: 'badge-amber',   dot: 'amber',   icon: <Clock size={12} />,         value: 1 },
  2: { label: 'In Progress', badge: 'badge-blue',    dot: 'blue',    icon: <Wrench size={12} />,        value: 2 },
  3: { label: 'Completed',   badge: 'badge-green',   dot: 'green',   icon: <CheckCircle2 size={12} />,  value: 3 },
  4: { label: 'Confirmed',   badge: 'badge-violet',  dot: 'violet',  icon: <CheckCircle2 size={12} />,  value: 4 },
  5: { label: 'Cancelled',   badge: 'badge-rose',    dot: 'rose',    icon: <XCircle size={12} />,       value: 5 },
};

const priorityConfig: Record<number, { label: string; badge: string }> = {
  0: { label: 'Low',      badge: 'badge-muted' },
  1: { label: 'Normal',   badge: 'badge-blue' },
  2: { label: 'High',     badge: 'badge-amber' },
  3: { label: 'Critical', badge: 'badge-rose' },
};

// ── Job Detail / Edit Panel ────────────────────────────────────────────────────

function JobDetailPanel({ job, technicians, onClose, onSaved }: {
  job: any;
  technicians: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [form, setForm] = useState({
    assignedTechnicianId: job.assignedTechnicianId ?? job.assignedTechnician?.id ?? '',
    scheduledStartDate: job.scheduledStartDate ? job.scheduledStartDate.slice(0, 16) : '',
    scheduledEndDate: job.scheduledEndDate ? job.scheduledEndDate.slice(0, 16) : '',
    priority: job.priority ?? 1,
  });

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // PATCH /api/jobcards/{id} — update assignedTechnicianId + scheduling
      await fetch(`/api/jobcards/${job.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...job,
          assignedTechnicianId: form.assignedTechnicianId || null,
          scheduledStartDate: form.scheduledStartDate || null,
          scheduledEndDate: form.scheduledEndDate || null,
          priority: form.priority,
        }),
      });
      onSaved();
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (newStatus: number) => {
    setStatusUpdating(true);
    try {
      await dashboardApi.updateJobStatus(job.id, newStatus);
      onSaved();
    } catch (err: any) {
      alert('Status update failed: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const sc = statusConfig[job.status] ?? statusConfig[0];
  const pc = priorityConfig[job.priority] ?? priorityConfig[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Job summary */}
      <div style={{ padding: 16, background: 'var(--bg-app)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)' }}>{job.jobNumber}</span>
          <span className={`badge ${sc.badge}`}><span className={`status-dot ${sc.dot}`} />{sc.label}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          {job.equipment?.name || 'Unknown Asset'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {job.description || 'No description'}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          {job.jobType?.name && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tag size={10} /> {job.jobType.name}
            </span>
          )}
          {job.customer?.name && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={10} /> {job.customer.name}
            </span>
          )}
          {job.totalCost > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)' }}>
              K {job.totalCost.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Status change */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Change Status
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.values(statusConfig).filter(s => s.value !== job.status).map(s => (
            <button
              key={s.value}
              className={`badge ${s.badge}`}
              disabled={statusUpdating}
              onClick={() => changeStatus(s.value)}
              style={{ cursor: 'pointer', border: '1px solid transparent', padding: '5px 10px', fontSize: 12, opacity: statusUpdating ? 0.5 : 1 }}
            >
              {s.icon} <span style={{ marginLeft: 4 }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reassign form */}
      <form onSubmit={handleReassign}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          Assignment & Scheduling
        </div>

        <div className="form-field" style={{ marginBottom: 14 }}>
          <label className="form-label"><User size={11} style={{ marginRight: 4 }} />Assigned Technician</label>
          <select
            className="form-select"
            value={form.assignedTechnicianId}
            onChange={e => setForm({ ...form, assignedTechnicianId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.userName ?? t.firstName + ' ' + t.lastName}</option>
            ))}
          </select>
        </div>

        <div className="form-field" style={{ marginBottom: 14 }}>
          <label className="form-label">Priority</label>
          <select
            className="form-select"
            value={form.priority}
            onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })}
          >
            <option value={0}>Low</option>
            <option value={1}>Normal</option>
            <option value={2}>High</option>
            <option value={3}>Critical</option>
          </select>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-field">
            <label className="form-label"><Calendar size={11} style={{ marginRight: 4 }} />Scheduled Start</label>
            <input
              type="datetime-local"
              className="form-input"
              value={form.scheduledStartDate}
              onChange={e => setForm({ ...form, scheduledStartDate: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Deadline</label>
            <input
              type="datetime-local"
              className="form-input"
              value={form.scheduledEndDate}
              onChange={e => setForm({ ...form, scheduledEndDate: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function JobCardsPage() {
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [jobs, setJobs]                   = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [technicians, setTechnicians]     = useState<any[]>([]);
  const [isNewJobOpen, setIsNewJobOpen]   = useState(false);
  const [selectedJob, setSelectedJob]     = useState<any>(null);
  const [openMenuId, setOpenMenuId]       = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchJobs = () => {
    setLoading(true);
    Promise.all([
      dashboardApi.getJobCards(),
      dashboardApi.getReferenceDataTechnicians(),
    ])
      .then(([jobData, techData]) => {
        setJobs(jobData || []);
        setTechnicians(techData || []);
      })
      .catch(err => console.error('Could not load jobs', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = jobs.filter(j =>
    (statusFilter === 'All' || statusConfig[j.status]?.label === statusFilter) &&
    (priorityFilter === 'All' || priorityConfig[j.priority]?.label === priorityFilter) &&
    (
      j.jobNumber?.toLowerCase().includes(search.toLowerCase()) ||
      j.equipment?.name?.toLowerCase().includes(search.toLowerCase()) ||
      j.description?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      {/* New Job SlideOver */}
      <SlideOver
        open={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        title="New Job Card"
        subtitle="Define maintenance steps, assign technicians, and schedule work."
        width={600}
      >
        <JobCardForm
          onSuccess={() => { fetchJobs(); setIsNewJobOpen(false); }}
          onCancel={() => setIsNewJobOpen(false)}
        />
      </SlideOver>

      {/* Job Detail / Edit SlideOver */}
      <SlideOver
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.jobNumber ?? 'Job Details'}
        subtitle={selectedJob?.equipment?.name ?? 'Edit assignment and scheduling'}
      >
        {selectedJob && (
          <JobDetailPanel
            job={selectedJob}
            technicians={technicians}
            onClose={() => setSelectedJob(null)}
            onSaved={() => { fetchJobs(); setSelectedJob(null); }}
          />
        )}
      </SlideOver>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Job Cards</h1>
          <p className="page-subtitle">{jobs.length} total operations · {jobs.filter(j => j.status === 2).length} active</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewJobOpen(true)}>
          <Plus size={14} /> New Job Card
        </button>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'In Progress',      value: jobs.filter(j => j.status === 2).length, color: 'var(--accent-blue)',    icon: <Wrench size={15} /> },
          { label: 'Scheduled',        value: jobs.filter(j => j.status === 1).length, color: 'var(--accent-amber)',   icon: <Clock size={15} /> },
          { label: 'Completed',        value: jobs.filter(j => j.status === 3 || j.status === 4).length, color: 'var(--accent-emerald)', icon: <CheckCircle2 size={15} /> },
          { label: 'Critical Priority',value: jobs.filter(j => j.priority === 3).length, color: 'var(--accent-rose)',  icon: <AlertTriangle size={15} /> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div className="stat-icon" style={{ background: s.color + '20', marginBottom: 0 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
              <div className="stat-label" style={{ margin: 0 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search by job ID, description, or asset…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className="btn btn-sm" style={{
                background: statusFilter === s ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                color: statusFilter === s ? 'white' : 'var(--text-secondary)',
                border: '1px solid ' + (statusFilter === s ? 'var(--accent-blue)' : 'var(--border-subtle)'),
                whiteSpace: 'nowrap',
              }}>{s}</button>
            ))}
          </div>
          <select className="search-input" style={{ width: 140 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Job Reference</th>
              <th>Asset</th>
              <th>Type</th>
              <th>Technician</th>
              <th>Scheduled Start</th>
              <th>Priority</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Est. Cost</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px 0' }}>Loading job cards...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No jobs found</td></tr>
            ) : filtered.map(job => {
              const sc = statusConfig[job.status] ?? statusConfig[0];
              const pc = priorityConfig[job.priority] ?? priorityConfig[1];
              const techName = job.assignedTechnician
                ? (job.assignedTechnician.firstName
                    ? `${job.assignedTechnician.firstName} ${job.assignedTechnician.lastName ?? ''}`.trim()
                    : job.assignedTechnician.userName)
                : 'Unassigned';

              return (
                <tr
                  key={job.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setOpenMenuId(null); setSelectedJob(job); }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className={`priority-bar ${pc.label.toLowerCase()}`} />
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: 13 }}>{job.jobNumber}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{job.equipment?.name || 'Unknown'}</td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{job.jobType?.name || '—'}</td>
                  <td style={{ color: job.assignedTechnician ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: 13, fontStyle: job.assignedTechnician ? 'normal' : 'italic' }}>
                    {techName}
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                    {job.scheduledStartDate ? new Date(job.scheduledStartDate).toLocaleDateString() : '—'}
                  </td>
                  <td><span className={`badge ${pc.badge}`}>{pc.label}</span></td>
                  <td><span className={`badge ${sc.badge}`}><span className={`status-dot ${sc.dot}`} />{sc.label}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {job.totalCost > 0 ? `K ${job.totalCost.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ textAlign: 'right', position: 'relative' }} onClick={e => e.stopPropagation()}>
                    <div ref={openMenuId === job.id ? menuRef : undefined} style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 4 }}
                        onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {openMenuId === job.id && (
                        <div style={{
                          position: 'absolute', right: 0, top: '100%', zIndex: 50, minWidth: 160,
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden',
                        }}>
                          {[
                            { label: 'View / Edit', action: () => { setSelectedJob(job); setOpenMenuId(null); } },
                            { label: 'Mark Scheduled', action: () => { dashboardApi.updateJobStatus(job.id, 1).then(fetchJobs); setOpenMenuId(null); } },
                            { label: 'Mark In Progress', action: () => { dashboardApi.updateJobStatus(job.id, 2).then(fetchJobs); setOpenMenuId(null); } },
                            { label: 'Mark Completed', action: () => { dashboardApi.updateJobStatus(job.id, 3).then(fetchJobs); setOpenMenuId(null); } },
                            { label: 'Cancel Job', action: () => { if (confirm('Cancel this job?')) dashboardApi.updateJobStatus(job.id, 5).then(fetchJobs); setOpenMenuId(null); }, danger: true },
                          ].map(item => (
                            <button
                              key={item.label}
                              onClick={item.action}
                              style={{
                                width: '100%', textAlign: 'left', padding: '9px 14px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 13, color: (item as any).danger ? 'var(--accent-rose)' : 'var(--text-secondary)',
                                borderBottom: '1px solid var(--border-subtle)',
                              }}
                              onMouseEnter={e => ((e.target as HTMLElement).style.background = 'var(--bg-hover)')}
                              onMouseLeave={e => ((e.target as HTMLElement).style.background = 'none')}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Showing {filtered.length} of {jobs.length} records</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Total Value: <strong style={{ color: 'var(--text-primary)' }}>K {filtered.reduce((a, j) => a + (j.totalCost || 0), 0).toLocaleString()}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

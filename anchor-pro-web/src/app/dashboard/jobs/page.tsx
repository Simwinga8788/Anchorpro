'use client';

import { useState, useEffect } from 'react';
import {
  Search, Plus, Filter, ChevronDown, Wrench,
  AlertTriangle, Clock, CheckCircle2, XCircle, MoreHorizontal
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';
import JobCardForm from '@/components/JobCardForm';

const STATUSES = ['All', 'Unscheduled', 'Scheduled', 'In Progress', 'Completed', 'Confirmed', 'Cancelled'];
const PRIORITIES = ['All', 'Low', 'Normal', 'High', 'Critical'];

const statusConfig: Record<number, { label: string; badge: string; dot: string; icon: React.ReactNode }> = {
  0: { label: 'Unscheduled', badge: 'badge-muted',  dot: 'muted', icon: <Clock size={12} /> },
  1: { label: 'Scheduled',   badge: 'badge-amber',  dot: 'amber', icon: <Clock size={12} /> },
  2: { label: 'In Progress', badge: 'badge-blue',   dot: 'blue',  icon: <Wrench size={12} /> },
  3: { label: 'Completed',   badge: 'badge-green',  dot: 'green', icon: <CheckCircle2 size={12} /> },
  4: { label: 'Confirmed',   badge: 'badge-violet', dot: 'violet', icon: <CheckCircle2 size={12} /> },
  5: { label: 'Cancelled',   badge: 'badge-rose',   dot: 'rose',  icon: <XCircle size={12} /> },
};

const priorityConfig: Record<number, { label: string; badge: string }> = {
  0: { label: 'Low',      badge: 'badge-muted' },
  1: { label: 'Normal',   badge: 'badge-blue' },
  2: { label: 'High',     badge: 'badge-amber' },
  3: { label: 'Critical', badge: 'badge-rose' },
};

export default function JobCardsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);

  const fetchJobs = () => {
    setLoading(true);
    dashboardApi.getJobCards()
      .then(data => setJobs(data || []))
      .catch(err => console.error("Could not load jobs", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filtered = jobs.filter(j =>
    (statusFilter === 'All' || (statusConfig[j.status]?.label === statusFilter)) &&
    (priorityFilter === 'All' || (priorityConfig[j.priority]?.label === priorityFilter)) &&
    (j.jobNumber?.toLowerCase().includes(search.toLowerCase()) ||
     j.equipment?.name?.toLowerCase().includes(search.toLowerCase()) ||
     j.description?.toLowerCase().includes(search.toLowerCase()))
  );

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
          onSuccess={() => { fetchJobs(); setIsNewJobOpen(false); }} 
          onCancel={() => setIsNewJobOpen(false)} 
        />
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
          { label: 'In Progress', value: jobs.filter(j=>j.status===2).length, color: 'var(--accent-blue)', icon: <Wrench size={15}/> },
          { label: 'Scheduled',   value: jobs.filter(j=>j.status===1).length, color: 'var(--accent-amber)', icon: <Clock size={15}/> },
          { label: 'Completed',   value: jobs.filter(j=>j.status===3 || j.status===4).length, color: 'var(--accent-emerald)', icon: <CheckCircle2 size={15}/> },
          { label: 'Critical Priority', value: jobs.filter(j=>j.priority===3).length, color: 'var(--accent-rose)', icon: <AlertTriangle size={15}/> },
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
        {/* Filter bar */}
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
                whiteSpace: 'nowrap'
              }}>{s}</button>
            ))}
          </div>

          <select className="search-input" style={{ width: 140 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Table */}
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
              const sc = statusConfig[job.status] ?? { label: 'Unknown', badge: 'badge-muted', dot: 'muted', icon: null };
              const pc = priorityConfig[job.priority] ?? { label: 'Unknown', badge: 'badge-muted' };
              const techName = job.assignedTechnician ? job.assignedTechnician.userName : 'Unassigned';
              
              return (
                <tr key={job.id} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className={`priority-bar ${pc.label.toLowerCase()}`} />
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: 13 }}>{job.jobNumber}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{job.equipment?.name || 'Unknown'}</td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{job.jobType?.name || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{techName}</td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                    {job.scheduledStartDate ? new Date(job.scheduledStartDate).toLocaleDateString() : '—'}
                  </td>
                  <td><span className={`badge ${pc.badge}`}>{pc.label}</span></td>
                  <td><span className={`badge ${sc.badge}`}><span className={`status-dot ${sc.dot}`} />{sc.label}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {job.totalCost > 0 ? `K ${job.totalCost.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4 }}><MoreHorizontal size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Footer */}
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Showing {filtered.length} of {jobs.length} records</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Total Value: <strong style={{ color: 'var(--text-primary)' }}>K {filtered.reduce((a,j)=>a+(j.totalCost||0),0).toLocaleString()}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

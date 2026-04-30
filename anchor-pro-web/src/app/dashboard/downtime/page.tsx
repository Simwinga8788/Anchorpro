'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Search, MoreHorizontal, Pause, Plus, X, Zap } from 'lucide-react';
import { dashboardApi } from '@/lib/api';

export default function DowntimePage() {
  const [downtime, setDowntime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ jobCardId: '', jobTaskId: '', downtimeCategoryId: '', notes: '', startTime: '' });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      dashboardApi.getAllDowntime(),
      dashboardApi.getDowntimeCategories(),
      dashboardApi.getJobCards(),
    ]).then(([dt, cats, jbs]) => {
      setDowntime(dt || []);
      setCategories(cats || []);
      setJobs(jbs || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load tasks when job is selected
  useEffect(() => {
    if (!form.jobCardId) { setTasks([]); return; }
    dashboardApi.getJobTasks(Number(form.jobCardId))
      .then((t: any[]) => setTasks(t || []))
      .catch(() => setTasks([]));
  }, [form.jobCardId]);

  const filtered = downtime.filter(d =>
    d.equipment?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const activeDowntime = downtime.filter(d => !d.endTime);
  const totalDuration = downtime.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.downtimeCategoryId) return;
    setSaving(true); setErr('');
    try {
      await dashboardApi.reportDowntime({
        ...(form.jobTaskId ? { jobTaskId: Number(form.jobTaskId) } : {}),
        ...(form.jobCardId ? { jobCardId: Number(form.jobCardId) } : {}),
        downtimeCategoryId: Number(form.downtimeCategoryId),
        notes: form.notes || null,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : new Date().toISOString(),
        durationMinutes: 0,
      });
      setShowModal(false);
      setForm({ jobCardId: '', jobTaskId: '', downtimeCategoryId: '', notes: '', startTime: '' });
      load();
    } catch (ex: any) {
      setErr(ex?.message || 'Failed to report breakdown');
    } finally { setSaving(false); }
  }

  async function handleResolve(item: any) {
    try {
      const now = new Date();
      const start = new Date(item.startTime);
      const dur = Math.round((now.getTime() - start.getTime()) / 60000);
      await dashboardApi.updateDowntime(item.id, { ...item, endTime: now.toISOString(), durationMinutes: dur });
      load();
    } catch (ex: any) { alert('Error resolving: ' + ex.message); }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', fontSize: 13, padding: '8px 12px',
    background: 'var(--bg-app)', border: '1px solid var(--border-default)',
    borderRadius: 6, color: 'var(--text-primary)', boxSizing: 'border-box',
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Downtime & Reliability</h1>
          <p className="page-subtitle">Historical log of equipment breakdowns and lost production time.</p>
        </div>
        <button className="btn btn-danger" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} /> Report Breakdown
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Breakdowns', value: activeDowntime.length, color: 'var(--accent-rose)',    icon: <Pause size={16}/> },
          { label: 'Total Downtime',    value: `${Math.round(totalDuration / 60)}h`, color: 'var(--accent-amber)', icon: <Clock size={16}/> },
          { label: 'Resolved Today',    value: downtime.filter(d => d.endTime && new Date(d.endTime).toDateString() === new Date().toDateString()).length, color: 'var(--accent-emerald)', icon: <CheckCircle2 size={16}/> },
        ].map(s => (
          <div key={s.label} className="card-elevated" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search by equipment or notes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Equipment / Task</th>
              <th>Category</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>Loading downtime records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No records found</td></tr>
            ) : filtered.map(item => {
              const isActive = !item.endTime;
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.equipment?.name || item.jobTask?.jobCard?.equipment?.name || 'Unknown Asset'}</div>
                    {item.jobTask && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.jobTask.description || 'Task #' + item.jobTaskId}</div>}
                  </td>
                  <td><span className="badge badge-muted">{item.downtimeCategory?.name || item.category?.name || 'General'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{new Date(item.startTime).toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{isActive ? <span style={{ color: '#ef4444' }}>Ongoing</span> : `${item.durationMinutes} min`}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notes || '—'}</td>
                  <td>
                    {isActive ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge badge-rose"><span className="status-dot" style={{ background: '#ef4444' }} />Live</span>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => handleResolve(item)}>Resolve</button>
                      </div>
                    ) : (
                      <span className="badge badge-green">Resolved</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Report Breakdown Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowModal(false)}>
          <div className="card-elevated" style={{ width: 460, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} style={{ color: '#ef4444' }} /> Report Breakdown
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Job Card</label>
                <select style={fieldStyle} value={form.jobCardId} onChange={e => setForm(f => ({ ...f, jobCardId: e.target.value, jobTaskId: '' }))}>
                  <option value="">Select a job...</option>
                  {jobs.filter(j => j.status !== 3).map((j: any) => (
                    <option key={j.id} value={j.id}>{j.jobNumber} — {j.equipment?.name || 'Unknown'}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Job Task <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <select style={fieldStyle} value={form.jobTaskId} onChange={e => setForm(f => ({ ...f, jobTaskId: e.target.value }))}>
                  <option value="">
                    {form.jobCardId && tasks.length === 0 ? 'No tasks — job-level downtime' : 'Select a task (optional)...'}
                  </option>
                  {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.description || 'Task #' + t.id}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Downtime Category *</label>
                <select style={fieldStyle} value={form.downtimeCategoryId} onChange={e => setForm(f => ({ ...f, downtimeCategoryId: e.target.value }))} required>
                  <option value="">Select category...</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Start Time <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(leave blank for now)</span></label>
                <input style={fieldStyle} type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Notes</label>
                <textarea style={{ ...fieldStyle, resize: 'none' }} rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Describe the breakdown..." />
              </div>

              {err && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); setErr(''); }}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={saving || !form.downtimeCategoryId}>
                  {saving ? 'Reporting...' : 'Report Breakdown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

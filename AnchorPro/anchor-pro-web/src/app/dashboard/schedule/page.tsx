'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Plus, Edit2, Trash2
} from 'lucide-react';
import { projectsApi, scheduleApi } from '@/lib/api';
import Modal from '@/components/Modal';

const STATUS_LABELS = ['Not Started', 'In Progress', 'Complete', 'Delayed'];
const STATUS_BADGE: Record<number, string> = { 0: 'badge-muted', 1: 'badge-blue', 2: 'badge-green', 3: 'badge-red' };

const emptyForm = {
  title: '', trade: '', plannedStartDate: '', plannedEndDate: '', predecessorMilestoneId: '' as string | number
};

export default function SchedulePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    projectsApi.getProjects()
      .then((res: any) => {
        const list = res.data ?? res;
        setProjects(list);
        if (list.length > 0 && !selectedProjectId) setSelectedProjectId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const loadMilestones = async (projId: number) => {
    setLoading(true);
    try {
      const data = await scheduleApi.getByProject(projId);
      setMilestones(Array.isArray(data) ? data : []);
    } catch {
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) loadMilestones(selectedProjectId);
  }, [selectedProjectId]);

  const overallProgress = Math.round(
    milestones.reduce((acc, m) => acc + m.progressPercentage, 0) / (milestones.length || 1)
  );

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const openEditModal = (m: any) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      trade: m.trade || '',
      plannedStartDate: m.plannedStartDate.split('T')[0],
      plannedEndDate: m.plannedEndDate.split('T')[0],
      predecessorMilestoneId: m.predecessorMilestoneId || ''
    });
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !form.title || !form.plannedStartDate || !form.plannedEndDate) return;
    const payload = {
      title: form.title,
      trade: form.trade || undefined,
      plannedStartDate: form.plannedStartDate,
      plannedEndDate: form.plannedEndDate,
      predecessorMilestoneId: form.predecessorMilestoneId ? Number(form.predecessorMilestoneId) : null
    };
    try {
      if (editingId) {
        await scheduleApi.update(editingId, payload);
      } else {
        await scheduleApi.create({ projectId: selectedProjectId, ...payload });
      }
      setShowAddModal(false);
      await loadMilestones(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleProgressChange = async (m: any, progressPercentage: number) => {
    let status = m.status;
    if (progressPercentage >= 100) status = 2;
    else if (progressPercentage > 0 && status === 0) status = 1;
    try {
      await scheduleApi.updateProgress(m.id, {
        progressPercentage,
        status,
        actualStartDate: m.actualStartDate ?? (status !== 0 ? new Date().toISOString() : null),
        actualEndDate: status === 2 ? (m.actualEndDate ?? new Date().toISOString()) : m.actualEndDate
      });
      if (selectedProjectId) await loadMilestones(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (m: any, status: number) => {
    try {
      await scheduleApi.updateProgress(m.id, {
        progressPercentage: status === 2 ? 100 : m.progressPercentage,
        status,
        actualStartDate: m.actualStartDate ?? (status !== 0 ? new Date().toISOString() : null),
        actualEndDate: status === 2 ? new Date().toISOString() : m.actualEndDate
      });
      if (selectedProjectId) await loadMilestones(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this activity from the schedule?')) return;
    try {
      await scheduleApi.remove(id);
      if (selectedProjectId) await loadMilestones(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isLate = (m: any) => m.status !== 2 && new Date(m.plannedEndDate) < new Date();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={24} style={{ color: 'var(--accent-blue)' }} />
            <h1 className="topbar-title" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              Construction Program &amp; Schedule
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Planned activities tracked against actual progress. Dates are set by your team — not auto-calculated.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {projects.length > 0 && (
            <select
              className="form-select"
              style={{ width: 240 }}
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="btn btn-primary" onClick={openAddModal} style={{ gap: 6 }}>
            <Plus size={15} /> Add Program Activity
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Overall Progress
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 4, fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
            {overallProgress}%
          </div>
          <div style={{ width: '100%', height: 6, background: 'var(--bg-hover)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${overallProgress}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: 3 }} />
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Active Activities
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-emerald)', marginTop: 4, fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
            {milestones.filter(m => m.status === 1).length} <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>/ {milestones.length} total</span>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Delayed
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: milestones.filter(m => m.status === 3).length > 0 ? '#ef4444' : 'var(--accent-amber)', marginTop: 4, fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
            {milestones.filter(m => m.status === 3).length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Flagged by status</div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Program Activities</h3>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{milestones.length} activities</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading schedule…</div>
          ) : milestones.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No activities on this project&apos;s schedule yet. Click &quot;Add Program Activity&quot; above.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-hover)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Activity / Trade</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Planned</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Actual</th>
                  <th style={{ padding: '10px 16px', width: 200, fontWeight: 600 }}>Progress</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</div>
                      {m.trade && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Trade: {m.trade}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', color: isLate(m) ? '#ef4444' : 'var(--text-secondary)' }}>
                      {new Date(m.plannedStartDate).toLocaleDateString()} → {new Date(m.plannedEndDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {m.actualStartDate ? new Date(m.actualStartDate).toLocaleDateString() : '—'}
                      {m.actualEndDate ? ` → ${new Date(m.actualEndDate).toLocaleDateString()}` : ''}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="range" min={0} max={100} value={m.progressPercentage}
                          onChange={e => handleProgressChange(m, Number(e.target.value))}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 600, width: 36, textAlign: 'right', fontFamily: "'Barlow Semi Condensed', sans-serif" }}>{m.progressPercentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={m.status}
                        onChange={e => handleStatusChange(m, Number(e.target.value))}
                        className={`badge ${STATUS_BADGE[m.status]}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        {STATUS_LABELS.map((label, i) => <option key={i} value={i}>{label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(m)} aria-label="Edit"><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(m.id)} aria-label="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={editingId ? 'Edit Program Activity' : 'Add Program Activity'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Activity Name *</label>
            <input className="form-input" required placeholder="e.g. First Floor Slab Formwork" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Trade / Section</label>
            <input className="form-input" placeholder="e.g. Concrete & Formwork" value={form.trade} onChange={e => setForm({ ...form, trade: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Planned Start *</label>
              <input className="form-input" type="date" required value={form.plannedStartDate} onChange={e => setForm({ ...form, plannedStartDate: e.target.value })} />
            </div>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Planned End *</label>
              <input className="form-input" type="date" required value={form.plannedEndDate} onChange={e => setForm({ ...form, plannedEndDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Follows (optional)</label>
            <select className="form-select" value={form.predecessorMilestoneId} onChange={e => setForm({ ...form, predecessorMilestoneId: e.target.value })}>
              <option value="">Not linked</option>
              {milestones.filter(m => m.id !== editingId).map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Save Activity'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

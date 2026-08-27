'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Plus, Edit2, Trash2, Link2, List, GanttChartSquare
} from 'lucide-react';
import { projectsApi, scheduleApi, boqApi } from '@/lib/api';
import Modal from '@/components/Modal';

const STATUS_LABELS = ['Not Started', 'In Progress', 'Complete', 'Delayed'];
const STATUS_BADGE: Record<number, string> = { 0: 'badge-muted', 1: 'badge-blue', 2: 'badge-green', 3: 'badge-red' };

const emptyForm = {
  title: '', trade: '', plannedStartDate: '', plannedEndDate: '',
  predecessorMilestoneId: '' as string | number, boqSectionId: '' as string | number
};

export default function SchedulePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [boqSections, setBoqSections] = useState<any[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState<'timeline' | 'list'>('timeline');
  const [draftProgress, setDraftProgress] = useState<Record<number, number>>({});

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
    if (selectedProjectId) {
      loadMilestones(selectedProjectId);
      boqApi.getByProject(selectedProjectId)
        .then((boq: any) => setBoqSections(boq?.sections || []))
        .catch(() => setBoqSections([]));
    }
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
      predecessorMilestoneId: m.predecessorMilestoneId || '',
      boqSectionId: m.boqSectionId || ''
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
      predecessorMilestoneId: form.predecessorMilestoneId ? Number(form.predecessorMilestoneId) : null,
      boqSectionId: form.boqSectionId ? Number(form.boqSectionId) : null
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

  const handleProgressDrag = (m: any, progressPercentage: number) => {
    // Instant visual feedback while dragging — the committed value only lands after the API round-trip.
    setDraftProgress(prev => ({ ...prev, [m.id]: progressPercentage }));
  };

  const handleProgressCommit = async (m: any, progressPercentage: number) => {
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
    } finally {
      setDraftProgress(prev => {
        const next = { ...prev };
        delete next[m.id];
        return next;
      });
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
          <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setView('timeline')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: view === 'timeline' ? 'var(--accent-blue)' : 'var(--bg-surface)', color: view === 'timeline' ? '#fff' : 'var(--text-secondary)' }}
            >
              <GanttChartSquare size={14} /> Timeline
            </button>
            <button
              onClick={() => setView('list')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', fontSize: 13, fontWeight: 600, border: 'none', borderLeft: '1px solid var(--border-subtle)', cursor: 'pointer', background: view === 'list' ? 'var(--accent-blue)' : 'var(--bg-surface)', color: view === 'list' ? '#fff' : 'var(--text-secondary)' }}
            >
              <List size={14} /> List
            </button>
          </div>
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

      {/* Timeline (Gantt) */}
      {view === 'timeline' && (
        loading ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading schedule…</div>
        ) : milestones.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No activities on this project&apos;s schedule yet. Click &quot;Add Program Activity&quot; above.
          </div>
        ) : (
          <GanttTimeline milestones={milestones} />
        )
      )}

      {/* Schedule Table */}
      {view === 'list' && (
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
                      {m.isAutoTracked && (
                        <div style={{ fontSize: 11.5, color: 'var(--accent-blue)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Link2 size={11} /> Auto from BOQ: {m.boqSectionName}
                        </div>
                      )}
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
                          type="range" min={0} max={100}
                          value={draftProgress[m.id] ?? m.progressPercentage}
                          disabled={m.isAutoTracked}
                          onInput={e => handleProgressDrag(m, Number((e.target as HTMLInputElement).value))}
                          onChange={e => handleProgressCommit(m, Number(e.target.value))}
                          style={{ flex: 1, opacity: m.isAutoTracked ? 0.6 : 1 }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 600, width: 36, textAlign: 'right', fontFamily: "'Barlow Semi Condensed', sans-serif" }}>{draftProgress[m.id] ?? m.progressPercentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {m.isAutoTracked ? (
                        <span className={`badge ${STATUS_BADGE[m.status]}`}>{STATUS_LABELS[m.status]}</span>
                      ) : (
                        <select
                          value={m.status}
                          onChange={e => handleStatusChange(m, Number(e.target.value))}
                          className={`badge ${STATUS_BADGE[m.status]}`}
                          style={{ border: 'none', cursor: 'pointer' }}
                        >
                          {STATUS_LABELS.map((label, i) => <option key={i} value={i}>{label}</option>)}
                        </select>
                      )}
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
      )}

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
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Track Progress From BOQ Section (optional)</label>
            <select className="form-select" value={form.boqSectionId} onChange={e => setForm({ ...form, boqSectionId: e.target.value })}>
              <option value="">Manual — I&apos;ll update progress myself</option>
              {boqSections.map((s: any) => (
                <option key={s.id} value={s.id}>{s.sectionCode} — {s.sectionName}</option>
              ))}
            </select>
            {form.boqSectionId && (
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Progress and status will be computed automatically from certified work against this BOQ section, and can&apos;t be edited by hand.
              </p>
            )}
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

const fmtShort = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const STATUS_BAR_COLOR: Record<number, string> = {
  0: 'var(--text-secondary)',
  1: 'var(--accent-blue)',
  2: 'var(--accent-emerald)',
  3: '#ef4444'
};

function GanttTimeline({ milestones }: { milestones: any[] }) {
  const starts = milestones.map(m => new Date(m.plannedStartDate).getTime());
  const ends = milestones.map(m => new Date(m.plannedEndDate).getTime());
  const dayMs = 24 * 60 * 60 * 1000;
  const rangeStart = Math.min(...starts) - dayMs * 3;
  const rangeEnd = Math.max(...ends) + dayMs * 3;
  const totalMs = Math.max(rangeEnd - rangeStart, dayMs);

  const pctOf = (ms: number) => ((ms - rangeStart) / totalMs) * 100;

  // Month gridlines spanning the range
  const months: { label: string; pct: number }[] = [];
  const cursor = new Date(rangeStart);
  cursor.setDate(1);
  while (cursor.getTime() <= rangeEnd) {
    months.push({
      label: cursor.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      pct: pctOf(cursor.getTime())
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const todayPct = pctOf(Date.now());
  const showToday = todayPct >= 0 && todayPct <= 100;

  const rowH = 46;
  const labelColW = 240;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Program Timeline</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 900, position: 'relative' }}>
          {/* Month header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: labelColW, flexShrink: 0, padding: '8px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Activity
            </div>
            <div style={{ flex: 1, position: 'relative', height: 30 }}>
              {months.map((mo, i) => (
                <div key={i} style={{ position: 'absolute', left: `${mo.pct}%`, top: 0, bottom: 0, borderLeft: '1px solid var(--border-subtle)', paddingLeft: 6, fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {mo.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div style={{ position: 'relative' }}>
            {showToday && (
              <div style={{
                position: 'absolute', left: `calc(${labelColW}px + (100% - ${labelColW}px) * ${todayPct / 100})`,
                top: 0, bottom: 0, width: 2, background: '#ef4444', zIndex: 2
              }} title="Today" />
            )}
            {milestones.map((m) => {
              const startPct = pctOf(new Date(m.plannedStartDate).getTime());
              const endPct = pctOf(new Date(m.plannedEndDate).getTime());
              const widthPct = Math.max(endPct - startPct, 0.5);
              const color = STATUS_BAR_COLOR[m.status];
              return (
                <div key={m.id} style={{ display: 'flex', height: rowH, borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                  <div style={{ width: labelColW, flexShrink: 0, padding: '0 16px', overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.title}</div>
                    {m.isAutoTracked && (
                      <div style={{ fontSize: 10.5, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Link2 size={10} /> Auto: {m.boqSectionName}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: rowH }}>
                    <div
                      title={`${m.title}: ${fmtShort(m.plannedStartDate)} → ${fmtShort(m.plannedEndDate)} — ${m.progressPercentage}% — ${STATUS_LABELS[m.status]}`}
                      style={{
                        position: 'absolute', left: `${startPct}%`, width: `${widthPct}%`, top: '50%', transform: 'translateY(-50%)',
                        height: 20, borderRadius: 4, background: 'var(--bg-hover)', border: `1px solid ${color}`, overflow: 'hidden'
                      }}
                    >
                      <div style={{ width: `${m.progressPercentage}%`, height: '100%', background: color, opacity: 0.85 }} />
                    </div>
                    <span style={{
                      position: 'absolute', left: `calc(${startPct}% + ${widthPct}% + 8px)`, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontFamily: "'Barlow Semi Condensed', sans-serif"
                    }}>
                      {fmtShort(m.plannedStartDate)} → {fmtShort(m.plannedEndDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, padding: '10px 18px', borderTop: '1px solid var(--border-subtle)', fontSize: 11.5, color: 'var(--text-secondary)' }}>
        {STATUS_LABELS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_BAR_COLOR[i], display: 'inline-block' }} />
            {label}
          </div>
        ))}
        {showToday && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 2, background: '#ef4444', display: 'inline-block' }} />
            Today
          </div>
        )}
      </div>
    </div>
  );
}

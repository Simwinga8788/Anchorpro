'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, MoreHorizontal, ChevronRight, ChevronLeft } from 'lucide-react';
import { dashboardApi } from '@/lib/api';

const columns = [
  { id: 1, label: 'Scheduled',      color: '#f59e0b', nextId: 2 },
  { id: 2, label: 'In Progress',    color: '#3b82f6', nextId: 4 },
  { id: 4, label: 'Pending Review', color: '#8b5cf6', nextId: 3 },
  { id: 3, label: 'Completed',      color: '#10b981', nextId: null },
];

const priorityColor: Record<number, string> = {
  3: 'var(--accent-rose)', 2: 'var(--accent-amber)',
  1: 'var(--accent-blue)', 0: 'var(--text-muted)',
};

const priorityLabel: Record<number, string> = { 3: 'Critical', 2: 'High', 1: 'Normal', 0: 'Low' };

export default function PlanningPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    dashboardApi.getJobCards()
      .then(data => setJobs(data || []))
      .catch(err => console.error('Could not load jobs', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function moveJob(jobId: number, newStatus: number) {
    setMoving(jobId);
    try {
      await dashboardApi.updateJobStatus(jobId, newStatus);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch (e) {
      console.error('Failed to move job', e);
    } finally {
      setMoving(null);
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Planning Board</h1>
          <p className="page-subtitle">{jobs.length} operations across {columns.length} stages</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard/jobs'}>
          <Plus size={14} /> New Job Card
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading operations...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
          {columns.map((col, colIdx) => {
            const colCards = jobs.filter(j => j.status === col.id);
            const prevCol = colIdx > 0 ? columns[colIdx - 1] : null;

            return (
              <div key={col.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}60`, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{col.label}</span>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, border: '1px solid var(--border-subtle)' }}>
                    {colCards.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colCards.map(card => {
                    const techName = card.assignedTechnician
                      ? (card.assignedTechnician.firstName || card.assignedTechnician.userName)
                      : 'Unassigned';
                    const isMoving = moving === card.id;

                    return (
                      <div key={card.id} className="card" style={{
                        padding: 14,
                        borderLeft: `3px solid ${priorityColor[card.priority] ?? priorityColor[0]}`,
                        opacity: isMoving ? 0.5 : 1,
                        transition: 'opacity 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)' }}>{card.jobNumber}</span>
                          <span style={{ fontSize: 10, color: priorityColor[card.priority] ?? priorityColor[0], fontWeight: 700 }}>
                            {priorityLabel[card.priority] ?? ''}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
                          {card.equipment?.name || 'Unknown Asset'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>{card.jobType?.name || '—'}</div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="avatar" style={{ width: 20, height: 20, fontSize: 9, background: priorityColor[card.priority] ?? priorityColor[0] }}>
                              {techName[0]?.toUpperCase() || '?'}
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{techName}</span>
                          </div>
                          {card.scheduledDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {new Date(card.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Move buttons */}
                        <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                          {prevCol && (
                            <button
                              className="btn btn-ghost btn-sm"
                              disabled={isMoving}
                              onClick={() => moveJob(card.id, prevCol.id)}
                              style={{ flex: 1, fontSize: 11, gap: 4 }}
                              title={`Move to ${prevCol.label}`}
                            >
                              <ChevronLeft size={11} /> {prevCol.label}
                            </button>
                          )}
                          {col.nextId && (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={isMoving}
                              onClick={() => moveJob(card.id, col.nextId!)}
                              style={{ flex: 1, fontSize: 11, gap: 4 }}
                              title={`Move to ${columns.find(c => c.id === col.nextId)?.label}`}
                            >
                              {columns.find(c => c.id === col.nextId)?.label} <ChevronRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colCards.length === 0 && (
                    <div style={{
                      border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)',
                      padding: '20px 12px', textAlign: 'center',
                      fontSize: 12, color: 'var(--text-muted)',
                    }}>
                      No jobs here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

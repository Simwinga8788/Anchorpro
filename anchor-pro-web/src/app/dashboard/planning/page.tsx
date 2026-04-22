'use client';

import { useState, useEffect } from 'react';
import { Clock, Wrench, CheckCircle2, AlertTriangle, Plus, MoreHorizontal } from 'lucide-react';
import { dashboardApi } from '@/lib/api';

const columns = [
  { id: 1, label: 'Scheduled', color: '#f59e0b', dot: 'amber' },
  { id: 2, label: 'In Progress', color: '#3b82f6', dot: 'blue' },
  { id: 4, label: 'Pending Review', color: '#8b5cf6', dot: 'blue' },
  { id: 3, label: 'Completed', color: '#10b981', dot: 'green' },
];

const priorityColor: Record<number, string> = {
  3: 'var(--accent-rose)', 2: 'var(--accent-amber)',
  1: 'var(--accent-blue)', 0: 'var(--text-muted)',
};

export default function PlanningPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getJobCards()
      .then(data => setJobs(data || []))
      .catch(err => console.error("Could not load jobs", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Planning Board</h1>
          <p className="page-subtitle">{jobs.length} operations across {columns.length} stages</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.href='/dashboard'}><Plus size={14} /> Go to Hub to Create</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading operations...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
          {columns.map(col => {
            const colCards = jobs.filter(j => j.status === col.id);
            return (
              <div key={col.id}>
                {/* Column header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 10, padding: '0 2px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`status-dot ${col.dot}`} style={{ background: col.color, boxShadow: `0 0 6px ${col.color}60` }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{col.label}</span>
                  </div>
                  <span style={{
                    background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)',
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                    border: '1px solid var(--border-subtle)',
                  }}>{colCards.length}</span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colCards.map(card => {
                    const techName = card.assignedTechnician ? card.assignedTechnician.userName : 'Unassigned';
                    return (
                      <div key={card.id} className="card" style={{
                        padding: 14, cursor: 'grab',
                        borderLeft: `3px solid ${priorityColor[card.priority] || priorityColor[0]}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)' }}>{card.jobNumber}</span>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 2 }}><MoreHorizontal size={13} /></button>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
                          {card.equipment?.name || 'Unknown Asset'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>{card.jobType?.name || '—'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="avatar" style={{ width: 20, height: 20, fontSize: 9, background: priorityColor[card.priority] || priorityColor[0] }}>
                              {techName[0]?.toUpperCase() || '?'}
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{techName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>—</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add card */}
                  <button className="btn btn-ghost" onClick={() => window.location.href='/dashboard'} style={{
                    width: '100%', justifyContent: 'center', padding: '10px',
                    border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)',
                    fontSize: 12, color: 'var(--text-muted)',
                  }}>
                    <Plus size={12} /> Add Card
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Filter, Clock, CheckCircle2, AlertTriangle, 
  ChevronRight, ArrowRight, BarChart3, Building2, Layers
} from 'lucide-react';
import { projectsApi } from '@/lib/api';
import Modal from '@/components/Modal';

interface ScheduleMilestone {
  id: string;
  taskName: string;
  trade: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Complete' | 'Delayed';
  predecessor?: string;
}

const DEFAULT_SCHEDULE: ScheduleMilestone[] = [
  { id: 'M-01', taskName: 'Site Establishment & Perimeter Hoarding', trade: 'Preliminaries', startDate: '2026-08-01', endDate: '2026-08-10', durationDays: 10, progress: 100, status: 'Complete' },
  { id: 'M-02', taskName: 'Bulk Earthworks & Foundation Trenching', trade: 'Earthworks', startDate: '2026-08-11', endDate: '2026-08-25', durationDays: 14, progress: 85, status: 'In Progress', predecessor: 'M-01' },
  { id: 'M-03', taskName: 'Foundation Strip Footings & Blinding', trade: 'Concrete & Rebar', startDate: '2026-08-20', endDate: '2026-09-05', durationDays: 16, progress: 40, status: 'In Progress', predecessor: 'M-02' },
  { id: 'M-04', taskName: 'Ground Floor Stub Columns & Plinth Beams', trade: 'Concrete & Rebar', startDate: '2026-09-06', endDate: '2026-09-22', durationDays: 16, progress: 0, status: 'Not Started', predecessor: 'M-03' },
  { id: 'M-05', taskName: 'Substructure Masonry & Hardcore Backfilling', trade: 'Masonry', startDate: '2026-09-23', endDate: '2026-10-08', durationDays: 15, progress: 0, status: 'Not Started', predecessor: 'M-04' },
  { id: 'M-06', taskName: 'Ground Floor Suspended Slab Casting', trade: 'Concrete & Formwork', startDate: '2026-10-09', endDate: '2026-10-25', durationDays: 16, progress: 0, status: 'Not Started', predecessor: 'M-05' },
];

export default function SchedulePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<ScheduleMilestone[]>(DEFAULT_SCHEDULE);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState<Partial<ScheduleMilestone>>({
    taskName: '',
    trade: 'Concrete & Rebar',
    startDate: '',
    endDate: '',
    progress: 0,
    status: 'Not Started'
  });

  useEffect(() => {
    projectsApi.getProjects()
      .then((res: any) => {
        const list = res.data ?? res;
        setProjects(list);
        if (list.length > 0 && !selectedProjectId) {
          setSelectedProjectId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const overallProgress = Math.round(
    milestones.reduce((acc, m) => acc + m.progress, 0) / (milestones.length || 1)
  );

  const handleAddTask = () => {
    if (!newTask.taskName || !newTask.startDate || !newTask.endDate) return;
    const item: ScheduleMilestone = {
      id: `M-0${milestones.length + 1}`,
      taskName: newTask.taskName,
      trade: newTask.trade || 'General',
      startDate: newTask.startDate,
      endDate: newTask.endDate,
      durationDays: 14,
      progress: Number(newTask.progress) || 0,
      status: newTask.status as any || 'Not Started'
    };
    setMilestones([...milestones, item]);
    setShowAddModal(false);
    setNewTask({ taskName: '', trade: 'Concrete & Rebar', startDate: '', endDate: '', progress: 0, status: 'Not Started' });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={26} style={{ color: '#3b82f6' }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary, #fff)' }}>
              Construction Program & Schedule
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted, #94a3b8)' }}>
            Track master milestones, critical path items, and physical progress against contract program.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {projects.length > 0 && (
            <select
              className="input-field"
              style={{ width: 260, background: '#1e293b' }}
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Add Program Milestone
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Overall Progress</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>{overallProgress}%</div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 8 }}>
            <div style={{ width: `${overallProgress}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
          </div>
        </div>

        <div className="card" style={{ padding: 18, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Active Tasks</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
            {milestones.filter(m => m.status === 'In Progress').length} <span style={{ fontSize: 14, color: '#94a3b8' }}>/ {milestones.length} total</span>
          </div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>On Critical Path</div>
        </div>

        <div className="card" style={{ padding: 18, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Completed Milestones</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
            {milestones.filter(m => m.status === 'Complete').length}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Verified by Site Engineer</div>
        </div>
      </div>

      {/* Schedule Gantt / List */}
      <div className="card" style={{ padding: 20, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: '#fff' }}>Master Construction Activities</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Code</th>
                <th style={{ padding: '10px 14px' }}>Activity / Trade</th>
                <th style={{ padding: '10px 14px' }}>Start Date</th>
                <th style={{ padding: '10px 14px' }}>Finish Date</th>
                <th style={{ padding: '10px 14px', width: 220 }}>Physical Progress</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#3b82f6' }}>{m.id}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{m.taskName}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Trade: {m.trade}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{m.startDate}</td>
                  <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{m.endDate}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                        <div style={{ 
                          width: `${m.progress}%`, 
                          height: '100%', 
                          background: m.progress === 100 ? '#10b981' : '#3b82f6', 
                          borderRadius: 3 
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, width: 36, textAlign: 'right' }}>{m.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 11.5, fontWeight: 600,
                      background: m.status === 'Complete' ? 'rgba(16,185,129,0.15)' : m.status === 'In Progress' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)',
                      color: m.status === 'Complete' ? '#10b981' : m.status === 'In Progress' ? '#3b82f6' : '#94a3b8'
                    }}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Milestone Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Program Milestone">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Activity Name *</label>
            <input className="input-field" placeholder="e.g. First Floor Slab Formwork" value={newTask.taskName} onChange={e => setNewTask({ ...newTask, taskName: e.target.value })} />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Trade / Section</label>
            <input className="input-field" placeholder="e.g. Concrete & Formwork" value={newTask.trade} onChange={e => setNewTask({ ...newTask, trade: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Start Date *</label>
              <input className="input-field" type="date" value={newTask.startDate} onChange={e => setNewTask({ ...newTask, startDate: e.target.value })} />
            </div>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>End Date *</label>
              <input className="input-field" type="date" value={newTask.endDate} onChange={e => setNewTask({ ...newTask, endDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddTask}>Save Activity</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Clock, Wrench, CheckCircle2, Play, Check, ChevronRight, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import SlideOver from '@/components/SlideOver';

const statusConfig: Record<number, { label: string; badge: string; color: string; icon: React.ReactNode }> = {
  0: { label: 'Unscheduled', badge: 'badge-muted', color: '#6b6b6b', icon: <Clock size={14} /> },
  1: { label: 'Scheduled', badge: 'badge-amber', color: '#f59e0b', icon: <Clock size={14} /> },
  2: { label: 'In Progress', badge: 'badge-blue', color: '#3b82f6', icon: <Wrench size={14} /> },
  3: { label: 'Completed', badge: 'badge-green', color: '#10b981', icon: <CheckCircle2 size={14} /> },
  4: { label: 'Confirmed', badge: 'badge-violet', color: '#8b5cf6', icon: <CheckCircle2 size={14} /> },
  5: { label: 'Cancelled', badge: 'badge-rose', color: '#f43f5e', icon: <Clock size={14} /> },
};

export default function MyJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Workflows state
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [showPermit, setShowPermit] = useState(false);
  const [showDowntime, setShowDowntime] = useState(false);
  const [permitData, setPermitData] = useState({ isIsolated: false, isLotoApplied: false, isAreaSecure: false, isPpeChecked: false, hazardsIdentified: '' });
  const [downtimeData, setDowntimeData] = useState({ categoryId: 1, notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchJobs = () => {
    if (!user) return;
    setLoading(true);
    dashboardApi.getJobCards()
      .then(data => {
        const myTasks = (data || []).filter((j: any) =>
          j.assignedTechnicianId === user.id ||
          (j.assignedTechnician && j.assignedTechnician.email === user.email)
        );
        setJobs(myTasks);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const handleStartWork = (jobId: number) => {
    setActiveJobId(jobId);
    setShowPermit(true);
  };

  const submitPermit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobId) return;
    setSaving(true);
    try {
      // 1. Create the official Permit Record
      await dashboardApi.createPermit({ 
        jobCardId: activeJobId,
        ...permitData,
        status: 1 // Approved/Active
      });
      
      // 2. Start the Job
      await dashboardApi.updateJobStatus(activeJobId, 2); // Status 2 = In Progress
      
      setShowPermit(false);
      fetchJobs();
    } catch (err: any) {
      console.error('Permit Error:', err);
      alert(err.message || "Failed to confirm safety permit.");
    } finally {
      setSaving(false);
    }
  };

  const reportDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobId) return;
    setSaving(true);
    try {
      const job = jobs.find(j => j.id === activeJobId);
      await dashboardApi.reportDowntime({
        equipmentId: job?.equipmentId,
        jobCardId: activeJobId,
        downtimeCategoryId: downtimeData.categoryId,
        notes: downtimeData.notes,
        startTime: new Date().toISOString()
      });
      setShowDowntime(false);
      alert("Downtime reported.");
    } catch (err) {
      alert("Failed to report downtime.");
    } finally {
      setSaving(false);
    }
  };

  const completeJob = async (jobId: number) => {
    if (!confirm("Confirm job completion?")) return;
    try {
      await dashboardApi.updateJobStatus(jobId, 3); // 3 = Completed
      fetchJobs();
    } catch (err) {
      alert("Error completing job.");
    }
  };

  const activeWork = jobs.filter(j => j.status === 1 || j.status === 2);

  // Task checklist state
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const loadTasks = async (jobId: number) => {
    setSelectedJobId(jobId);
    setTasksLoading(true);
    try {
      const data = await dashboardApi.getJobTasks(jobId);
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const toggleTask = async (taskId: number, currentDone: boolean) => {
    setUpdatingTaskId(taskId);
    try {
      await dashboardApi.updateJobTaskStatus(taskId, !currentDone);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !currentDone } : t));
    } catch {
      // silent fail — UI stays optimistic
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div>
      {/* Safety Permit SlideOver */}
      <SlideOver open={showPermit} onClose={() => setShowPermit(false)} title="Safety Permit (PTW)" subtitle="Verify safety controls before starting hazardous work.">
        <form onSubmit={submitPermit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--accent-amber-dim)', padding: 12, borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
            <ShieldCheck size={18} style={{ color: 'var(--accent-amber)' }} />
            <span style={{ fontSize: 13, color: 'var(--accent-amber)', fontWeight: 600 }}>Permit-to-Work required for this operation.</span>
          </div>

          {[
            { id: 'isIsolated', label: 'Equipment Isolated / Energy Dissipated' },
            { id: 'isLotoApplied', label: 'LOTO Applied (Lock Out / Tag Out)' },
            { id: 'isAreaSecure', label: 'Work Area Barricaded / Secure' },
            { id: 'isPpeChecked', label: 'Standard/Special PPE Verified' },
          ].map(check => (
            <label key={check.id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              <input type="checkbox" required checked={(permitData as any)[check.id]} onChange={e => setPermitData({ ...permitData, [check.id]: e.target.checked })} />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{check.label}</span>
            </label>
          ))}

          <div className="form-field">
            <label className="form-label">Identified Hazards / Control Measures</label>
            <textarea className="form-textarea" placeholder="e.g. Risk of hydraulic spray, using gloves and face shield." value={permitData.hazardsIdentified} onChange={e => setPermitData({ ...permitData, hazardsIdentified: e.target.value })} />
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPermit(false)}>Abort</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>Confirm & Start Job</button>
          </div>
        </form>
      </SlideOver>

      {/* Downtime Report SlideOver */}
      <SlideOver open={showDowntime} onClose={() => setShowDowntime(false)} title="Report Downtime" subtitle="Log immediate equipment breakdown or operational halt.">
        <form onSubmit={reportDowntime} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-field">
            <label className="form-label">Breakdown Category</label>
            <select className="form-select" value={downtimeData.categoryId} onChange={e => setDowntimeData({ ...downtimeData, categoryId: parseInt(e.target.value) })}>
              <option value="1">Equipment Breakdown</option>
              <option value="2">Power Failure</option>
              <option value="3">Supply Chain Delay</option>
              <option value="4">External Factor</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Failure Notes / Symptoms</label>
            <textarea className="form-textarea" required placeholder="Describe what happened..." value={downtimeData.notes} onChange={e => setDowntimeData({ ...downtimeData, notes: e.target.value })} />
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDowntime(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--accent-rose)', border: 'none' }} disabled={saving}>Submit Report</button>
          </div>
        </form>
      </SlideOver>

      <div className="page-header">
        <h1 className="page-title">My Assignments</h1>
        <p className="page-subtitle">Personal queue of work orders and active operations.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading your queue...</div>
      ) : activeWork.length === 0 ? (
        <div className="card-elevated" style={{ textAlign: 'center', padding: 60 }}>
          <CheckCircle2 size={48} style={{ color: 'var(--accent-emerald)', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>No active jobs.</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Enjoy the breather, or check the planning board for new tasks.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeWork.map(job => {
              const sc = statusConfig[job.status] || statusConfig[0];
              const isWorking = job.status === 2;
              const isSelected = selectedJobId === job.id;

              return (
                <div
                  key={job.id}
                  className="card-elevated"
                  style={{
                    padding: 0, overflow: 'hidden',
                    borderLeft: `4px solid ${sc.color}`,
                    outline: isSelected ? `1px solid ${sc.color}` : 'none',
                  }}
                  onClick={() => loadTasks(job.id)}
                >
                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <div style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{job.jobNumber}</div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{job.equipment?.name || 'Asset'}</h3>
                      </div>
                      <span className={`badge ${sc.badge}`}>{sc.label}</span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>{job.description || 'Routine maintenance and inspection.'}</p>

                    <div style={{ display: 'flex', gap: 10 }} onClick={e => e.stopPropagation()}>
                      {!isWorking ? (
                        <button onClick={() => handleStartWork(job.id)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                          <Play size={14} /> Start Job
                        </button>
                      ) : (
                        <>
                          <button onClick={() => completeJob(job.id)} className="btn" style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-emerald)', color: '#fff', border: 'none' }}>
                            <CheckCircle2 size={14} /> Complete Job
                          </button>
                          <button onClick={() => { setActiveJobId(job.id); setShowDowntime(true); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }}>
                            <AlertTriangle size={14} /> Report Downtime
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Task Checklist Panel */}
          <div className="card" style={{ padding: 20, position: 'sticky', top: 80 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Task Checklist</h3>
            {!selectedJobId ? (
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>Tap a job card to load its tasks.</p>
            ) : tasksLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 36, borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>No tasks defined for this job card.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {tasks.filter(t => t.isCompleted).length}/{tasks.length} completed
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, borderRadius: 2, background: 'var(--border-subtle)', marginBottom: 10 }}>
                  <div style={{
                    height: '100%', borderRadius: 2, background: 'var(--accent-emerald)',
                    width: `${Math.round((tasks.filter(t => t.isCompleted).length / tasks.length) * 100)}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                {tasks.map(task => (
                  <label
                    key={task.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                      padding: '8px 10px', borderRadius: 6,
                      background: task.isCompleted ? 'var(--accent-emerald-dim)' : 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      opacity: updatingTaskId === task.id ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!task.isCompleted}
                      disabled={updatingTaskId === task.id}
                      onChange={() => toggleTask(task.id, task.isCompleted)}
                      style={{ marginTop: 2, accentColor: 'var(--accent-emerald)', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{
                        fontSize: 13, fontWeight: 500,
                        color: task.isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        textDecoration: task.isCompleted ? 'line-through' : 'none',
                      }}>
                        {task.description ?? task.taskDescription ?? task.name ?? 'Task'}
                      </div>
                      {task.estimatedHours && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Est. {task.estimatedHours}h
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Clock, Wrench, CheckCircle2, Play, AlertTriangle, ShieldCheck, XCircle, Package, Search, Camera } from 'lucide-react';
import { dashboardApi, referenceDataApi, inventoryApi, jobCardsApi, jobTasksApi, uploadApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import SlideOver from '@/components/SlideOver';

const statusConfig: Record<number, { label: string; badge: string; color: string; icon: React.ReactNode }> = {
  0: { label: 'Unscheduled', badge: 'badge-muted',  color: '#6b6b6b', icon: <Clock size={14} /> },
  1: { label: 'Scheduled',   badge: 'badge-amber',  color: '#f59e0b', icon: <Clock size={14} /> },
  2: { label: 'In Progress', badge: 'badge-blue',   color: '#3b82f6', icon: <Wrench size={14} /> },
  3: { label: 'Completed',   badge: 'badge-green',  color: '#10b981', icon: <CheckCircle2 size={14} /> },
  4: { label: 'Cancelled',   badge: 'badge-rose',   color: '#f43f5e', icon: <XCircle size={14} /> },
  5: { label: 'On Hold',     badge: 'badge-amber',  color: '#f59e0b', icon: <Clock size={14} /> },
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
  const [downtimeData, setDowntimeData] = useState({ categoryId: '', notes: '' });
  const [downtimeCategories, setDowntimeCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Add Part state
  const [showAddPart, setShowAddPart]           = useState(false);
  const [addPartJobId, setAddPartJobId]         = useState<number | null>(null);
  const [inventoryItems, setInventoryItems]     = useState<any[]>([]);
  const [partSearch, setPartSearch]             = useState('');
  const [selectedPartId, setSelectedPartId]     = useState<number | null>(null);
  const [partQty, setPartQty]                   = useState(1);
  const [addingPart, setAddingPart]             = useState(false);

  useEffect(() => {
    referenceDataApi.getDowntimeCategories()
      .then(cats => {
        setDowntimeCategories(Array.isArray(cats) ? cats : []);
        if (cats && cats.length > 0) setDowntimeData(d => ({ ...d, categoryId: cats[0].id.toString() }));
      })
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      loadTasks(jobs[0].id);
    }
  }, [jobs]);

  const handleStartWork = async (jobId: number) => {
    setSaving(true);
    try {
      await dashboardApi.updateJobStatus(jobId, 2); // Status 2 = In Progress
      fetchJobs();
    } catch (err: any) {
      alert(err.message || "Failed to start job.");
    } finally {
      setSaving(false);
    }
  };

  const submitPermit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobId) return;
    setSaving(true);
    try {
      // In prod we would call dashboardApi.createPermit({ ...permitData, jobCardId: activeJobId });
      await dashboardApi.updateJobStatus(activeJobId, 2); // Status 2 = In Progress
      setShowPermit(false);
      fetchJobs();
    } catch (err) {
      alert("Failed to confirm safety permit.");
    } finally {
      setSaving(false);
    }
  };

  const reportDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobId) return;
    setSaving(true);
    try {
      // Backend requires jobTaskId — load tasks for this job to get one
      let jobTaskId: number | null = null;
      let jobTasks: any[] = [];
      try { jobTasks = await dashboardApi.getJobTasks(activeJobId); } catch { jobTasks = []; }
      // Prefer the first incomplete task, fall back to any task
      const target = jobTasks.find((t: any) => !t.isCompleted) ?? jobTasks[0];
      jobTaskId = target?.id ?? null;

      if (!jobTaskId) {
        alert('Cannot report down time — no tasks exist on this job card. Add a task first.');
        setSaving(false);
        return;
      }

      await dashboardApi.reportDowntime({
        jobTaskId,
        downtimeCategoryId: parseInt(downtimeData.categoryId),
        notes: downtimeData.notes,
        startTime: new Date().toISOString(),
      });
      setShowDowntime(false);
      alert('Down Time reported.');
    } catch (err: any) {
      alert(err.message || 'Failed to report down time.');
    } finally {
      setSaving(false);
    }
  };

  const completeJob = async (jobId: number) => {
    // If we have tasks loaded for this job, check upfront
    if (selectedJobId === jobId && tasks.length > 0) {
      const pending = tasks.filter(t => !t.isCompleted);
      if (pending.length > 0) {
        alert(`Cannot complete job — ${pending.length} task${pending.length > 1 ? 's' : ''} still pending.\n\nUse the checklist on the right to complete all tasks first.`);
        return;
      }
    }
    if (!confirm("Confirm job completion?")) return;
    try {
      await dashboardApi.updateJobStatus(jobId, 3); // 3 = Completed
      fetchJobs();
    } catch (err: any) {
      const msg = err.message ?? '';
      if (msg.includes('tasks must be completed') || msg.includes('All tasks')) {
        alert('Cannot complete job — all tasks must be marked complete first.\n\nUse the task checklist to complete all tasks.');
      } else {
        alert(msg || "Error completing job.");
      }
    }
  };

  const activeWork = jobs.filter(j => j.status === 1 || j.status === 2);

  // Task checklist state
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const loadTasks = async (jobId: number) => {
    setSelectedJobId(jobId);
    setTasksLoading(true);
    try {
      const jobData = await jobCardsApi.getById(jobId);
      setSelectedJob(jobData);
      setTasks(Array.isArray(jobData?.jobTasks) ? jobData.jobTasks : []);
      setParts(Array.isArray(jobData?.jobCardParts) ? jobData.jobCardParts : []);
    } catch {
      setTasks([]);
      setParts([]);
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

  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleTaskPhotoUpload = async (taskId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64DataUrl = await compressImageToBase64(file);
      await jobTasksApi.updatePhoto(taskId, base64DataUrl);
      if (selectedJobId) {
        loadTasks(selectedJobId);
      }
    } catch (err: any) {
      alert('Photo upload failed: ' + err.message);
    }
  };

  const openAddPart = async (jobId: number) => {
    setAddPartJobId(jobId);
    setSelectedPartId(null);
    setPartQty(1);
    setPartSearch('');
    setShowAddPart(true);
    if (inventoryItems.length === 0) {
      try {
        const items = await inventoryApi.getAll();
        setInventoryItems(Array.isArray(items) ? items : []);
      } catch { setInventoryItems([]); }
    }
  };

  const submitAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPartJobId || !selectedPartId) return;
    setAddingPart(true);
    try {
      await dashboardApi.addPartToJob(addPartJobId, selectedPartId, partQty);
      setShowAddPart(false);
      alert(`Part requested from stores. It will appear on your job card once issued by the warehouse.`);
    } catch (err: any) {
      alert('Failed to request part: ' + (err.message || 'Unknown error'));
    } finally {
      setAddingPart(false);
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

      {/* Request Part SlideOver */}
      <SlideOver open={showAddPart} onClose={() => setShowAddPart(false)} title="Request Part from Stores" subtitle="Select a stocked item to request from the warehouse. A storeman will issue the part to deduct inventory.">
        <form onSubmit={submitAddPart} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 30 }}
              placeholder="Search parts by name..."
              value={partSearch}
              onChange={e => { setPartSearch(e.target.value); setSelectedPartId(null); }}
            />
          </div>

          {/* Part list */}
          <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {inventoryItems
              .filter(i => i.name?.toLowerCase().includes(partSearch.toLowerCase()) || i.partNumber?.toLowerCase().includes(partSearch.toLowerCase()))
              .map((item: any) => {
                const selected = selectedPartId === item.id;
                const outOfStock = (item.currentStock ?? item.quantityInStock ?? item.quantityOnHand ?? 0) <= 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => setSelectedPartId(selected ? null : item.id)}
                    style={{
                      textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: outOfStock ? 'not-allowed' : 'pointer',
                      background: selected ? 'var(--accent-blue-dim)' : 'var(--bg-elevated)',
                      border: `1px solid ${selected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                      opacity: outOfStock ? 0.45 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: selected ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{item.name}</div>
                        {item.partNumber && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.partNumber}</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: outOfStock ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                          {outOfStock ? 'Out of stock' : `${item.currentStock ?? item.quantityInStock ?? item.quantityOnHand} in stock`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>K {(item.unitCost ?? item.costPerUnit ?? 0).toLocaleString()}/u</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            {inventoryItems.filter(i => i.name?.toLowerCase().includes(partSearch.toLowerCase())).length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No parts found.</p>
            )}
          </div>

          {/* Quantity */}
          {selectedPartId && (() => {
            const item = inventoryItems.find(i => i.id === selectedPartId);
            const maxStock = item?.currentStock ?? item?.quantityInStock ?? item?.quantityOnHand ?? 1;
            return (
              <div style={{ padding: 14, borderRadius: 8, background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                  {item?.name} — K {((item?.unitCost ?? item?.costPerUnit ?? 0) * partQty).toLocaleString(undefined, { maximumFractionDigits: 2 })} total
                </div>
                <div className="form-field" style={{ margin: 0 }}>
                  <label className="form-label">Quantity to Request</label>
                  <input
                    type="number" min={1} max={maxStock} className="form-input"
                    value={partQty}
                    onChange={e => setPartQty(Math.min(maxStock, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{maxStock} available in warehouse</div>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddPart(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!selectedPartId || addingPart}>
              <Package size={13} /> {addingPart ? 'Requesting...' : 'Request Part'}
            </button>
          </div>
        </form>
      </SlideOver>

      <SlideOver open={showDowntime} onClose={() => setShowDowntime(false)} title="Report Down Time" subtitle="Log immediate equipment down time or operational halt.">
        <form onSubmit={reportDowntime} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-field">
            <label className="form-label">Down Time Category</label>
            <select className="form-select" required value={downtimeData.categoryId} onChange={e => setDowntimeData({ ...downtimeData, categoryId: e.target.value })}>
              <option value="">Select category...</option>
              {downtimeCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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
        <div style={{ display: 'flex', gap: 24, alignItems: 'start', flexWrap: 'wrap' }}>

          {/* Left Column: Compact Assignments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '320px', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingLeft: 4 }}>
              Active Assignments ({activeWork.length})
            </div>
            {activeWork.map(job => {
              const sc = statusConfig[job.status] || statusConfig[0];
              const isSelected = selectedJobId === job.id;

              return (
                <div
                  key={job.id}
                  className="card"
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${sc.color}`,
                    background: isSelected ? 'var(--bg-active)' : 'var(--bg-card)',
                    border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                    boxShadow: isSelected ? '0 2px 8px rgba(77,158,255,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => loadTasks(job.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '11.5px', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.02em' }}>
                      #{job.jobNumber}
                    </span>
                    <span className={`badge ${sc.badge}`} style={{ fontSize: '10px', padding: '1px 5px' }}>{sc.label}</span>
                  </div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {job.equipment?.name || 'Asset'}
                  </h4>
                  {job.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Details & Checklist */}
          <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!selectedJobId ? (
              <div className="card-elevated" style={{ textAlign: 'center', padding: 60 }}>
                <Clock size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 16px', opacity: 0.5 }} />
                <h3 style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>Select a job card to start</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Choose an assignment from the left column to view tasks and log operations.</p>
              </div>
            ) : tasksLoading ? (
              <div className="card" style={{ padding: 30 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: 100, borderRadius: 8, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            ) : (
              <>
                {/* Job Info and Control Actions Card */}
                {selectedJob && (() => {
                  const job = selectedJob;
                  const sc = statusConfig[job.status] || statusConfig[0];
                  const isWorking = job.status === 2;

                  return (
                    <div className="card" style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                          <div style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                            JOB REFERENCE: #{job.jobNumber}
                          </div>
                          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {job.equipment?.name || 'Asset'}
                          </h2>
                        </div>
                        <span className={`badge ${sc.badge}`}>{sc.label}</span>
                      </div>

                      {job.description && (
                        <div style={{ marginBottom: 20 }}>
                          <div className="form-label" style={{ marginBottom: 4 }}>Job Scope / Description</div>
                          <p style={{ color: 'var(--text-primary)', fontSize: 14, background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-subtle)', whiteSpace: 'pre-wrap' }}>
                            {job.description}
                          </p>
                        </div>
                      )}

                      {/* Control buttons */}
                      <div style={{ display: 'flex', gap: 10 }}>
                        {!isWorking ? (
                          <button onClick={() => handleStartWork(job.id)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                            <Play size={14} /> Start Job
                          </button>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => completeJob(job.id)} className="btn" style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-emerald)', color: '#fff', border: 'none' }}>
                                <CheckCircle2 size={14} /> Complete Job
                              </button>
                              <button onClick={() => openAddPart(job.id)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                <Package size={14} /> Request Component
                              </button>
                            </div>
                            <button onClick={() => { setActiveJobId(job.id); setShowDowntime(true); }} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }}>
                              <AlertTriangle size={14} /> Report Down Time / Delay
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Task Checklist Panel */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Task Checklist</h3>
                  {tasks.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>No tasks defined for this job card.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {tasks.filter(t => t.isCompleted).length}/{tasks.length} completed
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 5, borderRadius: 3, background: 'var(--border-subtle)', marginBottom: 12 }}>
                        <div style={{
                          height: '100%', borderRadius: 3, background: 'var(--accent-emerald)',
                          width: `${Math.round((tasks.filter(t => t.isCompleted).length / tasks.length) * 100)}%`,
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      {tasks.map(task => (
                        <label
                          key={task.id}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                            padding: '10px 12px', borderRadius: 8,
                            background: task.isCompleted ? 'var(--accent-emerald-dim)' : 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            opacity: updatingTaskId === task.id ? 0.6 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!task.isCompleted}
                            disabled={updatingTaskId === task.id}
                            onChange={() => toggleTask(task.id, !!task.isCompleted)}
                            style={{ marginTop: 3, accentColor: 'var(--accent-emerald)', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 500,
                              color: task.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                              textDecoration: task.isCompleted ? 'line-through' : 'none',
                            }}>
                              {task.name ?? task.description ?? task.taskDescription ?? 'Task'}
                            </div>

                            {task.instructions && (
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic', whiteSpace: 'pre-line' }}>
                                Instructions: {task.instructions}
                              </div>
                            )}

                            {(task.estimatedDurationMinutes !== undefined || task.estimatedHours) && (
                              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                                Est. {task.estimatedDurationMinutes !== undefined ? `${task.estimatedDurationMinutes} mins` : `${task.estimatedHours}h`}
                              </div>
                            )}

                            {task.isCompleted && (
                              <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '5px 10px', borderRadius: 6, background: 'var(--bg-hover)' }}>
                                  <Camera size={13} style={{ color: 'var(--accent-blue)' }} />
                                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                                    {task.photoPath ? 'Replace Photo' : 'Attach Photo'}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleTaskPhotoUpload(task.id, e)}
                                    style={{ display: 'none' }}
                                  />
                                </label>
                              </div>
                            )}

                            {task.photoPath && (
                              <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
                                <img
                                  src={task.photoPath}
                                  alt="Task proof"
                                  style={{
                                    maxWidth: 120, maxHeight: 80, objectFit: 'cover',
                                    borderRadius: 6, border: '1px solid var(--border-default)'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Parts Request Status Panel */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={15} style={{ color: 'var(--accent-amber)' }} /> Requested Components Status
                  </h3>
                  {parts.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No components requested for this job.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {parts.map((p: any) => (
                        <div key={p.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)'
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.inventoryItem?.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Qty: {p.quantityUsed}</div>
                          </div>
                          {p.isIssued ? (
                            <span className="badge badge-green">Issued</span>
                          ) : (
                            <span className="badge badge-muted">Requested</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

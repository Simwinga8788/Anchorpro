'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Clock, Plus, Trash2, Users, Calendar,
  DollarSign, Wrench, Tag, Package, AlertTriangle, Upload, ExternalLink,
  FileText, Camera, ShieldAlert, X, Eye, Play, CheckCircle, ChevronDown, ChevronRight, Printer, Download
} from 'lucide-react';
import { dashboardApi, jobCardsApi, jobTasksApi, uploadApi, procurementApi, financialApi, quotationsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';

const statusConfig: Record<number, { label: string; badge: string; dot: string; icon: React.ReactNode; value: number }> = {
  0: { label: 'Unscheduled', badge: 'badge-muted',   dot: 'muted',   icon: <Clock size={12} />,         value: 0 },
  1: { label: 'Scheduled',   badge: 'badge-amber',   dot: 'amber',   icon: <Clock size={12} />,         value: 1 },
  2: { label: 'In Progress', badge: 'badge-blue',    dot: 'blue',    icon: <Wrench size={12} />,        value: 2 },
  3: { label: 'Completed',   badge: 'badge-green',   dot: 'green',   icon: <CheckCircle2 size={12} />,  value: 3 },
  4: { label: 'Cancelled',   badge: 'badge-rose',    dot: 'rose',    icon: <XCircleComponent size={12} />, value: 4 },
  5: { label: 'On Hold',     badge: 'badge-amber',   dot: 'amber',   icon: <Clock size={12} />,         value: 5 },
};

function XCircleComponent({ size }: { size: number }) {
  return <X size={size} style={{ color: 'var(--accent-rose)' }} />;
}

const priorityConfig: Record<number, { label: string; badge: string; color: string }> = {
  0: { label: 'Low',      badge: 'badge-muted',  color: 'var(--text-secondary)' },
  1: { label: 'Normal',   badge: 'badge-blue',   color: 'var(--accent-blue)' },
  2: { label: 'High',     badge: 'badge-amber',  color: 'var(--accent-amber)' },
  3: { label: 'Critical', badge: 'badge-rose',   color: 'var(--accent-rose)' },
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isTechnician, hasRole, user } = useAuth();
  const { t } = useDictionary();
  const id = parseInt(params.id as string);

  const jobsLabel = t('Job Cards', 'Job Cards');
  const jobLabel = jobsLabel.endsWith('s') && !jobsLabel.toLowerCase().endsWith('ss') ? jobsLabel.slice(0, -1) : jobsLabel;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [subcontracts, setSubcontracts] = useState<any[]>([]);

  // Modals / forms visibility
  const [showSubconModal, setShowSubconModal] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Quotation & Invoice state
  const [quotation, setQuotation] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actioningQuote, setActioningQuote] = useState(false);
  const [showDocFlow, setShowDocFlow] = useState(false);
  // Collapsible sections state
  const [isTasksExpanded, setIsTasksExpanded] = useState(true);
  const [isComponentsExpanded, setIsComponentsExpanded] = useState(true);
  const [isExternalExpanded, setIsExternalExpanded] = useState(true);

  // Form states
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskInst, setNewTaskInst] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('30');
  
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState('1');

  // Core properties edit state
  const [editCore, setEditCore] = useState(false);
  const [coreForm, setCoreForm] = useState({
    assignedTechnicianId: '',
    scheduledStartDate: '',
    scheduledEndDate: '',
    priority: 1,
    invoiceAmount: '',
  });

  const [savingCore, setSavingCore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadJobDetails = async () => {
    try {
      const data = await jobCardsApi.getById(id);
      setJob(data);
      if (data) {
        setCoreForm({
          assignedTechnicianId: data.assignedTechnicianId ?? data.assignedTechnician?.id ?? '',
          scheduledStartDate: data.scheduledStartDate ? data.scheduledStartDate.slice(0, 16) : '',
          scheduledEndDate: data.scheduledEndDate ? data.scheduledEndDate.slice(0, 16) : '',
          priority: data.priority ?? 1,
          invoiceAmount: data.invoiceAmount > 0 ? String(data.invoiceAmount) : '',
        });
      }
      // Fetch related subcontracts
      const pos = await procurementApi.getOrdersByJob(id).catch(() => []);
      setSubcontracts(pos || []);

      // Fetch Quotation and Invoice
      const q = await quotationsApi.getByJob(id).catch(() => null);
      setQuotation(q);
      const inv = await financialApi.getInvoiceByJob(id).catch(() => null);
      setInvoice(inv);
    } catch (err) {
      console.error('Failed to load job details', err);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      await Promise.all([
        loadJobDetails(),
        dashboardApi.getTechnicians().then(setTechnicians).catch(() => []),
        dashboardApi.getInventoryItems().then(setInventory).catch(() => []),
      ]);
      setLoading(false);
    };
    initPage();
  }, [id]);

  useEffect(() => {
    // Only poll if the job is active (unscheduled, scheduled, in progress, on hold)
    const isActive = job && job.status !== 3 && job.status !== 4;
    if (!isActive) return;

    const interval = setInterval(() => {
      // If we are currently editing the core fields, we don't want to fetch in background to avoid wiping out the user's unsaved form changes
      if (!editCore) {
        loadJobDetails();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [job?.status, editCore, id]);

  const handleUpdateCore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCore(true);
    try {
      await jobCardsApi.update(id, {
        ...job,
        assignedTechnicianId: coreForm.assignedTechnicianId || null,
        scheduledStartDate: coreForm.scheduledStartDate || null,
        scheduledEndDate: coreForm.scheduledEndDate || null,
        priority: coreForm.priority,
        invoiceAmount: coreForm.invoiceAmount ? parseFloat(coreForm.invoiceAmount) : 0,
      });
      await loadJobDetails();
      setEditCore(false);
    } catch (err: any) {
      alert('Failed to save details: ' + err.message);
    } finally {
      setSavingCore(false);
    }
  };

  const handleCreateQuote = async () => {
    setActioningQuote(true);
    try {
      await quotationsApi.createFromJob(id);
      await loadJobDetails();
      alert('Quotation generated successfully!');
    } catch (err: any) {
      alert('Failed to create quotation: ' + err.message);
    } finally {
      setActioningQuote(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!quotation) return;
    setActioningQuote(true);
    try {
      await quotationsApi.accept(quotation.id);
      await loadJobDetails();
      setShowQuoteModal(false);
      alert('Quotation accepted! Corresponding invoice has been auto-generated.');
    } catch (err: any) {
      alert('Failed to accept quotation: ' + err.message);
    } finally {
      setActioningQuote(false);
    }
  };

  const handleRejectQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation || !rejectReason.trim()) return;
    setActioningQuote(true);
    try {
      await quotationsApi.reject(quotation.id, rejectReason.trim());
      await loadJobDetails();
      setShowRejectReasonModal(false);
      setShowQuoteModal(false);
      setRejectReason('');
      alert('Quotation rejected.');
    } catch (err: any) {
      alert('Failed to reject quotation: ' + err.message);
    } finally {
      setActioningQuote(false);
    }
  };

  const handleStatusChange = async (newStatus: number) => {
    setActionLoading(true);
    try {
      if (newStatus === 3) {
        // Pre-check incomplete tasks
        const pending = (job?.jobTasks || []).filter((t: any) => !t.isCompleted);
        if (pending.length > 0) {
          alert(`Cannot complete job — ${pending.length} task${pending.length > 1 ? 's' : ''} still pending. Complete all checklist tasks first.`);
          setActionLoading(false);
          return;
        }
      }
      await dashboardApi.updateJobStatus(id, newStatus);
      await loadJobDetails();
    } catch (err: any) {
      alert('Status change failed: ' + (err.message || err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    setActionLoading(true);
    try {
      await jobTasksApi.create({
        jobCardId: id,
        name: newTaskName.trim(),
        instructions: newTaskInst.trim(),
        estimatedDurationMinutes: parseInt(newTaskDuration) || 0,
        sequence: (job?.jobTasks?.length || 0) + 1,
        isCompleted: false,
      });
      setNewTaskName('');
      setNewTaskInst('');
      setNewTaskDuration('30');
      setShowAddTask(false);
      await loadJobDetails();
    } catch (err: any) {
      alert('Failed to add task: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setActionLoading(true);
    try {
      await jobTasksApi.delete(taskId);
      await loadJobDetails();
    } catch (err: any) {
      alert('Failed to delete task: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTaskComplete = async (taskId: number, currentComplete: boolean) => {
    try {
      await jobTasksApi.complete(taskId, !currentComplete);
      await loadJobDetails();
    } catch (err: any) {
      alert('Failed to update task: ' + err.message);
    }
  };

  const handleTaskPhotoUpload = async (taskId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionLoading(true);
    try {
      const res = await uploadApi.upload(file);
      if (res && res.filePath) {
        await jobTasksApi.updatePhoto(taskId, res.filePath);
        await loadJobDetails();
      } else {
        throw new Error('No filepath returned from upload API.');
      }
    } catch (err: any) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId || !partQty) return;
    setActionLoading(true);
    try {
      await dashboardApi.addPartToJob(id, parseInt(selectedPartId), parseInt(partQty));
      setSelectedPartId('');
      setPartQty('1');
      setShowAddPart(false);
      await loadJobDetails();
    } catch (err: any) {
      alert('Failed to request part: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssuePart = async (partId: number) => {
    setActionLoading(true);
    try {
      await jobCardsApi.issuePart(partId);
      await loadJobDetails();
    } catch (err: any) {
      alert('Failed to issue part: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePart = async (partId: number) => {
    if (!confirm('Remove this part? If already issued, stock will be refunded.')) return;
    setActionLoading(true);
    try {
      await jobCardsApi.removePart(partId);
      await loadJobDetails();
    } catch (err: any) {
      alert('Failed to remove part: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneralFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionLoading(true);
    try {
      await uploadApi.uploadJobAttachment(id, file);
      await loadJobDetails();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('Delete this file attachment?')) return;
    setActionLoading(true);
    try {
      await uploadApi.deleteJobAttachment(id, attachmentId);
      await loadJobDetails();
    } catch (err: any) {
      alert('Failed to delete attachment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
        <div style={{ height: 40, width: 200 }} className="loading-skeleton" />
        <div style={{ height: 120 }} className="loading-skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div style={{ height: 400 }} className="loading-skeleton" />
          <div style={{ height: 400 }} className="loading-skeleton" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><AlertTriangle size={24} /></div>
        <h3>{jobLabel} Not Found</h3>
        <p>The {jobLabel.toLowerCase()} you are looking for does not exist or has been deleted.</p>
        <button onClick={() => router.push('/dashboard/jobs')} className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to {jobsLabel}
        </button>
      </div>
    );
  }

  const isStoremanOrSupervisor = hasRole('Admin', 'Supervisor', 'Storeman');
  const sc = statusConfig[job.status] ?? statusConfig[0];
  const pc = priorityConfig[job.priority] ?? priorityConfig[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-in">
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/dashboard/jobs')} className="btn btn-secondary btn-sm" style={{ padding: 6 }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="topbar-title" style={{ fontSize: 24 }}>{jobLabel} #{job.jobNumber}</h1>
              <span className={`badge ${sc.badge}`} style={{ padding: '3px 10px' }}>
                <span className={`status-dot ${sc.dot}`} /> {sc.label}
              </span>
              <span className={`badge ${pc.badge}`}>{pc.label} Priority</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Asset: <strong style={{ color: 'var(--text-primary)' }}>{job.equipment?.name || 'Unknown'}</strong> · Type: {job.jobType?.name || '—'}
            </p>
          </div>
        </div>

        {/* Status Actions & Document Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {job.status !== 3 && job.status !== 4 && (
              <>
                {job.status === 0 && (
                  <button disabled={actionLoading} onClick={() => handleStatusChange(1)} className="btn btn-secondary">
                    <Play size={14} style={{ color: 'var(--accent-amber)' }} /> Schedule {jobLabel}
                  </button>
                )}
                {job.status === 1 && (
                  <button disabled={actionLoading} onClick={() => handleStatusChange(2)} className="btn btn-primary">
                    <Play size={14} /> Start Execution
                  </button>
                )}
                {job.status === 2 && (
                  <button disabled={actionLoading} onClick={() => handleStatusChange(3)} className="btn btn-success">
                    <CheckCircle size={14} /> Complete {jobLabel}
                  </button>
                )}
                <button disabled={actionLoading} onClick={() => { if (confirm(`Cancel this ${jobLabel.toLowerCase()}?`)) handleStatusChange(4); }} className="btn btn-danger btn-sm">
                  Cancel
                </button>
              </>
            )}
            {job.status === 3 && (
              <span style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Completed & Closed
              </span>
            )}
            {job.status === 4 && (
              <span style={{ fontSize: 13, color: 'var(--accent-rose)', fontWeight: 600 }}>
                Cancelled
              </span>
            )}

            {/* Document Flow Interactive Tab Button */}
            <button
              onClick={() => setShowDocFlow(!showDocFlow)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: showDocFlow ? 'var(--accent-indigo)' : 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: showDocFlow ? '#fff' : 'var(--text-secondary)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <FileText size={12} />
              <span>Doc Flow</span>
              {showDocFlow ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          </div>

          {/* Document Flow Trail (Collapsible) */}
          {showDocFlow && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--bg-elevated)',
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Document Flow:</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--accent-blue)' }}>Service Order</span>
                <span className="mono" style={{ color: 'var(--text-primary)' }}>#{job.jobNumber}</span>
              </div>

              <span style={{ color: 'var(--text-muted)' }}>→</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--accent-indigo)' }}>Quotation</span>
                {quotation ? (
                  <button 
                    onClick={() => setShowQuoteModal(true)} 
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-blue)',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 12,
                      textDecoration: 'underline'
                    }}
                  >
                    #{quotation.quotationNumber}
                  </button>
                ) : (
                  job.status !== 3 && job.status !== 4 && (
                    <button 
                      onClick={handleCreateQuote}
                      disabled={actioningQuote}
                      style={{
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid var(--accent-indigo)',
                        color: 'var(--accent-indigo)',
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontSize: 10,
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      {actioningQuote ? 'Creating...' : '+ Create Quote'}
                    </button>
                  )
                )}
              </div>

              <span style={{ color: 'var(--text-muted)' }}>→</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--accent-emerald)' }}>Invoice</span>
                {invoice ? (
                  <a 
                    href={`/dashboard/billing?invoiceId=${invoice.id}`}
                    style={{
                      color: 'var(--accent-blue)',
                      fontWeight: 600,
                      fontSize: 12,
                      textDecoration: 'underline'
                    }}
                  >
                    #{invoice.invoiceNumber || 'Draft/Pending'}
                  </a>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2.2fr 1fr',
        gap: 24,
      }} className="dashboard-bottom-grid">
        
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Description Card */}
          <div className="card-elevated">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
              <h3 className="card-title">Job Description</h3>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: 13.5, color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {job.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Checklist Tasks Section */}
          <div className="card-elevated">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isTasksExpanded ? 16 : 0 }}>
              <div 
                onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
              >
                {isTasksExpanded ? <ChevronDown size={16} style={{ color: 'var(--accent-emerald)' }} /> : <ChevronRight size={16} style={{ color: 'var(--accent-emerald)' }} />}
                <h3 className="card-title">Tasks Checklist</h3>
                <span className="badge badge-muted">{(job.jobTasks || []).filter((t:any)=>t.isCompleted).length} / {job.jobTasks?.length || 0}</span>
              </div>
              {isTasksExpanded && job.status !== 3 && job.status !== 4 && (
                <button onClick={() => setShowAddTask(!showAddTask)} className="btn btn-ghost btn-sm">
                  <Plus size={14} /> Add Checklist Task
                </button>
              )}
            </div>

            {isTasksExpanded && (
              <>
                {showAddTask && (
                  <form onSubmit={handleAddTaskSubmit} style={{ marginBottom: 20, padding: 14, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-field">
                      <label className="form-label">Task Name *</label>
                      <input type="text" className="form-input" placeholder="e.g. Inspect hydraulic pressure" required value={newTaskName} onChange={e => setNewTaskName(e.target.value)} />
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <label className="form-label">Est. Duration (Minutes)</label>
                        <input type="number" className="form-input" min="0" value={newTaskDuration} onChange={e => setNewTaskDuration(e.target.value)} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Instructions / Notes (optional)</label>
                        <input type="text" className="form-input" placeholder="Special requirements..." value={newTaskInst} onChange={e => setNewTaskInst(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowAddTask(false)} className="btn btn-ghost btn-sm">Cancel</button>
                      <button type="submit" className="btn btn-primary btn-sm">Save Task</button>
                    </div>
                  </form>
                )}

                {(!job.jobTasks || job.jobTasks.length === 0) ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                    No tasks checklist defined.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {job.jobTasks.map((t: any, idx: number) => (
                      <div key={t.id} style={{
                        background: t.isCompleted ? 'rgba(46,204,138,0.02)' : 'var(--bg-primary)',
                        border: `1px solid ${t.isCompleted ? 'var(--accent-emerald-dim)' : 'var(--border-subtle)'}`,
                        borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={t.isCompleted}
                              disabled={job.status === 3 || job.status === 4}
                              onChange={() => handleToggleTaskComplete(t.id, t.isCompleted)}
                              style={{ width: 17, height: 17, marginTop: 2, cursor: (job.status === 3 || job.status === 4) ? 'not-allowed' : 'pointer' }}
                            />
                            <div>
                              <div style={{
                                fontSize: 14, fontWeight: 600,
                                color: t.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                                textDecoration: t.isCompleted ? 'line-through' : 'none'
                              }}>
                                {t.name}
                              </div>
                              {t.instructions && (
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                                  Instructions: {t.instructions}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                                <span>Est: {t.estimatedDurationMinutes} mins</span>
                                {t.isCompleted && t.completedAt && (
                                  <span style={{ color: 'var(--accent-emerald)' }}>
                                    Completed at {new Date(t.completedAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Photo / Delete actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {t.isCompleted && (
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 8px', borderRadius: 4, background: 'var(--bg-hover)' }}>
                                <Camera size={12} style={{ color: 'var(--accent-blue)' }} />
                                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>
                                  {t.photoPath ? 'Replace Photo' : 'Attach Photo'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleTaskPhotoUpload(t.id, e)}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            )}
                            {job.status !== 3 && job.status !== 4 && (
                              <button onClick={() => handleDeleteTask(t.id)} className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--accent-rose)' }}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Task attachment photo rendered directly below the checklist task */}
                        {t.photoPath && (
                          <div style={{
                            marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6,
                            padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--border-subtle)'
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Task Execution Photo:</div>
                            <div style={{ position: 'relative', width: 'fit-content', cursor: 'zoom-in' }} onClick={() => setPreviewImage(t.photoPath)}>
                              <img
                                src={t.photoPath}
                                alt={`Task ${idx + 1} execution proof`}
                                style={{
                                  maxWidth: 160, maxHeight: 110, objectFit: 'cover',
                                  borderRadius: 6, border: '1px solid var(--border-default)',
                                  transition: 'transform 0.15s ease'
                                }}
                                onMouseEnter={e => (e.target as HTMLElement).style.transform = 'scale(1.02)'}
                                onMouseLeave={e => (e.target as HTMLElement).style.transform = 'scale(1)'}
                              />
                              <div style={{
                                position: 'absolute', right: 6, bottom: 6, background: 'rgba(0,0,0,0.65)',
                                padding: 3, borderRadius: 4, display: 'flex', alignItems: 'center'
                              }}>
                                <Eye size={12} style={{ color: 'white' }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Components Workspace */}
          <div className="card-elevated">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isComponentsExpanded ? 16 : 0 }}>
              <div 
                onClick={() => setIsComponentsExpanded(!isComponentsExpanded)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
              >
                {isComponentsExpanded ? <ChevronDown size={16} style={{ color: 'var(--accent-amber)' }} /> : <ChevronRight size={16} style={{ color: 'var(--accent-amber)' }} />}
                <h3 className="card-title">Components</h3>
              </div>
              {isComponentsExpanded && job.status !== 3 && job.status !== 4 && (
                <button onClick={() => setShowAddPart(!showAddPart)} className="btn btn-ghost btn-sm">
                  <Plus size={14} /> Add Component
                </button>
              )}
            </div>

            {isComponentsExpanded && (
              <>
                {showAddPart && (
                  <form onSubmit={handleAddPartSubmit} style={{ marginBottom: 20, padding: 14, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-default)', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-field" style={{ flex: 2, minWidth: 200 }}>
                      <label className="form-label">Inventory Part</label>
                      <select className="form-select" required value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)}>
                        <option value="">Select inventory item...</option>
                        {inventory.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.partNumber} - {item.name} (Stock: {item.quantityOnHand})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field" style={{ flex: 1, minWidth: 80 }}>
                      <label className="form-label">Quantity</label>
                      <input type="number" className="form-input" min="1" required value={partQty} onChange={e => setPartQty(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                      <button type="button" onClick={() => setShowAddPart(false)} className="btn btn-ghost btn-sm">Cancel</button>
                      <button type="submit" className="btn btn-primary btn-sm">Request</button>
                    </div>
                  </form>
                )}

                {(!job.jobCardParts || job.jobCardParts.length === 0) ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                    No components have been requested for this job.
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Part Details</th>
                        <th>Qty</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Total Cost</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.jobCardParts.map((p: any) => {
                        const totalCost = p.quantityUsed * p.unitCostSnapshot;
                        return (
                          <tr key={p.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.inventoryItem?.name || 'Unknown Item'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Part No: {p.inventoryItem?.partNumber || '—'}</div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{p.quantityUsed}</td>
                            <td>
                              {p.isIssued ? (
                                <span className="badge badge-green">Issued</span>
                              ) : (
                                <span className="badge badge-muted">Requested</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              K {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                                {!p.isIssued && isStoremanOrSupervisor && (
                                  <button
                                    disabled={actionLoading}
                                    onClick={() => handleIssuePart(p.id)}
                                    className="btn btn-success btn-sm"
                                    style={{ padding: '3px 8px', fontSize: 11 }}
                                  >
                                    Issue Part
                                  </button>
                                )}
                                {(job.status !== 3 && job.status !== 4) && (
                                  <button onClick={() => handleDeletePart(p.id)} className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--accent-rose)' }}>
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>

          {/* External Service Section */}
          <div className="card-elevated">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExternalExpanded ? 16 : 0 }}>
              <div 
                onClick={() => setIsExternalExpanded(!isExternalExpanded)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
              >
                {isExternalExpanded ? <ChevronDown size={16} style={{ color: 'var(--accent-rose)' }} /> : <ChevronRight size={16} style={{ color: 'var(--accent-rose)' }} />}
                <h3 className="card-title">External Service</h3>
              </div>
              {isExternalExpanded && job.status !== 3 && job.status !== 4 && (
                <button onClick={() => setShowSubconModal(true)} className="btn btn-secondary btn-sm">
                  <ExternalLink size={12} /> Add External Service
                </button>
              )}
            </div>

            {isExternalExpanded && (
              <>
                {subcontracts.length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                    No external services have been raised for this {jobLabel.toLowerCase()}.
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>PO Number</th>
                        <th>Supplier / Scope</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcontracts.map(po => (
                        <tr key={po.id}>
                          <td className="mono" style={{ color: 'var(--accent-violet)' }}>{po.poNumber}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{po.supplier?.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{po.notes}</div>
                          </td>
                          <td>
                            <span className={`badge ${
                              po.status === 0 ? 'badge-muted' :
                              po.status === 1 ? 'badge-amber' :
                              po.status === 2 ? 'badge-green' : 'badge-red'
                            }`}>
                              {po.status === 0 ? 'Draft' :
                               po.status === 1 ? 'Sent' :
                               po.status === 2 ? 'Received' : 'Cancelled'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            K {po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>

          {/* General Job Attachments Card */}
          <div className="card-elevated">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
                <h3 className="card-title">General Job Attachments</h3>
              </div>
              <label style={{ cursor: 'pointer' }} className="btn btn-secondary btn-sm">
                <Upload size={13} /> Upload File
                <input type="file" onChange={handleGeneralFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {(!job.jobAttachments || job.jobAttachments.length === 0) ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                No general attachments or documents.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {job.jobAttachments.map((att: any) => (
                  <div key={att.id} style={{
                    background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                    padding: 10, borderRadius: 8, display: 'flex', gap: 8, flexDirection: 'column', position: 'relative'
                  }}>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      style={{ position: 'absolute', top: 6, right: 6, color: 'var(--accent-rose)', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                      <FileText size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={att.fileName}>
                        {att.fileName}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {(att.fileSizeBytes / 1024).toFixed(1)} KB · {att.category || 'General'}
                    </div>
                    <a href={att.filePath} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '2px 4px', fontSize: 11, justifyContent: 'center', background: 'var(--bg-hover)', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                      <Eye size={10} /> View / Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (DETAILS & FINANCIALS) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Core Properties Card */}
          <div className="card-elevated">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} style={{ color: 'var(--accent-indigo)' }} />
                <h3 className="card-title">Properties</h3>
              </div>
              {!editCore && (job.status !== 3 && job.status !== 4) && (
                <button onClick={() => setEditCore(true)} className="btn btn-ghost btn-sm">Edit</button>
              )}
            </div>

            {editCore ? (
              <form onSubmit={handleUpdateCore} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-field">
                  <label className="form-label">Lead Technician</label>
                  <select className="form-select" value={coreForm.assignedTechnicianId} onChange={e => setCoreForm({ ...coreForm, assignedTechnicianId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {[t.firstName, t.lastName].filter(Boolean).join(' ') || t.userName || t.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={coreForm.priority} onChange={e => setCoreForm({ ...coreForm, priority: parseInt(e.target.value) })}>
                    <option value={0}>Low</option>
                    <option value={1}>Normal</option>
                    <option value={2}>High</option>
                    <option value={3}>Critical</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Scheduled Start</label>
                  <input type="datetime-local" className="form-input" value={coreForm.scheduledStartDate} onChange={e => setCoreForm({ ...coreForm, scheduledStartDate: e.target.value })} />
                </div>

                <div className="form-field">
                  <label className="form-label">Deadline / End Date</label>
                  <input type="datetime-local" className="form-input" value={coreForm.scheduledEndDate} onChange={e => setCoreForm({ ...coreForm, scheduledEndDate: e.target.value })} />
                </div>

                <div className="form-field">
                  <label className="form-label">Agreed Price (ZMW)</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00" value={coreForm.invoiceAmount} onChange={e => setCoreForm({ ...coreForm, invoiceAmount: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="button" onClick={() => setEditCore(false)} className="btn btn-secondary btn-sm" disabled={savingCore}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={savingCore}>Save</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Lead Technician</span>
                  <span style={{ fontWeight: 600 }}>
                    {job.assignedTechnician ? (
                      [job.assignedTechnician.firstName, job.assignedTechnician.lastName].filter(Boolean).join(' ') || job.assignedTechnician.userName
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Unassigned</span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Scheduled Start</span>
                  <span style={{ fontWeight: 600 }}>
                    {job.scheduledStartDate ? new Date(job.scheduledStartDate).toLocaleString() : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Deadline</span>
                  <span style={{ fontWeight: 600 }}>
                    {job.scheduledEndDate ? new Date(job.scheduledEndDate).toLocaleString() : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Job Type</span>
                  <span style={{ fontWeight: 600 }}>{job.jobType?.name || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer</span>
                  <span style={{ fontWeight: 600 }}>{job.customer?.name || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Contract</span>
                  <span style={{ fontWeight: 600 }}>{job.contract?.title || job.contract?.contractNumber || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Agreed Price</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                    K {job.invoiceAmount ? job.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Financial cost trinity breakdown card */}
          <div className="card-elevated">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <DollarSign size={16} style={{ color: 'var(--accent-emerald)' }} />
              <h3 className="card-title">Financial Cost Trinity</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Internal Labor',    value: job.laborCost,           color: 'var(--accent-blue)',    desc: 'Hours logged × tech rate' },
                { label: 'Issued Parts',      value: job.partsCost,           color: 'var(--accent-amber)',   desc: 'Only issued stock parts' },
                { label: 'Direct Purchase',   value: job.directPurchaseCost,  color: 'var(--accent-violet)',  desc: 'Non-stock PO items' },
                { label: 'Subcontracting',    value: job.subcontractingCost,  color: 'var(--accent-rose)',    desc: 'External contractors POs' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 6, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.desc}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: row.value > 0 ? row.color : 'var(--text-secondary)' }}>
                    K {(row.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}

              <div style={{ borderTop: '1px solid var(--border-default)', marginTop: 8, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Total Cost</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>K {(job.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {job.invoiceAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Agreed Price</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>K {(job.invoiceAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 8, marginTop: 4,
                  background: job.profit >= 0 ? 'var(--accent-emerald-dim)' : 'var(--accent-rose-dim)',
                  border: `1px solid ${job.profit >= 0 ? 'rgba(46,204,138,0.2)' : 'rgba(232,72,85,0.2)'}`
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: job.profit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {job.profit >= 0 ? 'Net Profit' : 'Net Loss'}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: job.profit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      K {Math.abs(job.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {job.profitMarginPercent !== undefined && (
                      <div style={{ fontSize: 11, color: job.profit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', opacity: 0.8 }}>
                        Margin: {job.profitMarginPercent?.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subcontract Modal ── */}
      {showSubconModal && (
        <SubcontractModal
          job={job}
          onClose={() => setShowSubconModal(false)}
          onSaved={loadJobDetails}
        />
      )}

      {/* ── Lightbox Image Preview ── */}
      {previewImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="lightbox preview" style={{ maxWidth: '90%', maxHeight: '80%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
          <button className="btn btn-secondary btn-sm" onClick={() => setPreviewImage(null)}>
            <X size={14} /> Close Preview
          </button>
        </div>
      )}
      {/* ── Quotation Modal ── */}
      {showQuoteModal && quotation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowQuoteModal(false)}>
          <div className="card-elevated" style={{ width: 500, padding: 24, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Quotation Details</div>
                <div style={{ fontSize: 13, color: 'var(--accent-indigo)', fontWeight: 600, marginTop: 4 }}>
                  #{quotation.quotationNumber}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowQuoteModal(false)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Meta information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span className={`badge ${
                    quotation.status === 0 ? 'badge-muted' :
                    quotation.status === 1 ? 'badge-blue' :
                    quotation.status === 2 ? 'badge-green' : 'badge-rose'
                  }`}>
                    {quotation.status === 0 ? 'Draft' :
                     quotation.status === 1 ? 'Sent' :
                     quotation.status === 2 ? 'Accepted' : 'Rejected'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer</span>
                  <span style={{ fontWeight: 600 }}>
                    {job.customer?.name || '—'} 
                    {job.customer?.customerNumber && (
                      <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: 10 }}>#{job.customer.customerNumber}</span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Quote Date</span>
                  <span>{new Date(quotation.quoteDate).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Expiry Date</span>
                  <span>{new Date(quotation.expiryDate).toLocaleDateString()}</span>
                </div>
                {quotation.status === 3 && quotation.rejectionReason && (
                  <div style={{ marginTop: 8, padding: 10, background: 'rgba(232,72,85,0.1)', border: '1px solid var(--accent-rose)', borderRadius: 6, color: 'var(--accent-rose)', fontSize: 12 }}>
                    <strong>Rejection Reason:</strong> {quotation.rejectionReason}
                  </div>
                )}
              </div>

              {/* Items Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cost Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Internal Labor', value: job.laborCost },
                    { label: 'Components (Issued)', value: job.partsCost },
                    { label: 'Direct Purchases', value: job.directPurchaseCost },
                    { label: 'External Services', value: job.subcontractingCost }
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{ fontWeight: 500 }}>K {(row.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                      <span style={{ fontWeight: 600 }}>K {quotation.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tax (VAT {quotation.taxRate}%)</span>
                      <span style={{ color: 'var(--text-secondary)' }}>K {quotation.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, borderTop: '1px solid var(--border-default)', paddingTop: 8 }}>
                      <span>Total Quote Amount</span>
                      <span style={{ color: 'var(--accent-indigo)' }}>K {quotation.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                <a 
                  href={`/dashboard/jobs/${id}/print-quotation`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} /> Download Quote
                </a>

                {quotation.status === 2 && invoice && (
                  <a 
                    href={`/dashboard/jobs/${id}/print-invoice`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(46,204,138,0.1)', borderColor: 'var(--accent-emerald)' }}
                  >
                    <Download size={13} /> Download Invoice
                  </a>
                )}

                {quotation.status !== 2 && quotation.status !== 3 && (
                  <>
                    <button 
                      onClick={() => setShowRejectReasonModal(true)} 
                      className="btn btn-danger btn-sm"
                      disabled={actioningQuote}
                    >
                      Reject
                    </button>
                    <button 
                      onClick={handleAcceptQuote} 
                      className="btn btn-success btn-sm"
                      disabled={actioningQuote}
                    >
                      {actioningQuote ? 'Accepting...' : 'Accept Quote'}
                    </button>
                  </>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowQuoteModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Reason Modal ── */}
      {showRejectReasonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowRejectReasonModal(false)}>
          <div className="card-elevated" style={{ width: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Reason for Rejection</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRejectReasonModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleRejectQuote} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Please enter the reason why the customer rejected this quote:</label>
                <textarea 
                  required 
                  style={{
                    width: '100%', minHeight: 80, fontSize: 13, padding: '8px 12px',
                    background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
                    borderRadius: 6, color: 'var(--text-primary)', boxSizing: 'border-box', resize: 'vertical'
                  }} 
                  placeholder="e.g. Price too high / deferred to next quarter..." 
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)} 
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRejectReasonModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger btn-sm" disabled={actioningQuote || !rejectReason.trim()}>
                  {actioningQuote ? 'Submitting...' : 'Reject Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcontract Modal Component ──
function SubcontractModal({ job, onClose, onSaved }: { job: any; onClose: () => void; onSaved: () => void }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    supplierId: '',
    description: '',
    estimatedCost: '',
    notes: '',
  });

  // State for registering inline supplier/individual
  const [showAddSupplierInline, setShowAddSupplierInline] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [savingNewSupplier, setSavingNewSupplier] = useState(false);

  useEffect(() => {
    dashboardApi.getSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId || !form.description) return;
    setSaving(true);
    try {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      await dashboardApi.createPurchaseOrder({
        poNumber: `PO-SUB-${year}-${rand}`,
        supplierId: parseInt(form.supplierId),
        poType: 2, // Subcontracting
        jobCardId: job.id,
        notes: form.notes || `Subcontracted work for ${job.jobNumber} — ${job.equipment?.name ?? ''}`.trim(),
        items: [{
          description: form.description,
          quantityOrdered: 1,
          unitCost: parseFloat(form.estimatedCost) || 0,
        }],
      });
      onSaved();
      onClose();
    } catch {
      alert('Failed to raise subcontract PO');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSupplierInline = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newSupplierName.trim()) return;
    setSavingNewSupplier(true);
    try {
      const payload = {
        name: newSupplierName.trim(),
        phone: newSupplierPhone.trim(),
        email: newSupplierEmail.trim(),
        supplierCode: 'IND-' + Math.floor(1000 + Math.random() * 9000),
        notes: 'Registered as individual contractor from Subcontract Modal.'
      };
      const created = await procurementApi.createSupplier(payload);
      
      // Reload suppliers
      const updatedList = await dashboardApi.getSuppliers();
      setSuppliers(updatedList || []);
      
      // Auto-select the newly created supplier
      if (created && created.id) {
        setForm(f => ({ ...f, supplierId: created.id.toString() }));
      } else {
        const match = updatedList.find((s: any) => s.name === payload.name);
        if (match) {
          setForm(f => ({ ...f, supplierId: match.id.toString() }));
        }
      }
      
      // Reset inline form
      setNewSupplierName('');
      setNewSupplierPhone('');
      setNewSupplierEmail('');
      setShowAddSupplierInline(false);
    } catch (err: any) {
      alert('Failed to add contractor: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingNewSupplier(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', fontSize: 13, padding: '8px 12px',
    background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
    borderRadius: 6, color: 'var(--text-primary)', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="card-elevated" style={{ width: 480, padding: 24, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Raise Subcontract PO</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
              Linked to <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{job.jobNumber}</span> · {job.equipment?.name}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>External Contractor / Supplier *</label>
            <select style={fieldStyle} required value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
              <option value="">Select supplier...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {suppliers.length === 0 ? "No suppliers found." : ""}
              </span>
              <button
                type="button"
                onClick={() => setShowAddSupplierInline(!showAddSupplierInline)}
                style={{
                  fontSize: 11, background: 'none', border: 'none',
                  color: 'var(--accent-blue)', cursor: 'pointer', padding: 0,
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3
                }}
              >
                {showAddSupplierInline ? 'Cancel' : '+ Register Individual / Supplier'}
              </button>
            </div>

            {showAddSupplierInline && (
              <div style={{
                marginTop: 10, padding: 12, borderRadius: 6,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', gap: 10
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Register Individual / Supplier</div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Full Name *</label>
                  <input style={fieldStyle} required placeholder="e.g. John Banda" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Phone</label>
                    <input style={fieldStyle} placeholder="+260..." value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Email</label>
                    <input style={fieldStyle} type="email" placeholder="john@email.com" value={newSupplierEmail} onChange={e => setNewSupplierEmail(e.target.value)} />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleCreateSupplierInline}
                  disabled={savingNewSupplier || !newSupplierName.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-end', padding: '4px 12px', fontSize: 11 }}
                >
                  {savingNewSupplier ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Scope of Work *</label>
            <textarea style={{ ...fieldStyle, minHeight: 80, resize: 'vertical' }} required
              placeholder="Describe the outsourced scope of work..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Estimated Cost (ZMW)</label>
            <input style={fieldStyle} type="number" min="0" step="0.01"
              placeholder="0.00"
              value={form.estimatedCost}
              onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Internal Notes</label>
            <input style={fieldStyle} placeholder="Internal notes or subcontract reference..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" style={{ background: 'var(--accent-violet)', borderColor: 'var(--accent-violet)' }} disabled={saving || !form.supplierId || showAddSupplierInline}>
              <ExternalLink size={13} /> {saving ? 'Raising PO...' : 'Raise Subcontract PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

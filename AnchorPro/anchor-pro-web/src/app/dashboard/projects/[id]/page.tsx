'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Users, Trash2,
  Layers, FileCheck, GitBranch, Calendar, ClipboardList, ShieldCheck, BarChart3, ChevronRight, Link2
} from 'lucide-react';
import toast from 'react-hot-toast';
import SlideOver from '@/components/SlideOver';
import { dashboardApi, scheduleApi, certificatesApi, boqApi } from '@/lib/api';
import { useDictionary } from '@/lib/DictionaryContext';
import { roleDisplayName } from '@/lib/roleDisplayNames';

const CONSTRUCTION_MODULES = [
  { key: 'boq', label: 'Bill of Quantities', desc: 'Contract sum, sections & rates', icon: Layers, href: (id: string | number) => `/dashboard/boq?project=${id}` },
  { key: 'certificates', label: 'Payment Certificates', desc: 'Interim valuations & IPCs', icon: FileCheck, href: (id: string | number) => `/dashboard/certificates?project=${id}` },
  { key: 'variations', label: 'Variations & Claims', desc: 'Site instructions & VOs', icon: GitBranch, href: (id: string | number) => `/dashboard/variations?project=${id}` },
  { key: 'schedule', label: 'Program & Schedule', desc: 'Gantt & auto-tracked progress', icon: Calendar, href: (id: string | number) => `/dashboard/schedule?project=${id}` },
  { key: 'sitediary', label: 'Daily Site Diary', desc: 'Labour, plant & deliveries', icon: ClipboardList, href: (id: string | number) => `/dashboard/site-diary?project=${id}` },
  { key: 'safety', label: 'Safety & Compliance', desc: 'Permits-to-work & LOTO', icon: ShieldCheck, href: (id: string | number) => `/dashboard/safety?project=${id}` },
  { key: 'weekly', label: 'Weekly Reports', desc: 'Site progress rollups', icon: BarChart3, href: (id: string | number) => `/dashboard/reports/weekly?project=${id}` },
  { key: 'monthly', label: 'Monthly Reports', desc: 'Client & consultant report', icon: FileCheck, href: (id: string | number) => `/dashboard/reports/monthly?project=${id}` },
];

// Must match the backend ProjectDocumentCategory enum (Data/Entities/ProjectDocument.cs) order exactly.
const DOCUMENT_CATEGORIES = ['Drawing', 'Specification', 'Contract', 'Photo', 'Other'];

function HealthBar({ current, total }: { current: number, total: number }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  const color = pct > 90 ? 'var(--accent-rose)' : pct > 75 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
  return (
    <div style={{ width: '100%', height: 8, background: 'var(--bg-card)', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.3s' }}></div>
    </div>
  );
}

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { formatMoney } = useDictionary();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [snapshot, setSnapshot] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', estimatedHours: '', startDate: '', dueDate: '', assignedToId: '' });

  const [users, setUsers] = useState<any[]>([]);
  const [showTeam, setShowTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ userId: '', projectRole: 'Contributor' });

  const [showExpense, setShowExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Other', expenseDate: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docForm, setDocForm] = useState({ category: 'Other', revisionNumber: '', boqSectionId: '' });
  const [boqSections, setBoqSections] = useState<any[]>([]);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }

    dashboardApi.getProjectSnapshot(Number(id)).then(setSnapshot).catch(() => setSnapshot(null));
    scheduleApi.getByProject(Number(id)).then((m: any) => setMilestones(Array.isArray(m) ? m : [])).catch(() => setMilestones([]));
    certificatesApi.getByProject(Number(id)).then((c: any) => setCertificates(Array.isArray(c) ? c : [])).catch(() => setCertificates([]));
    boqApi.getByProject(Number(id)).then((b: any) => setBoqSections(b?.sections || [])).catch(() => setBoqSections([]));
  };

  const handleCreateTask = async (e: any) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('anchor_auth_token');
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/projecttasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectId: id,
          title: taskForm.title,
          description: taskForm.description,
          estimatedHours: parseFloat(taskForm.estimatedHours) || 0,
          startDate: taskForm.startDate,
          dueDate: taskForm.dueDate,
          assignedToId: taskForm.assignedToId || undefined
        })
      });
      if (res.ok) {
        toast.success('Task created successfully');
        setShowTask(false);
        setTaskForm({ title: '', description: '', estimatedHours: '', startDate: '', dueDate: '', assignedToId: '' });
        loadProject();
      } else {
        toast.error('Error creating task');
      }
    } catch (err) {
      toast.error('Error creating task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('anchor_auth_token');
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const res = await fetch(`/api/projecttasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success('Task status updated');
        loadProject();
      } else {
        toast.error('Failed to update task');
      }
    } catch (e) {
      toast.error('Error updating task');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      if (res.ok) setUsers(await res.json());
    } catch(err) { console.error(err); }
  };

  const handleAddMember = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${id}/members`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm)
      });
      if (res.ok) {
        toast.success('Team member assigned');
        setShowTeam(false);
        setTeamForm({ userId: '', projectRole: 'Contributor' });
        loadProject();
      } else { toast.error('Error adding member'); }
    } catch(err) { toast.error('Error adding member'); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove member from project?')) return;
    try {
      const res = await fetch(`/api/projects/${id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Member removed');
        loadProject();
      } else { toast.error('Failed to remove member'); }
    } catch(err) { toast.error('Failed to remove member'); }
  };

  const handleCreateExpense = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${id}/expenses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount) || 0
        })
      });
      if (res.ok) {
        toast.success('Expense recorded');
        setShowExpense(false);
        setExpenseForm({ description: '', amount: '', category: 'Other', expenseDate: '' });
        loadProject();
      } else { toast.error('Error adding expense'); }
    } catch(err) { toast.error('Error adding expense'); }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('File exceeds the 50MB upload limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setPendingFile(file);
    setDocForm({ category: 'Other', revisionNumber: '', boqSectionId: '' });
    setShowDocUpload(true);
  };

  const handleDocUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFile) return;

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', pendingFile);
    formData.append('category', docForm.category);
    if (docForm.revisionNumber) formData.append('revisionNumber', docForm.revisionNumber);
    if (docForm.boqSectionId) formData.append('boqSectionId', docForm.boqSectionId);

    try {
      const res = await fetch(`/api/projects/${id}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('anchor_auth_token')}` },
        body: formData
      });
      if (res.ok) {
        toast.success('Document uploaded successfully');
        setShowDocUpload(false);
        setPendingFile(null);
        loadProject();
      } else {
        toast.error('Failed to upload document');
      }
    } catch (err) {
      toast.error('Error uploading document');
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (showTeam && users.length === 0) loadUsers();
  }, [showTeam]);

  if (loading) return <div className="page-container">Loading project...</div>;
  if (!project) return <div className="page-container">Project not found.</div>;

  const budgetRemaining = project.budget - project.totalCost;
  
  // Kanban columns
  const todoTasks = project.tasks?.filter((t: any) => t.status === 'ToDo') || [];
  const inProgressTasks = project.tasks?.filter((t: any) => t.status === 'InProgress') || [];
  const doneTasks = project.tasks?.filter((t: any) => t.status === 'Done') || [];

  // Financial calculations
  // Construction projects bill via Payment Certificates rather than the Job-Card Invoices flow,
  // so revenue recognized to date is whatever certificates have actually been paid.
  const certifiedRevenue = certificates.filter((c: any) => c.status === 5).reduce((sum: number, c: any) => sum + (c.netAmountDue || 0), 0);
  const totalInvoiced = (project.invoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0) + certifiedRevenue;
  const profitMargin = totalInvoiced > 0 ? ((totalInvoiced - (project.totalCost || 0)) / totalInvoiced) * 100 : 0;

  return (
    <div className="page-container">
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => router.push('/dashboard/projects')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.description}</p>
        </div>
        <span className={`badge ${project.status === 'Active' ? 'badge-blue' : 'badge-gray'}`}>
          {project.status}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        {['overview', 'timeline', 'board', 'operations', 'invoices', 'documents', 'team'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 600 : 500,
              fontSize: 14,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'board' ? 'Kanban Board' : tab === 'invoices' ? 'Certificates' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>TOTAL BUDGET</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{formatMoney(project.budget)}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>ACTUAL COSTS TO DATE</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-rose)' }}>{formatMoney(project.totalCost)}</div>
              <HealthBar current={project.totalCost} total={project.budget} />
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>TOTAL INVOICED (REVENUE)</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-emerald)' }}>{formatMoney(totalInvoiced)}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>PROFIT MARGIN</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: profitMargin >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>

          {snapshot && (snapshot.contractSum > 0 || snapshot.latestCertificateNumber) && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Construction Snapshot</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>CERTIFIED PROGRESS</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{snapshot.percentComplete?.toFixed(1) ?? 0}%</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {formatMoney(snapshot.grossValuationToDate)} valued of {formatMoney(snapshot.contractSum)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>LATEST CERTIFICATE</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{snapshot.latestCertificateNumber ?? '—'}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {snapshot.latestCertificateStatus ?? 'No certificate raised'} · {formatMoney(snapshot.netCertifiedPayable)} net payable
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>OPEN VARIATIONS</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: snapshot.openVariationsCount > 0 ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
                    {snapshot.openVariationsCount ?? 0}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>awaiting approval</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>SAFETY & PERMITS</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{snapshot.permitCompliancePercent?.toFixed(0) ?? 100}%</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {snapshot.activePermitsCount ?? 0} active permits · {snapshot.safetyIncidentsThisMonth ?? 0} incidents this month
                  </div>
                </div>
                {snapshot.nextMilestoneTitle && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>NEXT MILESTONE</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{snapshot.nextMilestoneTitle}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {snapshot.nextMilestoneDate ? new Date(snapshot.nextMilestoneDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Construction Modules</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {CONSTRUCTION_MODULES.map(mod => {
                const Icon = mod.icon;
                return (
                  <Link key={mod.key} href={mod.href(id as string)} className="card" style={{
                    padding: 18, display: 'flex', alignItems: 'flex-start', gap: 12, textDecoration: 'none', color: 'inherit',
                    transition: 'border-color 0.15s', border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={17} style={{ color: 'var(--accent-blue)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {mod.label}
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{mod.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Program Schedule</h3>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Real construction activities — planned vs. actual, auto-tracked against certified BOQ progress.</p>
            </div>
            <Link href={`/dashboard/schedule?project=${id}`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              Open Full Gantt <ChevronRight size={14} />
            </Link>
          </div>

          {milestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              No schedule activities yet.{' '}
              <Link href={`/dashboard/schedule?project=${id}`} style={{ color: 'var(--accent-blue)' }}>Add the first one</Link>.
            </div>
          ) : (
            <div style={{ padding: 8 }}>
              {milestones
                .slice()
                .sort((a: any, b: any) => new Date(a.plannedStartDate).getTime() - new Date(b.plannedStartDate).getTime())
                .map((m: any) => {
                  const statusColor: Record<number, string> = { 0: 'var(--text-secondary)', 1: 'var(--accent-blue)', 2: 'var(--accent-emerald)', 3: '#ef4444' };
                  const statusLabel: Record<number, string> = { 0: 'Not Started', 1: 'In Progress', 2: 'Complete', 3: 'Delayed' };
                  const color = statusColor[m.status] ?? 'var(--text-secondary)';
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {m.title}
                          {m.isAutoTracked && <Link2 size={12} style={{ color: 'var(--accent-blue)' }} />}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {new Date(m.plannedStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} → {new Date(m.plannedEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          {m.trade && ` · ${m.trade}`}
                        </div>
                      </div>
                      <div style={{ width: 140, flexShrink: 0 }}>
                        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                          <div style={{ width: `${m.progressPercentage}%`, height: '100%', background: color }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, textAlign: 'right' }}>{m.progressPercentage}%</div>
                      </div>
                      <span className="badge" style={{ background: `${color}20`, color, flexShrink: 0 }}>{statusLabel[m.status] ?? 'Unknown'}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'board' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowTask(true)}><Plus size={16} /> Add Task</button>
          </div>
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20 }}>
            {/* To Do */}
            <div style={{ flex: 1, minWidth: 280, background: 'var(--bg-app)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>TO DO ({todoTasks.length})</div>
              {todoTasks.map((t: any) => (
                <div key={t.id} className="card-elevated" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>{t.title}</div>
                  {t.assignedToName && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}><Users size={12} style={{ display: 'inline', marginRight: 4 }}/>{t.assignedToName}</div>}
                  <button onClick={() => handleUpdateTaskStatus(t.id, 'InProgress')} style={{ width: '100%', padding: '6px', fontSize: 12, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4, cursor: 'pointer', color: 'var(--accent-blue)', fontWeight: 600 }}>Start Work</button>
                </div>
              ))}
            </div>

            {/* In Progress */}
            <div style={{ flex: 1, minWidth: 280, background: 'var(--bg-app)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>IN PROGRESS ({inProgressTasks.length})</div>
              {inProgressTasks.map((t: any) => (
                <div key={t.id} className="card-elevated" style={{ padding: 16, marginBottom: 12, borderLeft: '3px solid var(--accent-blue)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>{t.title}</div>
                  {t.assignedToName && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}><Users size={12} style={{ display: 'inline', marginRight: 4 }}/>{t.assignedToName}</div>}
                  <button onClick={() => handleUpdateTaskStatus(t.id, 'Done')} style={{ width: '100%', padding: '6px', fontSize: 12, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4, cursor: 'pointer', color: 'var(--accent-emerald)', fontWeight: 600 }}>Complete Task</button>
                </div>
              ))}
            </div>

            {/* Done */}
            <div style={{ flex: 1, minWidth: 280, background: 'var(--bg-app)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>DONE ({doneTasks.length})</div>
              {doneTasks.map((t: any) => (
                <div key={t.id} className="card-elevated" style={{ padding: 16, marginBottom: 12, opacity: 0.7 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8, textDecoration: 'line-through' }}>{t.title}</div>
                  <button onClick={() => handleUpdateTaskStatus(t.id, 'InProgress')} style={{ width: '100%', padding: '6px', fontSize: 11, background: 'none', border: '1px dashed var(--border-subtle)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-muted)' }}>Reopen</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Payment Certificates</h3>
            <Link href={`/dashboard/certificates?project=${id}`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Manage Certificates
            </Link>
          </div>

          <div className="card-elevated" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Certificate</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Gross Valuation</th>
                  <th style={{ textAlign: 'right' }}>Net Payable</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c: any) => {
                  const statusLabels = ['Draft', 'Submitted', 'Queried', 'Approved', 'Issued', 'Paid'];
                  const label = statusLabels[c.status] ?? 'Unknown';
                  const badgeClass = c.status >= 4 ? 'badge-green' : c.status === 2 ? 'badge-orange' : 'badge-gray';
                  return (
                    <tr key={`cert-${c.id}`}>
                      <td style={{ fontWeight: 600 }}>{c.certificateNumber}</td>
                      <td>{new Date(c.periodStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(c.periodEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td><span className={`badge ${badgeClass}`}>{label}</span></td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(c.grossValuationToDate)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(c.netAmountDue)}</td>
                    </tr>
                  );
                })}
                {certificates.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No certificates raised yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Other Invoices</h3>
          </div>

          <div className="card-elevated" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {project.invoices?.map((inv: any) => (
                  <tr key={`inv-${inv.id}`}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
                    <td><span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-green' : 'badge-orange'}`}>{inv.paymentStatus}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(inv.total)}</td>
                  </tr>
                ))}
                {(!project.invoices || project.invoices.length === 0) && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No ad-hoc invoices for this project.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Project Documents</h3>
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                PDF, Word/Excel, DWG/DXF, or images — up to 50MB.
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.jpg,.jpeg,.png,.heic,.webp"
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingDoc}>
              <Plus size={16} style={{ marginRight: 6 }}/> {uploadingDoc ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
          
          <div className="card-elevated" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Category</th>
                  <th>Revision</th>
                  <th>Uploaded At</th>
                  <th>Uploaded By</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {project.documents?.map((doc: any) => {
                  const section = boqSections.find(s => s.id === doc.boqSectionId);
                  return (
                    <tr key={`doc-${doc.id}`}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                        {doc.fileName}
                        {section && <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 400 }}>{section.sectionName}</div>}
                      </td>
                      <td><span className="badge badge-gray">{DOCUMENT_CATEGORIES[doc.category] ?? 'Other'}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{doc.revisionNumber || '—'}</td>
                      <td>{new Date(doc.uploadedAt).toLocaleString()}</td>
                      <td>{doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}</td>
                      <td style={{ textAlign: 'right' }}>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>Download</a>
                      </td>
                    </tr>
                  );
                })}
                {(!project.documents || project.documents.length === 0) && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No documents uploaded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'operations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Link href={`/dashboard/site-diary?project=${id}`} className="card" style={{
            padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', color: 'inherit'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={17} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>Daily Site Diary</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>Labour headcount, plant hours & deliveries are logged here, not as Job Cards.</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          </Link>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Direct Project Expenses</h3>
              <button className="btn btn-primary" onClick={() => setShowExpense(true)}><Plus size={16} /> Log Expense</button>
            </div>
            <div className="card-elevated" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Recorded By</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {project.directExpenses?.map((e: any) => (
                    <tr key={e.id}>
                      <td>{new Date(e.expenseDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>{e.description}</td>
                      <td><span className="badge badge-blue">{e.category}</span></td>
                      <td>{e.recordedBy}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-rose)' }}>{formatMoney(e.amount)}</td>
                    </tr>
                  ))}
                  {(!project.directExpenses || project.directExpenses.length === 0) && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No direct expenses logged yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowTeam(true)}><Plus size={16} /> Assign Member</button>
          </div>
          <div className="card-elevated" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.members?.map((m: any) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.userName}</div>
                    </td>
                    <td><span className="badge badge-gray">{m.projectRole}</span></td>
                    <td>
                      <button onClick={() => handleRemoveMember(m.userId)} className="btn btn-secondary" style={{ padding: 6, color: 'var(--accent-red)' }} title="Remove Member">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!project.members || project.members.length === 0) && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No team members assigned yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SlideOver open={showTask} onClose={() => setShowTask(false)} title="New Task">
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Task Title</label>
            <input className="form-input" required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" required value={taskForm.startDate} onChange={e => setTaskForm({...taskForm, startDate: e.target.value})} />
            </div>
            <div className="form-field">
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" required value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Estimated Hours</label>
            <input className="form-input" type="number" step="0.5" value={taskForm.estimatedHours} onChange={e => setTaskForm({...taskForm, estimatedHours: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Assign To</label>
            <select className="form-input" value={taskForm.assignedToId} onChange={e => setTaskForm({...taskForm, assignedToId: e.target.value})}>
              <option value="">Unassigned</option>
              {project?.members?.map((m: any) => (
                <option key={m.userId} value={m.userId}>{m.userName}</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Task</button>
          </div>
        </form>
      </SlideOver>

      <SlideOver open={showTeam} onClose={() => setShowTeam(false)} title="Assign Team Member">
        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Select User</label>
            <select className="form-input" required value={teamForm.userId} onChange={e => setTeamForm({...teamForm, userId: e.target.value})}>
              <option value="">Select a user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({roleDisplayName(u.role)})</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Project Role</label>
            <select className="form-input" value={teamForm.projectRole} onChange={e => setTeamForm({...teamForm, projectRole: e.target.value})}>
              <option value="Viewer">Viewer</option>
              <option value="Contributor">Contributor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Assign Member</button>
          </div>
        </form>
      </SlideOver>

      <SlideOver
        open={showDocUpload}
        onClose={() => { setShowDocUpload(false); setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
        title="Upload Document"
        subtitle={pendingFile?.name}
      >
        <form onSubmit={handleDocUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Category</label>
            <select className="form-input" value={docForm.category} onChange={e => setDocForm({...docForm, category: e.target.value})}>
              <option value="Drawing">Drawing</option>
              <option value="Specification">Specification</option>
              <option value="Contract">Contract</option>
              <option value="Photo">Photo</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Revision</label>
            <input className="form-input" placeholder="e.g. Rev A, Rev 2" value={docForm.revisionNumber} onChange={e => setDocForm({...docForm, revisionNumber: e.target.value})} />
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Captured as a record only — there&apos;s no live sync to flag when a newer revision exists elsewhere.
            </p>
          </div>
          <div className="form-field">
            <label className="form-label">BOQ Section (optional)</label>
            <select className="form-input" value={docForm.boqSectionId} onChange={e => setDocForm({...docForm, boqSectionId: e.target.value})}>
              <option value="">— Not linked to a section —</option>
              {boqSections.map((s: any) => <option key={s.id} value={s.id}>{s.sectionCode} — {s.sectionName}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 10 }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploadingDoc}>
              {uploadingDoc ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </SlideOver>

      <SlideOver open={showExpense} onClose={() => setShowExpense(false)} title="Log Direct Expense">
        <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Description</label>
            <input className="form-input" required value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="e.g. Subcontractor invoice, Surveying fee" />
          </div>
          <div className="form-field">
            <label className="form-label">Amount (ZMW)</label>
            <input className="form-input" type="number" step="0.01" required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Category</label>
            <select className="form-input" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
              <option value="Other">Other</option>
              <option value="OfficeSupplies">Office Supplies</option>
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent</option>
              <option value="Travel">Travel</option>
              <option value="Meals">Meals</option>
              <option value="Marketing">Marketing</option>
              <option value="SoftwareSubscriptions">Software / IT</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" required value={expenseForm.expenseDate} onChange={e => setExpenseForm({...expenseForm, expenseDate: e.target.value})} />
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Log Expense</button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}

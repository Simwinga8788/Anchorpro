'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Calendar, DollarSign, Users, CheckCircle, Clock, Loader2, Save, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import SlideOver from '@/components/SlideOver';

function getToken() {
  return localStorage.getItem('anchor_auth_token') || '';
}

const PROJECT_COLOURS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6'
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Draft:     { label: 'Draft',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  Active:    { label: 'Active',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  Completed: { label: 'Completed', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  Cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

function ProjectCard({ project, onClick }: { project: any; onClick: () => void }) {
  const tasks = project.tasks || [];
  const doneTasks = tasks.filter((t: any) => t.status === 'Done').length;
  const completionPct = project.completionPercentage ?? (tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0);
  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG['Draft'];
  const colour = project.colour || '#6366f1';
  const budgetUsed = project.totalCost || project.actualCost || 0;
  const budgetPct = project.budget > 0 ? Math.min(Math.round((budgetUsed / project.budget) * 100), 100) : 0;
  const budgetColor = budgetPct > 90 ? '#ef4444' : budgetPct > 70 ? '#f59e0b' : '#10b981';
  const members = project.members || [];
  const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000) : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 14,
        border: '1px solid var(--border-subtle)',
        padding: 0,
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Coloured top strip */}
      <div style={{ height: 5, background: colour, width: '100%' }} />
      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
            {project.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.description}</div>}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: status.bg, color: status.color, marginLeft: 10, flexShrink: 0 }}>
            {status.label}
          </span>
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Completion</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: completionPct >= 100 ? '#10b981' : 'var(--text-primary)' }}>{completionPct}%</span>
          </div>
          <div style={{ height: 7, background: 'var(--bg-app)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completionPct}%`, background: colour, borderRadius: 4, transition: 'width 0.5s ease' }} />
          </div>
          {tasks.length > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{doneTasks}/{tasks.length} tasks done</div>}
        </div>

        {/* Budget */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Budget</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: budgetColor }}>{budgetPct}% used</span>
          </div>
          <div style={{ height: 5, background: 'var(--bg-app)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${budgetPct}%`, background: budgetColor, borderRadius: 3 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>K {budgetUsed.toLocaleString()} spent</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>K {(project.budget || 0).toLocaleString()} budget</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {members.slice(0, 4).map((_: any, i: number) => (
              <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: colour, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg-card)', zIndex: 4-i }}>?</div>
            ))}
            {members.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No team</span>}
            {members.length > 4 && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>+{members.length - 4}</span>}
          </div>
          {daysLeft !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: daysLeft < 0 ? '#ef4444' : daysLeft < 14 ? '#f59e0b' : 'var(--text-muted)', fontWeight: daysLeft < 14 ? 700 : 400 }}>
              <Clock size={11} />
              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedColour, setSelectedColour] = useState(PROJECT_COLOURS[0]);
  const [form, setForm] = useState({ name: '', description: '', budget: '', startDate: '', endDate: '' });

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) setProjects(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, description: form.description, budget: parseFloat(form.budget) || 0, startDate: form.startDate || null, endDate: form.endDate || null, status: 'Active', colour: selectedColour })
      });
      if (res.ok) {
        toast.success('Project created successfully');
        setShowCreate(false);
        setForm({ name: '', description: '', budget: '', startDate: '', endDate: '' });
        setSelectedColour(PROJECT_COLOURS[0]);
        loadProjects();
      } else { toast.error('Error creating project'); }
    } catch (err) { toast.error('Error creating project'); }
    finally { setSaving(false); }
  };

  const filtered = projects
    .filter(p => filterStatus === 'all' || p.status?.toLowerCase() === filterStatus)
    .filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all: projects.length,
    active: projects.filter(p => p.status === 'Active').length,
    draft: projects.filter(p => p.status === 'Draft').length,
    completed: projects.filter(p => p.status === 'Completed').length,
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={22} className="text-accent-blue" /> Projects Portfolio
          </h1>
          <p className="page-subtitle">Track all projects, budgets, and team progress at a glance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={18} /> New Project</button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
        {Object.entries(counts).map(([key, val]) => (
          <button key={key} onClick={() => setFilterStatus(key)}
            className="card"
            style={{ padding: '14px 18px', textAlign: 'left', cursor: 'pointer', border: filterStatus === key ? '2px solid var(--accent-blue)' : '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{key}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{val}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 360 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading projects...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Building2 size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 16 }}>No projects found</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>Create First Project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} onClick={() => router.push(`/dashboard/projects/${p.id}`)} />
          ))}
        </div>
      )}

      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Project Name</label>
            <input className="form-input" required value={form.name} placeholder="e.g. Pit 3 Development Phase 2" onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} placeholder="Brief scope description..." onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
            </div>
            <div className="form-field">
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Budget (ZMW)</label>
            <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Project Colour</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              {PROJECT_COLOURS.map(c => (
                <button key={c} type="button" onClick={() => setSelectedColour(c)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: selectedColour === c ? '3px solid white' : '2px solid transparent', outline: selectedColour === c ? `3px solid ${c}` : 'none', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Create Project
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}

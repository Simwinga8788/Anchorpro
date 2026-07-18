'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Search, Calendar, DollarSign, Clock, Users } from 'lucide-react';
import { dashboardApi } from '@/lib/api'; // Assuming you have api mapped or I'll use fetch directly
import SlideOver from '@/components/SlideOver';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', budget: '', startDate: '', endDate: '' });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          budget: parseFloat(form.budget) || 0,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: 'Active'
        })
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: '', description: '', budget: '', startDate: '', endDate: '' });
        loadProjects();
      }
    } catch (err) {
      alert('Error creating project');
    }
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Projects Portfolio</h1>
          <p className="page-subtitle">Manage large-scale engagements and track overall profitability</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="card-elevated" style={{ padding: 16, marginBottom: 20 }}>
        <div className="search-bar">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No projects found.</div>
        ) : filtered.map(p => (
          <div 
            key={p.id} 
            className="card" 
            style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-subtle)' }}
            onClick={() => router.push(`/dashboard/projects/${p.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{p.name}</h3>
                <span className={`badge ${p.status === 'Active' ? 'badge-blue' : p.status === 'Completed' ? 'badge-green' : 'badge-gray'}`}>
                  {p.status}
                </span>
              </div>
              <div style={{ background: 'var(--accent-blue)20', padding: 8, borderRadius: 8 }}>
                <Building2 size={20} color="var(--accent-blue)" />
              </div>
            </div>
            
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {p.description || 'No description provided.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>BUDGET</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>K {p.budget?.toLocaleString() ?? '0'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>ACTUAL COSTS</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-rose)' }}>K {p.totalCost?.toLocaleString() ?? '0'}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-tertiary)' }}>
                <Clock size={14} /> {p.operationsCount} Operations
              </div>
              {p.managerName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <Users size={14} /> {p.managerName}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="Create New Project">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Project Name</label>
            <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Total Budget (K)</label>
            <input className="form-input" type="number" step="0.01" required value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Project</button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}

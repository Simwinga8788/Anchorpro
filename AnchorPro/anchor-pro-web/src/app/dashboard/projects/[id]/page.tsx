'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Building2, ArrowLeft, Plus, Clock, Users, Wrench, CheckCircle, Hash, Trash2 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SlideOver from '@/components/SlideOver';

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
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', estimatedHours: '' });

  const [users, setUsers] = useState<any[]>([]);
  const [showTeam, setShowTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ userId: '', projectRole: 'Contributor' });

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
  };

  const handleCreateTask = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projecttasks', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: id,
          title: taskForm.title,
          description: taskForm.description,
          estimatedHours: parseFloat(taskForm.estimatedHours) || 0,
        })
      });
      if (res.ok) {
        setShowTask(false);
        setTaskForm({ title: '', description: '', estimatedHours: '' });
        loadProject();
      }
    } catch (err) {
      alert('Error creating task');
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
        setShowTeam(false);
        setTeamForm({ userId: '', projectRole: 'Contributor' });
        loadProject();
      } else { alert('Error adding member'); }
    } catch(err) { console.error(err); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove member from project?')) return;
    try {
      const res = await fetch(`/api/projects/${id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) loadProject();
    } catch(err) { console.error(err); }
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
        {['overview', 'board', 'operations', 'team'].map(tab => (
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
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>TOTAL BUDGET</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>K {project.budget?.toLocaleString() ?? 0}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>ACTUAL COSTS TO DATE</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-rose)' }}>K {project.totalCost?.toLocaleString() ?? 0}</div>
              <HealthBar current={project.totalCost} total={project.budget} />
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>REMAINING BUDGET</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: budgetRemaining < 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                K {budgetRemaining?.toLocaleString() ?? 0}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Spend vs. Budget Tracking</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Start', Budget: 0, Actual: 0 },
                  { name: '25%', Budget: (project.budget || 0) * 0.25, Actual: (project.totalCost || 0) * 0.1 },
                  { name: '50%', Budget: (project.budget || 0) * 0.50, Actual: (project.totalCost || 0) * 0.35 },
                  { name: '75%', Budget: (project.budget || 0) * 0.75, Actual: (project.totalCost || 0) * 0.8 },
                  { name: 'Today', Budget: project.budget || 0, Actual: project.totalCost || 0 },
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-rose)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-rose)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `K${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-popover)', border: '1px solid var(--border-subtle)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(val: number) => [`K ${val.toLocaleString()}`, undefined]}
                  />
                  <Area type="monotone" dataKey="Budget" stroke="var(--accent-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorBudget)" />
                  <Area type="monotone" dataKey="Actual" stroke="var(--accent-rose)" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
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
                  {t.assignedToName && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}><Users size={12} style={{ display: 'inline', marginRight: 4 }}/>{t.assignedToName}</div>}
                </div>
              ))}
            </div>

            {/* In Progress */}
            <div style={{ flex: 1, minWidth: 280, background: 'var(--bg-app)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>IN PROGRESS ({inProgressTasks.length})</div>
              {inProgressTasks.map((t: any) => (
                <div key={t.id} className="card-elevated" style={{ padding: 16, marginBottom: 12, borderLeft: '3px solid var(--accent-blue)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>{t.title}</div>
                  {t.assignedToName && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}><Users size={12} style={{ display: 'inline', marginRight: 4 }}/>{t.assignedToName}</div>}
                </div>
              ))}
            </div>

            {/* Done */}
            <div style={{ flex: 1, minWidth: 280, background: 'var(--bg-app)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>DONE ({doneTasks.length})</div>
              {doneTasks.map((t: any) => (
                <div key={t.id} className="card-elevated" style={{ padding: 16, marginBottom: 12, opacity: 0.7 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8, textDecoration: 'line-through' }}>{t.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'operations' && (
        <div className="card-elevated" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Operation Ref</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Rolled-up Cost</th>
              </tr>
            </thead>
            <tbody>
              {project.jobCards?.map((j: any) => (
                <tr key={`j-${j.id}`}>
                  <td>{j.jobNumber}</td>
                  <td><span className="badge badge-gray"><Wrench size={12} style={{ marginRight: 4 }}/> Job Card</span></td>
                  <td>{j.status}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>K {j.totalCost?.toLocaleString() ?? 0}</td>
                </tr>
              ))}
              {project.shiftLogs?.map((s: any) => (
                <tr key={`s-${s.id}`}>
                  <td>{s.logNumber}</td>
                  <td><span className="badge badge-gray"><Hash size={12} style={{ marginRight: 4 }}/> Shift Log</span></td>
                  <td>{s.status}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>K {s.totalCost?.toLocaleString() ?? 0}</td>
                </tr>
              ))}
              {(project.jobCards?.length === 0 && project.shiftLogs?.length === 0) && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No operational documents linked to this project yet.</td></tr>
              )}
            </tbody>
          </table>
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
          <div className="form-field">
            <label className="form-label">Estimated Hours</label>
            <input className="form-input" type="number" step="0.5" value={taskForm.estimatedHours} onChange={e => setTaskForm({...taskForm, estimatedHours: e.target.value})} />
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
              {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>)}
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
    </div>
  );
}

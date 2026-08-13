'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hash, Building2, Calendar } from 'lucide-react';

export default function MyTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app, this would fetch tasks specifically assigned to the logged in user.
  // For this demo, we'll fetch all projects and extract tasks.
  useEffect(() => {
    loadMyTasks();
  }, []);

  const loadMyTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projecttasks/my', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('anchor_auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Project Tasks</h1>
        <p className="page-subtitle">View and update your assignments across all active projects</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Loading your tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="card-elevated" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Hash size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>No Tasks Assigned</h3>
          <p>You currently don't have any tasks assigned to you in any projects.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {tasks.map((t: any) => (
            <div key={t.id} className="card-elevated" style={{ borderLeft: t.status === 'Done' ? '4px solid var(--accent-emerald)' : t.status === 'InProgress' ? '4px solid var(--accent-blue)' : '4px solid var(--accent-amber)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="badge badge-gray">{t.projectName}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.status === 'Done' ? 'var(--accent-emerald)' : 'var(--text-tertiary)' }}>{t.status}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{t.title}</h3>
              {t.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{t.description}</p>}
              
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-tertiary)', marginTop: 'auto' }}>
                {t.dueDate && <div><Calendar size={12} style={{ display: 'inline', marginRight: 4 }}/> Due {new Date(t.dueDate).toLocaleDateString()}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

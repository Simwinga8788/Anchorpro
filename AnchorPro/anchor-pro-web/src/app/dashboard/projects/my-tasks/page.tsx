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
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const projects = await res.json();
        // Since /api/projects doesn't return tasks by default, we would normally use a /api/projecttasks/my endpoint.
        // For the sake of the prototype, we assume the backend provides it, or we just show a placeholder.
        setTasks([]); 
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

      <div className="card-elevated" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Hash size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>No Tasks Assigned</h3>
        <p>You currently don't have any tasks assigned to you in any projects.</p>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { shiftPlansApi } from '@/lib/api';
import { useDictionary } from '@/lib/DictionaryContext';
import { Plus, Search, Calendar, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
export default function ShiftPlanningPage() {
  const router = useRouter();
  const { t } = useDictionary();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPlans = async () => {
    try {
      const data = await shiftPlansApi.getAll();
      setPlans(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleGenerateActuals = async (id: number) => {
    if (!confirm('Generate actuals for this Shift Plan? This will create a Draft Shift Production Log.')) return;
    try {
      const res = await shiftPlansApi.generateActuals(id);
      router.push(`/dashboard/shift-logs/${res.id}/edit`);
    } catch (e: any) {
      alert(e.message || 'Failed to generate actuals');
    }
  };

  const getShiftName = (s: number) => {
    if (s === 0) return 'Day Shift';
    if (s === 1) return 'Night Shift';
    if (s === 2) return 'Afternoon Shift';
    return 'Unknown';
  };

  const getStatusBadge = (s: number) => {
    if (s === 0) return <span className="badge badge-warning">Draft</span>;
    if (s === 1) return <span className="badge badge-primary">Active</span>;
    if (s === 2) return <span className="badge badge-success">Completed</span>;
    return null;
  };

  const filtered = plans.filter(p => p.notes?.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search));

  return (
    <div className="animate-in" style={{ padding: '0 0' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('ShiftPlanning', 'Shift Planning')}</h1>
          <p className="page-subtitle">Schedule fleet, operators, and targets for upcoming {t('Shift', 'shifts')}.</p>
        </div>
        <div className="page-actions">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search plans..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link href="/dashboard/shift-planning/new" className="btn btn-primary">
            <Plus size={18} /> New {t('ShiftPlanning', 'Shift Plan')}
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No shift plans found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>{t('Shift', 'Shift')}</th>
                <th>Captain & Boss</th>
                <th>Tasks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>#{p.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} className="text-muted" />
                      {format(new Date(p.planDate), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td>{getShiftName(p.shift)}</td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.mineCaptain?.firstName} {p.mineCaptain?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.shiftBoss?.firstName} {p.shiftBoss?.lastName}</div>
                  </td>
                  <td>{p.tasks?.length || 0} tasks</td>
                  <td>{getStatusBadge(p.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/dashboard/shift-planning/${p.id}`)}>
                        View
                      </button>
                      {p.status === 0 && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleGenerateActuals(p.id)} title="Execute Shift (Generate Actuals)">
                          <PlayCircle size={14} /> Execute
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Play, CheckCircle2, Search, Filter, MoreHorizontal, Pause } from 'lucide-react';
import { dashboardApi } from '@/lib/api';

export default function DowntimePage() {
  const [downtime, setDowntime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDowntime = () => {
    setLoading(true);
    dashboardApi.getAllDowntime()
      .then(data => setDowntime(data || []))
      .catch(err => console.error("Failed to fetch downtime", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDowntime();
  }, []);

  const filtered = downtime.filter(d => 
    d.equipment?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const activeDowntime = downtime.filter(d => !d.endTime);
  const totalDuration = downtime.reduce((acc, current) => acc + (current.durationMinutes || 0), 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Downtime & Reliability</h1>
          <p className="page-subtitle">Historical log of equipment breakdowns and lost production time.</p>
        </div>
        <button className="btn btn-primary">
          <AlertTriangle size={14} /> Report Breakdown
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Active Breakdowns', value: activeDowntime.length, color: 'var(--accent-rose)', icon: <Pause size={16}/> },
          { label: 'Total Downtime',    value: `${Math.round(totalDuration / 60)} hrs`, color: 'var(--accent-amber)', icon: <Clock size={16}/> },
          { label: 'Reliability Score', value: '94%', color: 'var(--accent-emerald)', icon: <CheckCircle2 size={16}/> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div className="stat-icon" style={{ background: s.color + '20', marginBottom: 0 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
              <div className="stat-label" style={{ margin: 0 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="search-input" 
              style={{ width: '100%', paddingLeft: 30 }} 
              placeholder="Search by equipment or notes..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Category</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Notes</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0' }}>Loading downtime records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No records found</td></tr>
            ) : filtered.map(item => {
              const isActive = !item.endTime;
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.equipment?.name || 'Unknown Asset'}</td>
                  <td><span className="badge badge-muted">{item.category?.name || 'General'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{new Date(item.startTime).toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {isActive ? 'Ongoing' : `${item.durationMinutes} min`}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.notes || '—'}
                  </td>
                  <td>
                    {isActive ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge badge-rose"><Play size={10} style={{ transform: 'rotate(90deg)' }}/> Live Breakdown</span>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: 10 }} onClick={async () => {
                          try {
                            const updated = { ...item, endTime: new Date().toISOString() };
                            // Calculate duration in minutes if needed, though backend likely handles it
                            await dashboardApi.updateDowntime(item.id, updated);
                            fetchDowntime(); // reload
                          } catch(err: any) { alert("Error ending downtime: " + err.message); }
                        }}>End Now</button>
                      </div>
                    ) : (
                      <span className="badge badge-green">Resolved</span>
                    )}
                  </td>
                  <td><button className="btn btn-ghost btn-sm" style={{ padding: 4 }}><MoreHorizontal size={14}/></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

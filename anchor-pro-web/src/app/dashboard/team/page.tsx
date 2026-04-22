'use client';

import { Users, Plus, CheckCircle2, Clock, MoreHorizontal, Star, Hash } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getTechnicians()
      .then(data => setTeam(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Team Registry</h1>
          <p className="page-subtitle">{loading ? 'Loading...' : `${team.length} authenticated users documented in the platform`}</p>
        </div>
        <button className="btn btn-primary"><Plus size={14}/> Invite Member</button>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading team members...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 14 }}>
          {team.map(member => {
            const displayName = member.firstName ? `${member.firstName} ${member.lastName || ''}` : member.userName;
            const initials = member.firstName ? member.firstName[0]?.toUpperCase() : member.userName?.[0]?.toUpperCase();
            const manNumber = member.employeeNumber || 'UNASSIGNED';
            
            return (
              <div key={member.id} className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar" style={{ width: 44, height: 44, fontSize: 15, background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{displayName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{member.roles?.[0] || 'Technician'}</div>
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4 }}><MoreHorizontal size={14}/></button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, marginBottom: 16 }}>
                    <Hash size={13} style={{ color: 'var(--accent-blue)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>MAN NO: {manNumber}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    <span className="badge badge-muted">Field Ops</span>
                    <span className={`badge badge-green`}>
                      <span className={`status-dot green`} />
                      In Good Standing
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Total Jobs', value: member.completedJobsCount || '—', icon: <CheckCircle2 size={11}/> },
                      { label: 'Hours',      value: member.totalHours || '—', icon: <Clock size={11}/> },
                      { label: 'Rating',     value: member.rating || '5.0', icon: <Star size={11}/> },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                        padding: '10px 8px', textAlign: 'center',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)', marginBottom: 4 }}>
                          {s.icon}
                          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

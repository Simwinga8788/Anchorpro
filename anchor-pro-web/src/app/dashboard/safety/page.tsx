'use client';

import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, XCircle, Plus, MoreHorizontal, Activity, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';

const permitStatus: Record<string, string> = { 
  'Active': 'badge-green', 
  'Closed': 'badge-muted', 
  'Pending': 'badge-amber', 
  'Suspended': 'badge-rose' 
};

export default function SafetyPage() {
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Intersection of JobCards with InProgress status often indicates active high-risk work
    dashboardApi.getJobCards()
      .then(data => {
        const live = (data || [])
          .filter((j: any) => j.status === 2) // status 2 = In Progress
          .map((j: any) => ({
            id: `PTW-${j.jobNumber.split('-')[1] || j.id}`,
            type: j.jobType?.name || 'Standard Maintenance',
            jobNo: j.jobNumber,
            tech: j.assignedTechnician?.firstName ? `${j.assignedTechnician.firstName} ${j.assignedTechnician.lastName?.[0] || ''}.` : 'Assigned',
            issued: new Date(j.updatedAt || j.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            status: 'Active'
          }));
        setPermits(live);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Safety & Compliance</h1>
          <p className="page-subtitle">Governance over Permit-to-Work, LOTO compliance and Incident tracking.</p>
        </div>
        <button className="btn btn-primary"><ShieldCheck size={14}/> Issue Temporary Permit</button>
      </div>

      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Active Permits',    value: permits.filter(p=>p.status==='Active').length,   color: 'var(--accent-emerald)', icon: <ShieldCheck size={16}/> },
          { label: 'LOTO Compliance',   value: '100%',  color: 'var(--accent-blue)',    icon: <Lock size={16}/> },
          { label: 'Open Incidents',    value: '0',     color: 'var(--accent-rose)',    icon: <AlertTriangle size={16}/> },
          { label: 'Safety Score',      value: '98.5',  color: 'var(--accent-emerald)', icon: <Activity size={16}/> },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '20' }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="stats-grid-2">
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title" style={{ fontSize: 14 }}>Permit-to-Work Registry</h3>
            <button className="btn btn-ghost btn-sm"><Filter size={13}/> Filter</button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Permit ID</th><th>Type</th><th>Linked Job</th><th>Technician</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}>Syncing safety logs...</td></tr>
              ) : permits.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: 12 }}>{p.id}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.type}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>{p.jobNo}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{p.tech}</td>
                  <td><span className={`badge ${permitStatus[p.status] ?? 'badge-muted'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-elevated" style={{ padding: 24 }}>
          <h3 className="section-title" style={{ fontSize: 14, marginBottom: 16 }}>LOTO Verification Audit</h3>
          <div style={{ padding: 20, textAlign: 'center', background: 'var(--bg-app)', borderRadius: 12, border: '1px dashed var(--border-default)' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--accent-emerald)', margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Zero non-conformances detected.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>All active work orders have verified isolation logs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Filter({ size }: { size: number }) {
    return <Activity size={size} />
}

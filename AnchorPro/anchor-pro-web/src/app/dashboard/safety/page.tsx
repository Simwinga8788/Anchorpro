'use client';

import { ShieldCheck, CheckCircle2, AlertTriangle, Lock, Activity, Plus, XCircle, PauseCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { safetyApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

const permitStatusMap: Record<number, { label: string; badge: string }> = {
  0: { label: 'Active', badge: 'badge-green' },
  1: { label: 'Suspended', badge: 'badge-rose' },
  2: { label: 'Closed', badge: 'badge-muted' },
};

export default function SafetyPage() {
  const [permits, setPermits] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    jobCardId: '', authorizedBy: '', workScope: '', hazardsIdentified: '', controlMeasures: '',
    isIsolated: false, isLotoApplied: false, isAreaSecure: false, isPpeChecked: false, toolboxTalkCompleted: false,
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([safetyApi.getPermits(), safetyApi.getDashboard()])
      .then(([p, s]) => { setPermits(p || []); setStats(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await safetyApi.createPermit({
        ...form,
        jobCardId: parseInt(form.jobCardId),
      });
      setShowCreate(false);
      setForm({ jobCardId: '', authorizedBy: '', workScope: '', hazardsIdentified: '', controlMeasures: '', isIsolated: false, isLotoApplied: false, isAreaSecure: false, isPpeChecked: false, toolboxTalkCompleted: false });
      loadData();
    } catch (err: any) {
      alert('Error creating permit: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async (id: number) => {
    const notes = prompt('Reason for suspension:');
    if (notes === null) return;
    try {
      await safetyApi.updatePermitStatus(id, 1, notes); // 1 = Suspended
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleReactivate = async (id: number) => {
    try {
      await safetyApi.updatePermitStatus(id, 0, 'Reactivated'); // 0 = Active
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleClose = async (id: number) => {
    const notes = prompt('Closure notes:');
    if (notes === null) return;
    try {
      await safetyApi.updatePermitStatus(id, 2, notes); // 2 = Closed
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div>
      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="Issue Permit to Work" subtitle="Safety clearance for high-risk operations.">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Job Card ID</label>
            <input className="form-input" required type="number" placeholder="e.g. 1" value={form.jobCardId} onChange={e => setForm({...form, jobCardId: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Authorized By</label>
            <input className="form-input" required placeholder="Supervisor name" value={form.authorizedBy} onChange={e => setForm({...form, authorizedBy: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Work Scope</label>
            <input className="form-input" placeholder="Brief description of work" value={form.workScope} onChange={e => setForm({...form, workScope: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Hazards Identified</label>
            <textarea className="form-textarea" placeholder="List potential hazards" value={form.hazardsIdentified} onChange={e => setForm({...form, hazardsIdentified: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Control Measures</label>
            <textarea className="form-textarea" placeholder="Mitigation steps" value={form.controlMeasures} onChange={e => setForm({...form, controlMeasures: e.target.value})} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' }}>
            <label className="form-label" style={{ marginBottom: 4 }}>Safety Checks</label>
            {[
              { key: 'isIsolated', label: 'Equipment Isolated' },
              { key: 'isLotoApplied', label: 'LOTO Applied' },
              { key: 'isAreaSecure', label: 'Area Secured' },
              { key: 'isPpeChecked', label: 'PPE Verified' },
              { key: 'toolboxTalkCompleted', label: 'Toolbox Talk Done' },
            ].map(check => (
              <label key={check.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={(form as any)[check.key]} onChange={e => setForm({...form, [check.key]: e.target.checked})} style={{ transform: 'scale(1.1)' }} />
                {check.label}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Issuing...' : 'Issue Permit'}</button>
          </div>
        </form>
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Safety & Compliance</h1>
          <p className="page-subtitle">Governance over Permit-to-Work, LOTO compliance and Incident tracking.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><ShieldCheck size={14}/> Issue Permit</button>
      </div>

      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Active Permits', value: stats?.activePermits ?? 0, color: 'var(--accent-emerald)', icon: <ShieldCheck size={16}/> },
          { label: 'LOTO Applied', value: stats?.lotoApplied ?? 0, color: 'var(--accent-blue)', icon: <Lock size={16}/> },
          { label: 'Suspended', value: stats?.suspendedPermits ?? 0, color: 'var(--accent-rose)', icon: <AlertTriangle size={16}/> },
          { label: 'Compliance', value: `${stats?.compliancePercent?.toFixed(0) ?? 100}%`, color: 'var(--accent-emerald)', icon: <Activity size={16}/> },
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

      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="section-title" style={{ fontSize: 14 }}>Permit-to-Work Registry</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Work Scope</th><th>Authorized By</th><th>Issued</th><th>LOTO</th><th>PPE</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0' }}>Loading safety records...</td></tr>
            ) : permits.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No permits issued yet. Click "Issue Permit" to create one.</td></tr>
            ) : permits.map(p => {
              const statusInfo = permitStatusMap[p.status] || { label: 'Unknown', badge: 'badge-muted' };
              return (
                <tr key={p.id}>
                  <td style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: 12 }}>PTW-{p.id}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.workScope || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{p.authorizedBy}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(p.authorizedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</td>
                  <td>{p.isLotoApplied ? <CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)' }} /> : <XCircle size={14} style={{ color: 'var(--accent-rose)' }} />}</td>
                  <td>{p.isPpeChecked ? <CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)' }} /> : <XCircle size={14} style={{ color: 'var(--accent-rose)' }} />}</td>
                  <td><span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {p.status === 0 && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
                            title="Suspend Permit"
                            onClick={() => handleSuspend(p.id)}
                          >
                            <PauseCircle size={12} /> Suspend
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleClose(p.id)}>Close</button>
                        </>
                      )}
                      {p.status === 1 && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)' }}
                            onClick={() => handleReactivate(p.id)}
                          >
                            <ShieldCheck size={12} /> Reactivate
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleClose(p.id)}>Close</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

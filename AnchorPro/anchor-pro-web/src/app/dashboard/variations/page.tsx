'use client';

import { useState, useEffect } from 'react';
import { 
  Layers, Plus, FileText, CheckCircle2, Clock, 
  AlertCircle, DollarSign, ArrowUpRight, Search
} from 'lucide-react';
import { projectsApi } from '@/lib/api';
import Modal from '@/components/Modal';

interface VariationItem {
  id: number;
  variationNumber: string;
  siteInstructionRef: string;
  title: string;
  description: string;
  amount: number;
  timeExtensionDays: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Under Review';
  requestedDate: string;
}

const DEFAULT_VARIATIONS: VariationItem[] = [
  { id: 1, variationNumber: 'VO-001', siteInstructionRef: 'SI-04', title: 'Additional Subsurface Excavation for Soft Spots', description: 'Excavation of unexpected soft clay strata under Grid B4-B8 and backfilling with selected G5 rockfill.', amount: 4850.00, timeExtensionDays: 3, status: 'Approved', requestedDate: '2026-08-15' },
  { id: 2, variationNumber: 'VO-002', siteInstructionRef: 'SI-07', title: 'Upgrade Foundation Rebar from Y16 to Y20', description: 'Structural engineer revision to column base reinforcement mat due to revised load calculations.', amount: 3200.00, timeExtensionDays: 0, status: 'Approved', requestedDate: '2026-08-20' },
  { id: 3, variationNumber: 'VO-003', siteInstructionRef: 'SI-09', title: 'Relocation of Existing Underground Stormwater Line', description: 'Discovery of unchartered 450mm concrete stormwater culvert requiring redirection around parking structure.', amount: 8900.00, timeExtensionDays: 5, status: 'Under Review', requestedDate: '2026-08-24' }
];

export default function VariationsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [variations, setVariations] = useState<VariationItem[]>(DEFAULT_VARIATIONS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVo, setNewVo] = useState<Partial<VariationItem>>({
    siteInstructionRef: '',
    title: '',
    description: '',
    amount: 0,
    timeExtensionDays: 0,
    status: 'Pending'
  });

  useEffect(() => {
    projectsApi.getProjects()
      .then((res: any) => {
        const list = res.data ?? res;
        setProjects(list);
        if (list.length > 0 && !selectedProjectId) {
          setSelectedProjectId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const totalApproved = variations
    .filter(v => v.status === 'Approved')
    .reduce((acc, v) => acc + v.amount, 0);

  const totalPending = variations
    .filter(v => v.status !== 'Approved' && v.status !== 'Rejected')
    .reduce((acc, v) => acc + v.amount, 0);

  const handleAddVo = () => {
    if (!newVo.title || !newVo.amount) return;
    const item: VariationItem = {
      id: variations.length + 1,
      variationNumber: `VO-00${variations.length + 1}`,
      siteInstructionRef: newVo.siteInstructionRef || 'SI-Pending',
      title: newVo.title,
      description: newVo.description || '',
      amount: Number(newVo.amount),
      timeExtensionDays: Number(newVo.timeExtensionDays) || 0,
      status: (newVo.status as any) || 'Pending',
      requestedDate: new Date().toISOString().split('T')[0]
    };
    setVariations([...variations, item]);
    setShowAddModal(false);
    setNewVo({ siteInstructionRef: '', title: '', description: '', amount: 0, timeExtensionDays: 0, status: 'Pending' });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={26} style={{ color: '#3b82f6' }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary, #fff)' }}>
              Variations, Claims & Site Instructions
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted, #94a3b8)' }}>
            Log site instructions (SI), variation orders (VO), and track cost & time claims under JBCC / FIDIC.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {projects.length > 0 && (
            <select
              className="input-field"
              style={{ width: 260, background: '#1e293b' }}
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Log Variation Order (VO)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Approved Variations</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#10b981', marginTop: 4 }}>${totalApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>Added to Contract Sum</div>
        </div>

        <div className="card" style={{ padding: 18, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Pending Claims</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>Awaiting Engineer Determination</div>
        </div>

        <div className="card" style={{ padding: 18, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Approved Time Extensions (EOT)</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>
            {variations.reduce((acc, v) => acc + (v.status === 'Approved' ? v.timeExtensionDays : 0), 0)} Days
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Revised Practical Completion Date</div>
        </div>
      </div>

      {/* Variations Table */}
      <div className="card" style={{ padding: 20, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: '#fff' }}>Variation Orders Register</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>VO #</th>
                <th style={{ padding: '10px 14px' }}>SI Ref</th>
                <th style={{ padding: '10px 14px' }}>Title & Description</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Claimed Value</th>
                <th style={{ padding: '10px 14px' }}>EOT (Days)</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#3b82f6' }}>{v.variationNumber}</td>
                  <td style={{ padding: '12px 14px', color: '#f59e0b', fontWeight: 600 }}>{v.siteInstructionRef}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{v.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{v.description}</div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#fff' }}>
                    ${v.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>+{v.timeExtensionDays} days</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 11.5, fontWeight: 600,
                      background: v.status === 'Approved' ? 'rgba(16,185,129,0.15)' : v.status === 'Under Review' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: v.status === 'Approved' ? '#10b981' : v.status === 'Under Review' ? '#f59e0b' : '#ef4444'
                    }}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add VO Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Log Variation Order / Claim">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Site Instruction #</label>
              <input className="input-field" placeholder="e.g. SI-12" value={newVo.siteInstructionRef} onChange={e => setNewVo({ ...newVo, siteInstructionRef: e.target.value })} />
            </div>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Claimed Amount ($) *</label>
              <input className="input-field" type="number" placeholder="5000.00" value={newVo.amount || ''} onChange={e => setNewVo({ ...newVo, amount: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Variation Title *</label>
            <input className="input-field" placeholder="e.g. Additional Earthworks" value={newVo.title} onChange={e => setNewVo({ ...newVo, title: e.target.value })} />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description & Scope Change</label>
            <textarea className="input-field" rows={3} placeholder="Detailed justification and measured impact..." value={newVo.description} onChange={e => setNewVo({ ...newVo, description: e.target.value })} />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Extension of Time (EOT Days)</label>
            <input className="input-field" type="number" placeholder="0" value={newVo.timeExtensionDays || ''} onChange={e => setNewVo({ ...newVo, timeExtensionDays: parseInt(e.target.value) || 0 })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddVo}>Submit Claim</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

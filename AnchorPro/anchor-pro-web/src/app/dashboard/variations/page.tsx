'use client';

import { useState, useEffect } from 'react';
import { 
  Layers, Plus, FileText, CheckCircle2, Clock, 
  AlertCircle, DollarSign, ArrowUpRight, Search, Loader2
} from 'lucide-react';
import { projectsApi, variationsApi } from '@/lib/api';
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

export default function VariationsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [variations, setVariations] = useState<VariationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const loadVariations = async (projId: number) => {
    setLoading(true);
    try {
      const data = await variationsApi.getByProject(projId);
      setVariations(data || []);
    } catch {
      setVariations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadVariations(selectedProjectId);
    }
  }, [selectedProjectId]);

  const totalApproved = variations
    .filter(v => v.status === 'Approved')
    .reduce((acc, v) => acc + (Number(v.amount) || 0), 0);

  const totalPending = variations
    .filter(v => v.status !== 'Approved' && v.status !== 'Rejected')
    .reduce((acc, v) => acc + (Number(v.amount) || 0), 0);

  const handleAddVo = async () => {
    if (!newVo.title || !newVo.amount || !selectedProjectId) return;
    setSubmitting(true);
    try {
      await variationsApi.create({
        projectId: selectedProjectId,
        siteInstructionRef: newVo.siteInstructionRef || 'SI-Pending',
        title: newVo.title,
        description: newVo.description || '',
        amount: Number(newVo.amount),
        timeExtensionDays: Number(newVo.timeExtensionDays) || 0,
        status: newVo.status || 'Pending'
      });
      setShowAddModal(false);
      setNewVo({ siteInstructionRef: '', title: '', description: '', amount: 0, timeExtensionDays: 0, status: 'Pending' });
      await loadVariations(selectedProjectId);
    } catch (e: any) {
      alert('Failed to save variation: ' + (e.message || 'Error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={24} style={{ color: 'var(--accent-blue)' }} />
            <h1 className="topbar-title" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              Variations, Claims & Site Instructions
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Log site instructions (SI), variation orders (VO), and track cost & time claims under JBCC / FIDIC.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {projects.length > 0 && (
            <select
              className="form-select"
              style={{ width: 240 }}
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ gap: 6 }}>
            <Plus size={15} /> Log Variation Order (VO)
          </button>
        </div>
      </div>

      {/* KPI Cards (Stat Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Approved Variations
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-emerald)', marginTop: 4, fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
            ${totalApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--accent-emerald)', marginTop: 2 }}>Added to Contract Sum</div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Pending Claims
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-amber)', marginTop: 4, fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
            ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--accent-amber)', marginTop: 2 }}>Awaiting Engineer Determination</div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Approved Time Extensions (EOT)
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 4, fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
            {variations.reduce((acc, v) => acc + (v.status === 'Approved' ? (Number(v.timeExtensionDays) || 0) : 0), 0)} Days
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Revised Practical Completion Date</div>
        </div>
      </div>

      {/* Variations Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Variation Orders Register</h3>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{variations.length} records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              Loading variations from database…
            </div>
          ) : variations.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No variations or site instructions logged for this project yet. Click &quot;Log Variation Order&quot; above.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-hover)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>VO #</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>SI Ref</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Title & Description</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>Claimed Value</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>EOT (Days)</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {variations.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--accent-blue)' }}>{v.variationNumber}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent-amber)', fontWeight: 600 }}>{v.siteInstructionRef}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{v.description}</div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
                      ${Number(v.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>+{v.timeExtensionDays || 0} days</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={v.status === 'Approved' ? 'badge badge-green' : v.status === 'Under Review' ? 'badge badge-amber' : 'badge badge-rose'}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add VO Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Log Variation Order / Claim">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Site Instruction #</label>
              <input className="form-input" placeholder="e.g. SI-12" value={newVo.siteInstructionRef} onChange={e => setNewVo({ ...newVo, siteInstructionRef: e.target.value })} />
            </div>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Claimed Amount ($) *</label>
              <input className="form-input" type="number" placeholder="5000.00" value={newVo.amount || ''} onChange={e => setNewVo({ ...newVo, amount: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Variation Title *</label>
            <input className="form-input" placeholder="e.g. Additional Earthworks" value={newVo.title} onChange={e => setNewVo({ ...newVo, title: e.target.value })} />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description & Scope Change</label>
            <textarea className="form-input" rows={3} placeholder="Detailed justification and measured impact..." value={newVo.description} onChange={e => setNewVo({ ...newVo, description: e.target.value })} />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Extension of Time (EOT Days)</label>
            <input className="form-input" type="number" placeholder="0" value={newVo.timeExtensionDays || ''} onChange={e => setNewVo({ ...newVo, timeExtensionDays: parseInt(e.target.value) || 0 })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddVo} disabled={submitting}>
              {submitting ? 'Saving to Database…' : 'Submit Claim'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

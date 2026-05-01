'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ListChecks, Package, Calendar, Users, Briefcase, DollarSign, Info, Wrench } from 'lucide-react';
import { dashboardApi } from '@/lib/api';

interface JobCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function JobCardForm({ onSuccess, onCancel }: JobCardFormProps) {
  const [loading, setLoading] = useState(false);
  const [refData, setRefData] = useState<{
    equipment: any[];
    jobTypes: any[];
    customers: any[];
    contracts: any[];
    technicians: any[];
  }>({
    equipment: [],
    jobTypes: [],
    customers: [],
    contracts: [],
    technicians: [],
  });

  const [formData, setFormData] = useState({
    jobNumber: `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    description: '',
    equipmentId: '',
    jobTypeId: '',
    customerId: '',
    contractId: '',
    status: 0,
    priority: 1,
    scheduledStartDate: '',
    scheduledEndDate: '',
    assignedTechnicianId: '',      // primary assignee
    additionalTechnicianIds: [] as string[], // co-assignees
    subcontractingCost: '',
    subcontractorName: '',
    jobTasks: [] as any[],
    jobCardParts: [] as any[],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eq, jt, cust, cont, tech] = await Promise.all([
          dashboardApi.getEquipment(),
          dashboardApi.getJobTypes(),
          dashboardApi.getCustomers(),
          dashboardApi.getContracts(),
          dashboardApi.getReferenceDataTechnicians(),
        ]);
        setRefData({ equipment: eq, jobTypes: jt, customers: cust, contracts: cont, technicians: tech });
      } catch (err) {
        console.error('Failed to load ref data', err);
      }
    };
    loadData();
  }, []);

  const techName = (t: any) =>
    [t.firstName, t.lastName].filter(Boolean).join(' ') || t.email || t.userName || 'Unknown';

  const toggleAdditional = (id: string) => {
    setFormData(prev => ({
      ...prev,
      additionalTechnicianIds: prev.additionalTechnicianIds.includes(id)
        ? prev.additionalTechnicianIds.filter(x => x !== id)
        : [...prev.additionalTechnicianIds, id],
    }));
  };

  const handleAddTask = () =>
    setFormData(prev => ({
      ...prev,
      jobTasks: [...prev.jobTasks, { name: '', instructions: '', estimatedDurationMinutes: 30, sequence: prev.jobTasks.length }],
    }));

  const removeTask = (i: number) =>
    setFormData(prev => ({ ...prev, jobTasks: prev.jobTasks.filter((_, idx) => idx !== i) }));

  const updateTask = (i: number, field: string, value: any) =>
    setFormData(prev => {
      const t = [...prev.jobTasks];
      t[i] = { ...t[i], [field]: value };
      return { ...prev, jobTasks: t };
    });

  const handleAddPart = () =>
    setFormData(prev => ({
      ...prev,
      jobCardParts: [...prev.jobCardParts, { inventoryItemId: '', quantity: 1, unitCost: 0 }],
    }));

  const removePart = (i: number) =>
    setFormData(prev => ({ ...prev, jobCardParts: prev.jobCardParts.filter((_, idx) => idx !== i) }));

  const updatePart = (i: number, field: string, value: any) =>
    setFormData(prev => {
      const p = [...prev.jobCardParts];
      p[i] = { ...p[i], [field]: value };
      return { ...prev, jobCardParts: p };
    });

  // Estimated parts cost from form inputs
  const estPartsCost = formData.jobCardParts.reduce((sum, p) => sum + (p.quantity || 0) * (p.unitCost || 0), 0);
  const estSubcon = parseFloat(formData.subcontractingCost || '0') || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.equipmentId || !formData.jobTypeId || !formData.description) {
        alert('Please fill in Asset, Job Type and Description');
        setLoading(false);
        return;
      }

      await dashboardApi.createJobCard({
        jobNumber: formData.jobNumber,
        description: formData.description,
        equipmentId: parseInt(formData.equipmentId),
        jobTypeId: parseInt(formData.jobTypeId),
        customerId: formData.customerId ? parseInt(formData.customerId) : null,
        contractId: formData.contractId ? parseInt(formData.contractId) : null,
        status: formData.status,
        priority: formData.priority,
        scheduledStartDate: formData.scheduledStartDate || null,
        scheduledEndDate: formData.scheduledEndDate || null,
        assignedTechnicianId: formData.assignedTechnicianId || null,
        additionalTechnicianIds: formData.additionalTechnicianIds,
        subcontractingCost: estSubcon,
        jobTasks: formData.jobTasks,
        jobCardParts: formData.jobCardParts,
      });
      onSuccess();
    } catch (err) {
      console.error('Error creating job card', err);
      alert('Failed to create job card. Check console.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Section header helper ──────────────────────────────────
  const SectionHeader = ({ icon, label, color = 'var(--accent-blue)' }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ color }}>{icon}</div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Core Info ─────────────────────────────── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <SectionHeader icon={<Briefcase size={14} />} label="Core Information" />

        <div className="form-field">
          <label className="form-label">Description *</label>
          <textarea
            className="form-textarea"
            placeholder="What needs to be done?"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <div className="form-field">
            <label className="form-label">Asset *</label>
            <select className="form-select" value={formData.equipmentId}
              onChange={e => setFormData({ ...formData, equipmentId: e.target.value })} required>
              <option value="">Select Asset...</option>
              {refData.equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            {refData.equipment.length === 0 && <p style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 4 }}>No assets found — add assets in the Assets module first.</p>}
          </div>
          <div className="form-field">
            <label className="form-label">Job Type *</label>
            <select className="form-select" value={formData.jobTypeId}
              onChange={e => setFormData({ ...formData, jobTypeId: e.target.value })} required>
              <option value="">Select Type...</option>
              {refData.jobTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {refData.jobTypes.length === 0 && <p style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 4 }}>No job types — add them in Settings → Reference Data.</p>}
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <div className="form-field">
            <label className="form-label">Priority</label>
            <select className="form-select" value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}>
              <option value={0}>Low</option>
              <option value={1}>Normal</option>
              <option value={2}>High</option>
              <option value={3}>Critical</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Customer <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
            <select className="form-select" value={formData.customerId}
              onChange={e => setFormData({ ...formData, customerId: e.target.value })}>
              <option value="">Internal / No Customer</option>
              {refData.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-field" style={{ marginTop: 12 }}>
          <label className="form-label">Contract <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional — links SLA & billing)</span></label>
          <select className="form-select" value={formData.contractId}
            onChange={e => setFormData({ ...formData, contractId: e.target.value })}>
            <option value="">No Contract</option>
            {refData.contracts.map(c => <option key={c.id} value={c.id}>{c.title || c.contractNumber}</option>)}
          </select>
        </div>
      </div>

      {/* ── Scheduling ─────────────────────────────── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <SectionHeader icon={<Calendar size={14} />} label="Scheduling" color="var(--accent-amber)" />
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Start Date</label>
            <input type="datetime-local" className="form-input" value={formData.scheduledStartDate}
              onChange={e => setFormData({ ...formData, scheduledStartDate: e.target.value })} />
          </div>
          <div className="form-field">
            <label className="form-label">Deadline</label>
            <input type="datetime-local" className="form-input" value={formData.scheduledEndDate}
              onChange={e => setFormData({ ...formData, scheduledEndDate: e.target.value })} />
          </div>
        </div>
      </div>

      {/* ── Team Assignment ─────────────────────────── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <SectionHeader icon={<Users size={14} />} label="Team Assignment" color="var(--accent-indigo)" />

        <div className="form-field">
          <label className="form-label">Lead Technician</label>
          <select className="form-select" value={formData.assignedTechnicianId}
            onChange={e => setFormData({ ...formData, assignedTechnicianId: e.target.value })}>
            <option value="">Unassigned</option>
            {refData.technicians.map(t => (
              <option key={t.id} value={t.id}>{techName(t)}</option>
            ))}
          </select>
          {refData.technicians.length === 0 && <p style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 4 }}>No team members found — invite members in the Team module.</p>}
        </div>

        {refData.technicians.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <label className="form-label">Additional Assignees <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(select all that apply)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {refData.technicians
                .filter(t => t.id !== formData.assignedTechnicianId)
                .map(t => {
                  const selected = formData.additionalTechnicianIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleAdditional(t.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        border: `1px solid ${selected ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                        background: selected ? 'rgba(59,130,246,0.12)' : 'transparent',
                        color: selected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {selected ? '✓ ' : ''}{techName(t)}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ── Subcontracting ─────────────────────────── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <SectionHeader icon={<Wrench size={14} />} label="Subcontracting" color="var(--accent-rose)" />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Use this when part of the job is outsourced to an external vendor or specialist.
        </p>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Subcontractor / Vendor Name <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
            <input className="form-input" placeholder="e.g. Cummins Zambia, Atlas Copco..."
              value={formData.subcontractorName}
              onChange={e => setFormData({ ...formData, subcontractorName: e.target.value })} />
          </div>
          <div className="form-field">
            <label className="form-label">Estimated Subcontracting Cost (ZMW)</label>
            <input type="number" className="form-input" placeholder="0.00" min="0" step="0.01"
              value={formData.subcontractingCost}
              onChange={e => setFormData({ ...formData, subcontractingCost: e.target.value })} />
          </div>
        </div>
      </div>

      {/* ── Job Tasks ─────────────────────────────── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListChecks size={14} style={{ color: 'var(--accent-emerald)' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Job Tasks / Checklist</span>
          </div>
          <button type="button" onClick={handleAddTask} className="btn btn-ghost btn-sm">
            <Plus size={14} /> Add Task
          </button>
        </div>

        {formData.jobTasks.length === 0 ? (
          <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            No tasks defined. Add tasks to give technicians a step-by-step checklist.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formData.jobTasks.map((task, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.03)',
                padding: 10, borderRadius: 6, border: '1px solid var(--border-subtle)', position: 'relative'
              }}>
                <button type="button" onClick={() => removeTask(idx)} style={{
                  position: 'absolute', top: 8, right: 8, color: 'var(--accent-rose)',
                  opacity: 0.6, cursor: 'pointer', background: 'none', border: 'none'
                }}>
                  <Trash2 size={12} />
                </button>
                <div className="form-field">
                  <input className="form-input" placeholder={`Task ${idx + 1} name...`}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', borderRadius: 0, paddingLeft: 0 }}
                    value={task.name} onChange={e => updateTask(idx, 'name', e.target.value)} />
                </div>
                <div className="form-row" style={{ marginTop: 8 }}>
                  <div className="form-field">
                    <input type="number" className="form-input" placeholder="Est. minutes"
                      value={task.estimatedDurationMinutes}
                      onChange={e => updateTask(idx, 'estimatedDurationMinutes', parseInt(e.target.value))} />
                  </div>
                  <div className="form-field">
                    <input className="form-input" placeholder="Special instructions..."
                      value={task.instructions || ''}
                      onChange={e => updateTask(idx, 'instructions', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Parts & Materials ─────────────────────── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={14} style={{ color: 'var(--accent-amber)' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Expected Parts & Inventory</span>
          </div>
          <button type="button" onClick={handleAddPart} className="btn btn-ghost btn-sm">
            <Plus size={14} /> Add Part
          </button>
        </div>

        {formData.jobCardParts.length === 0 ? (
          <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            No specific parts required. Add parts to pre-plan stock consumption.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formData.jobCardParts.map((part, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.03)',
                padding: 10, borderRadius: 6, border: '1px solid var(--border-subtle)',
                display: 'flex', gap: 10, alignItems: 'center'
              }}>
                <div style={{ flex: 2 }}>
                  <input className="form-input" placeholder="Part / item description"
                    value={part.inventoryItemId} onChange={e => updatePart(idx, 'inventoryItemId', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <input type="number" className="form-input" placeholder="Qty"
                    value={part.quantity} onChange={e => updatePart(idx, 'quantity', parseInt(e.target.value))} />
                </div>
                <div style={{ flex: 1 }}>
                  <input type="number" className="form-input" placeholder="Unit cost (ZMW)"
                    value={part.unitCost} onChange={e => updatePart(idx, 'unitCost', parseFloat(e.target.value))} />
                </div>
                <button type="button" onClick={() => removePart(idx)}
                  style={{ color: 'var(--accent-rose)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cost Trinity Preview ───────────────────── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <SectionHeader icon={<DollarSign size={14} />} label="Cost Trinity — Estimated Preview" color="var(--accent-indigo)" />
        
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px',
          background: 'rgba(99,102,241,0.08)', borderRadius: 6, marginBottom: 14,
          border: '1px solid rgba(99,102,241,0.2)'
        }}>
          <Info size={14} style={{ color: 'var(--accent-indigo)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            <strong>Labor Cost</strong> is auto-calculated from hours logged × technician rate.<br />
            <strong>Parts Cost</strong> is calculated from stock consumed during the job.<br />
            <strong>Subcontracting</strong> is the vendor cost you entered above.<br />
            These figures are updated in real-time as the job progresses.
          </p>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Labor Cost (auto)</label>
            <input className="form-input" disabled value="Calculated on completion" style={{ fontSize: 11, color: 'var(--text-muted)' }} />
          </div>
          <div className="form-field">
            <label className="form-label">Est. Parts Cost</label>
            <input className="form-input" disabled value={`ZMW ${estPartsCost.toLocaleString('en', { minimumFractionDigits: 2 })}`} />
          </div>
          <div className="form-field">
            <label className="form-label">Est. Subcontracting</label>
            <input className="form-input" disabled value={`ZMW ${estSubcon.toLocaleString('en', { minimumFractionDigits: 2 })}`} />
          </div>
          <div className="form-field">
            <label className="form-label">Est. Total Cost</label>
            <input className="form-input" disabled
              style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}
              value={`ZMW ${(estPartsCost + estSubcon).toLocaleString('en', { minimumFractionDigits: 2 })}`} />
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 10,
        position: 'sticky', bottom: -24, background: 'var(--bg-card)',
        padding: '16px 0', borderTop: '1px solid var(--border-subtle)'
      }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Job Card'}
        </button>
      </div>
    </form>
  );
}

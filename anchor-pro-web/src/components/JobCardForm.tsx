'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ListChecks, Package, Calendar, User, Building, Briefcase } from 'lucide-react';
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
    status: 0, // Unscheduled
    priority: 1, // Normal
    scheduledStartDate: '',
    scheduledEndDate: '',
    assignedTechnicianId: '',
    jobTasks: [] as any[],
    jobCardParts: [] as any[],
  });

  // Load Reference Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [eq, jt, cust, cont, tech] = await Promise.all([
          dashboardApi.getEquipment(),
          dashboardApi.getJobTypes(),
          dashboardApi.getCustomers(),
          dashboardApi.getContracts(),
          dashboardApi.getTechnicians(),
        ]);
        setRefData({ equipment: eq, jobTypes: jt, customers: cust, contracts: cont, technicians: tech });
      } catch (err) {
        console.error('Failed to load ref data', err);
      }
    };
    loadData();
  }, []);

  const handleAddTask = () => {
    setFormData({
      ...formData,
      jobTasks: [...formData.jobTasks, { name: '', instructions: '', estimatedDurationMinutes: 30, sequence: formData.jobTasks.length }]
    });
  };

  const removeTask = (index: number) => {
    const newTasks = [...formData.jobTasks];
    newTasks.splice(index, 1);
    setFormData({ ...formData, jobTasks: newTasks });
  };

  const updateTask = (index: number, field: string, value: any) => {
    const newTasks = [...formData.jobTasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setFormData({ ...formData, jobTasks: newTasks });
  };

  const handleAddPart = () => {
    setFormData({
      ...formData,
      jobCardParts: [...formData.jobCardParts, { inventoryItemId: '', quantity: 1, unitCost: 0 }]
    });
  };

  const removePart = (index: number) => {
    const newParts = [...formData.jobCardParts];
    newParts.splice(index, 1);
    setFormData({ ...formData, jobCardParts: newParts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Basic validation
      if (!formData.equipmentId || !formData.jobTypeId || !formData.description) {
        alert('Please fill in Asset, Job Type and Description');
        setLoading(false);
        return;
      }

      await dashboardApi.createJobCard({
        ...formData,
        equipmentId: parseInt(formData.equipmentId),
        jobTypeId: parseInt(formData.jobTypeId),
        customerId: formData.customerId ? parseInt(formData.customerId) : null,
        contractId: formData.contractId ? parseInt(formData.contractId) : null,
        scheduledStartDate: formData.scheduledStartDate || null,
        scheduledEndDate: formData.scheduledEndDate || null,
      });
      onSuccess();
    } catch (err) {
      console.error('Error creating job card', err);
      alert('Failed to create job card. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Basic Info ── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Briefcase size={14} style={{ color: 'var(--accent-blue)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Core Information</span>
        </div>
        
        <div className="form-field">
          <label className="form-label">Description</label>
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
            <label className="form-label">Asset</label>
            <select 
              className="form-select" 
              value={formData.equipmentId}
              onChange={e => setFormData({ ...formData, equipmentId: e.target.value })}
              required
            >
              <option value="">Select Asset...</option>
              {refData.equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Job Type</label>
            <select 
              className="form-select" 
              value={formData.jobTypeId}
              onChange={e => setFormData({ ...formData, jobTypeId: e.target.value })}
              required
            >
              <option value="">Select Type...</option>
              {refData.jobTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <div className="form-field">
            <label className="form-label">Customer</label>
            <select 
              className="form-select" 
              value={formData.customerId}
              onChange={e => setFormData({ ...formData, customerId: e.target.value })}
            >
              <option value="">Internal / No Customer</option>
              {refData.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Contract</label>
            <select 
              className="form-select" 
              value={formData.contractId}
              onChange={e => setFormData({ ...formData, contractId: e.target.value })}
            >
              <option value="">No Contract</option>
              {refData.contracts.map(c => <option key={c.id} value={c.id}>{c.contractNumber}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 12 }}>
          <div className="form-field">
            <label className="form-label">Priority</label>
            <select 
              className="form-select" 
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            >
              <option value={0}>Low</option>
              <option value={1}>Normal</option>
              <option value={2}>High</option>
              <option value={3}>Critical</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Assigned Technician</label>
            <select 
              className="form-select" 
              value={formData.assignedTechnicianId}
              onChange={e => setFormData({ ...formData, assignedTechnicianId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {refData.technicians.map(t => <option key={t.id} value={t.id}>{t.userName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Scheduling ── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Calendar size={14} style={{ color: 'var(--accent-amber)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Scheduling</span>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Start Date</label>
            <input 
              type="datetime-local" 
              className="form-input" 
              value={formData.scheduledStartDate}
              onChange={e => setFormData({ ...formData, scheduledStartDate: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Deadline</label>
            <input 
              type="datetime-local" 
              className="form-input" 
              value={formData.scheduledEndDate}
              onChange={e => setFormData({ ...formData, scheduledEndDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* ── Tasks ── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListChecks size={14} style={{ color: 'var(--accent-emerald)' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Job Tasks</span>
          </div>
          <button type="button" onClick={handleAddTask} className="btn btn-ghost btn-sm">
            <Plus size={14} /> Add Task
          </button>
        </div>
        
        {formData.jobTasks.length === 0 ? (
          <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            No tasks defined. Technicians will have no checklist.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formData.jobTasks.map((task, idx) => (
              <div key={idx} style={{ 
                background: 'rgba(255,255,255,0.03)', 
                padding: 10, borderRadius: 6, border: '1px solid var(--border-subtle)',
                position: 'relative'
              }}>
                <button type="button" onClick={() => removeTask(idx)} style={{ 
                  position: 'absolute', top: 8, right: 8, color: 'var(--accent-rose)',
                  opacity: 0.6, cursor: 'pointer', background: 'none', border: 'none'
                }}>
                  <Trash2 size={12} />
                </button>
                <div className="form-field">
                  <input 
                    className="form-input" 
                    placeholder={`Task ${idx + 1} name...`}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', borderRadius: 0, paddingLeft: 0 }}
                    value={task.name}
                    onChange={e => updateTask(idx, 'name', e.target.value)}
                  />
                </div>
                <div className="form-row" style={{ marginTop: 8 }}>
                  <div className="form-field">
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Minutes"
                      value={task.estimatedDurationMinutes}
                      onChange={e => updateTask(idx, 'estimatedDurationMinutes', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-field">
                    <input 
                      className="form-input" 
                      placeholder="Special instructions..."
                      value={task.instructions || ''}
                      onChange={e => updateTask(idx, 'instructions', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Expected Parts & Materials ── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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
            No specific parts required.
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
                   <input className="form-input" placeholder="Part Item ID / Description" value={part.inventoryItemId} onChange={e => {
                     const newParts = [...formData.jobCardParts];
                     newParts[idx].inventoryItemId = e.target.value;
                     setFormData({ ...formData, jobCardParts: newParts });
                   }} />
                </div>
                <div style={{ flex: 1 }}>
                   <input type="number" className="form-input" placeholder="Quantity" value={part.quantity} onChange={e => {
                     const newParts = [...formData.jobCardParts];
                     newParts[idx].quantity = parseInt(e.target.value);
                     setFormData({ ...formData, jobCardParts: newParts });
                   }} />
                </div>
                <div style={{ flex: 1 }}>
                   <input type="number" className="form-input" placeholder="Est. Unit Cost" value={part.unitCost} onChange={e => {
                     const newParts = [...formData.jobCardParts];
                     newParts[idx].unitCost = parseFloat(e.target.value);
                     setFormData({ ...formData, jobCardParts: newParts });
                   }} />
                </div>
                <button type="button" onClick={() => removePart(idx)} style={{ color: 'var(--accent-rose)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Financials (Cost Trinity View Only) ── */}
      <div className="card-elevated" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Briefcase size={14} style={{ color: 'var(--accent-indigo)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Financial Output (Cost Trinity)</span>
        </div>
        <div className="form-row">
           <div className="form-field"><label className="form-label">Labor Cost</label><input className="form-input" disabled value="0.00" /></div>
           <div className="form-field"><label className="form-label">Parts Cost</label><input className="form-input" disabled value="0.00" /></div>
           <div className="form-field"><label className="form-label">Direct/Subcon</label><input className="form-input" disabled value="0.00" /></div>
           <div className="form-field"><label className="form-label">Invoice Total</label><input className="form-input" disabled value="0.00" /></div>
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div style={{ 
        display: 'flex', justifyContent: 'flex-end', gap: 10,
        position: 'sticky', bottom: -24, background: 'var(--bg-card)', padding: '16px 0', borderTop: '1px solid var(--border-subtle)'
      }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Job Card'}
        </button>
      </div>
    </form>
  );
}

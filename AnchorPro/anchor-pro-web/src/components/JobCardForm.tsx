'use client';

import { useState, useEffect } from 'react';
import { Briefcase, DollarSign, Info } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { useDictionary } from '@/lib/DictionaryContext';

interface JobCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function JobCardForm({ onSuccess, onCancel }: JobCardFormProps) {
  const { t } = useDictionary();
  const jobsLabel = t('Job Cards', 'Job Cards');
  const jobLabel = jobsLabel.endsWith('s') && !jobsLabel.toLowerCase().endsWith('ss') ? jobsLabel.slice(0, -1) : jobsLabel;
  const equipLabel = t('Equipment', 'Equipment');

  const [loading, setLoading] = useState(false);
  const [refData, setRefData] = useState<{
    equipment: any[];
    jobTypes: any[];
    customers: any[];
    contracts: any[];
  }>({
    equipment: [],
    jobTypes: [],
    customers: [],
    contracts: [],
  });

  const [formData, setFormData] = useState({
    jobNumber: '',
    description: '',
    equipmentId: '',
    jobTypeId: '',
    customerId: '',
    contractId: '',
    priority: 1,
    isCustomerBrought: false,
    customerItemName: '',
    customerItemSerial: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eq, jt, cust, cont] = await Promise.all([
          dashboardApi.getEquipment(),
          dashboardApi.getJobTypes(),
          dashboardApi.getCustomers(),
          dashboardApi.getContracts(),
        ]);
        setRefData({
          equipment: eq || [],
          jobTypes: jt || [],
          customers: cust || [],
          contracts: cont || [],
        });
      } catch (err) {
        console.error('Failed to load ref data', err);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.jobTypeId || !formData.description) {
        alert('Please fill in Job Type and Description');
        setLoading(false);
        return;
      }

      if (!formData.isCustomerBrought && !formData.equipmentId) {
        alert(`Please select ${equipLabel}`);
        setLoading(false);
        return;
      }

      if (formData.isCustomerBrought && !formData.customerItemName) {
        alert('Please enter the Customer Item Name');
        setLoading(false);
        return;
      }

      let finalEquipmentId = parseInt(formData.equipmentId);

      if (formData.isCustomerBrought) {
        const customer = refData.customers.find(c => c.id.toString() === formData.customerId);
        const customerName = customer ? customer.name : 'Customer';
        const serial = formData.customerItemSerial.trim() || `SN-CUST-${Math.floor(100000 + Math.random() * 900000)}`;

        const newAsset = await dashboardApi.createAsset({
          name: formData.customerItemName,
          serialNumber: serial,
          location: `Customer Owned: ${customerName}`,
          hourlyRate: 150.00,
        });

        if (newAsset && newAsset.id) {
          finalEquipmentId = newAsset.id;
        } else {
          throw new Error('Failed to auto-register customer asset.');
        }
      }

      const payload = {
        jobNumber: formData.jobNumber.trim(),
        description: formData.description,
        equipmentId: finalEquipmentId,
        jobTypeId: parseInt(formData.jobTypeId),
        customerId: formData.customerId ? parseInt(formData.customerId) : null,
        contractId: formData.contractId ? parseInt(formData.contractId) : null,
        status: 0, // Unscheduled
        priority: parseInt(formData.priority as any) || 1,
        scheduledStartDate: null,
        scheduledEndDate: null,
        assignedTechnicianId: null,
        subcontractingCost: 0,
        jobTasks: [],
        jobCardParts: [],
      };

      console.log('API SUBMISSION:', payload);

      await dashboardApi.createJobCard(payload);
      onSuccess();
    } catch (err: any) {
      console.error('CRITICAL ERROR CREATING JOB CARD:', err);
      alert(`Submission Failed: ${err.message || 'Unknown error'}. Check browser console for details.`);
    } finally {
      setLoading(false);
    }
  };

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
        <SectionHeader icon={<Briefcase size={14} />} label="Core Details" />

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Description *</label>
          <textarea
            className="form-textarea"
            placeholder="Describe the issue / reason for creation"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            required
            rows={3}
          />
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Job Type *</label>
            <select className="form-select" value={formData.jobTypeId}
              onChange={e => setFormData({ ...formData, jobTypeId: e.target.value })} required>
              <option value="">Select Type...</option>
              {refData.jobTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {refData.jobTypes.length === 0 && <p style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 4 }}>No job types found.</p>}
          </div>
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
        </div>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Customer <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
          <select className="form-select" value={formData.customerId}
            onChange={e => {
              const isSelected = !!e.target.value;
              setFormData({ 
                ...formData, 
                customerId: e.target.value,
                isCustomerBrought: isSelected ? formData.isCustomerBrought : false,
                customerItemName: isSelected ? formData.customerItemName : '',
                customerItemSerial: isSelected ? formData.customerItemSerial : '',
              });
            }}>
            <option value="">Internal / No Customer</option>
            {refData.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {formData.customerId && (
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="isCustomerBrought"
              checked={formData.isCustomerBrought}
              onChange={e => setFormData({ 
                ...formData, 
                isCustomerBrought: e.target.checked,
                equipmentId: e.target.checked ? '' : formData.equipmentId,
                customerItemName: e.target.checked ? formData.customerItemName : '',
                customerItemSerial: e.target.checked ? formData.customerItemSerial : '',
              })}
              style={{ cursor: 'pointer', width: 15, height: 15 }}
            />
            <label htmlFor="isCustomerBrought" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
              Customer brought their own item / vehicle (Register new customer asset)
            </label>
          </div>
        )}

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-field">
            {formData.isCustomerBrought ? (
              <>
                <label className="form-label">Customer Item Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. BMW-420i, Generator, Toyota Hilux..."
                  value={formData.customerItemName}
                  onChange={e => setFormData({ ...formData, customerItemName: e.target.value })}
                  required
                />
              </>
            ) : (
              <>
                <label className="form-label">{equipLabel} *</label>
                <select className="form-select" value={formData.equipmentId}
                  onChange={e => setFormData({ ...formData, equipmentId: e.target.value })} required={!formData.isCustomerBrought}>
                  <option value="">Select {equipLabel}...</option>
                  {refData.equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                {refData.equipment.length === 0 && <p style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 4 }}>No {equipLabel.toLowerCase()} found.</p>}
              </>
            )}
          </div>
          {formData.isCustomerBrought && (
            <div className="form-field">
              <label className="form-label">Serial / Model Number <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SN-998822, Chassis Number..."
                value={formData.customerItemSerial}
                onChange={e => setFormData({ ...formData, customerItemSerial: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Contract <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
            <select className="form-select" value={formData.contractId}
              onChange={e => setFormData({ ...formData, contractId: e.target.value })}>
              <option value="">No Contract</option>
              {refData.contracts.map(c => <option key={c.id} value={c.id}>{c.title || c.contractNumber}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px',
        background: 'rgba(99,102,241,0.08)', borderRadius: 6,
        border: '1px solid rgba(99,102,241,0.2)'
      }}>
        <Info size={14} style={{ color: 'var(--accent-indigo)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Additional scheduling, assigning, checklist tasks, and parts requests can be added from the dedicated details page once the {jobLabel.toLowerCase()} is created.
        </p>
      </div>

      {/* ── Footer ─────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 10,
        position: 'sticky', bottom: -24, background: 'var(--bg-card)',
        padding: '16px 0', borderTop: '1px solid var(--border-subtle)'
      }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : `Create ${jobLabel}`}
        </button>
      </div>
    </form>
  );
}

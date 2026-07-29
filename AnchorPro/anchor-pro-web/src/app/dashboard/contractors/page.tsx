'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResponsiveTable from '@/components/ResponsiveTable';
import SlideOver from '@/components/SlideOver';
import { Plus, Hammer, Truck, Users, Save, Loader2, Filter } from 'lucide-react';
import { useDictionary } from '@/lib/DictionaryContext';

const getContractorTypes = (t: (k: string, d: string) => string) => [
  { value: 0, label: t('ClientContract', 'Client Contract'), icon: Users, color: '#6366f1' },
  { value: 1, label: t('ContractorType1', 'Blasting Contractor'), icon: Hammer, color: '#f59e0b' },
  { value: 2, label: t('ContractorType2', 'Ore Transport'), icon: Truck, color: '#10b981' },
  { value: 3, label: t('ContractorType3', 'Support Contractor'), icon: Users, color: '#8b5cf6' },
];

const STATUS_COLORS: Record<string, string> = {
  Draft: 'badge-muted',
  Active: 'badge-green',
  Expired: 'badge-red',
  Cancelled: 'badge-red',
  OnHold: 'badge-orange',
};

function getToken() {
  return localStorage.getItem('anchor_auth_token') || localStorage.getItem('token') || '';
}

export default function ContractorsPage() {
  const router = useRouter();
  const { t } = useDictionary();
  const contractorTypes = getContractorTypes(t);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<number | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    contractNumber: '',
    customerId: '',
    startDate: '',
    endDate: '',
    value: '',
    unitRate: '',
    unitOfMeasure: 'Tons',
    contractPartyType: 1,
    rateType: 'Per Ton',
    workingArea: '',
    terms: '',
  });
  const [customers, setCustomers] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${getToken()}` };
      const [cRes, custRes] = await Promise.all([
        fetch('/api/contracts', { headers }),
        fetch('/api/customers', { headers }),
      ]);
      if (cRes.ok) setContracts(await cRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          contractNumber: form.contractNumber || `CTR-${Date.now()}`,
          customerId: form.customerId ? Number(form.customerId) : null,
          startDate: form.startDate,
          endDate: form.endDate,
          value: parseFloat(form.value) || 0,
          unitRate: form.unitRate ? parseFloat(form.unitRate) : null,
          unitOfMeasure: form.unitOfMeasure,
          contractPartyType: Number(form.contractPartyType),
          rateType: form.rateType,
          workingArea: form.workingArea,
          terms: form.terms,
          status: 'Active',
          slaHours: 24,
        })
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: '', contractNumber: '', customerId: '', startDate: '', endDate: '', value: '', unitRate: '', unitOfMeasure: 'Tons', contractPartyType: 1, rateType: 'Per Ton', workingArea: '', terms: '' });
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to create contractor agreement');
      }
    } catch (e: any) { alert(e.message || 'Error'); }
    finally { setSaving(false); }
  };

  const filteredContracts = filterType === 'all'
    ? contracts.filter(c => c.contractPartyType > 0) // Only contractors, not client contracts
    : contracts.filter(c => c.contractPartyType === filterType);

  const getTypeInfo = (type: number) => contractorTypes.find(t => t.value === type) || contractorTypes[0];

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Hammer size={22} className="text-accent-blue" />
            {t('ContractorsTitle', 'Mining Contractors')}
          </h1>
          <p className="page-subtitle">{t('ContractorsSubtitle', 'Manage blasting, haulage, and support contractor agreements.')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> New Contractor Agreement
        </button>
      </div>

      {/* Type summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {contractorTypes.slice(1).map(type => {
          const Icon = type.icon;
          const count = contracts.filter(c => c.contractPartyType === type.value).length;
          const active = contracts.filter(c => c.contractPartyType === type.value && c.status === 'Active').length;
          return (
            <button
              key={type.value}
              onClick={() => setFilterType(filterType === type.value ? 'all' : type.value)}
              className="card"
              style={{ padding: 18, textAlign: 'left', cursor: 'pointer', border: filterType === type.value ? `2px solid ${type.color}` : '1px solid var(--border-subtle)', background: filterType === type.value ? `${type.color}11` : undefined }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${type.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: type.color }}>
                  <Icon size={18} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{type.label}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: type.color }}>{count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{active} active</div>
            </button>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        <button onClick={() => setFilterType('all')} className={filterType === 'all' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: 12, padding: '6px 14px' }}>All Contractors</button>
        {contractorTypes.slice(1).map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)} className={filterType === t.value ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: 12, padding: '6px 14px' }}>{t.label}</button>
        ))}
      </div>

      <div className="card">
        <ResponsiveTable>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Contract Ref</th>
                <th>Company / Contractor</th>
                <th>Working Area</th>
                <th>Rate</th>
                <th>Duration</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
              ) : filteredContracts.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No contractor agreements found. Click "New Contractor Agreement" to add one.
                </td></tr>
              ) : filteredContracts.map(c => {
                const typeInfo = getTypeInfo(c.contractPartyType);
                const TypeIcon = typeInfo.icon;
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${typeInfo.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeInfo.color }}>
                          <TypeIcon size={14} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: typeInfo.color }}>{typeInfo.label}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.contractNumber}</td>
                    <td>{c.customer?.name || c.title}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.workingArea || '-'}</td>
                    <td>
                      {c.unitRate ? (
                        <div>
                          <span style={{ fontWeight: 600 }}>K {Number(c.unitRate).toLocaleString()}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> {c.rateType || `/${c.unitOfMeasure}`}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>
                        <div>{c.startDate ? new Date(c.startDate).toLocaleDateString() : '-'}</div>
                        <div style={{ color: 'var(--text-muted)' }}>to {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Ongoing'}</div>
                      </div>
                    </td>
                    <td><span className={`badge ${STATUS_COLORS[c.status] || 'badge-muted'}`}>{c.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" onClick={() => router.push(`/dashboard/contracts/${c.id}`)}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>

      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Contractor Agreement">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Contractor Type</label>
            <select className="input" required value={form.contractPartyType} onChange={e => setForm({...form, contractPartyType: Number(e.target.value)})}>
              {contractorTypes.slice(1).map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Contract Title / Description</label>
            <input className="input" required value={form.title} placeholder="e.g. AECI Blasting Services Q3" onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Contractor Company</label>
            <select className="input" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
              <option value="">-- Select company or leave blank --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" className="input" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" className="input" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Working Area / Zone</label>
            <input className="input" placeholder="e.g. Pit 3 North Face, Level 12 Stope" value={form.workingArea} onChange={e => setForm({...form, workingArea: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Unit Rate (ZMW)</label>
              <input type="number" step="0.01" className="input" placeholder="e.g. 45.00" value={form.unitRate} onChange={e => setForm({...form, unitRate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Rate Type</label>
              <select className="input" value={form.rateType} onChange={e => setForm({...form, rateType: e.target.value})}>
                <option value="Per Ton">Per Ton</option>
                <option value="Per Load">Per Load</option>
                <option value="Per Blast">Per Blast</option>
                <option value="Per Metre">Per Metre</option>
                <option value="Per Day">Per Day</option>
                <option value="Per Hour">Per Hour</option>
                <option value="Lump Sum">Lump Sum</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Total Contract Value (ZMW)</label>
            <input type="number" step="0.01" className="input" placeholder="Total value of this contract" value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Terms / Scope of Work</label>
            <textarea className="input" rows={3} placeholder="Describe the scope..." value={form.terms} onChange={e => setForm({...form, terms: e.target.value})} />
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save Agreement
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}

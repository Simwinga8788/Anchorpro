'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Search, Edit2, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { contractsApi, dashboardApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

const statusConfig: Record<string, { badge: string; dot: string }> = {
  Active:    { badge: 'badge-green',  dot: 'green' },
  Pending:   { badge: 'badge-amber',  dot: 'amber' },
  Expired:   { badge: 'badge-muted',  dot: 'muted' },
  Cancelled: { badge: 'badge-rose',   dot: 'rose'  },
};

const BLANK = {
  customerId: '',
  title: '',
  startDate: '',
  endDate: '',
  value: '',
  terms: '',
  status: 'Pending',
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [slideMode, setSlideMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [formData, setFormData] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      contractsApi.getAll(),
      dashboardApi.getCustomers(),
    ]).then(([contracts, customers]) => {
      setContracts(contracts || []);
      setCustomers(customers || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setFormData(BLANK);
    setEditTarget(null);
    setSlideMode('create');
  };

  const openEdit = (contract: any) => {
    setFormData({
      customerId: String(contract.customerId || ''),
      title: contract.title || '',
      startDate: contract.startDate ? contract.startDate.slice(0, 10) : '',
      endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
      value: String(contract.value || ''),
      terms: contract.terms || '',
      status: contract.status || 'Active',
    });
    setEditTarget(contract);
    setSlideMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        customerId: parseInt(formData.customerId),
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        value: parseFloat(formData.value) || 0,
        terms: formData.terms,
        status: formData.status,
      };
      if (slideMode === 'edit' && editTarget) {
        await contractsApi.update(editTarget.id, { ...editTarget, ...payload });
      } else {
        await contractsApi.create(payload);
      }
      setSlideMode(null);
      load();
    } catch (err: any) {
      alert(err?.message || 'Failed to save contract');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this contract? This cannot be undone.')) return;
    setCancelling(id);
    try {
      await contractsApi.cancel(id);
      load();
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel contract');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = contracts.filter(c =>
    (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.customer?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount  = contracts.filter(c => c.status === 'Active').length;
  const totalValue   = contracts.filter(c => c.status === 'Active').reduce((a, c) => a + (c.value || 0), 0);
  const expiringCount = contracts.filter(c => {
    if (!c.endDate) return false;
    const diff = (new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  }).length;

  const contractForm = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-field">
        <label className="form-label">Customer *</label>
        <select className="form-select" required value={formData.customerId}
          onChange={e => setFormData(f => ({ ...f, customerId: e.target.value }))}>
          <option value="">Select customer...</option>
          {customers.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="form-label">Contract Title *</label>
        <input className="form-input" required placeholder="e.g. Annual Maintenance Agreement"
          value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Start Date *</label>
          <input className="form-input" type="date" required value={formData.startDate}
            onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))} />
        </div>
        <div className="form-field">
          <label className="form-label">End Date *</label>
          <input className="form-input" type="date" required value={formData.endDate}
            onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Contract Value (K)</label>
          <input className="form-input" type="number" placeholder="0.00" value={formData.value}
            onChange={e => setFormData(f => ({ ...f, value: e.target.value }))} />
        </div>
        <div className="form-field">
          <label className="form-label">Status</label>
          <select className="form-select" value={formData.status}
            onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}>
            {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Terms & Notes</label>
        <textarea className="form-textarea" rows={3} placeholder="Contract terms, SLA details, scope of work..."
          value={formData.terms} onChange={e => setFormData(f => ({ ...f, terms: e.target.value }))} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button type="button" className="btn btn-secondary" style={{ flex: 1 }}
          onClick={() => setSlideMode(null)} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
          {saving ? 'Saving...' : slideMode === 'edit' ? 'Save Changes' : 'Create Contract'}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <SlideOver open={!!slideMode} onClose={() => setSlideMode(null)}
        title={slideMode === 'edit' ? `Edit — ${editTarget?.title}` : 'New Contract'}
        subtitle={slideMode === 'edit' ? 'Update contract details and status.' : 'Register a new service or maintenance contract.'}>
        {contractForm}
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Contracts</h1>
          <p className="page-subtitle">{contracts.length} contracts registered</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus size={14} /> New Contract
        </button>
      </div>

      <div className="stats-grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Active',    value: activeCount,                                                            color: 'var(--accent-emerald)', icon: <CheckCircle2 size={16} /> },
          { label: 'Expiring (30d)', value: expiringCount,                                                     color: 'var(--accent-amber)',   icon: <Clock size={16} /> },
          { label: 'Total Value',   value: `K ${totalValue.toLocaleString()}`,                                 color: 'var(--accent-blue)',    icon: <FileText size={16} /> },
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
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }}
              placeholder="Search by title or customer…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Customer</th>
              <th>Duration</th>
              <th>Value</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>Loading contracts...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }} />
                  {search ? 'No contracts match your search' : 'No contracts yet — create one above'}
                </td>
              </tr>
            ) : filtered.map(contract => {
              const sc = statusConfig[contract.status] ?? statusConfig['Pending'];
              const isExpiring = (() => {
                if (!contract.endDate) return false;
                const diff = (new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                return diff > 0 && diff <= 30;
              })();
              return (
                <tr key={contract.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(contract)}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{contract.title}</div>
                    {isExpiring && (
                      <div style={{ fontSize: 10, color: 'var(--accent-amber)', marginTop: 2 }}>⚠ Expiring soon</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {contract.customer?.name || customers.find((c: any) => c.id === contract.customerId)?.name || '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : '—'}
                    {' → '}
                    {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {contract.value ? `K ${(contract.value).toLocaleString()}` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${sc.badge}`}>
                      <span className={`status-dot ${sc.dot}`} />
                      {contract.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: 4 }}
                        title="Edit" onClick={() => openEdit(contract)}>
                        <Edit2 size={13} />
                      </button>
                      {contract.status !== 'Cancelled' && (
                        <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--accent-rose)' }}
                          title="Cancel Contract" disabled={cancelling === contract.id}
                          onClick={() => handleCancel(contract.id)}>
                          <XCircle size={13} />
                        </button>
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

'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, Mail, Phone, MapPin, Edit2, FileText } from 'lucide-react';
import { dashboardApi, customersApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

const BLANK = { name: '', contactPerson: '', email: '', phone: '', address: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [slideMode, setSlideMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [formData, setFormData]   = useState(BLANK);
  const [saving, setSaving]       = useState(false);

  const fetchCustomers = () => {
    setLoading(true);
    dashboardApi.getCustomers()
      .then(data => setCustomers(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const openCreate = () => { setFormData(BLANK); setEditTarget(null); setSlideMode('create'); };
  const openEdit = (c: any) => {
    setFormData({ name: c.name || '', contactPerson: c.contactPerson || '', email: c.email || '', phone: c.phone || '', address: c.address || '' });
    setEditTarget(c); setSlideMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (slideMode === 'edit' && editTarget) {
        await customersApi.update(editTarget.id, { ...editTarget, ...formData });
      } else {
        await dashboardApi.createCustomer(formData);
      }
      setSlideMode(null); fetchCustomers();
    } catch { alert(slideMode === 'edit' ? 'Failed to update customer' : 'Failed to create customer'); }
    finally { setSaving(false); }
  };

  const customerForm = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-field"><label className="form-label">Company Name</label>
        <input className="form-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
      <div className="form-field"><label className="form-label">Contact Person</label>
        <input className="form-input" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} /></div>
      <div className="form-row">
        <div className="form-field"><label className="form-label">Email</label>
          <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
        <div className="form-field"><label className="form-label">Phone</label>
          <input type="tel" className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
      </div>
      <div className="form-field"><label className="form-label">Address</label>
        <textarea className="form-textarea" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSlideMode(null)} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : slideMode === 'edit' ? 'Save Changes' : 'Add Customer'}</button>
      </div>
    </form>
  );

  return (
    <div>
      <SlideOver open={!!slideMode} onClose={() => setSlideMode(null)}
        title={slideMode === 'edit' ? `Edit — ${editTarget?.name}` : 'Add Customer'}
        subtitle={slideMode === 'edit' ? 'Update contact details and account information.' : 'Register a new business account or client.'}>
        {customerForm}
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Customers & Clients</h1>
          <p className="page-subtitle">{customers.length} client accounts registered</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Customer</button>
      </div>

      <div className="card-elevated" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>Company Name</th><th>Contact Person</th><th>Contact Details</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}>Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <Building2 size={32} style={{ margin: '0 auto 12px', opacity: 0.5, display: 'block' }} />
                  No customers found. Click &quot;Add Customer&quot; to begin.
                </td>
              </tr>
            ) : customers.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(c)}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <MapPin size={10} /> {c.address || 'No address'}
                  </div>
                </td>
                <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{c.contactPerson || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={11} /> {c.email}</div>}
                  {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Phone size={11} /> {c.phone}</div>}
                  {!c.email && !c.phone && '—'}
                </td>
                <td><span className="badge badge-green">Active</span></td>
                <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

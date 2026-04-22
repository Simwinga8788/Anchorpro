'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, Mail, Phone, MapPin, MoreHorizontal, FileText } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = () => {
    setLoading(true);
    dashboardApi.getCustomers()
      .then(data => setCustomers(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dashboardApi.createCustomer(formData);
      setIsSlideOpen(false);
      setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' });
      fetchCustomers();
    } catch (err) {
      alert("Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SlideOver open={isSlideOpen} onClose={() => setIsSlideOpen(false)} title="Add Customer" subtitle="Register a new business account or client.">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Company Name</label>
            <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Contact Person</label>
            <input className="form-input" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-field">
              <label className="form-label">Phone</label>
              <input type="tel" className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Address</label>
            <textarea className="form-textarea" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Customer'}</button>
          </div>
        </form>
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Customers & Clients</h1>
          <p className="page-subtitle">Manage client accounts, contacts, and related operations.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setIsSlideOpen(true)}>
          <Plus size={14} /> Add Customer
        </button>
      </div>

      <div className="card-elevated" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Contact Person</th>
              <th>Contact Details</th>
              <th>Status</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}>Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <Building2 size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  No customers found. Click &quot;Add Customer&quot; to begin.
                </td>
              </tr>
            ) : (
              customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <MapPin size={10} /> {c.address || 'No address registered'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.contactPerson || '—'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} /> {c.email}</div>}
                      {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Phone size={12} /> {c.phone}</div>}
                      {!c.email && !c.phone && '—'}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-green">Active</span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4, height: 'auto' }}>
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

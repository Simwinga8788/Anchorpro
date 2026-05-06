'use client';

import { Plus, Search, FileText, MoreHorizontal, Zap, Truck, Trash2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

const typeConfig: Record<number, { label: string; badge: string; color: string }> = {
  0: { label: 'Inventory Replenishment', badge: 'badge-blue',   color: 'var(--accent-blue)' },
  1: { label: 'Direct Purchase',         badge: 'badge-amber',  color: 'var(--accent-amber)' },
  2: { label: 'Subcontracting',          badge: 'badge-violet', color: 'var(--accent-violet)' },
};

const statusConfig: Record<number, { label: string; badge: string }> = {
  0: { label: 'Draft',             badge: 'badge-muted' },
  1: { label: 'Submitted',         badge: 'badge-blue' },
  2: { label: 'Partially Received',badge: 'badge-amber' },
  3: { label: 'Received',          badge: 'badge-green' },
  4: { label: 'Cancelled',         badge: 'badge-rose' },
};

const SUPPLIER_BLANK = { name: '', contactPerson: '', email: '', phone: '', address: '', supplierCode: '', notes: '' };

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [jobs, setJobs] = useState<any[]>([]);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ supplierId: '', poType: 0, jobCardId: '', notes: '', items: [{ description: '', quantityOrdered: 1, unitCost: 0 }] });

  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState(SUPPLIER_BLANK);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([dashboardApi.getPurchaseOrders(), dashboardApi.getSuppliers(), dashboardApi.getJobCards()])
      .then(([ordersData, suppliersData, jobsData]) => {
        setOrders(ordersData || []);
        setSuppliers(suppliersData || []);
        setJobs(jobsData || []);
      })
      .catch(err => console.error("Failed to load data", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const prefix = formData.poType === 2 ? 'PO-SUB' : 'PO';
      await dashboardApi.createPurchaseOrder({
        poNumber: `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierId: parseInt(formData.supplierId),
        poType: formData.poType,
        jobCardId: formData.jobCardId ? parseInt(formData.jobCardId) : undefined,
        notes: formData.notes || undefined,
        items: formData.items
      });
      setIsSlideOpen(false);
      setFormData({ supplierId: '', poType: 0, jobCardId: '', notes: '', items: [{ description: '', quantityOrdered: 1, unitCost: 0 }] });
      fetchData();
    } catch (err) {
      alert("Failed to raise PO");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { description: '', quantityOrdered: 1, unitCost: 0 }] });
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    setSavingSupplier(true);
    try {
      await fetch('/api/procurement/suppliers', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm),
      });
      setSupplierForm(SUPPLIER_BLANK);
      setShowSupplierForm(false);
      fetchData();
    } catch { alert('Failed to save supplier'); }
    finally { setSavingSupplier(false); }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Remove this supplier?')) return;
    await fetch(`/api/procurement/suppliers/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchData();
  };

  const filtered = orders.filter(o =>
    o.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpend = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const pendingCount = orders.filter(o => o.status === 1 || o.status === 2).length;
  const receivedCount = orders.filter(o => o.status === 3).length;

  return (
    <div>
      <SlideOver open={isSlideOpen} onClose={() => setIsSlideOpen(false)} title="Raise Purchase Order" subtitle="Create a new PO for external suppliers.">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Supplier</label>
            <select className="form-select" required value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
              <option value="">Select a supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Order Type</label>
            <select className="form-select" value={formData.poType} onChange={e => setFormData({...formData, poType: parseInt(e.target.value)})}>
              {Object.entries(typeConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {(formData.poType === 1 || formData.poType === 2) && (
            <div className="form-field">
              <label className="form-label">Linked Job Card <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <select className="form-select" value={formData.jobCardId} onChange={e => setFormData({...formData, jobCardId: e.target.value})}>
                <option value="">— Not linked to a job —</option>
                {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.jobNumber} · {j.equipment?.name ?? ''}</option>)}
              </select>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input className="form-input" placeholder="Internal notes or reference..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          <div className="section-header" style={{ marginTop: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
            <div><div className="section-title" style={{ fontSize: 13 }}>Order Items</div></div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}><Plus size={12}/> Add Line</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formData.items.map((item, idx) => (
              <div key={idx} style={{ padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="form-input" placeholder="Item description / Part details" required value={item.description} onChange={e => {
                  const newI = [...formData.items]; newI[idx].description = e.target.value; setFormData({...formData, items: newI});
                }} />
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label" style={{ fontSize: 11 }}>Quantity</label>
                    <input type="number" className="form-input" required value={item.quantityOrdered} onChange={e => {
                      const newI = [...formData.items]; newI[idx].quantityOrdered = parseInt(e.target.value); setFormData({...formData, items: newI});
                    }} />
                  </div>
                  <div className="form-field">
                    <label className="form-label" style={{ fontSize: 11 }}>Unit Cost</label>
                    <input type="number" className="form-input" required value={item.unitCost} onChange={e => {
                      const newI = [...formData.items]; newI[idx].unitCost = parseFloat(e.target.value); setFormData({...formData, items: newI});
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Draft PO'}</button>
          </div>
        </form>
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Procurement</h1>
          <p className="page-subtitle">{orders.length} purchase orders · K {totalSpend.toLocaleString()} committed</p>
        </div>
        {activeTab === 'orders' ? (
          <button className="btn btn-primary" onClick={() => setIsSlideOpen(true)}>
            <Plus size={14}/> Raise PO
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowSupplierForm(true)}>
            <Plus size={14}/> Add Supplier
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
        {[
          { key: 'orders', label: 'Purchase Orders', icon: <FileText size={13}/> },
          { key: 'suppliers', label: 'Suppliers', icon: <Truck size={13}/> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && <>
      {/* Summary */}
      <div className="stats-grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Pending Processing', value: pendingCount, color: 'var(--accent-amber)', icon: <Zap size={16}/> },
          { label: 'Received',           value: receivedCount, color: 'var(--accent-emerald)', icon: <FileText size={16}/> },
          { label: 'Total Spend',        value: `K ${totalSpend.toLocaleString()}`, color: 'var(--accent-blue)', icon: <FileText size={16}/> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div className="stat-icon" style={{ background: s.color+'20', marginBottom: 0 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: typeof s.value==='string'?18:24, color: s.color }}>{s.value}</div>
              <div className="stat-label" style={{ margin: 0 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search by PO number or supplier…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Type</th>
              <th>Linked Job</th>
              <th>Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0' }}>Loading purchase orders...</td></tr>
            ) : filtered.length === 0 ? (
               <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No POs found</td></tr>
            ) : filtered.map(order => {
              const typeCfg = typeConfig[order.poType] || { label: 'Unknown', badge: 'badge-muted' };
              const statCfg = statusConfig[order.status] || { label: 'Unknown', badge: 'badge-muted' };
              
              return (
                <tr key={order.id} style={{ cursor: 'pointer' }}>
                  <td style={{ color: 'var(--accent-blue)', fontWeight: 600, fontSize: 13 }}>{order.poNumber}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{order.supplier?.name || 'Unknown Supplier'}</td>
                  <td><span className={`badge ${typeCfg.badge}`}>{typeCfg.label}</span></td>
                  <td style={{ color: order.jobCardId ? 'var(--accent-blue)' : 'var(--text-muted)', fontSize: 13, fontWeight: order.jobCardId ? 600 : 400 }}>
                    {order.jobCardId ? `Job #${order.jobCardId}` : '—'}
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td><span className={`badge ${statCfg.badge}`}>{statCfg.label}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                    K {order.totalAmount?.toLocaleString() || '0'}
                  </td>
                  <td><button className="btn btn-ghost btn-sm" style={{ padding: 4 }}><MoreHorizontal size={14}/></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </>}

      {activeTab === 'suppliers' && (
        <div>
          {/* Add Supplier Form */}
          {showSupplierForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSupplierForm(false)}>
              <div className="card-elevated" style={{ width: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Add Supplier</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowSupplierForm(false)}><X size={16}/></button>
                </div>
                <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Company Name *</label>
                      <input className="form-input" required value={supplierForm.name} onChange={e => setSupplierForm(f => ({...f, name: e.target.value}))} placeholder="Acme Engineering Ltd" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Supplier Code</label>
                      <input className="form-input" value={supplierForm.supplierCode} onChange={e => setSupplierForm(f => ({...f, supplierCode: e.target.value}))} placeholder="SUP-001" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Contact Person</label>
                      <input className="form-input" value={supplierForm.contactPerson} onChange={e => setSupplierForm(f => ({...f, contactPerson: e.target.value}))} placeholder="John Mwanza" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={supplierForm.phone} onChange={e => setSupplierForm(f => ({...f, phone: e.target.value}))} placeholder="+260 97..." />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={supplierForm.email} onChange={e => setSupplierForm(f => ({...f, email: e.target.value}))} placeholder="info@supplier.com" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Address</label>
                      <input className="form-input" value={supplierForm.address} onChange={e => setSupplierForm(f => ({...f, address: e.target.value}))} placeholder="Lusaka, Zambia" />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Notes</label>
                    <input className="form-input" value={supplierForm.notes} onChange={e => setSupplierForm(f => ({...f, notes: e.target.value}))} placeholder="Specialises in electrical components..." />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowSupplierForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={savingSupplier}>{savingSupplier ? 'Saving...' : 'Add Supplier'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Suppliers List */}
          {suppliers.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Truck size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 14, marginBottom: 12 }}>No suppliers yet</div>
              <button className="btn btn-primary" onClick={() => setShowSupplierForm(true)}><Plus size={13}/> Add First Supplier</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {suppliers.map((s: any) => (
                <div key={s.id} className="card-elevated" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{s.name}</div>
                      {s.supplierCode && <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 2 }}>{s.supplierCode}</div>}
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--accent-rose)' }} onClick={() => handleDeleteSupplier(s.id)}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {s.contactPerson && <div>Contact: {s.contactPerson}</div>}
                    {s.phone && <div>Phone: {s.phone}</div>}
                    {s.email && <div>Email: {s.email}</div>}
                    {s.address && <div>Address: {s.address}</div>}
                    {s.notes && <div style={{ marginTop: 6, color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

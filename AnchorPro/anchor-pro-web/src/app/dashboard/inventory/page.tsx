'use client';

import { Search, Plus, AlertTriangle, Package, Edit2, PlusCircle, Check, X, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardApi, inventoryApi, jobCardsApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

const BLANK = { name: '', partNumber: '', category: '', location: '', unitCost: 0, quantityOnHand: 0, reorderLevel: 5, unitOfMeasure: 'Unit' };

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');
  
  // Stock Registry state
  const [search, setSearch]       = useState('');
  const [cat, setCat]             = useState('All');
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [slideMode, setSlideMode] = useState<'create' | 'edit' | 'adjust' | null>(null);
  const [saving, setSaving]       = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [formData, setFormData]   = useState(BLANK);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  // Parts Requests state
  const [requests, setRequests]   = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const fetchInventory = () => {
    setLoading(true);
    dashboardApi.getInventoryItems()
      .then(data => setInventory(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchRequests = () => {
    setRequestsLoading(true);
    dashboardApi.getPendingPartsRequests()
      .then(data => setRequests(data || []))
      .catch(console.error)
      .finally(() => setRequestsLoading(false));
  };

  useEffect(() => {
    fetchInventory();
    dashboardApi.getPendingPartsRequests()
      .then(data => setRequests(data || []))
      .catch(() => {});
  }, []);

  const openCreate = () => { setFormData(BLANK); setEditTarget(null); setSlideMode('create'); };
  const openEdit = (item: any) => {
    setFormData({ name: item.name, partNumber: item.partNumber || '', category: item.category || '', location: item.location || '', unitCost: item.unitCost || 0, quantityOnHand: item.quantityOnHand || 0, reorderLevel: item.reorderLevel || 5, unitOfMeasure: item.unitOfMeasure || 'Unit' });
    setEditTarget(item); setSlideMode('edit');
  };
  const openAdjust = (item: any) => { setEditTarget(item); setAdjustQty(''); setAdjustNote(''); setSlideMode('adjust'); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (slideMode === 'edit' && editTarget) {
        await inventoryApi.update(editTarget.id, { ...editTarget, ...formData });
      } else {
        await dashboardApi.createInventoryItem(formData);
      }
      setSlideMode(null);
      fetchInventory();
    } catch { alert('Failed to save item'); }
    finally { setSaving(false); }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const delta = parseInt(adjustQty);
    if (isNaN(delta)) { setSaving(false); return; }
    try {
      const newQty = Math.max(0, (editTarget.quantityOnHand || 0) + delta);
      await inventoryApi.update(editTarget.id, { ...editTarget, quantityOnHand: newQty });
      setSlideMode(null);
      fetchInventory();
    } catch { alert('Stock adjustment failed'); }
    finally { setSaving(false); }
  };

  const handleIssueRequest = async (reqId: number) => {
    try {
      await jobCardsApi.issuePart(reqId);
      alert('Part issued successfully. Stock deducted.');
      fetchRequests();
      fetchInventory();
    } catch (err: any) {
      alert('Failed to issue part: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRejectRequest = async (reqId: number) => {
    if (!confirm('Reject and delete this parts request?')) return;
    try {
      await jobCardsApi.removePart(reqId);
      alert('Request rejected and deleted.');
      fetchRequests();
    } catch (err: any) {
      alert('Failed to reject request: ' + (err.message || 'Unknown error'));
    }
  };

  const categories = ['All', ...Array.from(new Set(inventory.map(i => i.category || 'Uncategorized')))];
  const lowStock    = inventory.filter(i => (i.quantityOnHand || 0) <= (i.reorderLevel || 0));
  const filtered    = inventory.filter(i =>
    (cat === 'All' || (i.category || 'Uncategorized') === cat) &&
    (i.name?.toLowerCase().includes(search.toLowerCase()) || i.partNumber?.toLowerCase().includes(search.toLowerCase()))
  );
  const totalValue  = inventory.reduce((a, i) => a + ((i.quantityOnHand || 0) * (i.unitCost || 0)), 0);

  const itemForm = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-field"><label className="form-label">Item Name</label>
        <input className="form-input" required placeholder="e.g. Engine Oil Filter" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
      <div className="form-row">
        <div className="form-field"><label className="form-label">Part No. (SKU)</label>
          <input className="form-input" required value={formData.partNumber} onChange={e => setFormData({ ...formData, partNumber: e.target.value })} /></div>
        <div className="form-field"><label className="form-label">Category</label>
          <input className="form-input" required placeholder="e.g. Filters" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} /></div>
      </div>
      <div className="form-row">
        <div className="form-field"><label className="form-label">Location</label>
          <input className="form-input" placeholder="e.g. Shelf A1" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} /></div>
        <div className="form-field"><label className="form-label">Unit of Measure</label>
          <input className="form-input" placeholder="Unit, L, Kg" required value={formData.unitOfMeasure} onChange={e => setFormData({ ...formData, unitOfMeasure: e.target.value })} /></div>
      </div>
      <div className="form-row">
        <div className="form-field"><label className="form-label">Unit Cost (K)</label>
          <input type="number" className="form-input" required value={formData.unitCost} onChange={e => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-field"><label className="form-label">Qty on Hand</label>
          <input type="number" className="form-input" required value={formData.quantityOnHand} onChange={e => setFormData({ ...formData, quantityOnHand: parseInt(e.target.value) || 0 })} /></div>
        <div className="form-field"><label className="form-label">Reorder Level</label>
          <input type="number" className="form-input" required value={formData.reorderLevel} onChange={e => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })} /></div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSlideMode(null)} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : slideMode === 'edit' ? 'Save Changes' : 'Add Item'}</button>
      </div>
    </form>
  );

  return (
    <div>
      <SlideOver open={slideMode === 'create' || slideMode === 'edit'} onClose={() => setSlideMode(null)}
        title={slideMode === 'edit' ? `Edit — ${editTarget?.name}` : 'Add Inventory Item'}
        subtitle={slideMode === 'edit' ? 'Update details, cost, or reorder level.' : 'Register a new part or component.'}>
        {itemForm}
      </SlideOver>

      <SlideOver open={slideMode === 'adjust'} onClose={() => setSlideMode(null)}
        title="Stock Adjustment" subtitle={editTarget ? `${editTarget.name} · current: ${editTarget.quantityOnHand} ${editTarget.unitOfMeasure || 'units'}` : ''}>
        <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current stock</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{editTarget?.quantityOnHand} {editTarget?.unitOfMeasure}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Reorder level</span>
              <span style={{ fontWeight: 700, color: editTarget?.quantityOnHand <= editTarget?.reorderLevel ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>{editTarget?.reorderLevel}</span>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Adjustment (+/−)</label>
            <input className="form-input" required type="number" placeholder="e.g. +50 or -10" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              New qty: <strong style={{ color: 'var(--text-primary)' }}>{isNaN(parseInt(adjustQty)) ? '—' : Math.max(0, (editTarget?.quantityOnHand || 0) + parseInt(adjustQty))}</strong>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Reason / Notes</label>
            <input className="form-input" placeholder="e.g. Stock count, received PO-0042" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSlideMode(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : 'Apply Adjustment'}</button>
          </div>
        </form>
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Inventory & Parts</h1>
          <p className="page-subtitle">{inventory.length} SKUs · K {totalValue.toLocaleString()} total value</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={13} /> Add Item</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 2 }}>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            fontSize: 14, fontWeight: activeTab === 'inventory' ? 700 : 500,
            color: activeTab === 'inventory' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'inventory' ? '2px solid var(--accent-blue)' : 'none',
            background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            padding: '8px 16px 12px', cursor: 'pointer', outline: 'none'
          }}
        >
          Stock Registry
        </button>
        <button
          onClick={() => { setActiveTab('requests'); fetchRequests(); }}
          style={{
            fontSize: 14, fontWeight: activeTab === 'requests' ? 700 : 500,
            color: activeTab === 'requests' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'requests' ? '2px solid var(--accent-blue)' : 'none',
            background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            padding: '8px 16px 12px', cursor: 'pointer', outline: 'none',
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          Parts Requests
          {requests.length > 0 && (
            <span style={{ fontSize: 11, background: 'var(--accent-rose)', color: 'white', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {lowStock.length > 0 && activeTab === 'inventory' && !loading && (
        <div style={{ background: 'var(--accent-amber-dim)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--accent-amber)', fontWeight: 600 }}>
            {lowStock.length} items at or below reorder level: {lowStock.slice(0, 4).map(i => i.name).join(', ')}{lowStock.length > 4 ? '…' : ''}
          </span>
        </div>
      )}

      {/* Tab Content 1: Stock Registry */}
      {activeTab === 'inventory' && (
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search by name or Part Number…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {categories.map(c => (
                <button key={c} onClick={() => setCat(c)} className="btn btn-sm" style={{ background: cat === c ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)', color: cat === c ? 'white' : 'var(--text-secondary)', border: '1px solid ' + (cat === c ? 'var(--accent-blue)' : 'var(--border-subtle)'), whiteSpace: 'nowrap' }}>{c}</button>
              ))}
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr><th>Item Name</th><th>Part No.</th><th>Category</th><th>Location</th><th>Unit Cost</th><th>Qty on Hand</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0' }}>Loading inventory...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No items found</td></tr>
              ) : filtered.map(item => {
                const qty = item.quantityOnHand || 0;
                const isLow = qty <= (item.reorderLevel || 0);
                return (
                  <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(item)}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-tertiary)' }}>{item.partNumber || '—'}</td>
                    <td><span className="badge badge-muted">{item.category || 'Uncategorized'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.location || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>K {(item.unitCost || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: isLow ? 'var(--accent-rose)' : 'var(--text-primary)' }}>{qty}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.unitOfMeasure || 'Unit'}</span>
                      </div>
                    </td>
                    <td>{isLow ? <span className="badge badge-rose"><AlertTriangle size={10} /> Low Stock</span> : <span className="badge badge-green">In Stock</span>}</td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} title="Adjust Stock" onClick={() => openAdjust(item)}><PlusCircle size={13} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} title="Edit" onClick={() => openEdit(item)}><Edit2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 2: Parts Requests */}
      {activeTab === 'requests' && (
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Part Requested</th>
                <th>Job Card</th>
                <th>Qty Requested</th>
                <th>Warehouse Stock</th>
                <th>Requested By</th>
                <th>Requested Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requestsLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0' }}>Loading requests...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No pending parts requests</td></tr>
              ) : requests.map((r: any) => {
                const available = r.inventoryItem?.quantityOnHand ?? 0;
                const requested = r.quantityUsed ?? 0;
                const outOfStock = available < requested;
                
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.inventoryItem?.name || 'Unknown Item'}</div>
                      {r.inventoryItem?.partNumber && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{r.inventoryItem.partNumber}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <a href={`/dashboard/jobs/${r.jobCardId}`} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} /> Job #{r.jobCard?.jobNumber || r.jobCardId}
                        </a>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.jobCard?.equipment?.name || 'Asset'}</div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {requested} {r.inventoryItem?.unitOfMeasure || 'Unit'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: outOfStock ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                          {available}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>available</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {r.createdBy || 'Technician'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingRight: 8 }}>
                        <button
                          onClick={() => handleRejectRequest(r.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', padding: '4px 10px', fontSize: 11 }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleIssueRequest(r.id)}
                          disabled={outOfStock}
                          className="btn btn-primary btn-sm"
                          style={{
                            background: outOfStock ? 'var(--bg-hover)' : 'var(--accent-emerald)',
                            borderColor: outOfStock ? 'var(--border-default)' : 'var(--accent-emerald)',
                            color: outOfStock ? 'var(--text-muted)' : 'white',
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            padding: '4px 10px',
                            fontSize: 11
                          }}
                        >
                          {outOfStock ? 'Out of Stock' : 'Issue Part'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

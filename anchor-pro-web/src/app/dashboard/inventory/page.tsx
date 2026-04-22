'use client';

import { Search, Plus, AlertTriangle, Package, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', partNumber: '', category: '', location: '', unitCost: 0, quantityOnHand: 0, reorderLevel: 5, unitOfMeasure: 'Unit' });

  const fetchInventory = () => {
    setLoading(true);
    dashboardApi.getInventoryItems()
      .then(data => setInventory(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dashboardApi.createInventoryItem(formData);
      setIsSlideOpen(false);
      setFormData({ name: '', partNumber: '', category: '', location: '', unitCost: 0, quantityOnHand: 0, reorderLevel: 5, unitOfMeasure: 'Unit' });
      fetchInventory();
    } catch (err) {
      alert("Failed to create inventory item");
    } finally {
      setSaving(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(inventory.map(i => i.category || 'Uncategorized')))];
  
  const lowStock = inventory.filter(i => (i.quantityOnHand || 0) <= (i.reorderLevel || 0));
  
  const filtered = inventory.filter(i =>
    (cat === 'All' || (i.category || 'Uncategorized') === cat) &&
    (i.name?.toLowerCase().includes(search.toLowerCase()) || i.partNumber?.toLowerCase().includes(search.toLowerCase()))
  );
  
  const totalValue = inventory.reduce((a, i) => a + ((i.quantityOnHand || 0) * (i.unitCost || 0)), 0);

  return (
    <div>
      <SlideOver open={isSlideOpen} onClose={() => setIsSlideOpen(false)} title="Add Inventory Item" subtitle="Register a new part or component in the warehouse.">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Item Name</label>
            <input className="form-input" required placeholder="e.g. Engine Oil Filter (CAT)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Part No. (SKU)</label>
              <input className="form-input" required value={formData.partNumber} onChange={e => setFormData({...formData, partNumber: e.target.value})} />
            </div>
            <div className="form-field">
              <label className="form-label">Category</label>
              <input className="form-input" placeholder="e.g. Filters" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Location (Aisle/Bin)</label>
              <input className="form-input" placeholder="e.g. Shelf A1" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div className="form-field">
              <label className="form-label">Unit of Measure</label>
              <input className="form-input" placeholder="e.g. Unit, L, Kg" required value={formData.unitOfMeasure} onChange={e => setFormData({...formData, unitOfMeasure: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Unit Cost (Est)</label>
              <input type="number" className="form-input" required value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: parseFloat(e.target.value)})} />
            </div>
            <div className="form-field">
              <label className="form-label">Quantity on Hand</label>
              <input type="number" className="form-input" required value={formData.quantityOnHand} onChange={e => setFormData({...formData, quantityOnHand: parseInt(e.target.value)})} />
            </div>
            <div className="form-field">
              <label className="form-label">Reorder Level</label>
              <input type="number" className="form-input" required value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: parseInt(e.target.value)})} />
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Item'}</button>
          </div>
        </form>
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Inventory & Parts</h1>
          <p className="page-subtitle">{inventory.length} SKUs · K {totalValue.toLocaleString()} total value</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm"><Package size={13} /> Stock Take</button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsSlideOpen(true)}><Plus size={13} /> Add Item</button>
        </div>
      </div>

      {lowStock.length > 0 && !loading && (
        <div style={{
          background: 'var(--accent-amber-dim)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertTriangle size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--accent-amber)', fontWeight: 600 }}>
            {lowStock.length} items are at or below reorder level: {lowStock.slice(0, 5).map(i => i.name).join(', ')}{lowStock.length > 5 ? '...' : ''}
          </span>
        </div>
      )}

      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search by name or Part Number…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)} className="btn btn-sm" style={{
                background: cat === c ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                color: cat === c ? 'white' : 'var(--text-secondary)',
                border: '1px solid ' + (cat === c ? 'var(--accent-blue)' : 'var(--border-subtle)'),
                whiteSpace: 'nowrap'
              }}>{c}</button>
            ))}
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Part No.</th>
              <th>Category</th>
              <th>Location</th>
              <th>Unit Cost</th>
              <th>Qty on Hand</th>
              <th>Status</th>
              <th></th>
            </tr>
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
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-tertiary)' }}>{item.partNumber || '—'}</td>
                  <td><span className="badge badge-muted">{item.category || 'Uncategorized'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.location || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>K {item.unitCost?.toLocaleString() || '0'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: isLow ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                        {qty}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.unitOfMeasure || 'Unit'}</span>
                    </div>
                  </td>
                  <td>
                    {isLow
                      ? <span className="badge badge-rose"><AlertTriangle size={10}/> Low Stock</span>
                      : <span className="badge badge-green">In Stock</span>
                    }
                  </td>
                  <td><button className="btn btn-ghost btn-sm" style={{ padding: 4 }}><MoreHorizontal size={14}/></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { Search, Plus, Wrench, AlertTriangle, TrendingUp, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

const statusConfig: Record<number, { label: string; badge: string; dot: string }> = {
  0: { label: 'Operational',    badge: 'badge-green',  dot: 'green' },
  1: { label: 'Under Repair',   badge: 'badge-rose',   dot: 'rose'  },
  2: { label: 'Scheduled PM',   badge: 'badge-amber',  dot: 'amber' },
  3: { label: 'Decommissioned', badge: 'badge-muted',  dot: 'muted' },
};

export default function AssetsPage() {
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', model: '', serialNumber: '', manufacturer: '', departmentId: 1, status: 0 });

  const fetchAssets = () => {
    setLoading(true);
    dashboardApi.getAssets()
      .then(data => setAssets(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dashboardApi.createAsset(formData);
      setIsSlideOpen(false);
      setFormData({ name: '', model: '', serialNumber: '', manufacturer: '', departmentId: 1, status: 0 });
      fetchAssets();
    } catch (err) {
      alert("Failed to register asset");
    } finally {
      setSaving(false);
    }
  };

  const filtered = assets.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.serialNumber?.toLowerCase().includes(search.toLowerCase())
  );
  
  const uniqueDepartments = [...new Set(assets.map(a => a.departmentId))];

  return (
    <div>
      <SlideOver open={isSlideOpen} onClose={() => setIsSlideOpen(false)} title="Register Asset" subtitle="Add new equipment to the fleet registry.">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Asset Name</label>
            <input className="form-input" required placeholder="e.g. CAT 797F Dump Truck" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Manufacturer</label>
              <input className="form-input" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
            </div>
            <div className="form-field">
              <label className="form-label">Model</label>
              <input className="form-input" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Serial Number</label>
              <input className="form-input" required value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
            </div>
            <div className="form-field">
              <label className="form-label">Status</label>
              <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: parseInt(e.target.value)})}>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Register Asset'}</button>
          </div>
        </form>
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Asset Registry</h1>
          <p className="page-subtitle">{assets.length} registered assets across {uniqueDepartments.length} departments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsSlideOpen(true)}><Plus size={14} /> Register Asset</button>
      </div>

      {/* Summary Row */}
      <div className="stats-grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Operational',  value: assets.filter(a=>a.status===0).length,  color: 'var(--accent-emerald)', icon: <TrendingUp size={16}/> },
          { label: 'Under Repair', value: assets.filter(a=>a.status===1).length,  color: 'var(--accent-rose)',    icon: <AlertTriangle size={16}/> },
          { label: 'Scheduled PM', value: assets.filter(a=>a.status===2).length,  color: 'var(--accent-amber)',   icon: <Wrench size={16}/> },
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
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search by name or serial number…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Model / Serial</th>
              <th>Manufacturer</th>
              <th>Department ID</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>Loading assets...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No assets found</td></tr>
            ) : filtered.map(asset => {
              const sc = statusConfig[asset.status] ?? { label: 'Unknown', badge: 'badge-muted', dot: 'muted' };
              return (
                <tr key={asset.id} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ID: {asset.id}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>{asset.model || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>S/N: {asset.serialNumber || '—'}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{asset.manufacturer || '—'}</td>
                  <td><span className="badge badge-muted">Dept #{asset.departmentId || 'Unassigned'}</span></td>
                  <td><span className={`badge ${sc.badge}`}><span className={`status-dot ${sc.dot}`} />{sc.label}</span></td>
                  <td><button className="btn btn-ghost btn-sm" style={{ padding: 4 }}><MoreHorizontal size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

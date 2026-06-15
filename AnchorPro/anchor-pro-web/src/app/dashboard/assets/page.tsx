'use client';

import { Search, Plus, Wrench, AlertTriangle, TrendingUp, Edit2, CheckCircle2, DollarSign, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { dashboardApi, equipmentApi, departmentsApi, intelligenceApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';
import { useDictionary } from '@/lib/DictionaryContext';
import ResponsiveTable from '@/components/ResponsiveTable';

// Equipment entity has no status field — all assets default to Operational
const getAssetStatus = (_asset: any): { label: string; badge: string; dot: string } =>
  ({ label: 'Operational', badge: 'badge-green', dot: 'green' });

const BLANK: { name: string; modelNumber: string; serialNumber: string; manufacturer: string; departmentId: number | null } = { name: '', modelNumber: '', serialNumber: '', manufacturer: '', departmentId: null };

export default function AssetsPage() {
  const { t } = useDictionary();
  const equipLabel = t('Equipment', 'Equipment');

  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideMode, setSlideMode] = useState<'create' | 'edit' | null>(null);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [formData, setFormData] = useState(BLANK);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [departments, setDepartments] = useState<any[]>([]);
  const [assetCosts, setAssetCosts] = useState<Record<number, number>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export/equipment/excel', { credentials: 'include' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equipment-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Failed to export: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/equipment/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      let errMsg = 'Import failed';
      if (!res.ok) {
        try {
          const json = await res.json();
          if (json.message) errMsg = json.message;
          else if (json.errors) errMsg = Object.values(json.errors).flat().join('\n');
        } catch {
          const text = await res.text();
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }
      
      const data = await res.json();
      alert(data.message || 'Import successful!');
      fetchAssets();
    } catch (err: any) {
      console.error('Import error:', err);
      alert('Failed to import: ' + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/export/equipment/template';
  };

  const fetchAssets = () => {
    setLoading(true);
    dashboardApi.getAssets()
      .then(data => setAssets(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
    departmentsApi.getAll()
      .then(d => setDepartments(d || []))
      .catch(() => {});
    // Load lifetime maintenance costs per asset (all-time: 3 years back)
    intelligenceApi.getAssetPerformance(365 * 3)
      .then((perf: any[]) => {
        const map: Record<number, number> = {};
        (perf || []).forEach((p: any) => { map[p.equipmentId] = p.totalMaintenanceCost || 0; });
        setAssetCosts(map);
      })
      .catch(() => {});
  }, []);

  const openCreate = () => { setFormData(BLANK); setEditTarget(null); setSlideMode('create'); };
  const openEdit = (asset: any) => {
    setFormData({ name: asset.name, modelNumber: asset.modelNumber || '', serialNumber: asset.serialNumber || '', manufacturer: asset.manufacturer || '', departmentId: asset.departmentId || 1 });
    setEditTarget(asset);
    setSlideMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (slideMode === 'edit' && editTarget) {
        await equipmentApi.update(editTarget.id, { ...editTarget, ...formData });
      } else {
        await dashboardApi.createAsset(formData);
      }
      setSlideMode(null);
      fetchAssets();
    } catch { alert('Failed to save asset'); }
    finally { setSaving(false); }
  };

  const filtered = assets.filter(a => {
    const matchesSearch = a.name?.toLowerCase().includes(search.toLowerCase()) || a.serialNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'all' || a.departmentId?.toString() === departmentFilter;
    return matchesSearch && matchesDept;
  });
  const uniqueDepartments = [...new Set(assets.map(a => a.departmentId))];

  return (
    <div>
      <SlideOver
        open={!!slideMode}
        onClose={() => setSlideMode(null)}
        title={slideMode === 'edit' ? `Edit — ${editTarget?.name}` : `Register ${equipLabel}`}
        subtitle={slideMode === 'edit' ? 'Update asset details or change operational status.' : 'Add new equipment to the fleet registry.'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field" style={{ marginBottom: 14 }}>
            <label className="form-label">{equipLabel} Name</label>
            <input type="text" className="form-input" required autoFocus value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Caterpillar D9 Bulldozer" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Manufacturer</label>
              <input className="form-input" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="form-label">Model</label>
              <input className="form-input" value={formData.modelNumber} onChange={e => setFormData({ ...formData, modelNumber: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Serial Number</label>
              <input className="form-input" required value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="form-label">Department</label>
              <select className="form-select" value={formData.departmentId || ''} onChange={e => setFormData({ ...formData, departmentId: parseInt(e.target.value) || null })}>
                <option value="">No Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSlideMode(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : slideMode === 'edit' ? 'Save Changes' : `Register ${equipLabel}`}</button>
          </div>
        </form>
      </SlideOver>

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{equipLabel} Registry</h1>
          <p className="page-subtitle">Track, register, and analyze lifetime costs.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload size={14} /> {importing ? 'Importing...' : 'Bulk Import'}
          </button>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Register {equipLabel}</button>
        </div>
      </div>

      <div className="stats-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: `Total ${equipLabel}s`,        value: assets.length,                                            color: 'var(--accent-emerald)', icon: <TrendingUp size={16} /> },
          { label: 'Operational',       value: assets.length,                                            color: 'var(--accent-blue)', icon: <CheckCircle2 size={16} /> },
          { label: `Highest Cost ${equipLabel}`,  value: (() => { const top = Object.entries(assetCosts).sort((a,b)=>b[1]-a[1])[0]; if (!top) return '—'; const a = assets.find(x=>x.id===parseInt(top[0])); return a ? a.name.split(' ').slice(0,2).join(' ') : '—'; })(), color: 'var(--accent-rose)', icon: <AlertTriangle size={16} /> },
          { label: 'Total Value Tracked', value: `K ${Object.values(assetCosts).reduce((a,b)=>a+b,0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, color: 'var(--text-primary)', icon: <DollarSign size={16} /> }
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div className="stat-icon" style={{ background: s.color + '20', marginBottom: 0 }}><span style={{ color: s.color }}>{s.icon}</span></div>
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
          <div style={{ width: 200 }}>
            <select className="form-select" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <ResponsiveTable>
          <table className="data-table">
            <thead>
              <tr><th>{equipLabel}</th><th>Model / Serial</th><th>Manufacturer</th><th>Department</th><th>Status</th><th style={{ textAlign: 'right' }}>Lifetime Cost</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0' }}>Loading assets...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No {equipLabel.toLowerCase()}s found</td></tr>
              ) : filtered.sort((a,b) => (assetCosts[b.id]||0) - (assetCosts[a.id]||0)).map(asset => {
                const sc = getAssetStatus(asset);
                const lifetimeCost = assetCosts[asset.id] || 0;
                const isTopCost = lifetimeCost > 0 && lifetimeCost === Math.max(...Object.values(assetCosts));
                return (
                  <tr key={asset.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(asset)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isTopCost && <span title={`Highest maintenance cost ${equipLabel.toLowerCase()}`} style={{ fontSize: 10, background: 'var(--accent-rose-dim)', color: 'var(--accent-rose)', border: '1px solid var(--accent-rose)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>⚠ HIGH</span>}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ID: {asset.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13 }}>{asset.modelNumber || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>S/N: {asset.serialNumber || '—'}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{asset.manufacturer || '—'}</td>
                    <td><span className="badge badge-muted">{departments.find(d => d.id === asset.departmentId)?.name || (asset.departmentId ? `Dept #${asset.departmentId}` : '—')}</span></td>
                    <td><span className={`badge ${sc.badge}`}><span className={`status-dot ${sc.dot}`} />{sc.label}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: lifetimeCost > 0 ? (isTopCost ? 'var(--accent-rose)' : 'var(--text-primary)') : 'var(--text-muted)', fontSize: 13 }}>
                      {lifetimeCost > 0 ? `K ${lifetimeCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => openEdit(asset)}><Edit2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>
    </div>
  );
}

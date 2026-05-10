'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, MoreHorizontal, Building2, Users, DollarSign, X, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { platformApi } from '@/lib/api';

interface NewTenantForm {
  companyName: string; industry: string; adminEmail: string;
  adminFirstName: string; adminLastName: string; adminPassword: string;
}

const BLANK: NewTenantForm = { companyName: '', industry: '', adminEmail: '', adminFirstName: '', adminLastName: '', adminPassword: '' };

const INDUSTRIES = [
  'Mining & Extraction', 'Manufacturing', 'Facilities Management',
  'Logistics & Fleet', 'Construction', 'Utilities & Energy',
  'Healthcare', 'Agriculture', 'Other',
];

export default function TenantsPage() {
  const [tenants, setTenants]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [offline, setOffline]     = useState(false);
  const [search,  setSearch]      = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [form,    setForm]        = useState<NewTenantForm>(BLANK);
  const [saving,  setSaving]      = useState(false);
  const [saveErr, setSaveErr]     = useState<string | null>(null);
  const [actId,   setActId]       = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await platformApi.getTenants();
      setTenants(Array.isArray(data) ? data : []);
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    return (t.name ?? t.companyName ?? '').toLowerCase().includes(q) ||
           (t.domain ?? '').toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveErr(null);
    try {
      await platformApi.getTenants(); // verify connection first
      // Use auth/register to create a new tenant + admin
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName:   form.companyName,
          industry:      form.industry,
          email:         form.adminEmail,
          firstName:     form.adminFirstName,
          lastName:      form.adminLastName,
          password:      form.adminPassword,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Error ${res.status}`);
      }
      setShowNew(false);
      setForm(BLANK);
      await load();
    } catch (e: unknown) {
      setSaveErr(e instanceof Error ? e.message : 'Failed to create tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async (id: number, currentStatus: string) => {
    setActId(id);
    try {
      if ((currentStatus ?? '').toLowerCase() === 'active') {
        await platformApi.suspendTenant(id);
      }
      await load();
    } catch {
      // silently refresh — status may have changed
      await load();
    } finally {
      setActId(null);
    }
  };

  const totalMrr   = tenants.reduce((a, t) => a + (t.mrr ?? 0), 0);
  const totalUsers = tenants.reduce((a, t) => a + (t.userCount ?? t.users ?? 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Tenant Registry</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            All companies registered on the Anchor Pro platform
            {offline && <span style={{ color: 'var(--accent-amber)', marginLeft: 8 }}>⚠ Offline</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
          </button>
          <button className="btn btn-primary" onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14}/> New Tenant
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Tenants',      value: loading ? '…' : tenants.length,                                                  color: 'var(--accent-blue)',    icon: <Building2 size={16}/> },
          { label: 'Total Platform Users', value: loading ? '…' : totalUsers || '—',                                              color: 'var(--accent-emerald)', icon: <Users size={16}/> },
          { label: 'Combined MRR',       value: loading ? '…' : totalMrr ? `K ${totalMrr.toLocaleString()}` : '—',               color: 'var(--accent-violet)',  icon: <DollarSign size={16}/> },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div className="stat-icon" style={{ background: s.color+'20', marginBottom: 0 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
              <div className="stat-label" style={{ margin: 0 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search companies or domains…"
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading tenants…</div>
        ) : offline ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <AlertTriangle size={28} style={{ color: 'var(--accent-amber)', marginBottom: 8 }}/>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Could not reach the API. Check your backend connection.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {search ? 'No tenants match your search' : 'No tenants yet — create one above'}
          </div>
        ) : (
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Company</th><th>Plan</th><th>Users</th><th>MRR</th><th>Joined</th><th>Status</th><th>Control</th></tr>
            </thead>
            <tbody>
              {filtered.map((t: any) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{(t.name ?? t.companyName ?? '?')[0]}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{t.name ?? t.companyName}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.domain ?? `ID: ${t.id}`}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{t.plan ?? t.planName ?? 'N/A'}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.userCount ?? t.users ?? '—'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{t.mrr ? `K ${t.mrr.toLocaleString()}` : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : t.joined ?? '—'}</td>
                  <td>
                    <span className={`badge ${(t.status ?? '').toLowerCase() === 'active' ? 'badge-green' : 'badge-amber'}`}>
                      <span className={`status-dot ${(t.status ?? '').toLowerCase() === 'active' ? 'green' : 'amber'}`}/>
                      {t.status ?? 'Unknown'}
                    </span>
                  </td>
                  <td>
                    {(t.status ?? '').toLowerCase() === 'active' ? (
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--accent-amber)' }}
                        disabled={actId === t.id}
                        onClick={() => handleSuspend(t.id, t.status)}>
                        {actId === t.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }}/> : 'Suspend'}
                      </button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                        <MoreHorizontal size={14}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-tertiary)' }}>
          {loading ? 'Loading…' : `${filtered.length} tenant${filtered.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* ── New Tenant Slide-over ── */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)' }} onClick={() => setShowNew(false)}/>
          <div style={{ position: 'relative', width: 460, background: 'var(--bg-page)', borderLeft: '1px solid var(--border-default)', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Provision New Tenant</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Creates company workspace + admin account</div>
              </div>
              <button onClick={() => setShowNew(false)} className="btn btn-ghost btn-sm" style={{ padding: 6 }}><X size={16}/></button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              {saveErr && (
                <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14}/> {saveErr}
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: -8 }}>Organisation</div>

              <div className="form-field">
                <label className="form-label">Company Name *</label>
                <input className="form-input" placeholder="Acme Operations Ltd" value={form.companyName}
                  onChange={e => setForm(f => ({...f, companyName: e.target.value}))} required/>
              </div>

              <div className="form-field">
                <label className="form-label">Industry</label>
                <select className="form-select" value={form.industry} onChange={e => setForm(f => ({...f, industry: e.target.value}))}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4, marginBottom: -8 }}>Admin Account</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-field">
                  <label className="form-label">First Name *</label>
                  <input className="form-input" placeholder="Jane" value={form.adminFirstName}
                    onChange={e => setForm(f => ({...f, adminFirstName: e.target.value}))} required/>
                </div>
                <div className="form-field">
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" placeholder="Doe" value={form.adminLastName}
                    onChange={e => setForm(f => ({...f, adminLastName: e.target.value}))} required/>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Admin Email *</label>
                <input className="form-input" type="email" placeholder="admin@company.com" value={form.adminEmail}
                  onChange={e => setForm(f => ({...f, adminEmail: e.target.value}))} required/>
              </div>

              <div className="form-field">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" placeholder="Min 8 characters" value={form.adminPassword}
                  onChange={e => setForm(f => ({...f, adminPassword: e.target.value}))} required minLength={8}/>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Leave blank to use default: <code style={{ color: 'var(--accent-blue)' }}>Anchor@1234!</code>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/> Creating…</> : <><Plus size={14}/> Create Tenant</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

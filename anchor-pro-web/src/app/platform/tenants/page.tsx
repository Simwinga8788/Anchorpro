'use client';

import { Plus, Search, MoreHorizontal, Building2, Users, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const tenants = [
  { id: 1, name: 'Anchor Corp',  domain: 'anchor.com',       plan: 'Professional', status: 'Active',   users: 12, mrr: 2500, joined: 'Jan 2026', owner: 'anchorcorp@anchor.com' },
  { id: 2, name: 'Anchor Pro',   domain: 'anchorpro.co.zm',  plan: 'Professional', status: 'Active',   users: 12, mrr: 2500, joined: 'Feb 2026', owner: 'admin@anchorpro.co.zm' },
  { id: 3, name: 'Anchor Pro',   domain: 'anchorpro2.co.zm', plan: 'Professional', status: 'Active',   users: 12, mrr: 3000, joined: 'Mar 2026', owner: 'admin2@anchorpro.co.zm' },
];

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const filtered = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.domain.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Tenant Registry</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>All companies registered on the Anchor Pro platform</p>
        </div>
        <button className="btn btn-primary"><Plus size={14}/> New Tenant</button>
      </div>

      {/* Summary */}
      <div className="stats-grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Environments', value: tenants.length, color: 'var(--accent-blue)', icon: <Building2 size={16}/> },
          { label: 'Total Platform Users', value: tenants.reduce((a,t) => a+t.users, 0), color: 'var(--accent-emerald)', icon: <Users size={16}/> },
          { label: 'Combined MRR', value: `K ${tenants.reduce((a,t) => a+t.mrr, 0).toLocaleString()}`, color: 'var(--accent-violet)', icon: <ArrowRight size={16}/> },
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
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search companies, domains or IDs…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Company</th><th>Domain</th><th>Plan & Billing</th><th>Users</th><th>Activity</th><th>MRR</th><th>Status</th><th>Control</th></tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} style={{ cursor: 'pointer' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{t.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {t.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{t.domain}</td>
                <td><span className="badge badge-blue">{t.plan}</span></td>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.users}</td>
                <td>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t.users} Users</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last login: 2m ago</div>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>K {t.mrr.toLocaleString()}</td>
                <td><span className="badge badge-green"><span className="status-dot green"/>Active</span></td>
                <td><button className="btn btn-ghost btn-sm" style={{ padding: 4 }}><MoreHorizontal size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-tertiary)' }}>
          Showing {filtered.length} environments
        </div>
      </div>
    </div>
  );
}

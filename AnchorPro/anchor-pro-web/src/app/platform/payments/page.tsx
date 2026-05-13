'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { platformApi, subscriptionsApi } from '@/lib/api';

const statusConfig: Record<string, { badge: string; icon: React.ReactNode }> = {
  Active:    { badge: 'badge-green', icon: <CheckCircle2 size={11}/> },
  Trial:     { badge: 'badge-blue',  icon: <Clock size={11}/> },
  Suspended: { badge: 'badge-rose',  icon: <XCircle size={11}/> },
  Cancelled: { badge: 'badge-muted', icon: <XCircle size={11}/> },
};

function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: string }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />;
}

export default function PaymentsPage() {
  const [tenants,  setTenants]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [search,   setSearch]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await platformApi.getTenants();
      setTenants(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSuspend = async (id: number) => {
    if (!confirm('Suspend this tenant subscription?')) return;
    setActionId(id);
    try {
      await subscriptionsApi.suspend(id, { reason: 'Suspended by platform admin' });
      load();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReactivate = async (id: number) => {
    setActionId(id);
    try {
      await subscriptionsApi.reactivate(id, { reason: 'Reactivated by platform admin' });
      load();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const filtered = tenants.filter(t => {
    const name = (t.companyName ?? t.name ?? '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Tenant Subscriptions</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Manage subscription status per tenant · GET /api/tenants</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent-rose-dim)', border: '1px solid var(--accent-rose)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: 'var(--accent-rose)' }}>
          <AlertTriangle size={14}/> {error}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <input
          className="search-input"
          style={{ width: 280, paddingLeft: 12 }}
          placeholder="Search tenants..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => <td key={j}><Skeleton h={14}/></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 13 }}>
                    {tenants.length === 0 ? 'No tenants yet' : 'No results for your search'}
                  </td>
                </tr>
              ) : (
                filtered.map((t: any) => {
                  const status = t.isActive === false ? 'Suspended' : (t.subscriptionStatus ?? t.status ?? 'Active');
                  const cfg = statusConfig[status] ?? statusConfig['Active'];
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.companyName ?? t.name ?? `Tenant #${t.id}`}</td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{t.domain ?? '—'}</td>
                      <td>
                        <span className={`badge ${cfg.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {cfg.icon} {status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.subscriptionPlan ?? t.planName ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {t.isActive !== false ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11 }}
                              disabled={actionId === t.id}
                              onClick={() => handleSuspend(t.id)}
                            >
                              {actionId === t.id ? '...' : 'Suspend'}
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: 11 }}
                              disabled={actionId === t.id}
                              onClick={() => handleReactivate(t.id)}
                            >
                              {actionId === t.id ? '...' : 'Reactivate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, XCircle, RefreshCw, AlertTriangle, FileCheck, X } from 'lucide-react';
import { platformApi, subscriptionsApi } from '@/lib/api';

function ProofPreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  const isPdf = /\.pdf($|\?)/i.test(url);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: 20 }} onClick={onClose}>
      <div className="card-elevated" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent-blue)', textDecoration: 'none' }}>Open in new tab</a>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6 }} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-page)', display: 'flex', alignItems: isPdf ? 'stretch' : 'center', justifyContent: 'center' }}>
          {isPdf ? <iframe src={url} title="Proof of payment" style={{ width: '100%', height: '100%', border: 'none' }} /> : <img src={url} alt="Proof of payment" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
        </div>
      </div>
    </div>
  );
}

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

  const [proofs, setProofs] = useState<any[]>([]);
  const [proofsLoading, setProofsLoading] = useState(true);
  const [proofActionId, setProofActionId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const loadProofs = async () => {
    setProofsLoading(true);
    try {
      const data = await subscriptionsApi.getPaymentProofs('Pending');
      setProofs(Array.isArray(data) ? data : []);
    } catch {
      setProofs([]);
    } finally {
      setProofsLoading(false);
    }
  };

  useEffect(() => { load(); loadProofs(); }, []);

  const handleApproveProof = async (id: number) => {
    setProofActionId(id);
    try {
      await subscriptionsApi.approvePaymentProof(id);
      await Promise.all([loadProofs(), load()]);
    } catch (e: any) {
      alert(e.message || 'Failed to approve payment');
    } finally {
      setProofActionId(null);
    }
  };

  const handleRejectProof = async (id: number) => {
    const reason = prompt('Reason for rejecting this payment proof:');
    if (reason === null) return;
    setProofActionId(id);
    try {
      await subscriptionsApi.rejectPaymentProof(id, reason);
      await loadProofs();
    } catch (e: any) {
      alert(e.message || 'Failed to reject payment');
    } finally {
      setProofActionId(null);
    }
  };

  const handleSuspend = async (subscriptionId: number) => {
    if (!subscriptionId) { alert('No active subscription found'); return; }
    if (!confirm('Suspend this tenant subscription?')) return;
    setActionId(subscriptionId);
    try {
      await subscriptionsApi.suspend(subscriptionId, { reason: 'Suspended by platform admin' });
      load();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReactivateSub = async (subscriptionId: number) => {
    if (!subscriptionId) { alert('No active subscription found'); return; }
    setActionId(subscriptionId);
    try {
      await subscriptionsApi.reactivate(subscriptionId, { reason: 'Reactivated by platform admin' });
      load();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleActivateTenant = async (tenantId: number) => {
    setActionId(tenantId);
    try {
      await platformApi.activateTenant(tenantId);
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

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileCheck size={16} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Payment Proofs Awaiting Review</span>
            {proofs.length > 0 && <span className="badge badge-amber" style={{ fontSize: 10 }}>{proofs.length} pending</span>}
          </div>
        </div>

        {proofsLoading ? (
          <Skeleton h={40} />
        ) : proofs.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '8px 0' }}>No payment proofs waiting for review.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proofs.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.tenantName ?? `Tenant #${p.id}`} — {p.currency} {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    {p.planName ?? 'Plan N/A'} · {p.paymentMethod}{p.transactionReference ? ` · Ref: ${p.transactionReference}` : ''} · {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                  {p.notes && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontStyle: 'italic' }}>“{p.notes}”</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }} onClick={() => setPreviewUrl(p.proofDocumentUrl)}>View Proof</button>
                  <button className="btn btn-success btn-sm" style={{ fontSize: 11 }} disabled={proofActionId === p.id} onClick={() => handleApproveProof(p.id)}>
                    {proofActionId === p.id ? '...' : 'Approve'}
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: 11, color: 'var(--accent-rose)' }} disabled={proofActionId === p.id} onClick={() => handleRejectProof(p.id)}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  const isTenantDeactivated = t.status === 'Deactivated';
                  const isSubSuspended = t.subscriptionStatus === 'Suspended';
                  
                  let displayStatus = 'Active';
                  if (isTenantDeactivated) displayStatus = 'Tenant Deactivated';
                  else if (isSubSuspended) displayStatus = 'Suspended';
                  else displayStatus = t.subscriptionStatus ?? 'Active';

                  const cfg = statusConfig[displayStatus] ?? { badge: 'badge-gray', icon: <XCircle size={12}/> };

                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name ?? `Tenant #${t.id}`}</td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{t.domain ?? '—'}</td>
                      <td>
                        <span className={`badge ${cfg.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {cfg.icon} {displayStatus}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.plan ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {isTenantDeactivated ? (
                            <button
                              className="btn btn-success btn-sm"
                              style={{ fontSize: 11 }}
                              disabled={actionId === t.id}
                              onClick={() => handleActivateTenant(t.id)}
                            >
                              {actionId === t.id ? '...' : 'Activate Tenant'}
                            </button>
                          ) : isSubSuspended ? (
                            <button
                              className="btn btn-success btn-sm"
                              style={{ fontSize: 11 }}
                              disabled={actionId === t.subscriptionId || !t.subscriptionId}
                              onClick={() => handleReactivateSub(t.subscriptionId)}
                            >
                              {actionId === t.subscriptionId ? '...' : 'Reactivate Sub'}
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11 }}
                              disabled={actionId === t.subscriptionId || !t.subscriptionId}
                              onClick={() => handleSuspend(t.subscriptionId)}
                            >
                              {actionId === t.subscriptionId ? '...' : 'Suspend Sub'}
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
      {previewUrl && <ProofPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
}

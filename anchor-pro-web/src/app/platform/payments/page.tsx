'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, XCircle, Download, Plus, MoreHorizontal, RefreshCw, AlertTriangle, Loader2, X } from 'lucide-react';
import { platformApi } from '@/lib/api';

// ── Mock fallback when API has no /api/platform/payments endpoint ──────────
const MOCK_PAYMENTS = [
  { id: 'TXN-2604-001', tenant: 'Anchor Corp',  plan: 'Professional', amount: 2500, method: 'Bank Transfer', date: '2026-04-01', status: 'Paid',    proof: true },
  { id: 'TXN-2604-002', tenant: 'Anchor Pro',   plan: 'Professional', amount: 2500, method: 'Bank Transfer', date: '2026-04-01', status: 'Paid',    proof: true },
  { id: 'TXN-2604-003', tenant: 'Anchor Pro',   plan: 'Professional', amount: 3000, method: 'Bank Transfer', date: '2026-04-12', status: 'Pending', proof: true },
];

const statusConfig: Record<string, { badge: string; icon: React.ReactNode }> = {
  Paid:    { badge: 'badge-green', icon: <CheckCircle2 size={11}/> },
  Pending: { badge: 'badge-amber', icon: <Clock size={11}/> },
  Failed:  { badge: 'badge-rose',  icon: <XCircle size={11}/> },
  Waived:  { badge: 'badge-muted', icon: <CheckCircle2 size={11}/> },
};

interface RecordForm { tenantId: string; amount: string; method: string; reference: string }

export default function PaymentsPage() {
  const [payments, setPayments]   = useState<any[]>(MOCK_PAYMENTS);
  const [loading,  setLoading]    = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [form,     setForm]       = useState<RecordForm>({ tenantId: '', amount: '', method: 'Bank Transfer', reference: '' });
  const [saving,   setSaving]     = useState(false);
  const [saveErr,  setSaveErr]    = useState<string | null>(null);
  const [actId,    setActId]      = useState<string | null>(null);

  // Payments don't have a dedicated platform endpoint in the docs yet —
  // using Stripe billing/checkout for new subscriptions, payments list is manual for now.
  // When backend exposes /api/platform/payments, swap this out.
  const load = async () => {
    setLoading(true);
    try {
      const data = await platformApi.getTenants();
      // For now keep mock data; in future fetch from dedicated payments endpoint
      if (Array.isArray(data) && data.length > 0) {
        // Could derive payments from tenant subscription data here
      }
    } catch {
      // Keep mock data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setActId(id);
    try {
      // Optimistic update
      setPayments(ps => ps.map(p => p.id === id ? { ...p, status: 'Paid' } : p));
      // POST to backend when endpoint is available:
      // await platformApi.approvePayment(Number(id));
    } finally {
      setActId(null);
    }
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveErr(null);
    try {
      // When backend has /api/platform/payments:
      // await platformApi.recordPayment({ tenantId: Number(form.tenantId), amount: Number(form.amount), method: form.method, reference: form.reference });
      const newPmt = {
        id: `TXN-${Date.now()}`, tenant: `Tenant ${form.tenantId}`,
        plan: 'Professional', amount: Number(form.amount),
        method: form.method, date: new Date().toISOString().split('T')[0],
        status: 'Paid', proof: false,
      };
      setPayments(ps => [newPmt, ...ps]);
      setShowForm(false);
      setForm({ tenantId: '', amount: '', method: 'Bank Transfer', reference: '' });
    } catch (e: unknown) {
      setSaveErr(e instanceof Error ? e.message : 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const totalCollected = payments.filter(p => p.status === 'Paid').reduce((a, p) => a + p.amount, 0);
  const totalPending   = payments.filter(p => p.status === 'Pending').reduce((a, p) => a + p.amount, 0);
  const thisMonth      = payments.filter(p => p.status === 'Paid' && (p.date ?? '').includes('04')).reduce((a, p) => a + p.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Payments & Billing</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Subscription revenue, proof of payment approvals and transaction history</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
          </button>
          <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={13}/> Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13}/> Record Payment
          </button>
        </div>
      </div>

      <div className="stats-grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Collected This Month', value: `K ${thisMonth.toLocaleString()}`,     color: 'var(--accent-emerald)' },
          { label: 'Pending Approval',     value: `K ${totalPending.toLocaleString()}`,  color: 'var(--accent-amber)' },
          { label: 'Total YTD Collected',  value: `K ${totalCollected.toLocaleString()}`, color: 'var(--accent-blue)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: 20 }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {payments.some(p => p.status === 'Pending') && (
        <div style={{ background: 'var(--accent-amber-dim)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={16} style={{ color: 'var(--accent-amber)' }}/>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-amber)' }}>
              {payments.filter(p => p.status === 'Pending').length} payment(s) awaiting proof of payment verification
            </span>
          </div>
          <button className="btn btn-sm" style={{ background: 'var(--accent-amber)', color: 'black', fontWeight: 700 }}>
            Review Now
          </button>
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <div><div className="section-title">Transaction History</div><div className="section-sub">All payment records across tenants</div></div>
        </div>
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr><th>Transaction ID</th><th>Tenant</th><th>Plan</th><th>Method</th><th>Date</th><th>Proof</th><th>Status</th><th style={{ textAlign: 'right' }}>Amount</th><th/></tr>
          </thead>
          <tbody>
            {payments.map(p => {
              const sc = statusConfig[p.status] ?? statusConfig['Paid'];
              return (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-blue)', fontWeight: 700 }}>{p.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 22, height: 22, fontSize: 9 }}>{(p.tenant ?? '?')[0]}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.tenant}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-muted">{p.plan}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{p.method}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{p.date}</td>
                  <td>
                    <span className={`badge ${p.proof ? 'badge-green' : 'badge-muted'}`}>
                      {p.proof ? <><CheckCircle2 size={10}/> Uploaded</> : 'None'}
                    </span>
                  </td>
                  <td><span className={`badge ${sc.badge}`}>{sc.icon} {p.status}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>K {p.amount.toLocaleString()}</td>
                  <td>
                    {p.status === 'Pending' ? (
                      <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }} disabled={actId === p.id} onClick={() => handleApprove(p.id)}>
                        {actId === p.id ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }}/> : 'Approve'}
                      </button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ padding: 4 }}><MoreHorizontal size={13}/></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* ── Record Payment Slide-over ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)' }} onClick={() => setShowForm(false)}/>
          <div style={{ position: 'relative', width: 420, background: 'var(--bg-page)', borderLeft: '1px solid var(--border-default)', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Record Payment</div>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm" style={{ padding: 6 }}><X size={16}/></button>
            </div>
            <form onSubmit={handleRecord} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {saveErr && (
                <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444' }}>
                  <AlertTriangle size={13}/> {saveErr}
                </div>
              )}
              <div className="form-field">
                <label className="form-label">Tenant ID *</label>
                <input className="form-input" placeholder="Tenant ID or name" value={form.tenantId} onChange={e => setForm(f => ({...f, tenantId: e.target.value}))} required/>
              </div>
              <div className="form-field">
                <label className="form-label">Amount (K) *</label>
                <input className="form-input" type="number" min="0" placeholder="2500" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} required/>
              </div>
              <div className="form-field">
                <label className="form-label">Payment Method *</label>
                <select className="form-select" value={form.method} onChange={e => setForm(f => ({...f, method: e.target.value}))}>
                  <option>Bank Transfer</option>
                  <option>Mobile Money</option>
                  <option>Cash</option>
                  <option>Stripe</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Reference / Notes</label>
                <input className="form-input" placeholder="Bank ref, receipt number…" value={form.reference} onChange={e => setForm(f => ({...f, reference: e.target.value}))}/>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/> Saving…</> : 'Record Payment'}
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

'use client';

import { CheckCircle2, Clock, XCircle, Download, Plus, MoreHorizontal } from 'lucide-react';

const payments = [
  { id: 'TXN-2604-001', tenant: 'Anchor Corp',  plan: 'Professional', amount: 2500, method: 'Bank Transfer',  date: 'Apr 1',  status: 'Paid',    proof: true },
  { id: 'TXN-2604-002', tenant: 'Anchor Pro',   plan: 'Professional', amount: 2500, method: 'Bank Transfer',  date: 'Apr 1',  status: 'Paid',    proof: true },
  { id: 'TXN-2604-003', tenant: 'Anchor Pro',   plan: 'Professional', amount: 3000, method: 'Bank Transfer',  date: 'Apr 12', status: 'Pending', proof: true },
  { id: 'TXN-2604-004', tenant: 'Anchor Corp',  plan: 'Professional', amount: 2500, method: 'Bank Transfer',  date: 'Mar 1',  status: 'Paid',    proof: true },
  { id: 'TXN-2604-005', tenant: 'Anchor Pro',   plan: 'Professional', amount: 2500, method: 'Bank Transfer',  date: 'Mar 1',  status: 'Paid',    proof: true },
  { id: 'TXN-2604-006', tenant: 'Anchor Pro',   plan: 'Professional', amount: 3000, method: 'Mobile Money',   date: 'Mar 1',  status: 'Paid',    proof: true },
];

const statusConfig: Record<string, { badge: string; icon: React.ReactNode }> = {
  Paid:     { badge: 'badge-green', icon: <CheckCircle2 size={11}/> },
  Pending:  { badge: 'badge-amber', icon: <Clock size={11}/> },
  Failed:   { badge: 'badge-rose',  icon: <XCircle size={11}/> },
  Waived:   { badge: 'badge-muted', icon: <CheckCircle2 size={11}/> },
};

export default function PaymentsPage() {
  const totalCollected = payments.filter(p => p.status === 'Paid').reduce((a, p) => a + p.amount, 0);
  const totalPending   = payments.filter(p => p.status === 'Pending').reduce((a, p) => a + p.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Payments & Billing</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Subscription revenue, proof of payment approvals and transaction history</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm"><Download size={13}/> Export</button>
          <button className="btn btn-primary btn-sm"><Plus size={13}/> Record Payment</button>
        </div>
      </div>

      <div className="stats-grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Collected This Month', value: `K ${payments.filter(p=>p.status==='Paid'&&p.date.includes('Apr')).reduce((a,p)=>a+p.amount,0).toLocaleString()}`, color: 'var(--accent-emerald)' },
          { label: 'Pending Approval',     value: `K ${totalPending.toLocaleString()}`,    color: 'var(--accent-amber)' },
          { label: 'Total YTD Collected',  value: `K ${totalCollected.toLocaleString()}`,  color: 'var(--accent-blue)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: 20 }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pending Approvals Banner */}
      {payments.some(p => p.status === 'Pending') && (
        <div style={{
          background: 'var(--accent-amber-dim)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={16} style={{ color: 'var(--accent-amber)' }} />
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
        <table className="data-table">
          <thead>
            <tr><th>Transaction ID</th><th>Tenant</th><th>Plan</th><th>Method</th><th>Date</th><th>Proof</th><th>Status</th><th style={{ textAlign: 'right' }}>Amount</th><th></th></tr>
          </thead>
          <tbody>
            {payments.map(p => {
              const sc = statusConfig[p.status] ?? statusConfig['Paid'];
              return (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-blue)', fontWeight: 700 }}>{p.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 22, height: 22, fontSize: 9 }}>{p.tenant[0]}</div>
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
                      <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }}>Approve</button>
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
  );
}

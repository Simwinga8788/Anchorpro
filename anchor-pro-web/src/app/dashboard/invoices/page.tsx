'use client';

import { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle2, AlertTriangle, Search, Filter, Plus, CreditCard, ExternalLink } from 'lucide-react';
import { financialApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

const statusMap: Record<number, { label: string; badge: string }> = {
  0: { label: 'Unpaid', badge: 'badge-rose' },
  1: { label: 'Partial', badge: 'badge-amber' },
  2: { label: 'Paid', badge: 'badge-green' },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showPayment, setShowPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [savingObj, setSavingObj] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([financialApi.getInvoices(), financialApi.getSnapshot()])
      .then(([inv, snap]) => {
        setInvoices(inv || []);
        setSnapshot(snap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    setSavingObj(true);
    try {
      await financialApi.recordPayment(selectedInvoice.id, {
        amount: parseFloat(paymentAmount),
        paymentMethod: paymentMethod,
        paymentDate: new Date().toISOString(),
        referenceId: `REF-${Math.floor(Math.random()*10000)}`
      });
      setShowPayment(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      loadData();
    } catch(err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingObj(false);
    }
  };

  const filtered = invoices.filter(i => 
    i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    (i.customer?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <SlideOver open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment" subtitle={`Invoice ${selectedInvoice?.invoiceNumber}`}>
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div style={{ padding: 16, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 10 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                 <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Invoice</span>
                 <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>K {selectedInvoice.total.toLocaleString()}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Current Balance</span>
                 <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-rose)' }}>K {selectedInvoice.balance.toLocaleString()}</span>
               </div>
             </div>

             <div className="form-field">
               <label className="form-label">Payment Amount (K)</label>
               <input className="form-input" required type="number" step="0.01" max={selectedInvoice.balance} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
             </div>

             <div className="form-field">
               <label className="form-label">Payment Method</label>
               <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                 <option>Bank Transfer</option>
                 <option>Credit Card</option>
                 <option>Cash</option>
                 <option>Mobile Money</option>
               </select>
             </div>

             <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
               <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPayment(false)}>Cancel</button>
               <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingObj}>{savingObj ? 'Processing...' : 'Record Payment'}</button>
             </div>
          </form>
        )}
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Invoices & Billing</h1>
          <p className="page-subtitle">Track receivables, record payments, and monitor cash flow.</p>
        </div>
        <button className="btn btn-primary"><Plus size={14}/> Create Invoice</button>
      </div>

      {snapshot && (
        <div className="stats-grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: 'Revenue (MTD)', value: `K ${snapshot.totalRevenueMTD.toLocaleString(undefined, {minimumFractionDigits:0})}`, color: 'var(--accent-emerald)', icon: <DollarSign size={16}/> },
            { label: 'Collected (MTD)', value: `K ${snapshot.totalCollectedMTD.toLocaleString(undefined, {minimumFractionDigits:0})}`, color: 'var(--accent-blue)', icon: <CreditCard size={16}/> },
            { label: 'Outstanding Balance', value: `K ${snapshot.totalOutstanding.toLocaleString(undefined, {minimumFractionDigits:0})}`, color: 'var(--accent-amber)', icon: <AlertTriangle size={16}/> },
            { label: 'Unpaid Invoices', value: snapshot.unpaidInvoiceCount, color: 'var(--accent-rose)', icon: <FileText size={16}/> },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.color + '20' }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="search-input" 
              style={{ width: '100%', paddingLeft: 30 }} 
              placeholder="Search invoices or customers..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <button className="btn btn-secondary btn-sm"><Filter size={13}/> Filter</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Job Card</th>
              <th>Issued</th>
              <th>Due</th>
              <th>Total Amount</th>
              <th>Balance</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px 0' }}>Loading financial records...</td></tr>
            ) : filtered.length === 0 ? (
               <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No invoices found.</td></tr>
            ) : filtered.map(inv => {
              const statusInfo = statusMap[inv.paymentStatus] || { label: 'Unknown', badge: 'badge-muted' };
              const isOverdue = new Date(inv.dueDate) < new Date() && inv.balance > 0;
              return (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-blue)', fontSize: 13 }}>{inv.invoiceNumber}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.customer?.name || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{inv.jobCardId ? `JOB-${inv.jobCardId}` : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td style={{ fontSize: 12, color: isOverdue ? 'var(--accent-rose)' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>K {inv.total.toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: inv.balance > 0 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>K {inv.balance.toLocaleString()}</td>
                  <td>
                     <span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span>
                     {isOverdue && <span className="badge badge-rose" style={{ marginLeft: 6 }}>Overdue</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {inv.paymentStatus !== 2 && (
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        setSelectedInvoice(inv);
                        setPaymentAmount(inv.balance.toString());
                        setShowPayment(true);
                      }}>Receive</button>
                    )}
                    {inv.paymentStatus === 2 && (
                      <button className="btn btn-ghost btn-sm" title="View"><ExternalLink size={14}/></button>
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

'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign, FileText, CheckCircle2, AlertTriangle,
  Search, Filter, Plus, CreditCard, ExternalLink, Zap
} from 'lucide-react';
import { financialApi, dashboardApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

const statusMap: Record<number, { label: string; badge: string }> = {
  0: { label: 'Unpaid',  badge: 'badge-rose' },
  1: { label: 'Partial', badge: 'badge-amber' },
  2: { label: 'Paid',    badge: 'badge-green' },
};

export default function InvoicesPage() {
  const [invoices, setInvoices]     = useState<any[]>([]);
  const [snapshot, setSnapshot]     = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');

  // Record payment
  const [showPayment, setShowPayment]           = useState(false);
  const [selectedInvoice, setSelectedInvoice]   = useState<any>(null);
  const [paymentAmount, setPaymentAmount]       = useState('');
  const [paymentMethod, setPaymentMethod]       = useState('Bank Transfer');
  const [savingPayment, setSavingPayment]       = useState(false);

  // Create invoice
  const [showCreate, setShowCreate]             = useState(false);
  const [createMode, setCreateMode]             = useState<'from-job' | 'adhoc'>('from-job');
  const [completedJobs, setCompletedJobs]       = useState<any[]>([]);
  const [jobsLoading, setJobsLoading]           = useState(false);
  const [savingInvoice, setSavingInvoice]       = useState(false);
  const [fromJobId, setFromJobId]               = useState('');
  const [adHocForm, setAdHocForm]               = useState({
    customerId: '', description: '', amount: '', dueDate: '',
  });
  const [customers, setCustomers]               = useState<any[]>([]);

  const loadData = () => {
    setLoading(true);
    Promise.all([financialApi.getInvoices(), financialApi.getSnapshot()])
      .then(([inv, snap]) => { setInvoices(inv || []); setSnapshot(snap); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // Load jobs & customers when Create Invoice panel opens
  useEffect(() => {
    if (!showCreate) return;
    setJobsLoading(true);
    Promise.all([dashboardApi.getJobCards(), dashboardApi.getCustomers()])
      .then(([jobs, custs]) => {
        // Show completed (status 3) and confirmed (status 4) jobs that don't already have invoices
        const invoicedJobIds = new Set(invoices.map((i: any) => i.jobCardId).filter(Boolean));
        setCompletedJobs(
          (jobs || []).filter((j: any) => (j.status === 3 || j.status === 4) && !invoicedJobIds.has(j.id))
        );
        setCustomers(custs || []);
      })
      .catch(console.error)
      .finally(() => setJobsLoading(false));
  }, [showCreate]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSavingPayment(true);
    try {
      await financialApi.recordPayment({invoiceId: selectedInvoice.id,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        paymentDate: new Date().toISOString(),
        referenceId: `REF-${Math.floor(Math.random() * 10000)}`,
      });
      setShowPayment(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInvoice(true);
    try {
      if (createMode === 'from-job') {
        if (!fromJobId) { alert('Select a job'); setSavingInvoice(false); return; }
        await financialApi.createFromJob(parseInt(fromJobId));
      } else {
        if (!adHocForm.customerId || !adHocForm.amount) { alert('Customer and amount required'); setSavingInvoice(false); return; }
        await financialApi.createAdHoc({
          customerId: parseInt(adHocForm.customerId),
          description: adHocForm.description,
          total: parseFloat(adHocForm.amount),
          dueDate: adHocForm.dueDate || null,
        });
      }
      setShowCreate(false);
      setFromJobId('');
      setAdHocForm({ customerId: '', description: '', amount: '', dueDate: '' });
      loadData();
    } catch (err: any) {
      alert('Error creating invoice: ' + err.message);
    } finally {
      setSavingInvoice(false);
    }
  };

  const filtered = invoices.filter(i =>
    (i.invoiceNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.customer?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* ── Record Payment SlideOver ── */}
      <SlideOver open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment" subtitle={`Invoice ${selectedInvoice?.invoiceNumber}`}>
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 16, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Invoice</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>K {selectedInvoice.total?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Current Balance</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-rose)' }}>K {selectedInvoice.balance?.toLocaleString()}</span>
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
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingPayment}>{savingPayment ? 'Processing...' : 'Record Payment'}</button>
            </div>
          </form>
        )}
      </SlideOver>

      {/* ── Create Invoice SlideOver ── */}
      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="Create Invoice" subtitle="Generate from a completed job or create manually">
        <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-app)', borderRadius: 8, padding: 4 }}>
            {([['from-job', 'From Completed Job'], ['adhoc', 'Ad-hoc Invoice']] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCreateMode(mode)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  background: createMode === mode ? 'var(--accent-blue)' : 'transparent',
                  color: createMode === mode ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {createMode === 'from-job' ? (
            <>
              <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-tertiary)' }}>
                The backend will automatically pull all cost data (labour, parts, direct purchases) from the job card and generate a complete invoice.
              </div>
              <div className="form-field">
                <label className="form-label">Completed Job</label>
                {jobsLoading ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '10px 0' }}>Loading jobs...</div>
                ) : completedJobs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '10px 0' }}>No completed jobs without invoices.</div>
                ) : (
                  <select className="form-select" value={fromJobId} onChange={e => setFromJobId(e.target.value)} required>
                    <option value="">Select a completed job...</option>
                    {completedJobs.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.jobNumber} — {j.equipment?.name || j.description || 'Job'}{j.customer ? ` (${j.customer.name})` : ''}
                        {j.totalCost > 0 ? ` · K ${j.totalCost.toLocaleString()}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="form-field">
                <label className="form-label">Customer</label>
                <select className="form-select" value={adHocForm.customerId} onChange={e => setAdHocForm({ ...adHocForm, customerId: e.target.value })} required>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="What is this invoice for?" value={adHocForm.description} onChange={e => setAdHocForm({ ...adHocForm, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Amount (K)</label>
                  <input className="form-input" type="number" step="0.01" required value={adHocForm.amount} onChange={e => setAdHocForm({ ...adHocForm, amount: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={adHocForm.dueDate} onChange={e => setAdHocForm({ ...adHocForm, dueDate: e.target.value })} />
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingInvoice || (createMode === 'from-job' && jobsLoading)}>
              {savingInvoice ? 'Generating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Invoices & Billing</h1>
          <p className="page-subtitle">Track receivables, record payments, and monitor cash flow.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Create Invoice
        </button>
      </div>

      {/* ── KPIs ── */}
      {snapshot && (
        <div className="stats-grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: 'Revenue (MTD)', value: `K ${(snapshot.totalRevenueMTD ?? 0).toLocaleString()}`, color: 'var(--accent-emerald)', icon: <DollarSign size={16} /> },
            { label: 'Collected (MTD)', value: `K ${(snapshot.totalCollectedMTD ?? 0).toLocaleString()}`, color: 'var(--accent-blue)', icon: <CreditCard size={16} /> },
            { label: 'Outstanding Balance', value: `K ${(snapshot.totalOutstanding ?? 0).toLocaleString()}`, color: 'var(--accent-amber)', icon: <AlertTriangle size={16} /> },
            { label: 'Unpaid Invoices', value: snapshot.unpaidInvoiceCount ?? 0, color: 'var(--accent-rose)', icon: <FileText size={16} /> },
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

      {/* ── Table ── */}
      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search invoices or customers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-secondary btn-sm"><Filter size={13} /> Filter</button>
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
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                  <FileText size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
                  <div style={{ fontSize: 13 }}>No invoices found</div>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowCreate(true)}>
                    <Plus size={13} /> Create your first invoice
                  </button>
                </td>
              </tr>
            ) : filtered.map(inv => {
              const statusInfo = statusMap[inv.paymentStatus] || { label: 'Unknown', badge: 'badge-muted' };
              const isOverdue = new Date(inv.dueDate) < new Date() && (inv.balance ?? 0) > 0;
              return (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-blue)', fontSize: 13 }}>{inv.invoiceNumber}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.customer?.name || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{inv.jobCardId ? `JOB-${inv.jobCardId}` : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td style={{ fontSize: 12, color: isOverdue ? 'var(--accent-rose)' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>K {(inv.total ?? 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: (inv.balance ?? 0) > 0 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>K {(inv.balance ?? 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span>
                    {isOverdue && <span className="badge badge-rose" style={{ marginLeft: 6 }}>Overdue</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {inv.paymentStatus !== 2 && (
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        setSelectedInvoice(inv);
                        setPaymentAmount((inv.balance ?? 0).toString());
                        setShowPayment(true);
                      }}>
                        <Zap size={12} /> Receive
                      </button>
                    )}
                    {inv.paymentStatus === 2 && (
                      <span className="badge badge-green"><CheckCircle2 size={11} style={{ marginRight: 4 }} />Settled</span>
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

'use client';

import { useState, useEffect } from 'react';
import { financeApi } from '@/lib/api';
import {
  DollarSign, FileText, Activity, CreditCard, ChevronRight, Download, Plus, Search, CheckCircle, Clock
} from 'lucide-react';
import ResponsiveTable from '@/components/ResponsiveTable';

// ─── Status Maps ───────────────────────────────────────────────────────────────
const vendorBillStatusMap: Record<number, { label: string; badge: string }> = {
  0: { label: 'Unpaid',    badge: 'badge-muted' },
  1: { label: 'Partial',   badge: 'badge-yellow'},
  2: { label: 'Paid',      badge: 'badge-green' },
  3: { label: 'Cancelled', badge: 'badge-rose'  },
};

const ledgerTypeMap: Record<number, { label: string; color: string }> = {
  0: { label: 'Money In',  color: 'var(--status-green)' },
  1: { label: 'Money Out', color: 'var(--status-red)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number | undefined | null) {
  if (n === null || n === undefined) return 'ZMW 0.00';
  return `ZMW ${n.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Tab = 'overview' | 'vendor-bills' | 'expenses' | 'ledger';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={22} className="text-accent-blue" /> Finance & Cashbook
          </h1>
          <p className="page-subtitle">Manage payables, expenses, ledger and profit & loss</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
        {([
          { key: 'overview',     label: 'Overview & P&L', icon: <Activity size={13} /> },
          { key: 'vendor-bills', label: 'Vendor Bills',   icon: <FileText size={13} /> },
          { key: 'expenses',     label: 'Expenses',       icon: <CreditCard size={13} /> },
          { key: 'ledger',       label: 'Ledger Log',     icon: <DollarSign size={13} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13,
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview'     && <ProfitAndLossTab />}
      {activeTab === 'vendor-bills' && <VendorBillsTab />}
      {activeTab === 'expenses'     && <ExpensesTab />}
      {activeTab === 'ledger'       && <LedgerTab />}
    </div>
  );
}

// ─── P&L Tab ──────────────────────────────────────────────────────────────────
function ProfitAndLossTab() {
  const [report, setReport] = useState<any>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await financeApi.getProfitAndLoss(month, year);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [month, year]);

  return (
    <div className="card" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Profit & Loss Report</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="input-field" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select className="input-field" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[year-1, year, year+1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <p>Loading...</p> : report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 15, background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Income (Cash In)</span>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--status-green)' }}>{fmt(report.totalIncome)}</div>
          </div>

          <div>
            <h4 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Expenses (Cash Out)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'var(--surface-sunken)', borderRadius: 6 }}>
                <span>Vendor Bills</span>
                <span style={{ fontWeight: 600 }}>{fmt(report.totalVendorBills)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'var(--surface-sunken)', borderRadius: 6 }}>
                <span>Payroll</span>
                <span style={{ fontWeight: 600 }}>{fmt(report.totalPayroll)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: 'var(--surface-sunken)', borderRadius: 6 }}>
                <span>Ad-Hoc Expenses</span>
                <span style={{ fontWeight: 600 }}>{fmt(report.totalAdHocExpenses)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', marginTop: 8, background: 'var(--surface-raised)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontWeight: 600 }}>Total Expenses</span>
              <span style={{ fontWeight: 700, color: 'var(--status-red)' }}>{fmt(report.totalExpenses)}</span>
            </div>
          </div>

          <div style={{ marginTop: 10, padding: 20, background: report.netProfit >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)', borderRadius: 8, border: `1px solid ${report.netProfit >= 0 ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.3)'}` }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: report.netProfit >= 0 ? 'var(--status-green)' : 'var(--status-red)' }}>NET PROFIT</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: report.netProfit >= 0 ? 'var(--status-green)' : 'var(--status-red)' }}>{fmt(report.netProfit)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vendor Bills Tab ─────────────────────────────────────────────────────────
function VendorBillsTab() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const fetchBills = async () => {
    try {
      const data = await financeApi.getVendorBills();
      setBills(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
    try {
      await financeApi.recordVendorBillPayment(selectedBill.id, amount);
      setSelectedBill(null);
      fetchBills();
    } catch (err) {
      alert('Failed to record payment');
    }
  };

  return (
    <>
      <div className="card">
        <div className="table-scroll">
          <ResponsiveTable>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Supplier</th>
                  <th>Bill Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : bills.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>No vendor bills found.</td></tr>
                ) : (
                  bills.map(row => {
                    const st = vendorBillStatusMap[row.status];
                    return (
                      <tr key={row.id}>
                        <td>{row.billNumber}</td>
                        <td>{row.supplier?.name || '-'}</td>
                        <td>{new Date(row.billDate).toLocaleDateString()}</td>
                        <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                        <td>{fmt(row.totalAmount)}</td>
                        <td>{fmt(row.balance)}</td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => setSelectedBill(row)}
                            disabled={row.status === 2 || row.status === 3}
                          >
                            Pay
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </ResponsiveTable>
        </div>
      </div>

      {selectedBill && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Record Payment: {selectedBill.billNumber}</h2>
              <button className="icon-btn" onClick={() => setSelectedBill(null)}><ChevronRight size={20} /></button>
            </div>
            <form onSubmit={handleRecordPayment} style={{ padding: 20 }}>
              <p style={{ marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                Supplier: {selectedBill.supplier?.name}<br/>
                Outstanding Balance: <strong>{fmt(selectedBill.balance)}</strong>
              </p>
              <div className="form-group">
                <label>Payment Amount</label>
                <input 
                  type="number" 
                  name="amount" 
                  className="input-field" 
                  required 
                  step="0.01" 
                  max={selectedBill.balance} 
                  defaultValue={selectedBill.balance}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedBill(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────
function ExpensesTab() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchExpenses = async () => {
    try {
      const data = await financeApi.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const expense = {
      description: (form.elements.namedItem('description') as HTMLInputElement).value,
      category: Number((form.elements.namedItem('category') as HTMLSelectElement).value),
      amount: Number((form.elements.namedItem('amount') as HTMLInputElement).value),
    };
    try {
      await financeApi.recordExpense(expense);
      setShowAdd(false);
      fetchExpenses();
    } catch (err) {
      alert('Failed to record expense');
    }
  };

  const categories = [
    'OfficeSupplies', 'Utilities', 'Rent', 'Travel', 'Meals', 
    'SoftwareSubscriptions', 'Marketing', 'VehicleMaintenance', 'PettyCash', 'Other'
  ];

  return (
    <>
      <div className="actions-bar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Record Expense
        </button>
      </div>

      <div className="card">
        <div className="table-scroll">
          <ResponsiveTable>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Recorded By</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No expenses recorded.</td></tr>
                ) : (
                  expenses.map(row => (
                    <tr key={row.id}>
                      <td>{new Date(row.expenseDate).toLocaleDateString()}</td>
                      <td>{categories[row.category]}</td>
                      <td>{row.description}</td>
                      <td>{row.recordedBy}</td>
                      <td>{fmt(row.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ResponsiveTable>
        </div>
      </div>

      {showAdd && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Record Ad-Hoc Expense</h2>
              <button className="icon-btn" onClick={() => setShowAdd(false)}><ChevronRight size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: 20 }}>
              <div className="form-group">
                <label>Category</label>
                <select name="category" className="input-field" required>
                  {categories.map((c, i) => <option key={i} value={i}>{c.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" name="description" className="input-field" required maxLength={200} />
              </div>
              <div className="form-group">
                <label>Amount (ZMW)</label>
                <input type="number" name="amount" className="input-field" required step="0.01" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Ledger Tab ───────────────────────────────────────────────────────────────
function LedgerTab() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    try {
      const data = await financeApi.getLedgerEntries();
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLedger(); }, []);

  return (
    <div className="card">
      <div className="table-scroll">
        <ResponsiveTable>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>User</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No ledger entries found.</td></tr>
              ) : (
                entries.map(row => {
                  const t = ledgerTypeMap[row.type];
                  return (
                    <tr key={row.id}>
                      <td>{new Date(row.transactionDate).toLocaleString()}</td>
                      <td><span style={{ color: t.color, fontWeight: 600 }}>{t.label}</span></td>
                      <td>{row.category}</td>
                      <td>{row.description}</td>
                      <td>{row.recordedBy}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: row.type === 0 ? 'var(--status-green)' : 'var(--status-red)' }}>
                          {row.type === 0 ? '+' : '-'}{fmt(row.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>
    </div>
  );
}

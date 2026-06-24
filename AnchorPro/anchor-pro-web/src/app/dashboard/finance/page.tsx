'use client';

import { useState, useEffect } from 'react';
import { financeApi, financialApi, quotationsApi, procurementApi, usersApi } from '@/lib/api';
import {
  DollarSign, FileText, Activity, CreditCard, ChevronRight, Plus,
  CheckCircle, Clock, ShieldCheck, XCircle, AlertTriangle, X
} from 'lucide-react';
import ResponsiveTable from '@/components/ResponsiveTable';

// ─── Status Maps ───────────────────────────────────────────────────────────────
const vendorBillStatusMap: Record<number, { label: string; badge: string }> = {
  0: { label: 'Unpaid',    badge: 'badge-muted'  },
  1: { label: 'Partial',   badge: 'badge-amber'  },
  2: { label: 'Paid',      badge: 'badge-green'  },
  3: { label: 'Cancelled', badge: 'badge-rose'   },
};

const ledgerTypeMap: Record<number, { label: string; color: string }> = {
  0: { label: 'Money In',  color: 'var(--accent-emerald)' },
  1: { label: 'Money Out', color: 'var(--accent-rose)'    },
};

const quotationStatusMap: Record<number, { label: string; badge: string }> = {
  0: { label: 'Draft',    badge: 'badge-muted'  },
  1: { label: 'Sent',     badge: 'badge-blue'   },
  2: { label: 'Accepted', badge: 'badge-green'  },
  3: { label: 'Rejected', badge: 'badge-rose'   },
};

const invoiceStatusMap: Record<number, { label: string; badge: string }> = {
  0: { label: 'Unpaid',    badge: 'badge-rose'   },
  1: { label: 'Partial',   badge: 'badge-amber'  },
  2: { label: 'Paid',      badge: 'badge-green'  },
  3: { label: 'Overdue',   badge: 'badge-rose'   },
  4: { label: 'Cancelled', badge: 'badge-muted'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number | undefined | null) {
  if (n === null || n === undefined) return 'ZMW 0.00';
  return `ZMW ${n.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isOverdue(dueDateStr: string | null | undefined) {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date();
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Tab = 'overview' | 'vendor-bills' | 'expenses' | 'ledger' | 'quotations' | 'invoices' | 'po-approvals';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [pendingPOCount, setPendingPOCount] = useState(0);

  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    procurementApi.getPendingApprovals()
      .then(data => setPendingPOCount(data?.length ?? 0))
      .catch(() => {});

    usersApi.getAll()
      .then(users => {
        const map: Record<string, string> = {};
        users.forEach((u: any) => {
          const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
          map[u.id] = name || u.email || u.userName || u.id;
        });
        setUsersMap(map);
      })
      .catch(err => console.error('Failed to load users for mapping:', err));
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',     label: 'Overview & P&L', icon: <Activity size={13} />    },
    { key: 'vendor-bills', label: 'Vendor Bills',   icon: <FileText size={13} />    },
    { key: 'expenses',     label: 'Expenses',       icon: <CreditCard size={13} />  },
    { key: 'ledger',       label: 'Ledger Log',     icon: <DollarSign size={13} />  },
    { key: 'quotations',   label: 'Quotations',     icon: <FileText size={13} />    },
    { key: 'invoices',     label: 'Receivables',    icon: <DollarSign size={13} />  },
    { key: 'po-approvals', label: 'PO Approvals',   icon: <ShieldCheck size={13} /> },
  ];

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={22} /> Finance &amp; Cashbook
          </h1>
          <p className="page-subtitle">Manage payables, expenses, ledger, invoices and PO approvals</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13,
              color: activeTab === tab.key ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              fontFamily: "'Barlow', sans-serif", fontWeight: activeTab === tab.key ? 600 : 400,
              marginBottom: -1, transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.key === 'po-approvals' && pendingPOCount > 0 && (
              <span style={{
                background: 'var(--accent-rose)', color: '#fff',
                borderRadius: 10, fontSize: 10, fontWeight: 700,
                padding: '1px 6px', marginLeft: 2, lineHeight: '16px',
              }}>
                {pendingPOCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview'     && <ProfitAndLossTab />}
      {activeTab === 'vendor-bills' && <VendorBillsTab />}
      {activeTab === 'expenses'     && <ExpensesTab usersMap={usersMap} />}
      {activeTab === 'ledger'       && <LedgerTab usersMap={usersMap} />}
      {activeTab === 'quotations'   && <QuotationsTab />}
      {activeTab === 'invoices'     && <InvoicesTab />}
      {activeTab === 'po-approvals' && <POApprovalsTab onCountChange={setPendingPOCount} />}
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

  // Calculations for enhanced visuals
  const totalIncome = report?.totalIncome ?? 0;
  const totalExpenses = report?.totalExpenses ?? 0;
  const netProfit = report?.netProfit ?? 0;
  
  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;

  const vendorBillPct = totalExpenses > 0 ? Math.round((report?.totalVendorBills / totalExpenses) * 100) : 0;
  const payrollPct = totalExpenses > 0 ? Math.round((report?.totalPayroll / totalExpenses) * 100) : 0;
  const adHocPct = totalExpenses > 0 ? Math.round((report?.totalAdHocExpenses / totalExpenses) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100 }}>
      
      {/* Header card with filters */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Statement of Cash Flows</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Real-time cash book summary for the selected period</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select 
            className="form-select" 
            style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', cursor: 'pointer' }}
            value={month} 
            onChange={e => setMonth(Number(e.target.value))}
          >
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select 
            className="form-select" 
            style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', cursor: 'pointer' }}
            value={year} 
            onChange={e => setYear(Number(e.target.value))}
          >
            {[year-1, year, year+1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          Loading financial data...
        </div>
      ) : report ? (
        <>
          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            
            {/* Total Income Card */}
            <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="stat-label">Total Income (Cash In)</span>
                  <div className="stat-value" style={{ color: 'var(--accent-emerald)', marginTop: 8, fontSize: 22, fontWeight: 700 }}>
                    {fmt(totalIncome)}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>Payments credited to cashbook</span>
                </div>
                <div style={{ padding: 8, borderRadius: 8, background: 'rgba(var(--accent-emerald-rgb), 0.1)', color: 'var(--accent-emerald)' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--accent-emerald)', opacity: 0.7 }} />
            </div>

            {/* Total Expenses Card */}
            <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="stat-label">Total Expenses (Cash Out)</span>
                  <div className="stat-value" style={{ color: 'var(--accent-rose)', marginTop: 8, fontSize: 22, fontWeight: 700 }}>
                    {fmt(totalExpenses)}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>Payables, payroll, and ad-hoc debits</span>
                </div>
                <div style={{ padding: 8, borderRadius: 8, background: 'rgba(var(--accent-rose-rgb), 0.1)', color: 'var(--accent-rose)' }}>
                  <CreditCard size={18} />
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--accent-rose)', opacity: 0.7 }} />
            </div>

            {/* Net Profit Card */}
            <div className="stat-card" style={{ 
              position: 'relative', 
              overflow: 'hidden',
              background: netProfit >= 0 ? 'rgba(var(--accent-emerald-rgb), 0.04)' : 'rgba(var(--accent-rose-rgb), 0.04)',
              border: `1px solid ${netProfit >= 0 ? 'rgba(var(--accent-emerald-rgb), 0.2)' : 'rgba(var(--accent-rose-rgb), 0.2)'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="stat-label">Net Profit / Position</span>
                  <div className="stat-value" style={{ 
                    color: netProfit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', 
                    marginTop: 8, 
                    fontSize: 22, 
                    fontWeight: 800 
                  }}>
                    {fmt(netProfit)}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className={`badge ${netProfit >= 0 ? 'badge-green' : 'badge-rose'}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                      {netProfit >= 0 ? 'Surplus' : 'Deficit'}
                    </span>
                    {totalIncome > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {profitMargin}% margin
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ 
                  padding: 8, 
                  borderRadius: 8, 
                  background: netProfit >= 0 ? 'rgba(var(--accent-emerald-rgb), 0.15)' : 'rgba(var(--accent-rose-rgb), 0.15)', 
                  color: netProfit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' 
                }}>
                  <Activity size={18} />
                </div>
              </div>
              <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                height: 3, 
                background: netProfit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' 
              }} />
            </div>

          </div>

          {/* Two Column Layout for Breakdown and Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
            
            {/* Left: Expenses Breakdown */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Operating Expenditures</h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Proportional breakdown of outbound cash flow</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                
                {/* Vendor Bills */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Vendor Bills &amp; Payables</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(report.totalVendorBills)}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({vendorBillPct}%)</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-app)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${vendorBillPct}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: 3, transition: 'width 0.5s ease-in-out' }} />
                  </div>
                </div>

                {/* Payroll */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Employee Payroll</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(report.totalPayroll)}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({payrollPct}%)</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-app)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${payrollPct}%`, height: '100%', background: 'var(--accent-amber)', borderRadius: 3, transition: 'width 0.5s ease-in-out' }} />
                  </div>
                </div>

                {/* Ad-Hoc Expenses */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Ad-Hoc Expenses</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(report.totalAdHocExpenses)}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({adHocPct}%)</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-app)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${adHocPct}%`, height: '100%', background: 'var(--accent-rose)', borderRadius: 3, transition: 'width 0.5s ease-in-out' }} />
                  </div>
                </div>

                <div style={{ 
                  marginTop: 'auto', 
                  padding: '12px 14px', 
                  background: 'var(--bg-app)', 
                  borderRadius: 8, 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Total Expenditures</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-rose)' }}>{fmt(totalExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Right: Health Metrics & Smart Insights */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Efficiency &amp; Diagnostics</h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Operating ratio and automated performance insights</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                
                {/* Profit Margin bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Operating Profit Margin</span>
                    <span style={{ color: netProfit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700 }}>{profitMargin}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--bg-app)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, Math.max(0, profitMargin))}%`, 
                      height: '100%', 
                      background: netProfit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      borderRadius: 4 
                    }} />
                  </div>
                </div>

                {/* Expense-to-Income ratio */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Expense-to-Income Ratio</span>
                    <span style={{ color: expenseRatio > 70 ? 'var(--accent-rose)' : 'var(--text-secondary)', fontWeight: 700 }}>{expenseRatio}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--bg-app)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, Math.max(0, expenseRatio))}%`, 
                      height: '100%', 
                      background: expenseRatio > 70 ? 'var(--accent-rose)' : 'var(--accent-blue)',
                      borderRadius: 4 
                    }} />
                  </div>
                </div>

                {/* Smart Insights list */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                    Automated Insights
                  </div>
                  
                  {/* Insight 1: Net Margin */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: netProfit >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', marginTop: 5, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {netProfit >= 0 
                        ? `The business operations are currently running at a ${profitMargin}% net surplus for this month.` 
                        : "Operating expenses exceed cash inflow for this month. Action is recommended to defer optional expenses."}
                    </span>
                  </div>

                  {/* Insight 2: Vendor Bills vs Income */}
                  {report.totalVendorBills > 0 && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', marginTop: 5, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        Supplier and vendor payables constitute {vendorBillPct}% of total expenditures this period.
                      </span>
                    </div>
                  )}

                  {/* Insight 3: Payroll flag */}
                  {report.totalPayroll === 0 ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-amber)', marginTop: 5, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        No payroll payouts have been recorded in the cashbook for this calendar period yet.
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-amber)', marginTop: 5, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        Payroll payments represent {payrollPct}% of your operational costs.
                      </span>
                    </div>
                  )}

                </div>

              </div>
            </div>

          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No records found for this period.
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
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
                ) : bills.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No vendor bills found.</td></tr>
                ) : (
                  bills.map(row => {
                    const st = vendorBillStatusMap[row.status] || { label: 'Unknown', badge: 'badge-muted' };
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
                            className="btn btn-secondary"
                            style={{ fontSize: 12, padding: '5px 12px' }}
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
              <button className="icon-btn" onClick={() => setSelectedBill(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleRecordPayment} style={{ padding: '20px 24px' }}>
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
function ExpensesTab({ usersMap }: { usersMap: Record<string, string> }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter(e => categories[e.category] === selectedCategory);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <select
            className="form-select"
            style={{ width: 220 }}
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Expense Categories</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>{c.replace(/([A-Z])/g, ' $1').trim()}</option>
            ))}
          </select>
        </div>
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
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No expenses recorded.</td></tr>
                ) : (
                  filteredExpenses.map(row => (
                    <tr key={row.id}>
                      <td>{new Date(row.expenseDate).toLocaleDateString()}</td>
                      <td>{categories[row.category].replace(/([A-Z])/g, ' $1').trim()}</td>
                      <td>{row.description}</td>
                      <td>{usersMap[row.recordedBy] || row.recordedBy || '—'}</td>
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
          <div className="modal-content animate-in" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Record Ad-Hoc Expense</h2>
              <button className="icon-btn" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '20px 24px' }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Category</label>
                <select name="category" className="form-select" required>
                  {categories.map((c, i) => <option key={i} value={i}>{c.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Description</label>
                <input type="text" name="description" className="form-input" required maxLength={200} />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Amount (ZMW)</label>
                <input type="number" name="amount" className="form-input" required step="0.01" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
function LedgerTab({ usersMap }: { usersMap: Record<string, string> }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    try {
      const data = await financeApi.getLedgerEntries();
      setEntries(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLedger(); }, []);

  // Compute running balance chronologically
  const sortedChronologically = [...entries].sort(
    (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
  );

  let cumulativeBalance = 0;
  const entriesWithBalance = sortedChronologically.map(entry => {
    const change = entry.type === 0 ? entry.amount : -entry.amount;
    cumulativeBalance += change;
    return { ...entry, runningBalance: cumulativeBalance };
  });

  // Display newest first
  const displayEntries = [...entriesWithBalance].reverse();

  // Summary card stats
  const totalCredits = entries.filter(e => e.type === 0).reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalDebits = entries.filter(e => e.type === 1).reduce((s, e) => s + (e.amount ?? 0), 0);
  const closingBalance = totalCredits - totalDebits;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Ledger Summary KPIs */}
      {!loading && entries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="stat-card">
            <span className="stat-label">Total Cash In (Credits)</span>
            <div className="stat-value" style={{ fontSize: 16, color: 'var(--accent-emerald)', marginTop: 4 }}>
              +{fmt(totalCredits)}
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Cash Out (Debits)</span>
            <div className="stat-value" style={{ fontSize: 16, color: 'var(--accent-rose)', marginTop: 4 }}>
              -{fmt(totalDebits)}
            </div>
          </div>
          <div className="stat-card" style={{ 
            background: closingBalance >= 0 ? 'rgba(var(--accent-emerald-rgb), 0.04)' : 'rgba(var(--accent-rose-rgb), 0.04)',
            border: `1px solid ${closingBalance >= 0 ? 'rgba(var(--accent-emerald-rgb), 0.15)' : 'rgba(var(--accent-rose-rgb), 0.15)'}`
          }}>
            <span className="stat-label">Closing Ledger Balance</span>
            <div className="stat-value" style={{ 
              fontSize: 18, 
              fontWeight: 800, 
              color: closingBalance >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', 
              marginTop: 4 
            }}>
              {fmt(closingBalance)}
            </div>
          </div>
        </div>
      )}

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
                  <th>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
                ) : displayEntries.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No ledger entries found.</td></tr>
                ) : (
                  displayEntries.map(row => {
                    const t = ledgerTypeMap[row.type] || { label: 'Unknown', color: 'var(--text-muted)' };
                    return (
                      <tr key={row.id}>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(row.transactionDate).toLocaleString()}</td>
                        <td><span style={{ color: t.color, fontWeight: 600 }}>{t.label}</span></td>
                        <td>{row.category}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{row.description}</td>
                        <td>{usersMap[row.recordedBy] || row.recordedBy || '—'}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: row.type === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                            {row.type === 0 ? '+' : '-'}{fmt(row.amount)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {fmt(row.runningBalance)}
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
    </div>
  );
}

// ─── Quotations Tab ───────────────────────────────────────────────────────────
function QuotationsTab() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const data = await quotationsApi.getAll();
      setQuotes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotes(); }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await quotationsApi.accept(id);
      fetchQuotes();
    } catch (err) {
      alert('Failed to approve quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await quotationsApi.reject(rejectTarget.id, rejectReason);
      setRejectTarget(null);
      setRejectReason('');
      fetchQuotes();
    } catch (err) {
      alert('Failed to reject quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const totalValue = quotes.reduce((sum, q) => sum + (q.totalAmount ?? q.subtotal ?? 0), 0);
  const acceptedCount = quotes.filter(q => q.status === 2).length;
  const pendingCount = quotes.filter(q => q.status === 1).length;

  return (
    <>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Quotes</div>
          <div className="stat-value">{quotes.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Value</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{fmt(totalValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Review</div>
          <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{pendingCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Accepted</div>
          <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{acceptedCount}</div>
        </div>
      </div>

      <div className="card">
        <ResponsiveTable>
          <table className="data-table">
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Job #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><FileText size={32} /></div>
                      <div className="empty-state-text">No quotations found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                quotes.map(q => {
                  const st = quotationStatusMap[q.status] || { label: 'Unknown', badge: 'badge-muted' };
                  const canAct = q.status === 1; // only Sent quotes can be approved/rejected
                  return (
                    <tr key={q.id}>
                      <td style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{q.quoteNumber || `Q-${q.id}`}</td>
                      <td>{q.jobCardId ? `#${q.jobCardId}` : '—'}</td>
                      <td>{q.customer?.name || q.customerName || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(q.totalAmount ?? q.subtotal)}</td>
                      <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                        {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        {canAct ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: 12, padding: '5px 12px' }}
                              disabled={actionLoading}
                              onClick={() => handleApprove(q.id)}
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ fontSize: 12, padding: '5px 12px' }}
                              disabled={actionLoading}
                              onClick={() => { setRejectTarget(q); setRejectReason(''); }}
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>Reject Quotation</h2>
              <button className="icon-btn" onClick={() => setRejectTarget(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Rejecting <strong>{rejectTarget.quoteNumber || `Q-${rejectTarget.id}`}</strong>. Please provide a reason.
              </p>
              <div className="form-group">
                <label>Rejection Reason</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Price too high, scope unclear..."
                  style={{ resize: 'vertical', fontFamily: "'Barlow', sans-serif" }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>Cancel</button>
                <button
                  className="btn btn-danger"
                  disabled={actionLoading || !rejectReason.trim()}
                  onClick={handleReject}
                >
                  <XCircle size={13} /> Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Invoices (Receivables) Tab ───────────────────────────────────────────────
function InvoicesTab() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financialApi.getInvoices()
      .then(data => setInvoices(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalInvoiced   = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
  const totalCollected  = invoices.reduce((s, i) => s + (i.amountPaid ?? 0), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + (i.balance ?? 0), 0);

  return (
    <>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Invoiced</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{fmt(totalInvoiced)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Collected</div>
          <div className="stat-value" style={{ fontSize: 16, color: 'var(--accent-emerald)' }}>{fmt(totalCollected)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value" style={{ fontSize: 16, color: totalOutstanding > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>{fmt(totalOutstanding)}</div>
        </div>
      </div>

      <div className="card">
        <ResponsiveTable>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><DollarSign size={32} /></div>
                      <div className="empty-state-text">No invoices found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map(inv => {
                  const st = invoiceStatusMap[inv.paymentStatus] || { label: 'Unknown', badge: 'badge-muted' };
                  const overdue = inv.paymentStatus !== 2 && isOverdue(inv.dueDate);
                  return (
                    <tr key={inv.id}>
                      <td style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{inv.invoiceNumber || `INV-${inv.id}`}</td>
                      <td>{inv.customer?.name || inv.customerName || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(inv.total)}</td>
                      <td>{fmt(inv.amountPaid)}</td>
                      <td>
                        <span className={`badge ${st.badge}`}>{st.label}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                          {overdue && (
                            <span title="Overdue">
                              <AlertTriangle size={13} style={{ color: 'var(--accent-rose)' }} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>
    </>
  );
}

// ─── PO Approvals Tab ─────────────────────────────────────────────────────────
function POApprovalsTab({ onCountChange }: { onCountChange: (n: number) => void }) {
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await procurementApi.getPendingApprovals();
      const list = data || [];
      setPendingPOs(list);
      onCountChange(list.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await procurementApi.approvePO(id);
      fetchPending();
    } catch (err) {
      alert('Failed to approve PO');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await procurementApi.rejectPO(rejectTarget.id, rejectReason);
      setRejectTarget(null);
      setRejectReason('');
      fetchPending();
    } catch (err) {
      alert('Failed to reject PO');
    } finally {
      setActionLoading(false);
    }
  };

  const totalValue = pendingPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0);

  return (
    <>
      {/* Hero stat card */}
      <div style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 24, background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)' }}>
          <ShieldCheck size={40} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Awaiting Finance Approval
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-amber)', marginTop: 4 }}>
              {fmt(totalValue)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {pendingPOs.length} purchase order{pendingPOs.length !== 1 ? 's' : ''} pending review
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <ResponsiveTable>
          <table className="data-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th>Type</th>
                <th>Linked Job</th>
                <th>Value</th>
                <th>Raised By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
              ) : pendingPOs.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><ShieldCheck size={32} /></div>
                      <div className="empty-state-text">No purchase orders pending approval</div>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingPOs.map(po => {
                  const typeLabels: Record<number, string> = {
                    0: 'Inventory Replenishment',
                    1: 'Direct Purchase',
                    2: 'External Service',
                  };
                  const typeBadges: Record<number, string> = {
                    0: 'badge-blue',
                    1: 'badge-amber',
                    2: 'badge-violet',
                  };
                  return (
                    <tr key={po.id}>
                      <td style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{po.poNumber}</td>
                      <td>{po.supplier?.name || '—'}</td>
                      <td>
                        <span className={`badge ${typeBadges[po.poType] ?? 'badge-muted'}`}>
                          {typeLabels[po.poType] ?? 'Unknown'}
                        </span>
                      </td>
                      <td style={{ color: po.jobCardId ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: po.jobCardId ? 600 : 400 }}>
                        {po.jobCardId ? `Job #${po.jobCardId}` : '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmt(po.totalAmount)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{po.createdByName || po.raisedBy || '—'}</td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                        {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: 12, padding: '5px 12px' }}
                            disabled={actionLoading}
                            onClick={() => handleApprove(po.id)}
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ fontSize: 12, padding: '5px 12px' }}
                            disabled={actionLoading}
                            onClick={() => { setRejectTarget(po); setRejectReason(''); }}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2>Reject Purchase Order</h2>
              <button className="icon-btn" onClick={() => setRejectTarget(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Rejecting <strong>{rejectTarget.poNumber}</strong> from <strong>{rejectTarget.supplier?.name}</strong> — {fmt(rejectTarget.totalAmount)}.
                Please provide a reason for the record.
              </p>
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Budget exceeded, supplier not approved..."
                  style={{ resize: 'vertical', fontFamily: "'Barlow', sans-serif" }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>Cancel</button>
                <button
                  className="btn btn-danger"
                  disabled={actionLoading || !rejectReason.trim()}
                  onClick={handleReject}
                >
                  <XCircle size={13} /> Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

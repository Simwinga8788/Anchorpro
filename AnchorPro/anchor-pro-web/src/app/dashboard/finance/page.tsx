'use client';

import React, { useState, useEffect } from 'react';
import { financeApi, financialApi, quotationsApi, procurementApi, usersApi, customersApi, jobCardsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import {
  DollarSign, FileText, Activity, CreditCard, ChevronRight, Plus,
  CheckCircle, Clock, ShieldCheck, XCircle, AlertTriangle, X,
  ChevronDown, ChevronUp, AlertCircle, Download
} from 'lucide-react';
import ResponsiveTable from '@/components/ResponsiveTable';
import SlideOver from '@/components/SlideOver';
import { hasPermission } from '@/lib/rbac';

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
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      procurementApi.getPendingApprovals(),
      procurementApi.getPendingRequisitions()
    ])
      .then(([pos, prs]) => {
        setPendingApprovalCount((pos?.length ?? 0) + (prs?.length ?? 0));
      })
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
    { key: 'po-approvals', label: 'Approvals',      icon: <ShieldCheck size={13} /> },
  ];

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={22} /> Finance &amp; Cashbook
          </h1>
          <p className="page-subtitle">Manage payables, expenses, ledger, invoices, PR and PO approvals</p>
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
            {tab.key === 'po-approvals' && pendingApprovalCount > 0 && (
              <span style={{
                background: 'var(--accent-rose)', color: '#fff',
                borderRadius: 10, fontSize: 10, fontWeight: 700,
                padding: '1px 6px', marginLeft: 2, lineHeight: '16px',
              }}>
                {pendingApprovalCount}
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
      {activeTab === 'po-approvals' && <ApprovalsHubTab onCountChange={setPendingApprovalCount} usersMap={usersMap} />}
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
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availablePOs, setAvailablePOs] = useState<any[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<number | ''>('');
  const [createLoading, setCreateLoading] = useState(false);

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

  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);
    setPoLoading(true);
    try {
      // Fetch all POs, filter for 'Received' (status = 5)
      const pos = await procurementApi.getOrders();
      const received = (pos || []).filter((p: any) => p.status === 5);
      
      // Filter out POs that already have a bill
      const existingPoIds = bills.map(b => b.purchaseOrderId).filter(Boolean);
      const available = received.filter((p: any) => !existingPoIds.includes(p.id));
      
      setAvailablePOs(available);
    } catch (err) {
      console.error(err);
    } finally {
      setPoLoading(false);
    }
  };

  const handleCreateBillDirectly = async (poId: number) => {
    setSelectedPoId(poId);
    setCreateLoading(true);
    try {
      await financeApi.createVendorBillFromPO(poId);
      setShowCreateModal(false);
      setSelectedPoId('');
      fetchBills();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create Vendor Bill');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) return;
    await handleCreateBillDirectly(Number(selectedPoId));
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        {hasPermission('/dashboard/finance', user?.allowedRoutes || [], user?.isPlatformOwner ?? false) && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} /> Convert Received PO to Bill
          </button>
        )}
      </div>

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
                          {hasPermission('/dashboard/finance', user?.allowedRoutes || [], user?.isPlatformOwner ?? false) && (
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: 12, padding: '5px 12px' }}
                              onClick={() => setSelectedBill(row)}
                              disabled={row.status === 2 || row.status === 3}
                            >
                              Pay
                            </button>
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

      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2>Convert PO to Vendor Bill</h2>
              <button className="icon-btn" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateBill} style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Select a <strong>Received</strong> Purchase Order to convert it into a Vendor Bill in Accounts Payable.
              </p>

              <div className="form-group" style={{ marginBottom: 0 }}>
                {poLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Purchase Orders...</div>
                ) : availablePOs.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--accent-rose)', background: 'var(--bg-app)', borderRadius: 6 }}>
                    No unbilled Received POs found.
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)' }}>
                        <tr>
                          <th>PO #</th>
                          <th>Supplier</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availablePOs.map((po: any) => (
                          <tr key={po.id}>
                            <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{po.poNumber}</td>
                            <td>{po.supplier?.name}</td>
                            <td style={{ fontWeight: 600 }}>{fmt(po.totalAmount)}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: 12 }}
                                disabled={createLoading && selectedPoId === po.id}
                                onClick={() => handleCreateBillDirectly(po.id)}
                              >
                                {createLoading && selectedPoId === po.id ? 'Creating...' : 'Create Bill'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Close</button>
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
  const { user } = useAuth();
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
        {hasPermission('/dashboard/finance:record_expense', user?.allowedRoutes || [], user?.isPlatformOwner ?? false) && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Record Expense
          </button>
        )}
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

  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [createQuoteForm, setCreateQuoteForm] = useState({ customerId: '', jobCardId: '', subtotal: '', notes: '' });
  const [customers, setCustomers] = useState<any[]>([]);
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

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

  useEffect(() => { 
    fetchQuotes(); 
    customersApi.getAll().then(setCustomers).catch(() => {});
    jobCardsApi.getAll().then(setJobCards).catch(() => {});
  }, []);

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createQuoteForm.customerId || !createQuoteForm.subtotal) return;
    setSavingQuote(true);
    try {
      await quotationsApi.createAdHoc({
        customerId: parseInt(createQuoteForm.customerId),
        jobCardId: createQuoteForm.jobCardId ? parseInt(createQuoteForm.jobCardId) : undefined,
        subtotal: parseFloat(createQuoteForm.subtotal),
        notes: createQuoteForm.notes
      });
      setShowCreateQuote(false);
      setCreateQuoteForm({ customerId: '', jobCardId: '', subtotal: '', notes: '' });
      fetchQuotes();
    } catch (err) {
      console.error(err);
      alert('Failed to create quotation');
    } finally {
      setSavingQuote(false);
    }
  };

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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowCreateQuote(true)}>
          <Plus size={14} /> Create Ad-Hoc Quote
        </button>
      </div>

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
                  const canAct = q.status === 1 || q.status === 0; // Sent or Draft quotes can be approved/rejected
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
                              className="btn btn-ghost"
                              style={{ fontSize: 12, padding: '5px 12px', color: 'var(--accent-blue)' }}
                              onClick={() => { setSelectedQuote(q); setShowQuoteModal(true); }}
                            >
                              View
                            </button>
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
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: '5px 12px', color: 'var(--accent-blue)' }}
                            onClick={() => { setSelectedQuote(q); setShowQuoteModal(true); }}
                          >
                            View
                          </button>
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

      {/* ── Create Quote SlideOver ── */}
      <SlideOver open={showCreateQuote} onClose={() => setShowCreateQuote(false)} title="Create Quotation" subtitle="Generate an ad-hoc quotation">
        <form onSubmit={handleCreateQuote} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-field">
            <label className="form-label">Customer</label>
            <select className="form-select" value={createQuoteForm.customerId} onChange={e => setCreateQuoteForm({ ...createQuoteForm, customerId: e.target.value })} required>
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Subtotal (ZMW)</label>
            <input className="form-input" type="number" step="0.01" required value={createQuoteForm.subtotal} onChange={e => setCreateQuoteForm({ ...createQuoteForm, subtotal: e.target.value })} />
            {createQuoteForm.subtotal && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                VAT (16%): K {(parseFloat(createQuoteForm.subtotal || '0') * 0.16).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {' '}→ Total: K {(parseFloat(createQuoteForm.subtotal || '0') * 1.16).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
          <div className="form-field">
            <label className="form-label">Notes (Optional)</label>
            <textarea className="form-textarea" placeholder="Any notes for the customer..." value={createQuoteForm.notes} onChange={e => setCreateQuoteForm({ ...createQuoteForm, notes: e.target.value })} />
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateQuote(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingQuote}>
              {savingQuote ? 'Generating...' : 'Create Quote'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* ── Quotation Modal ── */}
      {showQuoteModal && selectedQuote && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowQuoteModal(false)}>
          <div className="card-elevated" style={{ width: 500, padding: 24, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Quotation Details</div>
                <div style={{ fontSize: 13, color: 'var(--accent-indigo)', fontWeight: 600, marginTop: 4 }}>
                  #{selectedQuote.quotationNumber || selectedQuote.quoteNumber || `Q-${selectedQuote.id}`}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowQuoteModal(false)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span className={`badge ${
                    selectedQuote.status === 0 ? 'badge-muted' :
                    selectedQuote.status === 1 ? 'badge-blue' :
                    selectedQuote.status === 2 ? 'badge-green' : 'badge-rose'
                  }`}>
                    {selectedQuote.status === 0 ? 'Draft' :
                     selectedQuote.status === 1 ? 'Sent' :
                     selectedQuote.status === 2 ? 'Accepted' : 'Rejected'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer</span>
                  <span style={{ fontWeight: 600 }}>{selectedQuote.customer?.name || selectedQuote.customerName || '—'}</span>
                </div>
                {selectedQuote.jobCardId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Linked Job</span>
                    <span>#{selectedQuote.jobCardId}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Quote Date</span>
                  <span>{selectedQuote.quoteDate ? new Date(selectedQuote.quoteDate).toLocaleDateString() : '—'}</span>
                </div>
                {selectedQuote.status === 3 && selectedQuote.rejectionReason && (
                  <div style={{ marginTop: 8, padding: 10, background: 'rgba(232,72,85,0.1)', border: '1px solid var(--accent-rose)', borderRadius: 6, color: 'var(--accent-rose)', fontSize: 12 }}>
                    <strong>Rejection Reason:</strong> {selectedQuote.rejectionReason}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>K {(selectedQuote.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>VAT ({selectedQuote.taxRate}%)</span>
                    <span style={{ color: 'var(--text-secondary)' }}>K {(selectedQuote.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, borderTop: '1px solid var(--border-default)', paddingTop: 8 }}>
                    <span>Total Quote Amount</span>
                    <span style={{ color: 'var(--accent-indigo)' }}>K {(selectedQuote.total || selectedQuote.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {selectedQuote.notes && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 8, fontStyle: 'italic' }}>
                      {selectedQuote.notes}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                <a
                  href={selectedQuote.jobCardId ? `/dashboard/jobs/${selectedQuote.jobCardId}/print-quotation?qtnId=${selectedQuote.id}` : `/dashboard/quotations/${selectedQuote.id}/print`}
                  target="_blank" rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} /> Download PDF
                </a>
                {selectedQuote.status === 1 && (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { handleApprove(selectedQuote.id); setShowQuoteModal(false); }}
                    >
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => { setRejectTarget(selectedQuote); setRejectReason(''); setShowQuoteModal(false); }}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </>
                )}
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

  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [adHocForm, setAdHocForm] = useState({ customerId: '', description: '', amount: '', dueDate: '' });
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await financialApi.getInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    customersApi.getAll().then(setCustomers).catch(() => {});
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInvoice(true);
    try {
      if (!adHocForm.customerId || !adHocForm.amount) throw new Error("Missing required fields");
      await financialApi.createAdHoc({
        customerId: parseInt(adHocForm.customerId),
        notes: adHocForm.description,
        subtotal: parseFloat(adHocForm.amount),
        taxRate: 16,
        dueDate: adHocForm.dueDate ? new Date(adHocForm.dueDate).toISOString() : new Date().toISOString()
      });
      setShowCreate(false);
      setAdHocForm({ customerId: '', description: '', amount: '', dueDate: '' });
      fetchInvoices();
    } catch (err: any) {
      alert('Failed to create invoice: ' + err.message);
    } finally {
      setSavingInvoice(false);
    }
  };

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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Create Invoice
        </button>
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
                <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
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
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: 12, padding: '5px 12px', color: 'var(--accent-blue)' }}
                          onClick={() => { setSelectedInvoice(inv); setShowInvoiceModal(true); }}
                        >
                          View
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

      {/* ── Create Invoice SlideOver ── */}
      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="Create Ad-Hoc Invoice" subtitle="Generate a manual invoice">
        <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingInvoice}>
              {savingInvoice ? 'Generating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* ── Invoice Modal ── */}
      {showInvoiceModal && selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowInvoiceModal(false)}>
          <div className="card-elevated" style={{ width: 500, padding: 24, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Invoice Details</div>
                <div style={{ fontSize: 13, color: 'var(--accent-indigo)', fontWeight: 600, marginTop: 4 }}>
                  {selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id}`}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowInvoiceModal(false)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span className={`badge ${(invoiceStatusMap[selectedInvoice.paymentStatus] || { badge: 'badge-muted' }).badge}`}>
                    {(invoiceStatusMap[selectedInvoice.paymentStatus] || { label: 'Unknown' }).label}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer</span>
                  <span style={{ fontWeight: 600 }}>{selectedInvoice.customer?.name || selectedInvoice.customerName || '—'}</span>
                </div>
                {selectedInvoice.jobCardId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Linked Job</span>
                    <span>#{selectedInvoice.jobCardId}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Due Date</span>
                  <span>{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : '—'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>K {(selectedInvoice.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>VAT ({selectedInvoice.taxRate || 16}%)</span>
                    <span style={{ color: 'var(--text-secondary)' }}>K {(selectedInvoice.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, borderTop: '1px solid var(--border-default)', paddingTop: 8 }}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--text-primary)' }}>K {(selectedInvoice.total || selectedInvoice.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Amount Paid</span>
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>K {(selectedInvoice.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, borderTop: '1px solid var(--border-default)', paddingTop: 8 }}>
                    <span>Balance Due</span>
                    <span style={{ color: 'var(--accent-rose)' }}>K {(selectedInvoice.balance || (selectedInvoice.total - (selectedInvoice.amountPaid || 0)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {selectedInvoice.notes && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 8, fontStyle: 'italic' }}>
                      {selectedInvoice.notes}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                <a
                  href={`/dashboard/invoices/${selectedInvoice.id}/print`}
                  target="_blank" rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} /> Download PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Approvals Hub Tab ────────────────────────────────────────────────────────
function ApprovalsHubTab({ onCountChange, usersMap }: { onCountChange: (n: number) => void; usersMap: Record<string, string> }) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'requisitions' | 'pos'>('requisitions');
  const [pendingPRs, setPendingPRs] = useState<any[]>([]);
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Row expansion state
  const [expandedPRId, setExpandedPRId] = useState<number | null>(null);
  const [expandedPOId, setExpandedPOId] = useState<number | null>(null);

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectTargetType, setRejectTargetType] = useState<'pr' | 'po' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const [pos, prs] = await Promise.all([
        procurementApi.getPendingApprovals(),
        procurementApi.getPendingRequisitions()
      ]);
      setPendingPOs(pos || []);
      setPendingPRs(prs || []);
      onCountChange((pos?.length ?? 0) + (prs?.length ?? 0));
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const canApprove = hasPermission('/dashboard/procurement:approve_reject', user?.allowedRoutes || [], user?.isPlatformOwner ?? false);

  const handleApprovePR = async (id: number) => {
    setActionLoading(true);
    try {
      await procurementApi.approveRequisition(id);
      await fetchPending();
    } catch (err: any) {
      alert('Failed to approve PR: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePO = async (id: number) => {
    setActionLoading(true);
    try {
      await procurementApi.approvePO(id);
      await fetchPending();
    } catch (err: any) {
      alert('Failed to approve PO: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (target: any, type: 'pr' | 'po') => {
    setRejectTarget(target);
    setRejectTargetType(type);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || !rejectTargetType) return;
    setActionLoading(true);
    try {
      if (rejectTargetType === 'pr') {
        await procurementApi.rejectRequisition(rejectTarget.id, rejectReason);
      } else {
        await procurementApi.rejectPO(rejectTarget.id, rejectReason);
      }
      setRejectTarget(null);
      setRejectTargetType(null);
      setRejectReason('');
      await fetchPending();
    } catch (err: any) {
      alert(`Failed to reject ${rejectTargetType.toUpperCase()}: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPRValue = pendingPRs.reduce((s, r) => s + (r.totalEstimatedAmount ?? 0), 0);
  const totalPOValue = pendingPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0);

  return (
    <>
      {/* Hero stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* PR Stat Card */}
        <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 10 }}>
          <FileText size={36} style={{ color: '#818cf8', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Pending Requisitions (PR)
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#818cf8', marginTop: 4 }}>
              {fmt(totalPRValue)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {pendingPRs.length} requisition{pendingPRs.length !== 1 ? 's' : ''} awaiting review
            </div>
          </div>
        </div>

        {/* PO Stat Card */}
        <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)', borderRadius: 10 }}>
          <ShieldCheck size={36} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Pending Purchase Orders (PO)
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-amber)', marginTop: 4 }}>
              {fmt(totalPOValue)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {pendingPOs.length} purchase order{pendingPOs.length !== 1 ? 's' : ''} awaiting review
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab Switcher */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveSubTab('requisitions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: activeSubTab === 'requisitions' ? 'rgba(99, 102, 241, 0.15)' : 'none',
            border: activeSubTab === 'requisitions' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: activeSubTab === 'requisitions' ? 600 : 400,
            color: activeSubTab === 'requisitions' ? '#818cf8' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}
        >
          <FileText size={15} />
          Purchase Requisitions (PR)
          <span style={{
            background: activeSubTab === 'requisitions' ? '#818cf8' : 'var(--bg-elevated)',
            color: activeSubTab === 'requisitions' ? '#1e1b4b' : 'var(--text-secondary)',
            borderRadius: 10,
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 6px',
            marginLeft: 4,
          }}>
            {pendingPRs.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('pos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: activeSubTab === 'pos' ? 'rgba(217, 119, 6, 0.12)' : 'none',
            border: activeSubTab === 'pos' ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid transparent',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: activeSubTab === 'pos' ? 600 : 400,
            color: activeSubTab === 'pos' ? 'var(--accent-amber)' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}
        >
          <ShieldCheck size={15} />
          Purchase Orders (PO)
          <span style={{
            background: activeSubTab === 'pos' ? 'var(--accent-amber)' : 'var(--bg-elevated)',
            color: activeSubTab === 'pos' ? '#451a03' : 'var(--text-secondary)',
            borderRadius: 10,
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 6px',
            marginLeft: 4,
          }}>
            {pendingPOs.length}
          </span>
        </button>
      </div>

      <div className="card" style={{ borderRadius: 10, overflow: 'hidden' }}>
        <ResponsiveTable>
          {activeSubTab === 'requisitions' ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>PR #</th>
                  <th>Requested By</th>
                  <th>Linkage</th>
                  <th>Required Date</th>
                  <th>Est. Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</td></tr>
                ) : pendingPRs.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon"><FileText size={32} /></div>
                        <div className="empty-state-text">No requisitions pending approval</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingPRs.map(pr => {
                    const isExpanded = expandedPRId === pr.id;
                    const isRequester = pr.requestedById === user?.id;
                    const raisedByName = usersMap[pr.requestedById] || pr.createdByName || pr.requestedBy || '—';

                    return (
                      <React.Fragment key={pr.id}>
                        <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedPRId(isExpanded ? null : pr.id)}>
                          <td style={{ color: '#818cf8', fontWeight: 600 }}>{pr.requisitionNumber}</td>
                          <td style={{ fontWeight: 500 }}>{raisedByName}</td>
                          <td>
                            {pr.jobCardId ? (
                              <span className="badge badge-blue">
                                Job #{pr.jobCard?.jobNumber || pr.jobCardId}
                              </span>
                            ) : pr.departmentId ? (
                              <span className="badge badge-violet">
                                {pr.department?.name || 'Department Overhead'}
                              </span>
                            ) : (
                              <span className="badge badge-green">
                                Inventory Stock
                              </span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-tertiary)' }}>
                            {pr.requiredDate ? new Date(pr.requiredDate).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ fontWeight: 600 }}>{fmt(pr.totalEstimatedAmount)}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button
                                className="btn btn-primary"
                                style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
                                disabled={actionLoading || isRequester || !canApprove}
                                onClick={() => handleApprovePR(pr.id)}
                                title={isRequester ? "You cannot approve your own requisition" : "Approve Requisition"}
                              >
                                <CheckCircle size={13} /> Approve
                              </button>
                              <button
                                className="btn btn-danger"
                                style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
                                disabled={actionLoading}
                                onClick={() => handleRejectClick(pr, 'pr')}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: 4 }}
                                onClick={() => setExpandedPRId(isExpanded ? null : pr.id)}
                              >
                                {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} style={{ padding: '0 24px 20px 24px', background: 'var(--bg-app)' }}>
                              {isRequester && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '10px 14px',
                                  borderRadius: 6,
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: 'var(--accent-rose)',
                                  fontSize: 12,
                                  fontWeight: 500,
                                  marginBottom: 16,
                                  marginTop: 12
                                }}>
                                  <AlertCircle size={16} />
                                  <span>Requester cannot self-approve. Waiting for another authorized Finance user.</span>
                                </div>
                              )}
                              
                              {pr.notes && (
                                <div style={{ marginBottom: 16, marginTop: isRequester ? 0 : 12 }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>PURPOSE / NOTES</div>
                                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                                    {pr.notes}
                                  </div>
                                </div>
                              )}

                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, marginTop: pr.notes || isRequester ? 0 : 12 }}>REQUISITION LINE ITEMS</div>
                              {(pr.items || []).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {pr.items.map((item: any) => (
                                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 140px', gap: 12, padding: '10px 14px', borderRadius: 6, background: 'var(--bg-elevated)', fontSize: 12, border: '1px solid var(--border-subtle)' }}>
                                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.description}</span>
                                      <span style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Qty: {item.quantityRequested}</span>
                                      <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{fmt(item.estimatedUnitCost)} / unit</span>
                                      <span style={{ color: '#818cf8', textAlign: 'right', fontWeight: 600 }}>{fmt(item.estimatedUnitCost * item.quantityRequested)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 12px' }}>
                                  No items specified.
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
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
                    const isExpanded = expandedPOId === po.id;
                    const isCreator = po.raisedBy === user?.id;
                    const raisedByName = usersMap[po.raisedBy] || po.createdByName || po.raisedBy || '—';

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
                      <React.Fragment key={po.id}>
                        <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedPOId(isExpanded ? null : po.id)}>
                          <td style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{po.poNumber}</td>
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
                          <td style={{ fontWeight: 500 }}>{raisedByName}</td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                            {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '—'}
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button
                                className="btn btn-primary"
                                style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
                                disabled={actionLoading || isCreator || !canApprove}
                                onClick={() => handleApprovePO(po.id)}
                                title={isCreator ? "You cannot approve your own purchase order" : "Approve Purchase Order"}
                              >
                                <CheckCircle size={13} /> Approve
                              </button>
                              <button
                                className="btn btn-danger"
                                style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
                                disabled={actionLoading}
                                onClick={() => handleRejectClick(po, 'po')}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: 4 }}
                                onClick={() => setExpandedPOId(isExpanded ? null : po.id)}
                              >
                                {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} style={{ padding: '0 24px 20px 24px', background: 'var(--bg-app)' }}>
                              {isCreator && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '10px 14px',
                                  borderRadius: 6,
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: 'var(--accent-rose)',
                                  fontSize: 12,
                                  fontWeight: 500,
                                  marginBottom: 16,
                                  marginTop: 12
                                }}>
                                  <AlertCircle size={16} />
                                  <span>Creator cannot self-approve. Waiting for another authorized Finance user.</span>
                                </div>
                              )}

                              {po.notes && (
                                <div style={{ marginBottom: 16, marginTop: isCreator ? 0 : 12 }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>INTERNAL NOTES / REFERENCE</div>
                                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                                    {po.notes}
                                  </div>
                                </div>
                              )}

                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, marginTop: po.notes || isCreator ? 0 : 12 }}>PURCHASE ORDER LINE ITEMS</div>
                              {(po.items || []).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {po.items.map((item: any) => (
                                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 140px', gap: 12, padding: '10px 14px', borderRadius: 6, background: 'var(--bg-elevated)', fontSize: 12, border: '1px solid var(--border-subtle)' }}>
                                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.description}</span>
                                      <span style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Qty: {item.quantityOrdered}</span>
                                      <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{fmt(item.unitCost)} / unit</span>
                                      <span style={{ color: 'var(--accent-amber)', textAlign: 'right', fontWeight: 600 }}>{fmt(item.unitCost * item.quantityOrdered)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 12px' }}>
                                  No items specified.
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </ResponsiveTable>
      </div>

      {/* Reject Modal */}
      {rejectTarget && rejectTargetType && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2>Reject {rejectTargetType === 'pr' ? 'Purchase Requisition' : 'Purchase Order'}</h2>
              <button className="icon-btn" onClick={() => { setRejectTarget(null); setRejectTargetType(null); }}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Rejecting <strong>{rejectTargetType === 'pr' ? rejectTarget.requisitionNumber : rejectTarget.poNumber}</strong> —{' '}
                {fmt(rejectTargetType === 'pr' ? rejectTarget.totalEstimatedAmount : rejectTarget.totalAmount)}.
                Please provide a reason for the record.
              </p>
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder={rejectTargetType === 'pr' ? "e.g. Budget exceeded, items not required..." : "e.g. Budget exceeded, supplier not approved..."}
                  style={{ resize: 'vertical', fontFamily: "'Barlow', sans-serif" }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => { setRejectTarget(null); setRejectTargetType(null); }}>Cancel</button>
                <button
                  className="btn btn-danger"
                  disabled={actionLoading || !rejectReason.trim()}
                  onClick={handleConfirmReject}
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

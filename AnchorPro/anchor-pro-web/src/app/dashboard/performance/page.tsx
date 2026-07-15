'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, shiftLogsApi } from '@/lib/api';
import { Activity, CheckCircle, Clock, AlertTriangle, RefreshCw, BarChart3, TrendingUp, Zap, Calendar } from 'lucide-react';
import ResponsiveTable from '@/components/ResponsiveTable';
import { useDictionary } from '@/lib/DictionaryContext';
import { useAuth } from '@/lib/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number | undefined | null) {
  if (n === null || n === undefined) return '0';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const PERIOD_OPTIONS = [
  { label: 'Last 7 days',  value: 7   },
  { label: 'Last 30 days', value: 30  },
  { label: 'Last 90 days', value: 90  },
  { label: 'All time',     value: 3650 },
];

export default function PerformancePage() {
  const { user } = useAuth();
  // 1 = Mining (ShiftProductionLog)
  if (user?.operationMode === 1) {
    return <MiningProductionDashboard />;
  }
  return <MaintenancePerformanceDashboard />;
}

function MiningProductionDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start of week
    const weekStr = startOfWeek.toISOString().slice(0, 10);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStr = startOfMonth.toISOString().slice(0, 10);
    
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yearStr = startOfYear.toISOString().slice(0, 10);
    
    try {
      const [dRes, wRes, mRes, yRes] = await Promise.all([
        shiftLogsApi.getSummary(today, today).catch(() => null),
        shiftLogsApi.getSummary(weekStr, today).catch(() => null),
        shiftLogsApi.getSummary(monthStr, today).catch(() => null),
        shiftLogsApi.getSummary(yearStr, today).catch(() => null),
      ]);
      setData({ day: dRes, week: wRes, month: mRes, year: yRes });
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unit = data.day?.unitOfMeasure || data.month?.unitOfMeasure || 'Tons';

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={22} className="text-accent-amber" style={{ color: '#f59e0b' }} /> Production Dashboard
          </h1>
          <p className="page-subtitle">Shift, Daily, Weekly, Monthly, and Yearly Production Metrics</p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading production data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          
          <div className="card" style={{ padding: '24px 20px', borderLeft: '4px solid var(--accent-blue)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Today's Production
              </div>
              <Activity size={18} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {fmtNum(data.day?.totalQuantityProduced)} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>{unit}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              From {data.day?.totalShifts || 0} shift(s) today
            </div>
          </div>

          <div className="card" style={{ padding: '24px 20px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                This Week
              </div>
              <Calendar size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {fmtNum(data.week?.totalQuantityProduced)} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>{unit}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {fmtNum(data.week?.totalOperatingHours)} hrs · {fmtNum(data.week?.totalFuelConsumedLitres)}L fuel
            </div>
          </div>

          <div className="card" style={{ padding: '24px 20px', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                This Month (MTD)
              </div>
              <BarChart3 size={18} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {fmtNum(data.month?.totalQuantityProduced)} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>{unit}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Avg Cost: {data.month?.costPerUnit > 0 ? `K ${fmtNum(data.month?.costPerUnit)} / ${unit}` : 'N/A'}
            </div>
          </div>

          <div className="card" style={{ padding: '24px 20px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                This Year (YTD)
              </div>
              <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {fmtNum(data.year?.totalQuantityProduced)} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>{unit}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Total Shifts: {data.year?.totalShifts || 0}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function MaintenancePerformanceDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days,    setDays]    = useState(30);
  const { t } = useDictionary();

  const fetchMetrics = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const data = await dashboardApi.getPerformance(d);
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetrics(days); }, [days, fetchMetrics]);

  const selectedLabel = PERIOD_OPTIONS.find(o => o.value === days)?.label ?? `Last ${days} days`;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={22} className="text-accent-blue" /> Performance Metrics
          </h1>
          <p className="page-subtitle">Analyze asset reliability and {t('technician')} efficiency</p>
        </div>

        {/* Period selector + Refresh */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            id="perf-period-select"
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 13,
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            {PERIOD_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => fetchMetrics(days)} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading && !metrics ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : metrics ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* KPI Cards */}
            <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-blue)', marginBottom: 8 }}>
                {metrics.onTimeCompletionPercentage}%
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                On-Time Completion
              </div>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--status-green)', marginBottom: 8 }}>
                {metrics.avgLeadTimeHours} h
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Avg. Lead Time
              </div>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--status-yellow)', marginBottom: 8 }}>
                {metrics.overdueJobsCount}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Overdue Jobs
              </div>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                {metrics.completedJobsInPeriod}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Jobs ({selectedLabel})
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            {/* Technician Performance */}
            <div className="card">
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{t('Technicians')} Performance</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  Utilization and efficiency · {selectedLabel}
                </p>
              </div>
              <div className="table-scroll">
                <ResponsiveTable>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('Technician')}</th>
                        <th style={{ textAlign: 'center' }}>Jobs</th>
                        <th style={{ textAlign: 'center' }}>Hours</th>
                        <th style={{ textAlign: 'right' }}>Util %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.technicianStats?.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                            No completed jobs in this period
                          </td>
                        </tr>
                      ) : (
                        metrics.technicianStats?.slice(0, 5).map((tech: any, i: number) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{tech.technicianName}</td>
                            <td style={{ textAlign: 'center' }}>{tech.jobsCompleted}</td>
                            <td style={{ textAlign: 'center' }}>{tech.totalHoursWorked}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span className={`badge ${tech.utilizationPercentage > 80 ? 'badge-green' : tech.utilizationPercentage > 50 ? 'badge-yellow' : 'badge-muted'}`}>
                                {tech.utilizationPercentage}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </ResponsiveTable>
              </div>
            </div>

            {/* Asset Reliability */}
            <div className="card">
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Asset Reliability (Top Issues)</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Equipment with most breakdowns</p>
              </div>
              <div className="table-scroll">
                <ResponsiveTable>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th style={{ textAlign: 'center' }}>Breakdowns</th>
                        <th style={{ textAlign: 'center' }}>MTTR (Hr)</th>
                        <th style={{ textAlign: 'right' }}>Maint. Hrs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.equipmentStats?.slice(0, 5).map((eq: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {eq.equipmentName}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {eq.breakdownCount > 2 ? (
                              <span style={{ color: 'var(--status-red)', fontWeight: 700 }}>{eq.breakdownCount}</span>
                            ) : (
                              <span>{eq.breakdownCount}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>{eq.mttr_Hours}</td>
                          <td style={{ textAlign: 'right' }}>{eq.totalMaintenanceHours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ResponsiveTable>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

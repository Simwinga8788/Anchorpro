'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, shiftLogsApi } from '@/lib/api';
import { Activity, CheckCircle, Clock, AlertTriangle, RefreshCw, BarChart3, TrendingUp, Zap, Calendar } from 'lucide-react';
import ResponsiveTable from '@/components/ResponsiveTable';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useDictionary } from '@/lib/DictionaryContext';
import { useAuth } from '@/lib/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number | undefined | null) {
  if (n === null || n === undefined) return '0';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function renderKPIValue(actual: number | undefined, target: number | undefined, unit: string) {
  const act = actual || 0;
  const tgt = target || 0;
  if (tgt > 0) {
    const pct = Math.round((act / tgt) * 100);
    const color = pct >= 100 ? 'var(--accent-emerald)' : pct >= 80 ? 'var(--accent-amber)' : 'var(--accent-rose)';
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span>{fmtNum(act)} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>/ {fmtNum(tgt)} {unit}</span></span>
        <span style={{ fontSize: 14, fontWeight: 700, color, background: 'var(--bg-app)', padding: '2px 6px', borderRadius: 4 }}>
          {pct}%
        </span>
      </div>
    );
  }
  return <span>{fmtNum(act)} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>{unit}</span></span>;
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
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartDays, setChartDays] = useState(30);

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
      const [dRes, wRes, mRes, yRes, chartRes] = await Promise.all([
        shiftLogsApi.getSummary(today, today).catch(() => null),
        shiftLogsApi.getSummary(weekStr, today).catch(() => null),
        shiftLogsApi.getSummary(monthStr, today).catch(() => null),
        shiftLogsApi.getSummary(yearStr, today).catch(() => null),
        shiftLogsApi.getChartData(chartDays).catch(() => []),
      ]);
      setData({ day: dRes, week: wRes, month: mRes, year: yRes });
      setChartData(chartRes || []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [chartDays]);

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
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {renderKPIValue(data.day?.totalQuantityProduced, data.day?.totalTargetQuantity, unit)}
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
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {renderKPIValue(data.week?.totalQuantityProduced, data.week?.totalTargetQuantity, unit)}
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
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {renderKPIValue(data.month?.totalQuantityProduced, data.month?.totalTargetQuantity, unit)}
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
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {renderKPIValue(data.year?.totalQuantityProduced, data.year?.totalTargetQuantity, unit)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Total Shifts: {data.year?.totalShifts || 0}
            </div>
          </div>

        </div>
      )}

      {/* Chart Section */}
      {!loading && (
        <div className="card" style={{ padding: '24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Daily Production: Actual vs Target</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Track daily operational performance over time</p>
            </div>
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '6px 30px 6px 12px', fontSize: 13 }}
              value={chartDays} 
              onChange={e => setChartDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
          
          <div style={{ height: 350, width: '100%' }}>
            {chartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No production data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-popover)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)' }}
                    itemStyle={{ fontSize: 13 }}
                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: 5, fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Bar dataKey="actual" name={`Actual (${unit})`} fill="var(--accent-blue)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line type="monotone" dataKey="target" name={`Target (${unit})`} stroke="var(--accent-amber)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
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

'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import {
  Activity, CheckCircle, Clock, AlertTriangle, Briefcase, RefreshCw
} from 'lucide-react';
import ResponsiveTable from '@/components/ResponsiveTable';
import { useDictionary } from '@/lib/DictionaryContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number | undefined | null) {
  if (n === null || n === undefined) return '0';
  return n.toLocaleString();
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useDictionary();

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getPerformance(30);
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={22} className="text-accent-blue" /> Performance Metrics
          </h1>
          <p className="page-subtitle">Analyze asset reliability and {t('technician')} efficiency</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchMetrics} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
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
                Jobs (30d)
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            {/* Technician Performance */}
            <div className="card">
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{t('Technicians')} Performance</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Utilization and efficiency</p>
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
                      {metrics.technicianStats?.slice(0, 5).map((tech: any, i: number) => (
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
                      ))}
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

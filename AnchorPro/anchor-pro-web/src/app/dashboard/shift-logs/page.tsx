'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shiftLogsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import ResponsiveTable from '@/components/ResponsiveTable';
import { Plus, Check, X, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';

function TargetActualBar({ actual, target }: { actual: number; target: number | null }) {
  if (!target || target === 0) {
    return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No target</span>;
  }
  const pct = Math.min(Math.round((actual / target) * 100), 150);
  const over = pct >= 100;
  const barPct = Math.min(pct, 100);
  const barColor = pct >= 100 ? 'var(--accent-emerald)' : pct >= 75 ? 'var(--accent-amber)' : 'var(--accent-rose)';
  const Icon = pct >= 100 ? TrendingUp : pct >= 50 ? Minus : TrendingDown;
  return (
    <div style={{ minWidth: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{actual.toLocaleString()}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {target.toLocaleString()}</span>
        <Icon size={12} color={barColor} />
      </div>
      <div style={{ height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barPct}%`, background: barColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: over ? 'var(--accent-emerald)' : 'var(--text-muted)', marginTop: 2, fontWeight: over ? 700 : 400 }}>
        {pct}% {over ? '✓ Target met' : 'of target'}
      </div>
    </div>
  );
}

export default function ShiftLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const router = useRouter();
  const { isPlanner, isPlatformOwner, user } = useAuth();
  const { t } = useDictionary();

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await shiftLogsApi.getAll();
      data.sort((a: any, b: any) => new Date(b.shiftDate).getTime() - new Date(a.shiftDate).getTime());
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this shift log?')) return;
    try { await shiftLogsApi.approve(id); loadLogs(); } catch (e: any) { alert(e.message || 'Failed to approve'); }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try { await shiftLogsApi.reject(id, reason || 'Rejected by supervisor'); loadLogs(); } catch (e: any) { alert(e.message || 'Failed to reject'); }
  };

  const handleGenerateDaily = async () => {
    if (!confirm('Generate a Daily Log from all completed tasks for today?')) return;
    try { 
      await shiftLogsApi.generateDaily(new Date().toISOString()); 
      alert('Daily log generated successfully!');
      loadLogs(); 
    } catch (e: any) { 
      alert(e.message || 'Failed to generate daily log'); 
    }
  };

  const filteredLogs = filterStatus === 'all' ? logs : logs.filter(l => {
    if (filterStatus === 'draft') return l.status === 0;
    if (filterStatus === 'submitted') return l.status === 1;
    if (filterStatus === 'approved') return l.status === 2;
    if (filterStatus === 'rejected') return l.status === 3;
    return true;
  });

  // Summary stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.shiftDate?.startsWith(todayStr));
  const todayActual = todayLogs.reduce((s: number, l: any) => s + (l.quantityProduced || 0), 0);
  const todayTarget = todayLogs.reduce((s: number, l: any) => s + (l.targetQuantity || 0), 0);

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} className="text-accent-blue" />
            {t('ShiftLogsTitle', 'Shift Production Logs')}
          </h1>
          <p className="page-subtitle">{t('ShiftLogsSubtitle', 'Track daily shift production, fuel, and target vs actual output.')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleGenerateDaily} className="btn btn-secondary">
            <FileText size={18} /> Generate Daily Log
          </button>
          <Link href="/dashboard/shift-logs/new" className="btn btn-primary">
            <Plus size={18} /> New {t('ShiftLogItem', 'Shift Log')}
          </Link>
        </div>
      </div>

      {/* Today's summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{t('TodayProduction', "Today's Production")}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{todayActual.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{t('Unit', 'tons')}</span></div>
          <TargetActualBar actual={todayActual} target={todayTarget > 0 ? todayTarget : null} />
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Today's Shifts</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-blue)' }}>{todayLogs.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{todayLogs.filter((l: any) => l.status === 2).length} approved</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Pending Review</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-amber)' }}>{logs.filter((l: any) => l.status === 1).length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>submitted logs</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Total Logs</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{logs.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>all time</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'draft', 'submitted', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={filterStatus === s ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: 12, padding: '6px 14px', textTransform: 'capitalize' }}>
            {s === 'all' ? 'All Logs' : s}
          </button>
        ))}
      </div>

      <div className="card">
        <ResponsiveTable>
          <table className="data-table">
            <thead>
              <tr>
                <th>Log No.</th>
                <th>Date / Shift</th>
                <th>{t('Activity', 'Activity')}</th>
                <th>{t('Equipment', 'Equipment')}</th>
                <th>{t('SourceDestination', 'Source ➔ Destination')}</th>
                <th>{t('TargetVsActual', 'Target vs Actual')}</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>Loading logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No shift logs found.</td></tr>
              ) : (
                filteredLogs.map(log => {
                  const shiftName = log.shift === 0 ? 'Day' : log.shift === 1 ? 'Night' : 'Afternoon';
                  let statusBadge = 'badge-muted';
                  let statusText = 'Draft';
                  if (log.status === 1) { statusBadge = 'badge-blue'; statusText = 'Submitted'; }
                  if (log.status === 2) { statusBadge = 'badge-green'; statusText = 'Approved'; }
                  if (log.status === 3) { statusBadge = 'badge-red'; statusText = 'Rejected'; }

                  const isReviewer = isPlanner || isPlatformOwner;

                  const activityLabel = log.miningActivity !== null && log.miningActivity !== undefined
                    ? [
                        t('Activity0', 'General Mining'),
                        t('Activity1', 'Blasting'),
                        t('Activity2', 'Loading'),
                        t('Activity3', 'Hauling'),
                        t('Activity4', 'Development'),
                        t('Activity5', 'Stripping'),
                        t('Activity6', 'Dewatering'),
                        t('Activity7', 'Support')
                      ][log.miningActivity] || log.activityType
                    : log.activityType;

                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.logNumber}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{new Date(log.shiftDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{shiftName} Shift</div>
                      </td>
                      <td>
                        {activityLabel ? (
                          <span className="badge badge-gray" style={{ fontSize: 11 }}>{activityLabel}</span>
                        ) : '-'}
                      </td>
                      <td>{log.equipment ? log.equipment.name : <span style={{color: 'var(--text-muted)'}}>None</span>}</td>
                      <td>
                        {log.sourceLocation ? (
                          <div style={{ fontSize: 13 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{log.sourceLocation}</span>
                            {' ➔ '}
                            <span style={{ color: 'var(--text-secondary)' }}>{log.destinationLocation || 'N/A'}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        <TargetActualBar actual={log.quantityProduced || 0} target={log.targetQuantity} />
                      </td>
                      <td><span className={`badge ${statusBadge}`}>{statusText}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        {log.status === 1 && isReviewer ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleApprove(log.id)} title="Approve">
                              <Check size={16} className="text-status-green" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleReject(log.id)} title="Reject">
                              <X size={16} className="text-status-red" />
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-secondary" onClick={() => router.push(`/dashboard/shift-logs/${log.id}`)}>View</button>
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
  );
}

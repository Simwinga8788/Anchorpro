'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shiftLogsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ResponsiveTable from '@/components/ResponsiveTable';
import { Plus, Check, X, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ShiftLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isPlanner, isPlatformOwner, user } = useAuth();

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await shiftLogsApi.getAll();
      // Sort by date descending
      data.sort((a, b) => new Date(b.shiftDate).getTime() - new Date(a.shiftDate).getTime());
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this shift log?')) return;
    try {
      await shiftLogsApi.approve(id);
      loadLogs();
    } catch (e: any) {
      alert(e.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await shiftLogsApi.reject(id, reason || 'Rejected by supervisor');
      loadLogs();
    } catch (e: any) {
      alert(e.message || 'Failed to reject');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} className="text-accent-blue" />
            Shift Production Logs
          </h1>
          <p className="page-subtitle">Manage daily shift production and resource tracking.</p>
        </div>
        <Link href="/dashboard/shift-logs/new" className="btn btn-primary">
          <Plus size={18} /> New Shift Log
        </Link>
      </div>

      <div className="card">
        <ResponsiveTable>
          <table className="data-table">
            <thead>
              <tr>
                <th>Log No.</th>
                <th>Date / Shift</th>
                <th>Equipment</th>
                <th>Source ➔ Destination</th>
                <th>Loads</th>
                <th>Est. Tonnage</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No shift logs found.</td></tr>
              ) : (
                logs.map(log => {
                  const shiftName = log.shift === 0 ? 'Day' : log.shift === 1 ? 'Night' : 'Afternoon';
                  let statusBadge = 'badge-muted';
                  let statusText = 'Draft';
                  if (log.status === 1) { statusBadge = 'badge-blue'; statusText = 'Submitted'; }
                  if (log.status === 2) { statusBadge = 'badge-green'; statusText = 'Approved'; }
                  if (log.status === 3) { statusBadge = 'badge-red'; statusText = 'Rejected'; }

                  const isReviewer = isPlanner || isPlatformOwner;

                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.logNumber}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{new Date(log.shiftDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{shiftName} Shift</div>
                      </td>
                      <td>
                        {log.equipment ? log.equipment.name : <span style={{color: 'var(--text-muted)'}}>None</span>}
                      </td>
                      <td>
                        {log.sourceLocation ? (
                          <div style={{ fontSize: 13 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{log.sourceLocation}</span>
                            {' ➔ '}
                            <span style={{ color: 'var(--text-secondary)' }}>{log.destinationLocation || 'N/A'}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td>{log.loadCount || '-'}</td>
                      <td style={{ fontWeight: 600 }}>
                        {log.quantityProduced} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{log.unitOfMeasure}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge}`}>{statusText}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {/* If it's submitted and user is reviewer, allow Approve/Reject */}
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
                          <button className="btn btn-secondary" onClick={() => router.push(`/dashboard/shift-logs/${log.id}`)}>
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
    </div>
  );
}

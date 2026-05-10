'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Square, Timer, User, Briefcase, Trash2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { timeTrackingApi, dashboardApi } from '@/lib/api';

function formatDuration(minutes: number) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my' | 'all'>('my');
  const [clockingIn, setClockinIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const openEntry = myEntries.find(e => !e.clockOut);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, all, jobList] = await Promise.all([
        timeTrackingApi.getMine(),
        timeTrackingApi.getAll(),
        dashboardApi.getJobCards(),
      ]);
      setMyEntries(mine || []);
      setEntries(all || []);
      setJobs((jobList || []).filter((j: any) => j.status !== 3));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleClockIn() {
    if (!selectedJob) return;
    setClockinIn(true);
    try {
      await timeTrackingApi.clockIn(Number(selectedJob), notes || undefined);
      setSelectedJob(''); setNotes('');
      showToast('Clocked in successfully');
      await load();
    } catch (e: any) {
      showToast(e.message || 'Clock-in failed', 'err');
    } finally {
      setClockinIn(false);
    }
  }

  async function handleClockOut() {
    setClockingOut(true);
    try {
      await timeTrackingApi.clockOut(openEntry?.id, notes || undefined);
      setNotes('');
      showToast('Clocked out');
      await load();
    } catch (e: any) {
      showToast(e.message || 'Clock-out failed', 'err');
    } finally {
      setClockingOut(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this time entry?')) return;
    try {
      await timeTrackingApi.deleteEntry(id);
      showToast('Entry deleted');
      await load();
    } catch {
      showToast('Delete failed', 'err');
    }
  }

  const displayEntries = tab === 'my' ? myEntries : entries;

  const totalMinutes = displayEntries.reduce((sum: number, e: any) => sum + (e.durationMinutes || 0), 0);

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          background: toast.type === 'ok' ? 'var(--accent-green)' : 'var(--accent-rose)',
          color: '#fff', padding: '10px 18px', borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {toast.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Time Tracking</h1>
          <p className="page-subtitle">Clock in/out on jobs and review labour hours</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Timer size={14} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatDuration(totalMinutes)} logged
            </span>
          </div>
        </div>
      </div>

      {/* Clock In/Out card */}
      <div className="card-elevated" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Clock size={15} style={{ color: openEntry ? 'var(--accent-green)' : 'var(--text-muted)' }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            {openEntry ? 'Currently Clocked In' : 'Clock In to a Job'}
          </span>
          {openEntry && (
            <span className="badge badge-green" style={{ marginLeft: 6 }}>
              <span className="status-dot green" />
              Active — {openEntry.jobNumber}
            </span>
          )}
        </div>

        {openEntry ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Notes (optional)</label>
              <input
                className="input"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any notes for this session..."
              />
            </div>
            <button
              className="btn btn-danger"
              onClick={handleClockOut}
              disabled={clockingOut}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Square size={13} /> {clockingOut ? 'Clocking out...' : 'Clock Out'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Job Card</label>
              <select className="input" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                <option value="">Select a job...</option>
                {jobs.map((j: any) => (
                  <option key={j.id} value={j.id}>
                    {j.jobNumber} — {j.equipment?.name || j.description || 'Unnamed'}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Notes (optional)</label>
              <input
                className="input"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. starting inspection..."
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleClockIn}
              disabled={clockingIn || !selectedJob}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Play size={13} /> {clockingIn ? 'Clocking in...' : 'Clock In'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {(['my', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: tab === t ? 'var(--accent-blue)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {t === 'my' ? 'My Time Log' : 'All Entries'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading entries...</div>
      ) : displayEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Timer size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No time entries yet</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 4 }}>Clock in to a job to start tracking</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Job', tab === 'all' ? 'Technician' : null, 'Clock In', 'Clock Out', 'Duration', 'Notes', ''].filter(Boolean).map(h => (
                  <th key={h!} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayEntries.map((e: any) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Briefcase size={13} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{e.jobNumber || `Job #${e.jobCardId}`}</div>
                        {e.jobDescription && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{e.jobDescription}</div>}
                      </div>
                    </div>
                  </td>
                  {tab === 'all' && (
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={12} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.technicianName || e.technicianId}</span>
                      </div>
                    </td>
                  )}
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(e.clockIn)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {e.clockOut ? formatDate(e.clockOut) : (
                      <span className="badge badge-green"><span className="status-dot green" />Active</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: e.durationMinutes > 0 ? 'var(--accent-blue)' : 'var(--text-muted)',
                    }}>
                      {e.clockOut ? formatDuration(e.durationMinutes) : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.notes || '—'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(e.id)}
                      style={{ color: 'var(--accent-rose)', padding: '4px 6px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

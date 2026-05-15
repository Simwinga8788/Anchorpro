'use client';

import { Activity, CheckCircle2, AlertCircle, AlertTriangle, Shield, User, Database, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auditLogApi } from '@/lib/api';

const categories = ['All', 'Security', 'Billing', 'Operations', 'Integration', 'System'];

const levelFromAction = (action: string): string => {
  const a = action.toLowerCase();
  if (a.includes('fail') || a.includes('error') || a.includes('block')) return 'warning';
  if (a.includes('impersonat') || a.includes('suspend') || a.includes('cancel')) return 'warning';
  if (a.includes('complete') || a.includes('success') || a.includes('activated') || a.includes('approved') || a.includes('paid')) return 'success';
  if (a.includes('delete') || a.includes('removed')) return 'error';
  return 'info';
};

const levelConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  success: { color: 'var(--accent-emerald)', icon: <CheckCircle2 size={14}/> },
  info:    { color: 'var(--accent-blue)',    icon: <Activity size={14}/> },
  warning: { color: 'var(--accent-amber)',   icon: <AlertTriangle size={14}/> },
  error:   { color: 'var(--accent-rose)',    icon: <AlertCircle size={14}/> },
};

const categoryIcon: Record<string, React.ReactNode> = {
  Security:    <Shield size={11}/>,
  Billing:     <CheckCircle2 size={11}/>,
  Users:       <User size={11}/>,
  Operations:  <Activity size={11}/>,
  System:      <Database size={11}/>,
  Integration: <AlertCircle size={11}/>,
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AuditLogsPage() {
  const [cat,     setCat]     = useState('All');
  const [logs,    setLogs]    = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [days,    setDays]    = useState(30);

  const load = async (module?: string, windowDays = days) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { days: String(windowDays), pageSize: '100' };
      if (module && module !== 'All') params.module = module;
      const res = await auditLogApi.getLogs(params);
      setLogs(Array.isArray(res?.logs) ? res.logs : []);
      setTotal(res?.total ?? 0);
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(cat === 'All' ? undefined : cat, days); }, [cat, days]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Audit Logs</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Complete event trail across all tenants and platform operations
            {offline && <span style={{ color: 'var(--accent-amber)', marginLeft: 8 }}>⚠ Offline</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ fontSize: 12, padding: '5px 10px', height: 32 }}
            value={days}
            onChange={e => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => load(cat === 'All' ? undefined : cat, days)} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Refresh
          </button>
          <span className="badge badge-blue" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="status-dot blue" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}/>
            Live
          </span>
        </div>
      </div>

      <div className="card">
        {/* Filter bar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)} className="btn btn-sm" style={{
              background: cat === c ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
              color: cat === c ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${cat === c ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {categoryIcon[c]} {c}
            </button>
          ))}
        </div>

        {/* Log List */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> Loading audit logs…
          </div>
        ) : offline ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <AlertTriangle size={28} style={{ color: 'var(--accent-amber)', marginBottom: 8 }}/>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Could not reach the API.</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No audit events found for this period.
          </div>
        ) : (
          <div>
            {logs.map((log: any, i: number) => {
              const level = levelFromAction(log.action ?? '');
              const lc = levelConfig[level] ?? levelConfig['info'];
              const module = log.module ?? 'System';
              return (
                <div key={log.id ?? i} style={{
                  padding: '14px 20px',
                  borderBottom: i < logs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <div style={{ flexShrink: 0, marginTop: 2, color: lc.color }}>{lc.icon}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{log.action}</span>
                      <span className="badge badge-muted" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                        {categoryIcon[module] ?? <Activity size={11}/>} {module}
                      </span>
                    </div>
                    {(log.oldValue || log.newValue) && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 3, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {log.newValue ?? log.oldValue}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {log.changedBy ?? '—'}</span>
                      {log.ipAddress && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {log.ipAddress}</span>}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0, fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {log.timestamp ? timeAgo(log.timestamp) : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)' }}>
          {loading ? 'Loading…' : `Showing ${logs.length} of ${total} events`}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

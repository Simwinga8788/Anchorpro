'use client';
import { Clock, AlertTriangle } from 'lucide-react';

export default function TimeTrackingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Clock size={28} style={{ color: 'var(--accent-amber)' }} />
      </div>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Time Tracking — Coming Soon</h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 380 }}>
          The time tracking module requires a backend controller that has not been implemented yet.
          Technician work hours are tracked automatically via job card assignments.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)' }}>
        <AlertTriangle size={14} style={{ color: 'var(--accent-amber)' }} />
        <span style={{ fontSize: 12, color: 'var(--accent-amber)' }}>No backend API exists for this module yet</span>
      </div>
    </div>
  );
}

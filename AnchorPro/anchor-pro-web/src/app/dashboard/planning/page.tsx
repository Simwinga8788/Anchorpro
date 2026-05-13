'use client';
import { CalendarDays, AlertTriangle } from 'lucide-react';

export default function PlanningPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CalendarDays size={28} style={{ color: 'var(--accent-blue)' }} />
      </div>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Planning Board — Coming Soon</h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 380 }}>
          The planning board requires a scheduling backend controller that has not been implemented yet.
          For now, manage job scheduling directly from the Job Cards module.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: 'var(--accent-amber-dim)', border: '1px solid var(--accent-amber)' }}>
        <AlertTriangle size={14} style={{ color: 'var(--accent-amber)' }} />
        <span style={{ fontSize: 12, color: 'var(--accent-amber)' }}>No backend API exists for this module yet</span>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Wrench, Play, FileText, CheckCircle2 } from 'lucide-react';
import { shiftLogsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import SlideOver from '@/components/SlideOver';

export default function MiningMyShifts() {
  const router = useRouter();
  const { user } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Downtime state
  const [showDowntime, setShowDowntime] = useState(false);
  const [downtimeData, setDowntimeData] = useState({ categoryId: '', notes: '' });

  const loadShifts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const logs = await shiftLogsApi.getAll();
      // Find Draft logs assigned to this user (by name)
      const myName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.userName;
      
      const myShifts = logs.filter(l => 
        l.status === 0 && 
        l.operatorName === myName
      );
      myShifts.sort((a, b) => new Date(a.shiftDate).getTime() - new Date(b.shiftDate).getTime());
      setShifts(myShifts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [user]);

  const handleStartShift = (logId: number) => {
    router.push(`/dashboard/shift-logs/${logId}`);
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">My Shifts</h1>
          <p className="page-subtitle">Your scheduled shift roster and active logs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard/shift-logs/new')}>
          <FileText size={16} /> Log New Shift
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading your roster...</div>
      ) : shifts.length === 0 ? (
        <div className="card-elevated" style={{ textAlign: 'center', padding: 60 }}>
          <CheckCircle2 size={48} style={{ color: 'var(--accent-emerald)', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>No upcoming shifts scheduled.</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Enjoy your time off, or manually log a new shift above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {shifts.map(shift => {
            const shiftName = shift.shift === 0 ? 'Day' : shift.shift === 1 ? 'Night' : 'Afternoon';
            const isToday = new Date(shift.shiftDate).toDateString() === new Date().toDateString();

            return (
              <div key={shift.id} className="card" style={{ padding: 20, borderLeft: '4px solid var(--accent-blue)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{new Date(shift.shiftDate).toLocaleDateString()}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{shiftName} Shift</div>
                  </div>
                  {isToday && <span className="badge badge-amber">Today</span>}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 600, background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 6 }}>
                  <Wrench size={16} className="text-muted" /> {shift.equipment?.name || 'Unassigned Equipment'}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button onClick={() => handleStartShift(shift.id)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    <Play size={16} /> Fill Shift Log
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

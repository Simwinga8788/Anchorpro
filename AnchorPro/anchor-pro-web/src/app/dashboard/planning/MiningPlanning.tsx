'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Plus, User, Wrench, Clock, CheckCircle2 } from 'lucide-react';
import { shiftLogsApi, referenceDataApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

export default function MiningPlanning() {
  const [draftLogs, setDraftLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Data for roster modal
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [rosterData, setRosterData] = useState({
    shiftDate: new Date().toISOString().split('T')[0],
    shift: 0,
    equipmentId: '',
    operatorName: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const logs = await shiftLogsApi.getAll();
      // Filter to only show future/today Draft logs (Scheduled shifts)
      const scheduled = logs.filter(l => l.status === 0);
      scheduled.sort((a, b) => new Date(a.shiftDate).getTime() - new Date(b.shiftDate).getTime());
      setDraftLogs(scheduled);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Load reference data for the modal
    const fetchRef = async () => {
      try {
        const tokenStr = localStorage.getItem('anchor_auth_token');
        const headers: any = {};
        if (tokenStr) headers['Authorization'] = `Bearer ${tokenStr}`;
        const eqRes = await fetch('/api/equipment', { headers });
        if (eqRes.ok) setEquipmentList(await eqRes.json());
        
        const techs = await referenceDataApi.getTechnicians();
        if (Array.isArray(techs)) setTechnicians(techs);
      } catch (e) {}
    };
    fetchRef();
  }, []);

  const handleRosterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        shiftDate: rosterData.shiftDate,
        shift: Number(rosterData.shift),
        equipmentId: rosterData.equipmentId ? Number(rosterData.equipmentId) : null,
        operatorName: rosterData.operatorName,
        // The rest are null/0 until the operator fills them in
        quantityProduced: 0,
        unitOfMeasure: 'Tons',
        operatingHours: 0,
        fuelConsumedLitres: 0,
        downtimeHours: 0,
      };

      await shiftLogsApi.create(payload);
      setShowRosterModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule shift');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in">
      {/* Roster Modal */}
      <SlideOver open={showRosterModal} onClose={() => setShowRosterModal(false)} title="Schedule Shift" subtitle="Roster an operator to an equipment for an upcoming shift.">
        <form onSubmit={handleRosterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Shift Date</label>
            <input type="date" className="form-input" required value={rosterData.shiftDate} onChange={e => setRosterData({...rosterData, shiftDate: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Shift Type</label>
            <select className="form-select" value={rosterData.shift} onChange={e => setRosterData({...rosterData, shift: Number(e.target.value)})}>
              <option value={0}>Day Shift</option>
              <option value={1}>Night Shift</option>
              <option value={2}>Afternoon Shift</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Operator</label>
            <select className="form-select" required value={rosterData.operatorName} onChange={e => setRosterData({...rosterData, operatorName: e.target.value})}>
              <option value="">Select Operator...</option>
              {technicians.map(t => (
                <option key={t.id} value={`${t.firstName || ''} ${t.lastName || ''}`.trim() || t.userName}>
                  {`${t.firstName || ''} ${t.lastName || ''}`.trim() || t.userName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Equipment</label>
            <select className="form-select" required value={rosterData.equipmentId} onChange={e => setRosterData({...rosterData, equipmentId: e.target.value})}>
              <option value="">Select Equipment...</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name} ({eq.serialNumber})</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowRosterModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>Schedule</button>
          </div>
        </form>
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Shift Scheduling</h1>
          <p className="page-subtitle">Roster operators and schedule mining equipment.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRosterModal(true)}>
          <Plus size={16} /> Roster Operator
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading schedule...</div>
      ) : draftLogs.length === 0 ? (
        <div className="card-elevated" style={{ textAlign: 'center', padding: 60 }}>
          <CalendarDays size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>No upcoming shifts scheduled.</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Use the button above to roster operators to equipment.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {draftLogs.map(log => {
            const shiftName = log.shift === 0 ? 'Day' : log.shift === 1 ? 'Night' : 'Afternoon';
            return (
              <div key={log.id} className="card hover-lift" style={{ padding: 16, borderLeft: '4px solid var(--accent-blue)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)' }}>{new Date(log.shiftDate).toLocaleDateString()}</span>
                  <span className="badge badge-muted">{shiftName} Shift</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-primary)', fontWeight: 600 }}>
                  <User size={16} className="text-muted" /> {log.operatorName || 'Unassigned Operator'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
                  <Wrench size={16} className="text-muted" /> {log.equipment?.name || 'Unassigned Equipment'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

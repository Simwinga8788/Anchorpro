'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shiftLogsApi, adminAccessApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { Save, ArrowLeft, Loader2, Calculator } from 'lucide-react';

export default function NewShiftLogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Data for dropdowns
  const [equipmentList, setEquipmentList] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    shiftDate: new Date().toISOString().split('T')[0],
    shift: 0,
    equipmentId: '',
    sourceLocation: '',
    destinationLocation: '',
    activityType: '',
    loadCount: '',
    payloadFactor: '',
    quantityProduced: '',
    unitOfMeasure: 'Tons',
    operatingHours: '',
    fuelConsumedLitres: '',
    downtimeHours: '0',
    operatorName: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
    crewCount: '1',
    remarks: ''
  });

  useEffect(() => {
    // Fetch equipment
    // Using apiFetch directly since we need equipment for the dropdown
    const fetchEq = async () => {
      try {
        const tokenStr = localStorage.getItem('anchor_auth_token');
        const headers: any = {};
        if (tokenStr) headers['Authorization'] = `Bearer ${tokenStr}`;
        const res = await fetch('/api/equipment', { headers });
        if (res.ok) {
          const data = await res.json();
          setEquipmentList(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchEq();
  }, []);

  // Auto-calculate logic
  useEffect(() => {
    const loads = parseFloat(formData.loadCount);
    const factor = parseFloat(formData.payloadFactor);
    if (!isNaN(loads) && !isNaN(factor)) {
      setFormData(prev => ({ ...prev, quantityProduced: (loads * factor).toFixed(2) }));
    }
  }, [formData.loadCount, formData.payloadFactor]);

  const handleEquipmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eqId = e.target.value;
    const selected = equipmentList.find(eq => eq.id.toString() === eqId);
    
    setFormData(prev => ({
      ...prev,
      equipmentId: eqId,
      // Auto-pull payload capacity if it exists on the equipment
      payloadFactor: selected?.payloadCapacity ? selected.payloadCapacity.toString() : prev.payloadFactor
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        shiftDate: formData.shiftDate,
        shift: Number(formData.shift),
        equipmentId: formData.equipmentId ? Number(formData.equipmentId) : null,
        sourceLocation: formData.sourceLocation,
        destinationLocation: formData.destinationLocation,
        activityType: formData.activityType,
        loadCount: formData.loadCount ? Number(formData.loadCount) : null,
        payloadFactor: formData.payloadFactor ? Number(formData.payloadFactor) : null,
        quantityProduced: formData.quantityProduced ? Number(formData.quantityProduced) : 0,
        unitOfMeasure: formData.unitOfMeasure,
        operatingHours: formData.operatingHours ? Number(formData.operatingHours) : 0,
        fuelConsumedLitres: formData.fuelConsumedLitres ? Number(formData.fuelConsumedLitres) : 0,
        downtimeHours: formData.downtimeHours ? Number(formData.downtimeHours) : 0,
        operatorName: formData.operatorName,
        crewCount: formData.crewCount ? Number(formData.crewCount) : null,
        remarks: formData.remarks
      };

      await shiftLogsApi.create(payload);
      router.push('/dashboard/shift-logs');
    } catch (err: any) {
      alert(err.message || 'Failed to create shift log');
      setLoading(false);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn btn-secondary" onClick={() => router.back()} style={{ padding: '8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">New Shift Production Log</h1>
          <p className="page-subtitle">Record daily production, fuel, and hours.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Section 1: General Info */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 16 }}>
            General & Personnel
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Shift Date</label>
              <input type="date" className="input" required
                value={formData.shiftDate} onChange={e => setFormData({...formData, shiftDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Shift Type</label>
              <select className="input" value={formData.shift} onChange={e => setFormData({...formData, shift: Number(e.target.value)})}>
                <option value={0}>Day Shift</option>
                <option value={1}>Night Shift</option>
                <option value={2}>Afternoon Shift</option>
              </select>
            </div>
            <div className="form-group">
              <label>Operator Name</label>
              <input type="text" className="input" required
                value={formData.operatorName} onChange={e => setFormData({...formData, operatorName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Crew Count</label>
              <input type="number" className="input" min="1"
                value={formData.crewCount} onChange={e => setFormData({...formData, crewCount: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Section 2: Equipment & Location */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 16 }}>
            Operations & Logistics
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Equipment</label>
              <select className="input" required value={formData.equipmentId} onChange={handleEquipmentChange}>
                <option value="">-- Select Machine --</option>
                {equipmentList.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.name} ({eq.serialNumber})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Activity Type</label>
              <input type="text" className="input" placeholder="e.g. Hauling, Blasting" required
                value={formData.activityType} onChange={e => setFormData({...formData, activityType: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Source (Drawn from)</label>
              <input type="text" className="input" placeholder="e.g. Pit 3 Face, Level 12 Stope" required
                value={formData.sourceLocation} onChange={e => setFormData({...formData, sourceLocation: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Destination (Tipped to)</label>
              <input type="text" className="input" placeholder="e.g. Crusher, ROM Pad"
                value={formData.destinationLocation} onChange={e => setFormData({...formData, destinationLocation: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Section 3: Production Metrics */}
        <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={18} className="text-accent-blue" /> Production Metrics
          </h3>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
              <label>Number of Loads/Trips</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <input type="number" step="1" className="input" required style={{ flex: 1, fontSize: 24, padding: '16px', height: 'auto', fontWeight: 700 }}
                  value={formData.loadCount} onChange={e => setFormData({...formData, loadCount: e.target.value})} />
                <button type="button" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: 18, height: 'auto', fontWeight: 800 }} 
                  onClick={() => setFormData(prev => ({ ...prev, loadCount: (parseInt(prev.loadCount || '0') + 1).toString() }))}>
                  +1 Trip
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Payload Factor (Per Trip)</label>
              <input type="number" step="0.01" className="input" required
                value={formData.payloadFactor} onChange={e => setFormData({...formData, payloadFactor: e.target.value})} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Auto-pulled from Equipment if available</div>
            </div>
            <div className="form-group">
              <label>Est. Quantity Produced</label>
              <input type="number" step="0.01" className="input" required readOnly
                style={{ background: 'var(--bg-default)', fontWeight: 600 }}
                value={formData.quantityProduced} />
            </div>
            <div className="form-group">
              <label>Unit of Measure</label>
              <select className="input" value={formData.unitOfMeasure} onChange={e => setFormData({...formData, unitOfMeasure: e.target.value})}>
                <option value="Tons">Tons</option>
                <option value="BCM">BCM</option>
                <option value="m³">m³</option>
                <option value="Units">Units</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Resource Burn */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 16 }}>
            Resource Burn
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Operating Hours (SMU)</label>
              <input type="number" step="0.1" className="input" required
                value={formData.operatingHours} onChange={e => setFormData({...formData, operatingHours: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Fuel Consumed (Litres)</label>
              <input type="number" step="0.1" className="input" required
                value={formData.fuelConsumedLitres} onChange={e => setFormData({...formData, fuelConsumedLitres: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Downtime Hours</label>
              <input type="number" step="0.1" className="input"
                value={formData.downtimeHours} onChange={e => setFormData({...formData, downtimeHours: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Section 5: Remarks */}
        <div className="form-group">
          <label>Remarks / Notes</label>
          <textarea className="input" rows={3} placeholder="Any issues during the shift?"
            value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
            Save Draft Log
          </button>
        </div>

      </form>
    </div>
  );
}

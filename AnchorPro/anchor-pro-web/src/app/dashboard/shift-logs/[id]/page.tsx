'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { shiftLogsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { Save, ArrowLeft, Loader2, Calculator, Send } from 'lucide-react';

export default function EditShiftLogPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);

  const id = Number(params?.id);

  // Form state
  const [formData, setFormData] = useState({
    shiftDate: '',
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
    downtimeHours: '',
    operatorName: '',
    crewCount: '',
    remarks: '',
    status: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenStr = localStorage.getItem('anchor_auth_token');
        const headers: any = {};
        if (tokenStr) headers['Authorization'] = `Bearer ${tokenStr}`;
        const eqRes = await fetch('/api/equipment', { headers });
        if (eqRes.ok) setEquipmentList(await eqRes.json());

        if (id) {
          const log = await shiftLogsApi.getById(id);
          setFormData({
            shiftDate: log.shiftDate ? new Date(log.shiftDate).toISOString().split('T')[0] : '',
            shift: log.shift,
            equipmentId: log.equipmentId?.toString() || '',
            sourceLocation: log.sourceLocation || '',
            destinationLocation: log.destinationLocation || '',
            activityType: log.activityType || '',
            loadCount: log.loadCount?.toString() || '',
            payloadFactor: log.payloadFactor?.toString() || '',
            quantityProduced: log.quantityProduced?.toString() || '',
            unitOfMeasure: log.unitOfMeasure || 'Tons',
            operatingHours: log.operatingHours?.toString() || '',
            fuelConsumedLitres: log.fuelConsumedLitres?.toString() || '',
            downtimeHours: log.downtimeHours?.toString() || '',
            operatorName: log.operatorName || '',
            crewCount: log.crewCount?.toString() || '',
            remarks: log.remarks || '',
            status: log.status
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
      payloadFactor: selected?.payloadCapacity ? selected.payloadCapacity.toString() : prev.payloadFactor
    }));
  };

  const handleSave = async (submit: boolean = false) => {
    setSaving(true);
    try {
      const payload = {
        id,
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
        remarks: formData.remarks,
        status: formData.status // kept same on put
      };

      await shiftLogsApi.update(id, payload);
      
      if (submit) {
        await shiftLogsApi.submit(id); // Changes to status 1
      }
      
      router.back();
    } catch (err: any) {
      alert(err.message || 'Failed to save shift log');
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  const isEditable = formData.status === 0 || formData.status === 3; // Draft or Rejected

  return (
    <div className="animate-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn btn-secondary" onClick={() => router.back()} style={{ padding: '8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Edit Shift Log #{id}</h1>
          <p className="page-subtitle">Fill in actual production numbers for this shift.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, opacity: isEditable ? 1 : 0.7 }}>
        
        {/* Section 1: General Info */}
        <div className="form-grid">
          <div className="form-group">
            <label>Shift Date</label>
            <input type="date" className="input" disabled={!isEditable}
              value={formData.shiftDate} onChange={e => setFormData({...formData, shiftDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Operator Name</label>
            <input type="text" className="input" disabled={!isEditable}
              value={formData.operatorName} onChange={e => setFormData({...formData, operatorName: e.target.value})} />
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
              <select className="input" disabled={!isEditable} value={formData.equipmentId} onChange={handleEquipmentChange}>
                <option value="">-- Select Machine --</option>
                {equipmentList.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.name} ({eq.serialNumber})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Activity Type</label>
              <input type="text" className="input" placeholder="e.g. Hauling" disabled={!isEditable}
                value={formData.activityType} onChange={e => setFormData({...formData, activityType: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Source (Drawn from)</label>
              <input type="text" className="input" placeholder="e.g. Pit 3 Face" disabled={!isEditable}
                value={formData.sourceLocation} onChange={e => setFormData({...formData, sourceLocation: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Destination (Tipped to)</label>
              <input type="text" className="input" placeholder="e.g. Crusher" disabled={!isEditable}
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
                <input type="number" step="1" className="input" required disabled={!isEditable} style={{ flex: 1, fontSize: 24, padding: '16px', height: 'auto', fontWeight: 700 }}
                  value={formData.loadCount} onChange={e => setFormData({...formData, loadCount: e.target.value})} />
                {isEditable && (
                  <button type="button" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: 18, height: 'auto', fontWeight: 800 }} 
                    onClick={() => setFormData(prev => ({ ...prev, loadCount: (parseInt(prev.loadCount || '0') + 1).toString() }))}>
                    +1 Trip
                  </button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Payload Factor (Per Trip)</label>
              <input type="number" step="0.01" className="input" required disabled={!isEditable}
                value={formData.payloadFactor} onChange={e => setFormData({...formData, payloadFactor: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Est. Quantity Produced</label>
              <input type="number" step="0.01" className="input" readOnly
                style={{ background: 'var(--bg-default)', fontWeight: 600 }}
                value={formData.quantityProduced} />
            </div>
            <div className="form-group">
              <label>Unit of Measure</label>
              <select className="input" disabled={!isEditable} value={formData.unitOfMeasure} onChange={e => setFormData({...formData, unitOfMeasure: e.target.value})}>
                <option value="Tons">Tons</option>
                <option value="BCM">BCM</option>
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
              <input type="number" step="0.1" className="input" required disabled={!isEditable}
                value={formData.operatingHours} onChange={e => setFormData({...formData, operatingHours: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Fuel Consumed (Litres)</label>
              <input type="number" step="0.1" className="input" required disabled={!isEditable}
                value={formData.fuelConsumedLitres} onChange={e => setFormData({...formData, fuelConsumedLitres: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Downtime Hours</label>
              <input type="number" step="0.1" className="input" disabled={!isEditable}
                value={formData.downtimeHours} onChange={e => setFormData({...formData, downtimeHours: e.target.value})} />
            </div>
          </div>
        </div>

        {isEditable && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              Save Draft
            </button>
            <button type="button" className="btn btn-primary" onClick={() => handleSave(true)} disabled={saving}>
              {saving ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
              Submit to Supervisor
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

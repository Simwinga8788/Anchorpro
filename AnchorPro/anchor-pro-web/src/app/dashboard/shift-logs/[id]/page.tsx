'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shiftLogsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import { Save, ArrowLeft, Loader2, Calculator, Trash2, Send, Plus, HardHat } from 'lucide-react';

interface ShiftResource {
  id: number; // local ID for mapping
  equipmentId: string;
  operatorId: string;
  role: string;
  operatingHours: string;
  downtimeHours?: string;
  downtimeReason?: string;
  actualQuantity?: string;
  quantityUnit?: string;
}

export default function EditShiftLogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useDictionary();
  const id = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data for dropdowns
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [projectList, setProjectList] = useState<any[]>([]);
  const [contractList, setContractList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);


  // Form state
  const [formData, setFormData] = useState({
    shiftDate: new Date().toISOString().split('T')[0],
    shift: 0,
    projectId: '',
    clientContractId: '',
    material: '',
    sourceLocation: '',
    destinationLocation: '',
    operationActivity: '0',
    loadCount: '',
    payloadFactor: '',
    quantityProduced: '0',
    targetQuantity: '',
    unitOfMeasure: 'Tons',
    operatingHours: '',
    fuelConsumedLitres: '',
    downtimeHours: '0',
    crewCount: '1',
    remarks: '',
    status: 0,
    resources: [{ id: Date.now(), equipmentId: '', operatorId: '', role: '', operatingHours: '' }] as ShiftResource[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenStr = localStorage.getItem('anchor_auth_token');
        const headers: any = {};
        if (tokenStr) headers['Authorization'] = `Bearer ${tokenStr}`;
        
        const [resEq, resProj, resUsers, resContracts] = await Promise.all([
          fetch('/api/equipment', { headers }),
          fetch('/api/projects', { headers }),
          fetch('/api/users', { headers }),
          fetch('/api/contracts', { headers })
        ]);
        
        if (resEq.ok) setEquipmentList(await resEq.json());
        if (resProj.ok) setProjectList(await resProj.json());
        if (resUsers.ok) setUserList(await resUsers.json());
        if (resContracts.ok) setContractList(await resContracts.json());

        if (id) {
          const log = await shiftLogsApi.getById(id);
          setFormData({
            shiftDate: log.shiftDate ? new Date(log.shiftDate).toISOString().split('T')[0] : '',
            shift: log.shift,
            projectId: log.projectId?.toString() || '',
            clientContractId: log.clientContractId?.toString() || '',
            material: log.material || '',
            sourceLocation: log.sourceLocation || '',
            destinationLocation: log.destinationLocation || '',
            operationActivity: log.operationActivity?.toString() || '0',
            targetQuantity: log.targetQuantity?.toString() || '',
            loadCount: log.loadCount?.toString() || '',
            payloadFactor: log.payloadFactor?.toString() || '',
            quantityProduced: log.quantityProduced?.toString() || '',
            unitOfMeasure: log.unitOfMeasure || 'Tons',
            operatingHours: log.operatingHours?.toString() || '',
            fuelConsumedLitres: log.fuelConsumedLitres?.toString() || '',
            downtimeHours: log.downtimeHours?.toString() || '',
            crewCount: log.crewCount?.toString() || '',
            remarks: log.remarks || '',
            status: log.status || 0,
            resources: log.resources ? log.resources.map((r: any) => ({
              id: r.id || Date.now() + Math.random(),
              equipmentId: r.equipmentId?.toString() || '',
              operatorId: r.operatorId || '',
              role: r.role || '',
              operatingHours: r.operatingHours?.toString() || '',
              downtimeHours: r.downtimeHours?.toString() || '',
              downtimeReason: r.downtimeReason || '',
              actualQuantity: r.actualQuantity?.toString() || '',
              quantityUnit: r.quantityUnit || ''
            })) : []
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-calculate logic
  useEffect(() => {
    const loads = parseFloat(formData.loadCount);
    const factor = parseFloat(formData.payloadFactor);
    if (!isNaN(loads) && !isNaN(factor)) {
      setFormData(prev => ({ ...prev, quantityProduced: (loads * factor).toFixed(2) }));
    }
  }, [formData.loadCount, formData.payloadFactor]);

  const handleAddResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { id: Date.now(), equipmentId: '', operatorId: '', role: '', operatingHours: '', downtimeHours: '', downtimeReason: '', actualQuantity: '', quantityUnit: '' }]
    }));
  };

  const handleRemoveResource = (id: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter(r => r.id !== id)
    }));
  };

  const handleResourceChange = (id: number, field: keyof ShiftResource, value: string) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.map(r => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          // Auto-pull payload factor if we change equipment and don't have one set
          if (field === 'equipmentId' && !prev.payloadFactor) {
            const eq = equipmentList.find(e => e.id.toString() === value);
            if (eq?.payloadCapacity) {
              setFormData(p => ({ ...p, payloadFactor: eq.payloadCapacity.toString() }));
            }
          }
          return updated;
        }
        return r;
      })
    }));
  };

  const handleSave = async (submit: boolean = false) => {
    setSaving(true);
    try {
      const payload = {
        id,
        shiftDate: formData.shiftDate,
        shift: Number(formData.shift),
        projectId: formData.projectId ? Number(formData.projectId) : null,
        clientContractId: formData.clientContractId ? Number(formData.clientContractId) : null,
        material: formData.material,
        sourceLocation: formData.sourceLocation,
        destinationLocation: formData.destinationLocation,
        operationActivity: formData.operationActivity ? Number(formData.operationActivity) : null,
        targetQuantity: formData.targetQuantity ? Number(formData.targetQuantity) : null,
        loadCount: formData.loadCount ? Number(formData.loadCount) : null,
        payloadFactor: formData.payloadFactor ? Number(formData.payloadFactor) : null,
        quantityProduced: formData.quantityProduced ? Number(formData.quantityProduced) : 0,
        unitOfMeasure: formData.unitOfMeasure,
        operatingHours: formData.operatingHours ? Number(formData.operatingHours) : 0,
        fuelConsumedLitres: formData.fuelConsumedLitres ? Number(formData.fuelConsumedLitres) : 0,
        downtimeHours: formData.downtimeHours ? Number(formData.downtimeHours) : 0,
        crewCount: formData.crewCount ? Number(formData.crewCount) : null,
        remarks: formData.remarks,
        resources: formData.resources.map(r => ({
          equipmentId: r.equipmentId ? Number(r.equipmentId) : null,
          operatorId: r.operatorId || null,
          role: r.role,
          operatingHours: r.operatingHours ? Number(r.operatingHours) : null,
          downtimeHours: r.downtimeHours ? Number(r.downtimeHours) : null,
          downtimeReason: r.downtimeReason || null,
          actualQuantity: r.actualQuantity ? Number(r.actualQuantity) : null,
          quantityUnit: r.quantityUnit || null
        }))
      };

      await shiftLogsApi.update(id, payload);
      
      if (submit) {
        await shiftLogsApi.submit(id);
      }
      
      router.back();
    } catch (err: any) {
      alert(err.message || 'Failed to save shift log');
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  const isEditable = formData.status === 0 || formData.status === 3;

  return (
    <div className="animate-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn btn-secondary" onClick={() => router.back()} style={{ padding: '8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Edit {t('ShiftLogs', 'Shift Log')} #{id}</h1>
          <p className="page-subtitle">Fill in actual production numbers for this {t('Shift', 'shift')}.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 32, opacity: isEditable ? 1 : 0.7 }}>
        
        {/* Section 1: General Info */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 16 }}>
            General Details
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('Shift', 'Shift')} Date</label>
              <input type="date" className="input" required
                value={formData.shiftDate} onChange={e => setFormData({...formData, shiftDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{t('Shift', 'Shift')} Type</label>
              <select className="input" value={formData.shift} onChange={e => setFormData({...formData, shift: Number(e.target.value)})}>
                <option value={0}>Day Shift</option>
                <option value={1}>Night Shift</option>
                <option value={2}>Afternoon Shift</option>
              </select>
            </div>
            <div className="form-group">
              <label>Total Crew Count</label>
              <input type="number" className="input" min="1"
                value={formData.crewCount} onChange={e => setFormData({...formData, crewCount: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Client Contract <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
              <select className="input" value={formData.clientContractId} onChange={e => setFormData({...formData, clientContractId: e.target.value})}>
                <option value="">-- No Contract --</option>
                {contractList.map(c => (
                  <option key={c.id} value={c.id}>{c.referenceNumber} - {c.title}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Link to Project <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
              <select className="input" value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}>
                <option value="">-- No Project --</option>
                {projectList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Fleet & Operators */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Fleet & Operators</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddResource}>
              <Plus size={14} /> Add Resource
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {formData.resources.map((res, index) => (
              <div key={res.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px 40px', gap: 12, alignItems: 'end', background: 'var(--bg-default)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Machine / Equipment</label>
                  <select className="input" value={res.equipmentId} onChange={e => handleResourceChange(res.id, 'equipmentId', e.target.value)}>
                    <option value="">-- Select --</option>
                    {equipmentList.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name} ({eq.serialNumber})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Operator</label>
                  <select className="input" value={res.operatorId} onChange={e => handleResourceChange(res.id, 'operatorId', e.target.value)}>
                    <option value="">-- Select User --</option>
                    {userList.map(u => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Role / Assignment</label>
                  <input type="text" className="input" placeholder="e.g. Loader, Driver"
                    value={res.role} onChange={e => handleResourceChange(res.id, 'role', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Hrs</label>
                  <input type="number" step="0.5" className="input" placeholder="Opt."
                    value={res.operatingHours} onChange={e => handleResourceChange(res.id, 'operatingHours', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Downtime (Hrs)</label>
                  <input type="number" step="0.1" className="input" placeholder="0"
                    value={res.downtimeHours} onChange={e => handleResourceChange(res.id, 'downtimeHours', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Downtime Reason</label>
                  <input type="text" className="input" placeholder="e.g. Blown tire"
                    value={res.downtimeReason || ''} onChange={e => handleResourceChange(res.id, 'downtimeReason', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Output / Done</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input type="number" step="0.1" className="input" placeholder="0" style={{ width: '60%' }}
                      value={res.actualQuantity || ''} onChange={e => handleResourceChange(res.id, 'actualQuantity', e.target.value)} />
                    <select className="input" style={{ width: '40%', padding: '0 4px' }} 
                      value={res.quantityUnit || ''} onChange={e => handleResourceChange(res.id, 'quantityUnit', e.target.value)}>
                      <option value="">--</option>
                      <option value="Meters">Meters</option>
                      <option value="Trips">Trips</option>
                      <option value="Buckets">Buckets</option>
                      <option value="Tons">Tons</option>
                    </select>
                  </div>
                </div>
                <button type="button" className="btn btn-ghost" style={{ padding: 8, color: 'var(--text-muted)' }} onClick={() => handleRemoveResource(res.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {formData.resources.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                No fleet resources assigned. Click "Add Resource" to assign machines and operators.
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Operations & Logistics */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 16 }}>
            Operations & Logistics
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Activity Type</label>
              <select className="input" value={formData.operationActivity} onChange={e => setFormData({...formData, operationActivity: e.target.value})}>
                <option value="0">{t('Activity0', 'General Mining')}</option>
                <option value="1">{t('Activity1', 'Blasting')}</option>
                <option value="2">{t('Activity2', 'Loading')}</option>
                <option value="3">{t('Activity3', 'Hauling')}</option>
                <option value="4">{t('Activity4', 'Development')}</option>
                <option value="5">{t('Activity5', 'Stripping')}</option>
                <option value="6">{t('Activity6', 'Dewatering')}</option>
                <option value="7">{t('Activity7', 'Support')}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('Material', 'Material')}</label>
              <input type="text" className="input" placeholder={t('MaterialPlaceholder', 'e.g. Copper Ore, Waste')}
                value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{t('Source', 'Source (Drawn from)')}</label>
              <input type="text" className="input" placeholder={t('SourcePlaceholder', 'e.g. Pit 3 Face, Level 12 Stope')}
                value={formData.sourceLocation} onChange={e => setFormData({...formData, sourceLocation: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{t('Destination', 'Destination (Dumped to)')}</label>
              <input type="text" className="input" placeholder={t('DestinationPlaceholder', 'e.g. ROM Pad, Waste Dump 2')}
                value={formData.destinationLocation} onChange={e => setFormData({...formData, destinationLocation: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Section 4: Production Metrics */}
        <div style={{ background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={18} className="text-accent-blue" /> Production Metrics
          </h3>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
              <label>Number of Loads/Trips</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <input type="number" step="1" className="input" style={{ flex: 1, fontSize: 24, padding: '16px', height: 'auto', fontWeight: 700 }}
                  value={formData.loadCount} onChange={e => setFormData({...formData, loadCount: e.target.value})} />
                <button type="button" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: 18, height: 'auto', fontWeight: 800 }} 
                  onClick={() => setFormData(prev => ({ ...prev, loadCount: (parseInt(prev.loadCount || '0') + 1).toString() }))}>
                  +1 Trip
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Payload Factor (Per Trip)</label>
              <input type="number" step="0.01" className="input"
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
              <select className="input" value={formData.unitOfMeasure} onChange={e => setFormData({...formData, unitOfMeasure: e.target.value})}>
                <option value="Tons">Tons</option>
                <option value="BCM">BCM</option>
                <option value="m³">m³</option>
                <option value="Units">Units</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('Shift', 'Shift')} Target <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input type="number" step="0.01" className="input" placeholder="e.g. 500"
                value={formData.targetQuantity} onChange={e => setFormData({...formData, targetQuantity: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Section 5: Resource Burn */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 16 }}>
            Overall {t('Shift', 'Shift')} Resource Burn
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Total Operating Hours</label>
              <input type="number" step="0.1" className="input" required
                value={formData.operatingHours} onChange={e => setFormData({...formData, operatingHours: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Total Fuel Consumed (Litres)</label>
              <input type="number" step="0.1" className="input" required
                value={formData.fuelConsumedLitres} onChange={e => setFormData({...formData, fuelConsumedLitres: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Total Downtime Hours</label>
              <input type="number" step="0.1" className="input"
                value={formData.downtimeHours} onChange={e => setFormData({...formData, downtimeHours: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Section 6: Remarks */}
        <div className="form-group">
          <label>Remarks / Notes</label>
          <textarea className="input" rows={3} placeholder="Any issues during the shift?"
            value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
        </div>

        {isEditable && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              Save Draft Log
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

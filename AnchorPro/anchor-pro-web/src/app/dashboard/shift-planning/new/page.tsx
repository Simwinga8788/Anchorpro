'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shiftPlansApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Calendar, Target, Drill, Truck, HardHat } from 'lucide-react';
import { format } from 'date-fns';

interface ShiftPlanTask {
  id: number;
  activityCategory: string;
  equipmentId: string;
  operatorId: string;
  targetPrimary: string;
  targetPrimaryUnit: string;
  targetTonnage: string;
  location: string;
  drillRingAndHole: string;
  assignedTrucks: string;
}

export default function NewShiftPlanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Data for dropdowns
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    planDate: new Date().toISOString().split('T')[0],
    shift: 0,
    mineCaptainId: '',
    shiftBossId: '',
    overallTargetTonnage: '',
    notes: '',
    tasks: [] as ShiftPlanTask[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenStr = localStorage.getItem('anchor_auth_token');
        const headers: any = {};
        if (tokenStr) headers['Authorization'] = `Bearer ${tokenStr}`;
        
        const [resEq, resUsers] = await Promise.all([
          fetch('/api/equipment', { headers }),
          fetch('/api/users', { headers })
        ]);
        
        if (resEq.ok) setEquipmentList(await resEq.json());
        if (resUsers.ok) setUserList(await resUsers.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const handleAddTask = (category: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        id: Date.now(),
        activityCategory: category,
        equipmentId: '',
        operatorId: '',
        targetPrimary: '',
        targetPrimaryUnit: category === 'Drilling' ? 'm' : category === 'Loading' ? 'buckets' : 'trips',
        targetTonnage: '',
        location: '',
        drillRingAndHole: '',
        assignedTrucks: ''
      }]
    }));
  };

  const handleRemoveTask = (id: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  const handleTaskChange = (id: number, field: keyof ShiftPlanTask, value: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, [field]: value } : t)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        planDate: formData.planDate,
        shift: Number(formData.shift),
        mineCaptainId: formData.mineCaptainId || null,
        shiftBossId: formData.shiftBossId || null,
        overallTargetTonnage: formData.overallTargetTonnage ? Number(formData.overallTargetTonnage) : null,
        notes: formData.notes,
        tasks: formData.tasks.map(t => ({
          activityCategory: t.activityCategory,
          equipmentId: t.equipmentId ? Number(t.equipmentId) : null,
          operatorId: t.operatorId || null,
          targetPrimary: t.targetPrimary ? Number(t.targetPrimary) : null,
          targetPrimaryUnit: t.targetPrimaryUnit,
          targetTonnage: t.targetTonnage ? Number(t.targetTonnage) : null,
          location: t.location,
          drillRingAndHole: t.drillRingAndHole,
          assignedTrucks: t.assignedTrucks
        }))
      };

      await shiftPlansApi.create(payload);
      router.push('/dashboard/shift-planning');
    } catch (err: any) {
      alert(err.message || 'Failed to create shift plan');
      setLoading(false);
    }
  };

  const renderTaskCard = (task: ShiftPlanTask, index: number) => {
    return (
      <div key={task.id} style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', position: 'relative' }}>
        <button type="button" onClick={() => handleRemoveTask(task.id)} style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <Trash2 size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-default)', fontWeight: 600 }}>
          {task.activityCategory === 'Drilling' && <Drill size={18} className="text-accent-blue" />}
          {task.activityCategory === 'Loading' && <Target size={18} className="text-accent-blue" />}
          {task.activityCategory === 'Hauling' && <Truck size={18} className="text-accent-blue" />}
          Task {index + 1}: {task.activityCategory}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Machine / Equipment</label>
            <select className="input" value={task.equipmentId} onChange={e => handleTaskChange(task.id, 'equipmentId', e.target.value)} required>
              <option value="">-- Select Machine --</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name} ({eq.serialNumber})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Operator Name</label>
            <select className="input" value={task.operatorId} onChange={e => handleTaskChange(task.id, 'operatorId', e.target.value)} required>
              <option value="">-- Select Operator --</option>
              {userList.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Location / Stope</label>
            <input type="text" className="input" placeholder="e.g. 1250 stope 5814L ORE"
              value={task.location} onChange={e => handleTaskChange(task.id, 'location', e.target.value)} />
          </div>

          {task.activityCategory === 'Drilling' && (
            <>
              <div className="form-group">
                <label>Target Meters</label>
                <input type="number" className="input" placeholder="e.g. 50"
                  value={task.targetPrimary} onChange={e => handleTaskChange(task.id, 'targetPrimary', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Ring and Hole No.</label>
                <input type="text" className="input" placeholder="e.g. R9 9H"
                  value={task.drillRingAndHole} onChange={e => handleTaskChange(task.id, 'drillRingAndHole', e.target.value)} />
              </div>
            </>
          )}

          {task.activityCategory === 'Loading' && (
            <>
              <div className="form-group">
                <label>Target Buckets</label>
                <input type="number" className="input" placeholder="e.g. 75"
                  value={task.targetPrimary} onChange={e => handleTaskChange(task.id, 'targetPrimary', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Target Tonnage</label>
                <input type="number" className="input" placeholder="e.g. 487"
                  value={task.targetTonnage} onChange={e => handleTaskChange(task.id, 'targetTonnage', e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Allocated Trucks</label>
                <input type="text" className="input" placeholder="e.g. AD30-21, AD30-25"
                  value={task.assignedTrucks} onChange={e => handleTaskChange(task.id, 'assignedTrucks', e.target.value)} />
              </div>
            </>
          )}

          {task.activityCategory === 'Hauling' && (
            <>
              <div className="form-group">
                <label>Target Trips</label>
                <input type="number" className="input" placeholder="e.g. 11"
                  value={task.targetPrimary} onChange={e => handleTaskChange(task.id, 'targetPrimary', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Target Tonnage</label>
                <input type="number" className="input" placeholder="e.g. 198"
                  value={task.targetTonnage} onChange={e => handleTaskChange(task.id, 'targetTonnage', e.target.value)} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn btn-secondary" onClick={() => router.back()} style={{ padding: '8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Shift Planner Builder</h1>
          <p className="page-subtitle">Build the shift plan by allocating targets to equipment and operators.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Header Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, background: 'var(--bg-default)', padding: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" className="input" required style={{ fontWeight: 600 }}
              value={formData.planDate} onChange={e => setFormData({...formData, planDate: e.target.value})} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Shift</label>
            <select className="input" value={formData.shift} onChange={e => setFormData({...formData, shift: Number(e.target.value)})} style={{ fontWeight: 600 }}>
              <option value={0}>Day Shift</option>
              <option value={1}>Night Shift</option>
              <option value={2}>Afternoon Shift</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Mine Captain</label>
            <select className="input" value={formData.mineCaptainId} onChange={e => setFormData({...formData, mineCaptainId: e.target.value})}>
              <option value="">-- Select Captain --</option>
              {userList.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Shift Boss</label>
            <select className="input" value={formData.shiftBossId} onChange={e => setFormData({...formData, shiftBossId: e.target.value})}>
              <option value="">-- Select Boss --</option>
              {userList.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0, marginTop: 16 }}>
            <label>Overall Shift Target Tonnage <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
            <input type="number" className="input" placeholder="e.g. 1100" style={{ fontSize: 20, padding: 16 }}
              value={formData.overallTargetTonnage} onChange={e => setFormData({...formData, overallTargetTonnage: e.target.value})} />
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Task Assignments</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddTask('Drilling')} style={{ background: 'var(--bg-default)' }}>
                <Drill size={14} className="text-accent-blue" /> Add Drill
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddTask('Loading')} style={{ background: 'var(--bg-default)' }}>
                <Target size={14} className="text-accent-blue" /> Add Loader
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddTask('Hauling')} style={{ background: 'var(--bg-default)' }}>
                <Truck size={14} className="text-accent-blue" /> Add Truck
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {formData.tasks.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <HardHat size={32} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                No tasks assigned to this shift yet.<br/>
                Use the buttons above to start building your shift plan.
              </div>
            ) : (
              formData.tasks.map((task, index) => renderTaskCard(task, index))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ fontSize: 16, padding: '12px 24px', height: 'auto' }}>
            {loading ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
            Save Shift Plan
          </button>
        </div>

      </form>
    </div>
  );
}

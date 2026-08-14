'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shiftPlansApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import { Save, ArrowLeft, Loader2, Plus, Trash2, Calendar, Target, Drill, Truck, HardHat } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ShiftPlanTask {
  id: number;
  activityCategory: string;
  projectTaskId?: string;
  equipmentId: string;
  operatorId: string;
  targetPrimary: string;
  targetPrimaryUnit: string;
  targetSecondary: string;
  location: string;
  referenceCode: string;
  assignedTrucks: string;
}

export default function NewShiftPlanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useDictionary();
  const [loading, setLoading] = useState(false);
  
  // Data for dropdowns
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [projectTasksList, setProjectTasksList] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    projectId: '',
    planDate: new Date().toISOString().split('T')[0],
    shift: 0,
    mineCaptainId: '',
    shiftBossId: '',
    overallTargetSecondary: '',
    notes: '',
    tasks: [] as ShiftPlanTask[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenStr = localStorage.getItem('anchor_auth_token');
        const headers: any = {};
        if (tokenStr) headers['Authorization'] = `Bearer ${tokenStr}`;
        
        const [resEq, resUsers, resProjects] = await Promise.all([
          fetch('/api/equipment', { headers }),
          fetch('/api/users', { headers }),
          fetch('/api/projects', { headers })
        ]);
        
        if (resEq.ok) setEquipmentList(await resEq.json());
        if (resUsers.ok) setUserList(await resUsers.json());
        if (resProjects.ok) setProjectsList(await resProjects.json());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!formData.projectId) {
        setProjectTasksList([]);
        return;
      }
      try {
        const tokenStr = localStorage.getItem('anchor_auth_token');
        const headers: any = {};
        if (tokenStr) headers['Authorization'] = `Bearer ${tokenStr}`;
        const res = await fetch(`/api/projects/${formData.projectId}`, { headers });
        if (res.ok) {
          const projectData = await res.json();
          setProjectTasksList(projectData.tasks || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchTasks();
  }, [formData.projectId]);

  const handleAddTask = (category: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        id: Date.now(),
        activityCategory: category,
        projectTaskId: '',
        equipmentId: '',
        operatorId: '',
        targetPrimary: '',
        targetPrimaryUnit: category === 'Drilling' ? 'm' : category === 'Loading' ? 'buckets' : category === 'Hauling' ? 'trips' : 'units',
        targetSecondary: '',
        location: '',
        referenceCode: '',
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
    try {
      setLoading(true);
      const payload = {
        planDate: formData.planDate,
        shift: Number(formData.shift),
        mineCaptainId: formData.mineCaptainId || null,
        shiftBossId: formData.shiftBossId || null,
        overallTargetSecondary: formData.overallTargetSecondary ? Number(formData.overallTargetSecondary) : null,
        notes: formData.notes,
        projectId: formData.projectId ? Number(formData.projectId) : null,
        tasks: formData.tasks.map(t => ({
          activityCategory: t.activityCategory,
          projectTaskId: t.projectTaskId ? Number(t.projectTaskId) : null,
          equipmentId: t.equipmentId ? Number(t.equipmentId) : null,
          operatorId: t.operatorId || null,
          targetPrimary: t.targetPrimary ? Number(t.targetPrimary) : null,
          targetPrimaryUnit: t.targetPrimaryUnit,
          targetSecondary: t.targetSecondary ? Number(t.targetSecondary) : null,
          location: t.location,
          referenceCode: t.referenceCode,
          assignedTrucks: t.assignedTrucks
        }))
      };

      await shiftPlansApi.create(payload);
      toast.success('Shift plan created successfully');
      router.push('/dashboard/shift-planning');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create shift plan');
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
          <HardHat size={18} className="text-accent-amber" />
          <span>Task {index + 1}: {task.activityCategory}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>Project Task</label>
            <select className="form-input" value={task.projectTaskId || ''} onChange={e => {
              const selectedTaskId = e.target.value;
              const selectedTask = projectTasksList.find(pt => pt.id.toString() === selectedTaskId);
              const updatedTasks = [...formData.tasks];
              updatedTasks[index].projectTaskId = selectedTaskId;
              if (selectedTask) {
                updatedTasks[index].activityCategory = selectedTask.title;
              }
              setFormData({...formData, tasks: updatedTasks});
            }}>
              <option value="">-- Select Project Task --</option>
              {projectTasksList.map(pt => (
                <option key={pt.id} value={pt.id}>{pt.title}</option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>Machine / Equipment</label>
            <select className="form-input" value={task.equipmentId} onChange={e => handleTaskChange(task.id, 'equipmentId', e.target.value)} required>
              <option value="">-- Select Machine --</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name} ({eq.serialNumber})</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Operator Name</label>
            <select className="form-input" value={task.operatorId} onChange={e => handleTaskChange(task.id, 'operatorId', e.target.value)} required>
              <option value="">-- Select Operator --</option>
              {userList.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
          
          <div className="form-field">
            <label>{t('Stope', 'Location / Stope')}</label>
            <input type="text" className="form-input" placeholder={user?.operationMode === 1 ? "e.g. 1250 stope 5814L ORE" : "e.g. Section B, Floor 2"}
              value={task.location} onChange={e => handleTaskChange(task.id, 'location', e.target.value)} />
          </div>

          {task.activityCategory === 'Drilling' && (
            <>
              <div className="form-field">
                <label>Target Meters</label>
                <input type="number" className="form-input" placeholder="e.g. 50"
                  value={task.targetPrimary} onChange={e => handleTaskChange(task.id, 'targetPrimary', e.target.value)} />
              </div>
              <div className="form-field">
                <label>{t('DrillRingAndHole', 'Reference Code')}</label>
                <input type="text" className="form-input" placeholder="e.g. R9 9H"
                  value={task.referenceCode} onChange={e => handleTaskChange(task.id, 'referenceCode', e.target.value)} />
              </div>
            </>
          )}

          {task.activityCategory === 'Loading' && (
            <>
              <div className="form-field">
                <label>Target Buckets</label>
                <input type="number" className="form-input" placeholder="e.g. 75"
                  value={task.targetPrimary} onChange={e => handleTaskChange(task.id, 'targetPrimary', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Target {t('Tonnage', 'Tonnage')}</label>
                <input type="number" className="form-input" placeholder="e.g. 487"
                  value={task.targetSecondary} onChange={e => handleTaskChange(task.id, 'targetSecondary', e.target.value)} />
              </div>
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Allocated Trucks</label>
                <input type="text" className="form-input" placeholder="e.g. AD30-21, AD30-25"
                  value={task.assignedTrucks} onChange={e => handleTaskChange(task.id, 'assignedTrucks', e.target.value)} />
              </div>
            </>
          )}

          {task.activityCategory === 'Hauling' && (
            <>
              <div className="form-field">
                <label>Target Trips</label>
                <input type="number" className="form-input" placeholder="e.g. 11"
                  value={task.targetPrimary} onChange={e => handleTaskChange(task.id, 'targetPrimary', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Target {t('Tonnage', 'Tonnage')}</label>
                <input type="number" className="form-input" placeholder="e.g. 198"
                  value={task.targetSecondary} onChange={e => handleTaskChange(task.id, 'targetSecondary', e.target.value)} />
              </div>
            </>
          )}

          {task.activityCategory === 'GeneralTask' && (
            <>
              <div className="form-field">
                <label>Target Quantity</label>
                <input type="number" className="form-input" placeholder="e.g. 100"
                  value={task.targetPrimary} onChange={e => handleTaskChange(task.id, 'targetPrimary', e.target.value)} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button type="button" className="btn btn-secondary" onClick={() => router.back()} style={{ padding: '8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">New {t('ShiftPlanning', 'Shift Plan')}</h1>
          <p className="page-subtitle">Allocate fleet and operators for the upcoming {t('Shift', 'shift')}.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Header Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, background: 'var(--bg-default)', padding: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>Project</label>
            <select className="form-input" value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} style={{ fontWeight: 600 }} required>
              <option value="">-- Select Project --</option>
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" className="form-input" required style={{ fontWeight: 600 }}
              value={formData.planDate} onChange={e => setFormData({...formData, planDate: e.target.value})} />
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>Shift</label>
            <select className="form-input" value={formData.shift} onChange={e => setFormData({...formData, shift: Number(e.target.value)})} style={{ fontWeight: 600 }}>
              <option value={0}>Day Shift</option>
              <option value={1}>Night Shift</option>
              <option value={2}>Afternoon Shift</option>
            </select>
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>{t('MineCaptain', 'Mine Captain')}</label>
            <select className="form-input" value={formData.mineCaptainId} onChange={e => setFormData({...formData, mineCaptainId: e.target.value})}>
              <option value="">-- Select {t('MineCaptain', 'Mine Captain')} --</option>
              {userList.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>{t('ShiftBoss', 'Shift Boss')}</label>
            <select className="form-input" value={formData.shiftBossId} onChange={e => setFormData({...formData, shiftBossId: e.target.value})}>
              <option value="">-- Select {t('ShiftBoss', 'Shift Boss')} --</option>
              {userList.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ gridColumn: '1 / -1', marginBottom: 0, marginTop: 16 }}>
            <label>Overall Shift Target {t('Tonnage', 'Tonnage')} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
            <input type="number" className="form-input" placeholder="e.g. 1100" style={{ fontSize: 20, padding: 16 }}
              value={formData.overallTargetSecondary} onChange={e => setFormData({...formData, overallTargetSecondary: e.target.value})} />
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Task Assignments</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {user?.operationMode === 1 ? (
                <>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddTask('Drilling')} style={{ background: 'var(--bg-default)' }}>
                    <Drill size={14} className="text-accent-blue" /> Add Drill
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddTask('Loading')} style={{ background: 'var(--bg-default)' }}>
                    <Target size={14} className="text-accent-blue" /> Add Loader
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddTask('Hauling')} style={{ background: 'var(--bg-default)' }}>
                    <Truck size={14} className="text-accent-blue" /> Add Truck
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddTask('GeneralTask')} style={{ background: 'var(--bg-default)' }}>
                  <HardHat size={14} className="text-accent-blue" /> Add Task
                </button>
              )}
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { shiftPlansApi, shiftLogsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import { ArrowLeft, Loader2, Calendar, Target, Drill, Truck, Clock, PlayCircle, HardHat } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ShiftPlanDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useDictionary();
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [linkedLog, setLinkedLog] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchPlan = async () => {
      try {
        const data = await shiftPlansApi.getById(Number(id));
        setPlan(data);
        
        // Also check if there's a log generated for this plan
        try {
          const logs = await shiftLogsApi.getAll();
          const related = logs.find((l: any) => l.shiftPlanId === Number(id));
          if (related) setLinkedLog(related);
        } catch (e) {
          // Ignore logs fetch error
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id]);

  const handleGenerateActuals = async () => {
    if (!confirm('Generate actuals for this Shift Plan? This will create a Draft Shift Production Log / Site Daily Log.')) return;
    setGenerating(true);
    try {
      const res = await shiftPlansApi.generateActuals(Number(id));
      toast.success('Generated successfully');
      router.push(`/dashboard/shift-logs/${res.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate actuals');
      setGenerating(false);
    }
  };

  const getShiftName = (s: number) => {
    if (s === 0) return 'Day Shift';
    if (s === 1) return 'Night Shift';
    if (s === 2) return 'Afternoon Shift';
    return 'Unknown';
  };

  const getStatusBadge = (s: number) => {
    if (s === 0) return <span className="badge badge-warning">Draft</span>;
    if (s === 1) return <span className="badge badge-primary">Active</span>;
    if (s === 2) return <span className="badge badge-success">Completed</span>;
    return null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        <Loader2 size={32} className="spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <h2>Plan Not Found</h2>
        <button className="btn btn-secondary" onClick={() => router.push('/dashboard/shift-planning')} style={{ marginTop: 16 }}>Back to List</button>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button className="btn btn-ghost" onClick={() => router.push('/dashboard/shift-planning')} style={{ marginBottom: 12, padding: '4px 8px', color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="page-title">Shift Plan #{plan.id}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            {getStatusBadge(plan.status)}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
              <Calendar size={14} />
              {plan.planDate ? format(new Date(plan.planDate), 'EEEE, MMM dd, yyyy') : '-'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
              <Clock size={14} />
              {getShiftName(plan.shift)}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          {plan.status === 0 && !linkedLog && (
            <button className="btn btn-primary" onClick={handleGenerateActuals} disabled={generating}>
              {generating ? <Loader2 size={18} className="spin" /> : <PlayCircle size={18} />} 
              Execute Shift
            </button>
          )}
          {linkedLog && (
            <Link href={`/dashboard/shift-logs/${linkedLog.id}`} className="btn btn-secondary">
              View Generated Log
            </Link>
          )}
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Tasks List */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>Planned Tasks</h3>
            
            {plan.tasks?.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                No tasks assigned to this shift plan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {plan.tasks?.map((task: any, idx: number) => (
                  <div key={task.id} style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ background: 'var(--bg-app)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                          {idx + 1}
                        </div>
                        {task.activityCategory === 'Drilling' && <Drill size={16} className="text-accent-blue" />}
                        {task.activityCategory === 'Loading' && <Target size={16} className="text-accent-blue" />}
                        {task.activityCategory === 'Hauling' && <Truck size={16} className="text-accent-blue" />}
                        {task.activityCategory === 'GeneralTask' && <HardHat size={16} className="text-accent-blue" />}
                        {task.activityCategory === 'GeneralTask' ? 'General Task' : task.activityCategory}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '2px 8px', borderRadius: 4 }}>
                        {task.location || 'No Location'}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Equipment</div>
                        <div style={{ fontWeight: 500 }}>{task.equipment?.name || 'Unassigned'} {task.equipment?.serialNumber ? `(${task.equipment.serialNumber})` : ''}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Operator</div>
                        <div style={{ fontWeight: 500 }}>{task.operator ? `${task.operator.firstName} ${task.operator.lastName}` : 'Unassigned'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Target Primary</div>
                        <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                          {task.targetPrimary ? `${task.targetPrimary} ${task.targetPrimaryUnit}` : '-'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Planned Quantity</div>
                        <div style={{ fontWeight: 600 }}>
                          {task.plannedQuantity ? `${task.plannedQuantity} ${task.targetPrimaryUnit}` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>Management</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{t('MineCaptain', 'Mine Captain')}</div>
                <div style={{ fontWeight: 500 }}>{plan.mineCaptain ? `${plan.mineCaptain.firstName} ${plan.mineCaptain.lastName}` : 'Unassigned'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{t('ShiftBoss', 'Shift Boss')}</div>
                <div style={{ fontWeight: 500 }}>{plan.shiftBoss ? `${plan.shiftBoss.firstName} ${plan.shiftBoss.lastName}` : 'Unassigned'}</div>
              </div>
            </div>
          </div>
          
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>Notes</h3>
            <div style={{ fontSize: 13, color: plan.notes ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
              {plan.notes || 'No notes provided.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

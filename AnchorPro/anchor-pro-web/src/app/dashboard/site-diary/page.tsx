'use client';

import { useState, useEffect } from 'react';
import { siteDiaryApi, projectsApi, equipmentApi } from '@/lib/api';
import { 
  ClipboardList, Building2, Plus, Sun, CloudRain, Cloud, Wind, 
  Users, Truck, ShieldAlert, Camera, CheckCircle2, ChevronDown, ChevronRight, Calendar, AlertCircle
} from 'lucide-react';
import Modal from '@/components/Modal';

export default function SiteDiaryPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Diary Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    diaryDate: new Date().toISOString().split('T')[0],
    weatherCondition: 'Sunny',
    temperatureCelsius: 24,
    workPerformedSummary: '',
    siteInstructionsReceived: '',
    delaysOrConstraints: '',
    // Labour sub-list
    labour: [
      { tradeOrCrewName: 'General Labour / Site Clearance', headcount: 8, hoursWorked: 8, notes: '' },
      { tradeOrCrewName: 'Concrete & Formwork Crew', headcount: 6, hoursWorked: 8, notes: '' }
    ],
    // Plant sub-list
    plant: [
      { equipmentName: 'CAT 320 Excavator (20-Ton)', operatingHours: 6.5, idleHours: 1.5, breakdownHours: 0, fuelConsumedLitres: 45, notes: '' }
    ],
    // Deliveries
    deliveries: [
      { supplierName: 'Lafarge Readymix', materialDescription: '25MPa Concrete for Foundation Footings', quantityReceived: 18, unitOfMeasure: 'm3', deliveryNoteNumber: 'DN-9941', verifiedBy: 'Site Supervisor' }
    ],
    // Safety
    safety: {
      toolboxTalkTopic: 'Excavation Shoring & Working at Heights Protocol',
      incidentsReported: 0,
      nearMissesCount: 0,
      hazardsIdentified: 'Open foundation trenches barricaded after 16:00',
      correctiveAction: 'Installed warning tape and perimeter timber railings'
    }
  });

  useEffect(() => {
    projectsApi.getProjects()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setProjects(list);
        if (list.length > 0) setSelectedProjectId(list[0].id);
      })
      .catch(() => setError('Failed to load projects.'));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    loadEntries(selectedProjectId);
  }, [selectedProjectId]);

  const loadEntries = async (projId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await siteDiaryApi.getByProject(projId);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load site diary entries.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      await siteDiaryApi.create({
        projectId: selectedProjectId,
        diaryDate: form.diaryDate,
        weatherCondition: form.weatherCondition,
        temperatureCelsius: form.temperatureCelsius,
        workPerformedSummary: form.workPerformedSummary,
        siteInstructionsReceived: form.siteInstructionsReceived,
        delaysOrConstraints: form.delaysOrConstraints,
        labour: form.labour,
        plant: form.plant,
        deliveries: form.deliveries,
        safety: form.safety
      });
      setShowCreateModal(false);
      loadEntries(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addLabourRow = () => {
    setForm({
      ...form,
      labour: [...form.labour, { tradeOrCrewName: '', headcount: 1, hoursWorked: 8, notes: '' }]
    });
  };

  const addPlantRow = () => {
    setForm({
      ...form,
      plant: [...form.plant, { equipmentName: '', operatingHours: 8, idleHours: 0, breakdownHours: 0, fuelConsumedLitres: 0, notes: '' }]
    });
  };

  const addDeliveryRow = () => {
    setForm({
      ...form,
      deliveries: [...form.deliveries, { supplierName: '', materialDescription: '', quantityReceived: 1, unitOfMeasure: 'ton', deliveryNoteNumber: '', verifiedBy: '' }]
    });
  };

  const getWeatherIcon = (cond: string) => {
    switch (cond?.toLowerCase()) {
      case 'rain':
      case 'heavy rain':
        return <CloudRain size={16} style={{ color: '#60a5fa' }} />;
      case 'overcast':
        return <Cloud size={16} style={{ color: '#94a3b8' }} />;
      case 'wind':
        return <Wind size={16} style={{ color: '#cbd5e1' }} />;
      default:
        return <Sun size={16} style={{ color: '#f59e0b' }} />;
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={28} style={{ color: '#ef4444' }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Daily Site Diary
            </h1>
          </div>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Official daily site record: Weather, Labour Headcount by Trade, Plant Hours, Material Deliveries, and Safety.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, outline: 'none' }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} style={{ background: '#1e293b' }}>{p.name}</option>
              ))}
            </select>
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <Plus size={14} /> New Daily Site Record
          </button>
        </div>
      </div>

      {/* Diary Entries List */}
      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading daily site logs...
        </div>
      )}

      {error && (
        <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#ef4444', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {entries.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {entries.map((entry) => {
            const totalHeadcount = (entry.labourHeadcounts || entry.LabourHeadcounts || []).reduce((sum: number, l: any) => sum + (l.headcount || 0), 0);
            const totalPlantHours = (entry.plantUsages || entry.PlantUsages || []).reduce((sum: number, p: any) => sum + (p.operatingHours || 0), 0);
            const deliveryCount = (entry.deliveries || entry.Deliveries || []).length;

            return (
              <div key={entry.id} className="card" style={{ padding: 20, borderLeft: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      <Calendar size={18} style={{ color: '#ef4444' }} />
                      {new Date(entry.diaryDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>
                      {getWeatherIcon(entry.weatherCondition)}
                      <span>{entry.weatherCondition} ({entry.temperatureCelsius ?? 22}°C)</span>
                    </div>

                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: entry.status === 2 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: entry.status === 2 ? '#10b981' : '#f59e0b'
                    }}>
                      {entry.status === 2 ? 'Approved Site Log' : 'Draft / Submitted'}
                    </span>
                  </div>

                  {/* Summary Badges */}
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} style={{ color: '#3b82f6' }} /> {totalHeadcount} Workers on Site
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Truck size={14} style={{ color: '#10b981' }} /> {totalPlantHours}h Plant Operating
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={14} style={{ color: '#f59e0b' }} /> {deliveryCount} Deliveries Received
                    </span>
                  </div>
                </div>

                {/* Main Work Performed */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Work Performed Today
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {entry.workPerformedSummary}
                  </div>
                </div>

                {/* Delays / Constraints if any */}
                {entry.delaysOrConstraints && (
                  <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>Delays / Constraints: </span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{entry.delaysOrConstraints}</span>
                  </div>
                )}

                {/* Headcount Breakdown Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, background: 'rgba(0,0,0,0.12)', padding: 12, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Labour Headcount by Trade
                    </div>
                    {(entry.labourHeadcounts || entry.LabourHeadcounts || []).map((l: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{l.tradeOrCrewName}</span>
                        <span style={{ fontWeight: 700, color: '#3b82f6' }}>{l.headcount} men ({l.hoursWorked}h)</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Plant & Machinery Usage
                    </div>
                    {(entry.plantUsages || entry.PlantUsages || []).map((p: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{p.equipmentName}</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{p.operatingHours}h Run / {p.idleHours}h Idle</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <ClipboardList size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>No Site Diary Logs Yet</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 6, maxWidth: 500, margin: '6px auto 20px' }}>
              Create your daily site diary entry to record today's weather, labor headcount, machinery hours, and work output.
            </p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Record Today's Site Diary
            </button>
          </div>
        )
      )}

      {/* New Site Diary Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Record Daily Site Diary">
        <form onSubmit={handleCreateEntry} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto', paddingRight: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={form.diaryDate} 
                onChange={e => setForm({ ...form, diaryDate: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Weather</label>
              <select 
                className="input-field" 
                value={form.weatherCondition} 
                onChange={e => setForm({ ...form, weatherCondition: e.target.value })}
              >
                <option value="Sunny">Sunny / Clear</option>
                <option value="Overcast">Overcast</option>
                <option value="Rain">Rain (Normal)</option>
                <option value="Heavy Rain">Heavy Rain (Site Stoppage)</option>
                <option value="Wind">High Wind</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Temp (°C)</label>
              <input 
                type="number" 
                className="input-field" 
                value={form.temperatureCelsius} 
                onChange={e => setForm({ ...form, temperatureCelsius: parseFloat(e.target.value) || 0 })} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Work Performed Summary</label>
            <textarea 
              className="input-field" 
              rows={3}
              value={form.workPerformedSummary} 
              onChange={e => setForm({ ...form, workPerformedSummary: e.target.value })} 
              placeholder="e.g. Completed blinding concrete in Grid 3-6. Excavated 120m3 foundation trench..." 
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Delays / Constraints / Standing Time</label>
            <input 
              type="text" 
              className="input-field" 
              value={form.delaysOrConstraints} 
              onChange={e => setForm({ ...form, delaysOrConstraints: e.target.value })} 
              placeholder="e.g. 2 hours standing time due to morning rainstorm." 
            />
          </div>

          {/* Labour Headcount Section */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Labour Headcount by Trade</span>
              <button type="button" className="btn btn-sm btn-secondary" onClick={addLabourRow}>+ Add Trade</button>
            </div>
            {form.labour.map((l, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 6 }}>
                <input 
                  type="text" className="input-field" placeholder="Trade (e.g. Bricklayers)" 
                  value={l.tradeOrCrewName} 
                  onChange={e => {
                    const next = [...form.labour];
                    next[idx].tradeOrCrewName = e.target.value;
                    setForm({ ...form, labour: next });
                  }} 
                  required 
                />
                <input 
                  type="number" className="input-field" placeholder="Headcount" 
                  value={l.headcount} 
                  onChange={e => {
                    const next = [...form.labour];
                    next[idx].headcount = parseInt(e.target.value) || 0;
                    setForm({ ...form, labour: next });
                  }} 
                  required 
                />
                <input 
                  type="number" className="input-field" placeholder="Hours" 
                  value={l.hoursWorked} 
                  onChange={e => {
                    const next = [...form.labour];
                    next[idx].hoursWorked = parseFloat(e.target.value) || 0;
                    setForm({ ...form, labour: next });
                  }} 
                  required 
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Daily Site Diary</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

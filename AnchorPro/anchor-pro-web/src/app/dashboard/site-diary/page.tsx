'use client';

import { useState, useEffect, useRef } from 'react';
import { siteDiaryApi, projectsApi, equipmentApi, uploadApi, hrApi } from '@/lib/api';
import {
  ClipboardList, Building2, Plus, Sun, CloudRain, Cloud, Wind,
  Users, Truck, ShieldAlert, Camera, CheckCircle2, Calendar, PackageCheck, Loader2
} from 'lucide-react';
import Modal from '@/components/Modal';

export default function SiteDiaryPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoTargetRef = useRef<number | null>(null);

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
      { tradeOrCrewName: 'General Labour / Site Clearance', headcount: 8, hoursWorked: 8, employeeUserId: '', notes: '' },
      { tradeOrCrewName: 'Concrete & Formwork Crew', headcount: 6, hoursWorked: 8, employeeUserId: '', notes: '' }
    ],
    // Plant sub-list
    plant: [
      { equipmentId: null as number | null, equipmentName: 'CAT 320 Excavator (20-Ton)', operatingHours: 6.5, idleHours: 1.5, breakdownHours: 0, fuelConsumedLitres: 45, notes: '' }
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

    equipmentApi.getAll()
      .then((res: any) => setEquipment(Array.isArray(res) ? res : []))
      .catch(() => setEquipment([]));

    hrApi.getEmployees()
      .then((res: any) => setEmployees(Array.isArray(res) ? res : []))
      .catch(() => setEmployees([]));
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
        labour: form.labour.map(l => ({ ...l, employeeUserId: l.employeeUserId || null })),
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
      labour: [...form.labour, { tradeOrCrewName: '', headcount: 1, hoursWorked: 8, employeeUserId: '', notes: '' }]
    });
  };

  const addPlantRow = () => {
    setForm({
      ...form,
      plant: [...form.plant, { equipmentId: null, equipmentName: '', operatingHours: 8, idleHours: 0, breakdownHours: 0, fuelConsumedLitres: 0, notes: '' }]
    });
  };

  const addDeliveryRow = () => {
    setForm({
      ...form,
      deliveries: [...form.deliveries, { supplierName: '', materialDescription: '', quantityReceived: 1, unitOfMeasure: 'ton', deliveryNoteNumber: '', verifiedBy: '' }]
    });
  };

  const handlePlantEquipmentChange = (idx: number, equipmentIdRaw: string) => {
    const next = [...form.plant];
    if (!equipmentIdRaw) {
      next[idx].equipmentId = null;
    } else {
      const eqId = Number(equipmentIdRaw);
      const eq = equipment.find(e => e.id === eqId);
      next[idx].equipmentId = eqId;
      if (eq) next[idx].equipmentName = eq.name;
    }
    setForm({ ...form, plant: next });
  };

  const triggerPhotoUpload = (entryId: number) => {
    photoTargetRef.current = entryId;
    fileInputRef.current?.click();
  };

  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const entryId = photoTargetRef.current;
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file || !entryId) return;

    setUploadingPhotoFor(entryId);
    try {
      const uploaded: any = await uploadApi.upload(file);
      await siteDiaryApi.addPhoto(entryId, { photoUrl: uploaded.url, caption: file.name });
      if (selectedProjectId) await loadEntries(selectedProjectId);
    } catch (err: any) {
      alert(err?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhotoFor(null);
    }
  };

  const getWeatherIcon = (cond: string) => {
    switch (cond?.toLowerCase()) {
      case 'rain':
      case 'heavy rain':
        return <CloudRain size={16} style={{ color: '#60a5fa' }} />;
      case 'overcast':
        return <Cloud size={16} style={{ color: 'var(--text-secondary)' }} />;
      case 'wind':
        return <Wind size={16} style={{ color: 'var(--text-secondary)' }} />;
      default:
        return <Sun size={16} style={{ color: '#f59e0b' }} />;
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Hidden file input shared by every entry's "Add Photo" button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoFileSelected}
      />

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
                <option key={p.id} value={p.id} style={{ background: 'var(--bg-card)' }}>{p.name}</option>
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
            const labour = entry.labourHeadcounts || entry.LabourHeadcounts || [];
            const plant = entry.plantUsages || entry.PlantUsages || [];
            const deliveries = entry.deliveries || entry.Deliveries || [];
            const photos = entry.photos || entry.Photos || [];
            const safetyLogs = entry.safetyLogs || entry.SafetyLogs || [];
            const safety = safetyLogs[0];

            const totalHeadcount = labour.reduce((sum: number, l: any) => sum + (l.headcount || 0), 0);
            const totalPlantHours = plant.reduce((sum: number, p: any) => sum + (p.operatingHours || 0), 0);
            const deliveryCount = deliveries.length;

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
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} style={{ color: '#3b82f6' }} /> {totalHeadcount} Workers on Site
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Truck size={14} style={{ color: '#10b981' }} /> {totalPlantHours}h Plant Operating
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PackageCheck size={14} style={{ color: '#f59e0b' }} /> {deliveryCount} Deliveries Received
                    </span>
                    {safety && (safety.incidentsReported > 0 || safety.nearMissesCount > 0) && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444' }}>
                        <ShieldAlert size={14} /> {safety.incidentsReported} Incidents / {safety.nearMissesCount} Near-Misses
                      </span>
                    )}
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

                {/* Headcount / Plant / Deliveries / Safety Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, background: 'rgba(0,0,0,0.12)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Labour Headcount by Trade
                    </div>
                    {labour.map((l: any, idx: number) => {
                      const emp = l.employee || l.Employee;
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-primary)' }}>
                            {l.tradeOrCrewName}
                            {emp && <span style={{ color: 'var(--accent-blue)', fontSize: 11 }}> · {emp.firstName} {emp.lastName}</span>}
                          </span>
                          <span style={{ fontWeight: 700, color: '#3b82f6' }}>{l.headcount} men ({l.hoursWorked}h)</span>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Plant & Machinery Usage
                    </div>
                    {plant.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No plant recorded</div>}
                    {plant.map((p: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{p.equipmentName}{p.equipmentId ? '' : ' (unregistered)'}</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{p.operatingHours}h Run / {p.idleHours}h Idle</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Deliveries Received
                    </div>
                    {deliveries.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No deliveries recorded</div>}
                    {deliveries.map((d: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{d.materialDescription} — {d.supplierName}</span>
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>{d.quantityReceived} {d.unitOfMeasure}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Safety
                    </div>
                    {!safety && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No safety log recorded</div>}
                    {safety && (
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {safety.toolboxTalkTopic && <div>Toolbox talk: {safety.toolboxTalkTopic}</div>}
                        <div>{safety.incidentsReported} incidents, {safety.nearMissesCount} near-misses</div>
                        {safety.hazardsIdentified && <div style={{ color: '#ef4444' }}>Hazards: {safety.hazardsIdentified}</div>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Site Photos ({photos.length})
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => triggerPhotoUpload(entry.id)}
                      disabled={uploadingPhotoFor === entry.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      {uploadingPhotoFor === entry.id
                        ? <Loader2 size={13} className="spin" />
                        : <Camera size={13} />}
                      Add Photo
                    </button>
                  </div>
                  {photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {photos.map((p: any) => (
                        <a key={p.id} href={p.photoUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={p.photoUrl}
                            alt={p.caption || 'Site photo'}
                            title={p.caption}
                            style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-subtle)' }}
                          />
                        </a>
                      ))}
                    </div>
                  )}
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
                className="form-input"
                value={form.diaryDate}
                onChange={e => setForm({ ...form, diaryDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Weather</label>
              <select
                className="form-input"
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
                className="form-input"
                value={form.temperatureCelsius}
                onChange={e => setForm({ ...form, temperatureCelsius: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Work Performed Summary</label>
            <textarea
              className="form-input"
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
              className="form-input"
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
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 0.8fr 1.4fr', gap: 8, marginBottom: 6 }}>
                <input
                  type="text" className="form-input" placeholder="Trade (e.g. Bricklayers)"
                  value={l.tradeOrCrewName}
                  onChange={e => {
                    const next = [...form.labour];
                    next[idx].tradeOrCrewName = e.target.value;
                    setForm({ ...form, labour: next });
                  }}
                  required
                />
                <input
                  type="number" className="form-input" placeholder="Headcount"
                  value={l.headcount}
                  onChange={e => {
                    const next = [...form.labour];
                    next[idx].headcount = parseInt(e.target.value) || 0;
                    setForm({ ...form, labour: next });
                  }}
                  required
                />
                <input
                  type="number" className="form-input" placeholder="Hours"
                  value={l.hoursWorked}
                  onChange={e => {
                    const next = [...form.labour];
                    next[idx].hoursWorked = parseFloat(e.target.value) || 0;
                    setForm({ ...form, labour: next });
                  }}
                  required
                />
                <select
                  className="form-input" title="Link to an AnchorPro employee, if this crew is (or is led by) one — enables labour cost roll-up"
                  value={l.employeeUserId}
                  onChange={e => {
                    const next = [...form.labour];
                    next[idx].employeeUserId = e.target.value;
                    setForm({ ...form, labour: next });
                  }}
                >
                  <option value="">— Subcontracted / casual —</option>
                  {employees.map((emp: any) => (
                    <option key={emp.userId} value={emp.userId}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Plant & Machinery Section */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Plant &amp; Machinery Usage</span>
              <button type="button" className="btn btn-sm btn-secondary" onClick={addPlantRow}>+ Add Plant</button>
            </div>
            {form.plant.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                  <select
                    className="form-input"
                    value={p.equipmentId ?? ''}
                    onChange={e => handlePlantEquipmentChange(idx, e.target.value)}
                  >
                    <option value="">Not in register…</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                  </select>
                  <input
                    type="text" className="form-input" placeholder="Plant description (e.g. CAT 320 Excavator)"
                    value={p.equipmentName}
                    onChange={e => {
                      const next = [...form.plant];
                      next[idx].equipmentName = e.target.value;
                      setForm({ ...form, plant: next });
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  <input
                    type="number" step="0.5" className="form-input" placeholder="Operating hrs"
                    value={p.operatingHours}
                    onChange={e => {
                      const next = [...form.plant];
                      next[idx].operatingHours = parseFloat(e.target.value) || 0;
                      setForm({ ...form, plant: next });
                    }}
                  />
                  <input
                    type="number" step="0.5" className="form-input" placeholder="Idle hrs"
                    value={p.idleHours}
                    onChange={e => {
                      const next = [...form.plant];
                      next[idx].idleHours = parseFloat(e.target.value) || 0;
                      setForm({ ...form, plant: next });
                    }}
                  />
                  <input
                    type="number" step="0.5" className="form-input" placeholder="Breakdown hrs"
                    value={p.breakdownHours}
                    onChange={e => {
                      const next = [...form.plant];
                      next[idx].breakdownHours = parseFloat(e.target.value) || 0;
                      setForm({ ...form, plant: next });
                    }}
                  />
                  <input
                    type="number" step="1" className="form-input" placeholder="Fuel (L)"
                    value={p.fuelConsumedLitres}
                    onChange={e => {
                      const next = [...form.plant];
                      next[idx].fuelConsumedLitres = parseFloat(e.target.value) || 0;
                      setForm({ ...form, plant: next });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Deliveries Section */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Deliveries Received</span>
              <button type="button" className="btn btn-sm btn-secondary" onClick={addDeliveryRow}>+ Add Delivery</button>
            </div>
            {form.deliveries.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                  <input
                    type="text" className="form-input" placeholder="Supplier"
                    value={d.supplierName}
                    onChange={e => {
                      const next = [...form.deliveries];
                      next[idx].supplierName = e.target.value;
                      setForm({ ...form, deliveries: next });
                    }}
                    required
                  />
                  <input
                    type="text" className="form-input" placeholder="Material description"
                    value={d.materialDescription}
                    onChange={e => {
                      const next = [...form.deliveries];
                      next[idx].materialDescription = e.target.value;
                      setForm({ ...form, deliveries: next });
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                  <input
                    type="number" step="0.1" className="form-input" placeholder="Quantity"
                    value={d.quantityReceived}
                    onChange={e => {
                      const next = [...form.deliveries];
                      next[idx].quantityReceived = parseFloat(e.target.value) || 0;
                      setForm({ ...form, deliveries: next });
                    }}
                  />
                  <select
                    className="form-input"
                    value={d.unitOfMeasure}
                    onChange={e => {
                      const next = [...form.deliveries];
                      next[idx].unitOfMeasure = e.target.value;
                      setForm({ ...form, deliveries: next });
                    }}
                  >
                    <option value="ton">ton</option>
                    <option value="m3">m³</option>
                    <option value="bag">bag</option>
                    <option value="unit">unit</option>
                    <option value="load">load</option>
                  </select>
                  <input
                    type="text" className="form-input" placeholder="Delivery note #"
                    value={d.deliveryNoteNumber}
                    onChange={e => {
                      const next = [...form.deliveries];
                      next[idx].deliveryNoteNumber = e.target.value;
                      setForm({ ...form, deliveries: next });
                    }}
                  />
                  <input
                    type="text" className="form-input" placeholder="Verified by"
                    value={d.verifiedBy}
                    onChange={e => {
                      const next = [...form.deliveries];
                      next[idx].verifiedBy = e.target.value;
                      setForm({ ...form, deliveries: next });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Safety Section */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>Safety</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text" className="form-input" placeholder="Toolbox talk topic"
                value={form.safety.toolboxTalkTopic}
                onChange={e => setForm({ ...form, safety: { ...form.safety, toolboxTalkTopic: e.target.value } })}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Incidents reported</label>
                  <input
                    type="number" min={0} className="form-input"
                    value={form.safety.incidentsReported}
                    onChange={e => setForm({ ...form, safety: { ...form.safety, incidentsReported: parseInt(e.target.value) || 0 } })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Near-misses</label>
                  <input
                    type="number" min={0} className="form-input"
                    value={form.safety.nearMissesCount}
                    onChange={e => setForm({ ...form, safety: { ...form.safety, nearMissesCount: parseInt(e.target.value) || 0 } })}
                  />
                </div>
              </div>
              <input
                type="text" className="form-input" placeholder="Hazards identified"
                value={form.safety.hazardsIdentified}
                onChange={e => setForm({ ...form, safety: { ...form.safety, hazardsIdentified: e.target.value } })}
              />
              <input
                type="text" className="form-input" placeholder="Corrective action taken"
                value={form.safety.correctiveAction}
                onChange={e => setForm({ ...form, safety: { ...form.safety, correctiveAction: e.target.value } })}
              />
            </div>
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

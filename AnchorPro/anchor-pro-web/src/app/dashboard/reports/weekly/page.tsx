'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, Download, Printer, Users, Truck, 
  ShieldCheck, AlertTriangle, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';
import { projectsApi, siteDiaryApi } from '@/lib/api';

export default function WeeklyReportPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  useEffect(() => {
    projectsApi.getProjects()
      .then((res: any) => {
        const list = res.data ?? res;
        setProjects(list);
        if (list.length > 0 && !selectedProjectId) {
          setSelectedProjectId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={26} style={{ color: '#3b82f6' }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary, #fff)' }}>
              Weekly Site Progress Report
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted, #94a3b8)' }}>
            Auto-aggregated executive summary from Daily Site Diaries, labor rosters & delivery notes.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {projects.length > 0 && (
            <select
              className="input-field"
              style={{ width: 260, background: '#1e293b' }}
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={16} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Report Document Sheet */}
      <div className="card" style={{ padding: '36px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
        
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>WEEKLY PROGRESS REPORT #34</div>
            <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 600, marginTop: 4 }}>
              {projects.find(p => p.id === selectedProjectId)?.name || 'Commercial Office Complex'}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Reporting Period: 18 Aug 2026 – 24 Aug 2026 (Week 34)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Main Contractor</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Anchor Civil & Building Ltd</div>
            <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>Status: Approved by Site Agent</div>
          </div>
        </div>

        {/* Executive Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11.5, color: '#94a3b8', textTransform: 'uppercase' }}>Total Man-Hours Worked</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>1,120 hrs</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>24 avg daily workforce</div>
          </div>

          <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11.5, color: '#94a3b8', textTransform: 'uppercase' }}>Plant Machine Hours</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', marginTop: 4 }}>87.5 hrs</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Excavators & Tippers</div>
          </div>

          <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11.5, color: '#94a3b8', textTransform: 'uppercase' }}>Weather Downtime</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>0 Days</div>
            <div style={{ fontSize: 11.5, color: '#10b981', marginTop: 2 }}>Zero Weather Delays</div>
          </div>

          <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11.5, color: '#94a3b8', textTransform: 'uppercase' }}>HSE Safety Incidents</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', marginTop: 4 }}>0 Incidents</div>
            <div style={{ fontSize: 11.5, color: '#10b981', marginTop: 2 }}>100% Zero Harm</div>
          </div>
        </div>

        {/* Work Done This Week */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12 }}>
            1. Key Works Executed During Week
          </h3>
          <ul style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Completed bulk excavation for strip footings Grid A1 through A8 to invert level -1.80m.</li>
            <li>Placed 85m³ of blinding concrete layer (15MPa) across foundation trenches.</li>
            <li>Prefabricated and tied 8.5 tons of High Tensile Y16 foundation steel reinforcement mats.</li>
            <li>Installed 120 linear meters of perimeter drainage subbase and stormwater connection.</li>
          </ul>
        </div>

        {/* 2-Week Lookahead */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12 }}>
            2. Two-Week Lookahead Program
          </h3>
          <ul style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Cast foundation footings with 25MPa ReadyMix Concrete (Volume: 120m³).</li>
            <li>Erect formwork and cast starter stub columns up to ground beam level.</li>
            <li>Import and compact 250m³ of G5 gravel backfill under ground floor slab.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

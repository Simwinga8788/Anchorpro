'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Calendar, Printer, DollarSign, Building2, 
  TrendingUp, CheckCircle2, ShieldCheck, Layers
} from 'lucide-react';
import { projectsApi } from '@/lib/api';

export default function MonthlyReportPage() {
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
            <FileText size={26} style={{ color: '#3b82f6' }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary, #fff)' }}>
              Monthly Client & Consultant Report
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted, #94a3b8)' }}>
            Comprehensive executive progress & financial report for Client, Architect & Principal Agent.
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
            <Printer size={16} /> Export Consultant PDF
          </button>
        </div>
      </div>

      {/* Monthly Report Document Sheet */}
      <div className="card" style={{ padding: '36px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
        
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>MONTHLY PROGRESS REPORT — AUGUST 2026</div>
            <div style={{ fontSize: 15, color: '#3b82f6', fontWeight: 600, marginTop: 4 }}>
              {projects.find(p => p.id === selectedProjectId)?.name || 'Lusaka Commercial Complex - Phase 1'}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Contract Standard: JBCC Edition 6.2 (State & Private)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Issued To</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Bicon Structural Consultants</div>
            <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>Certificate IPC-01 Valuation Attached</div>
          </div>
        </div>

        {/* Commercial & Physical Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Original Contract Sum</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 4 }}>$58,575.00</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Approved BOQ Baseline</div>
          </div>

          <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Gross Valuation to Date</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>$37,020.00</div>
            <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 2 }}>63.2% Financial Progress</div>
          </div>

          <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Net Certified Payable (IPC-01)</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>$35,169.00</div>
            <div style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>Less 5% Retention ($1,851.00)</div>
          </div>
        </div>

        {/* Section Breakdown */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12 }}>
            1. Trade Section Progress Breakdown
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Section</th>
                  <th style={{ padding: '8px 10px' }}>Trade Description</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>BOQ Budget</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Valued to Date</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>% Complete</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#3b82f6' }}>Sec A</td>
                  <td style={{ padding: '10px', color: '#fff' }}>Preliminaries & General</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>$15,000.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#10b981' }}>$15,000.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>100.0%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#3b82f6' }}>Sec B</td>
                  <td style={{ padding: '10px', color: '#fff' }}>Earthworks & Site Clearance</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>$15,525.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#10b981' }}>$10,800.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>69.6%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#3b82f6' }}>Sec C</td>
                  <td style={{ padding: '10px', color: '#fff' }}>Concrete, Formwork & Rebar</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>$28,050.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#10b981' }}>$11,220.00</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>40.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Safety & Quality */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 12 }}>
            2. Quality Control & Safety Compliance
          </h3>
          <p style={{ color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.8 }}>
            Cube test crush results for 25MPa Readymix foundation pours achieved an average 28-day compressive strength of 29.4 MPa (Exceeds specification). Zero Lost Time Injuries (LTI) recorded for the month.
          </p>
        </div>
      </div>
    </div>
  );
}

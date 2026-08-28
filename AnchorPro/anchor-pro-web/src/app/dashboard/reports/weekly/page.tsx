'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3, Printer, Users, CheckCircle2, Plus, Save
} from 'lucide-react';
import { projectsApi, reportsApi } from '@/lib/api';
import Modal from '@/components/Modal';

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  date.setDate(diff);
  return date;
}

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function WeeklyReportPage() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const monday = startOfWeek(new Date());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const [genForm, setGenForm] = useState({ periodStartDate: toISODate(monday), periodEndDate: toISODate(sunday) });

  const [keyWorks, setKeyWorks] = useState('');
  const [lookahead, setLookahead] = useState('');

  useEffect(() => {
    projectsApi.getProjects()
      .then((res: any) => {
        const list = res.data ?? res;
        setProjects(list);
        const paramId = Number(searchParams.get('project'));
        if (paramId && list.some((p: any) => p.id === paramId)) setSelectedProjectId(paramId);
        else if (list.length > 0 && !selectedProjectId) setSelectedProjectId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const loadReports = async (projId: number) => {
    setLoading(true);
    try {
      const data = await reportsApi.weekly.getByProject(projId);
      setReports(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedReport(data[0]);
        setKeyWorks(data[0].keyWorksNarrative || '');
        setLookahead(data[0].lookaheadNarrative || '');
      } else {
        setSelectedReport(null);
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) loadReports(selectedProjectId);
  }, [selectedProjectId]);

  const selectReport = (r: any) => {
    setSelectedReport(r);
    setKeyWorks(r.keyWorksNarrative || '');
    setLookahead(r.lookaheadNarrative || '');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setActionLoading(true);
    try {
      const report = await reportsApi.weekly.generate({
        projectId: selectedProjectId,
        periodStartDate: genForm.periodStartDate,
        periodEndDate: genForm.periodEndDate
      });
      setShowGenerateModal(false);
      await loadReports(selectedProjectId);
      selectReport(report);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNarrative = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      const updated = await reportsApi.weekly.updateNarrative(selectedReport.id, {
        keyWorksNarrative: keyWorks,
        lookaheadNarrative: lookahead
      });
      setSelectedReport(updated);
      if (selectedProjectId) await loadReports(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!selectedReport) return;
    if (!confirm('Issue this weekly report? Once issued it becomes read-only and rolls into the monthly report.')) return;
    setActionLoading(true);
    try {
      await handleSaveNarrative();
      const updated = await reportsApi.weekly.issue(selectedReport.id);
      setSelectedReport(updated);
      if (selectedProjectId) await loadReports(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isDraft = selectedReport?.status === 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto' }}>
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
            Auto-aggregated from Daily Site Diary entries — labour hours, plant hours, weather, and safety.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {projects.length > 0 && (
            <select
              className="form-input"
              style={{ width: 260, background: 'var(--bg-card)' }}
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => setShowGenerateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Generate Report
          </button>
          {selectedReport && (
            <a
              href={`/dashboard/reports/weekly/${selectedReport.id}/print`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={16} /> Print / Export PDF
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* History sidebar */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Report History
          </h3>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
          ) : reports.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No weekly reports yet. Click &quot;Generate Report&quot; to create one from this week&apos;s Site Diary entries.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map(r => (
                <div
                  key={r.id}
                  onClick={() => selectReport(r)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: selectedReport?.id === r.id ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-surface)',
                    border: selectedReport?.id === r.id ? '1px solid #3b82f6' : '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Report #{r.reportNumber}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {new Date(r.periodStartDate).toLocaleDateString()} – {new Date(r.periodEndDate).toLocaleDateString()}
                  </div>
                  <span className={`badge ${r.status === 1 ? 'badge-green' : 'badge-muted'}`} style={{ marginTop: 4 }}>
                    {r.status === 1 ? 'Issued' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report detail */}
        {selectedReport ? (
          <div className="card" style={{ padding: '36px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-subtle)', paddingBottom: 20, marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  WEEKLY PROGRESS REPORT #{selectedReport.reportNumber}
                </div>
                <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 600, marginTop: 4 }}>
                  {projects.find(p => p.id === selectedProjectId)?.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Reporting Period: {new Date(selectedReport.periodStartDate).toLocaleDateString()} – {new Date(selectedReport.periodEndDate).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${selectedReport.status === 1 ? 'badge-green' : 'badge-muted'}`}>
                  {selectedReport.status === 1 ? 'Issued' : 'Draft'}
                </span>
                {isDraft && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-secondary" disabled={actionLoading} onClick={handleSaveNarrative} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Save size={13} /> Save
                    </button>
                    <button className="btn btn-sm btn-primary" disabled={actionLoading} onClick={handleIssue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={13} /> Issue Report
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Executive Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              <div style={{ padding: 14, background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Man-Hours Worked</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>{Number(selectedReport.totalManHours).toLocaleString()} hrs</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{selectedReport.averageDailyWorkforce} avg daily workforce</div>
                {selectedReport.totalLabourCost > 0 && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    ${Number(selectedReport.totalLabourCost).toLocaleString(undefined, { minimumFractionDigits: 2 })} employee labour cost
                  </div>
                )}
              </div>
              <div style={{ padding: 14, background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Plant Machine Hours</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', marginTop: 4 }}>{Number(selectedReport.totalPlantHours).toLocaleString()} hrs</div>
              </div>
              <div style={{ padding: 14, background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Weather Downtime</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>{selectedReport.weatherDowntimeDays} Days</div>
              </div>
              <div style={{ padding: 14, background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>HSE Safety Incidents</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: selectedReport.safetyIncidentsCount > 0 ? '#ef4444' : '#10b981', marginTop: 4 }}>
                  {selectedReport.safetyIncidentsCount} Incidents
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{selectedReport.nearMissesCount} near misses</div>
              </div>
            </div>

            {/* Key Works Executed */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12 }}>
                1. Key Works Executed During Week
              </h3>
              {isDraft ? (
                <textarea
                  className="form-input"
                  rows={6}
                  value={keyWorks}
                  onChange={e => setKeyWorks(e.target.value)}
                  style={{ width: '100%', fontSize: 13.5, lineHeight: 1.6 }}
                />
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selectedReport.keyWorksNarrative}</p>
              )}
            </div>

            {/* Lookahead */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12 }}>
                2. Two-Week Lookahead Program
              </h3>
              {isDraft ? (
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Planned works for the next two weeks..."
                  value={lookahead}
                  onChange={e => setLookahead(e.target.value)}
                  style={{ width: '100%', fontSize: 13.5, lineHeight: 1.6 }}
                />
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selectedReport.lookaheadNarrative || 'Not specified.'}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <Users size={40} style={{ color: 'var(--text-secondary)', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No Weekly Report Selected</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>Click &quot;Generate Report&quot; to build one from this week&apos;s Site Diary entries.</p>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <Modal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Weekly Report">
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Aggregates all Site Diary entries logged for this project within the selected period.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Period Start</label>
              <input type="date" className="form-input" required value={genForm.periodStartDate} onChange={e => setGenForm({ ...genForm, periodStartDate: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Period End</label>
              <input type="date" className="form-input" required value={genForm.periodEndDate} onChange={e => setGenForm({ ...genForm, periodEndDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>Generate</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

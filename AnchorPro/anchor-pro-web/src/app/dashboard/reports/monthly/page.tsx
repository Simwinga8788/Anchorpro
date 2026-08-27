'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Printer, Plus, Save, CheckCircle2, Send
} from 'lucide-react';
import { projectsApi, reportsApi } from '@/lib/api';
import Modal from '@/components/Modal';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_INFO: Record<number, { label: string; badge: string }> = {
  0: { label: 'Draft', badge: 'badge-muted' },
  1: { label: 'Approved', badge: 'badge-blue' },
  2: { label: 'Issued', badge: 'badge-green' },
};

export default function MonthlyReportPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const now = new Date();
  const [genForm, setGenForm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });

  const [narrative, setNarrative] = useState('');

  useEffect(() => {
    projectsApi.getProjects()
      .then((res: any) => {
        const list = res.data ?? res;
        setProjects(list);
        if (list.length > 0 && !selectedProjectId) setSelectedProjectId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const loadReports = async (projId: number) => {
    setLoading(true);
    try {
      const data = await reportsApi.monthly.getByProject(projId);
      setReports(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        await selectReport(data[0].id);
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

  const selectReport = async (id: number) => {
    try {
      const detail = await reportsApi.monthly.getById(id);
      setSelectedReport(detail);
      setNarrative(detail.narrative || '');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setActionLoading(true);
    try {
      const report = await reportsApi.monthly.generate({
        projectId: selectedProjectId,
        year: genForm.year,
        month: genForm.month
      });
      setShowGenerateModal(false);
      await loadReports(selectedProjectId);
      await selectReport(report.id);
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
      await reportsApi.monthly.updateNarrative(selectedReport.id, narrative);
      await selectReport(selectedReport.id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReport) return;
    if (!confirm('Approve this monthly report? Save any narrative edits first.')) return;
    setActionLoading(true);
    try {
      await reportsApi.monthly.updateNarrative(selectedReport.id, narrative);
      await reportsApi.monthly.approve(selectedReport.id);
      await loadReports(selectedProjectId!);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!selectedReport) return;
    if (!confirm('Issue this monthly report to the client/consultant?')) return;
    setActionLoading(true);
    try {
      await reportsApi.monthly.issue(selectedReport.id);
      await loadReports(selectedProjectId!);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isDraft = selectedReport?.status === 0;
  const financialProgress = selectedReport && selectedReport.originalContractSum > 0
    ? Math.round((selectedReport.grossValuationToDate / selectedReport.originalContractSum) * 1000) / 10
    : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto' }}>
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
            Rolls up progress, cost-to-date, safety stats, and this month&apos;s issued weekly reports.
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
              href={`/dashboard/reports/monthly/${selectedReport.id}/print`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={16} /> Export Consultant PDF
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
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No monthly reports yet. Click &quot;Generate Report&quot; to build one.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map(r => (
                <div
                  key={r.id}
                  onClick={() => selectReport(r.id)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: selectedReport?.id === r.id ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-surface)',
                    border: selectedReport?.id === r.id ? '1px solid #3b82f6' : '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{MONTH_NAMES[r.reportMonth - 1]} {r.reportYear}</div>
                  <span className={`badge ${STATUS_INFO[r.status]?.badge}`} style={{ marginTop: 4 }}>
                    {STATUS_INFO[r.status]?.label}
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
                  MONTHLY PROGRESS REPORT — {MONTH_NAMES[selectedReport.reportMonth - 1].toUpperCase()} {selectedReport.reportYear}
                </div>
                <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 600, marginTop: 4 }}>
                  {selectedReport.project?.name}
                </div>
                {selectedReport.latestCertificateNumber && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Certificate {selectedReport.latestCertificateNumber} Valuation Reflected
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${STATUS_INFO[selectedReport.status]?.badge}`}>{STATUS_INFO[selectedReport.status]?.label}</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                  {isDraft && (
                    <>
                      <button className="btn btn-sm btn-secondary" disabled={actionLoading} onClick={handleSaveNarrative} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Save size={13} /> Save
                      </button>
                      <button className="btn btn-sm btn-primary" disabled={actionLoading} onClick={handleApprove} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={13} /> Approve
                      </button>
                    </>
                  )}
                  {selectedReport.status === 1 && (
                    <button className="btn btn-sm btn-primary" disabled={actionLoading} onClick={handleIssue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Send size={13} /> Issue to Client
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Commercial & Physical Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
              <div style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Original Contract Sum</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                  ${Number(selectedReport.originalContractSum).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Approved BOQ Baseline</div>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gross Valuation to Date</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>
                  ${Number(selectedReport.grossValuationToDate).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 2 }}>{financialProgress}% Financial Progress</div>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Net Certified Payable {selectedReport.latestCertificateNumber ? `(${selectedReport.latestCertificateNumber})` : ''}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                  ${Number(selectedReport.netCertifiedPayable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Section Breakdown */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12 }}>
                1. Trade Section Progress Breakdown
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Section</th>
                      <th style={{ padding: '8px 10px' }}>Trade Description</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>BOQ Budget</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Valued to Date</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>% Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReport.sectionBreakdown || []).map((s: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 600, color: '#3b82f6' }}>Sec {s.sectionCode}</td>
                        <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{s.sectionName}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>${Number(s.budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#10b981' }}>${Number(s.valuedToDate).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{s.percentComplete}%</td>
                      </tr>
                    ))}
                    {(!selectedReport.sectionBreakdown || selectedReport.sectionBreakdown.length === 0) && (
                      <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)' }}>No section-level data available — either no Bill of Quantities exists for this project yet, or the latest certificate has no measured line items.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Narrative */}
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, marginBottom: 12 }}>
                2. Progress Narrative &amp; Safety Summary
              </h3>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Safety this month: {selectedReport.safetyIncidentsCount} incidents, {selectedReport.nearMissesCount} near misses (rolled up from issued weekly reports).
              </div>
              {isDraft ? (
                <textarea
                  className="form-input"
                  rows={8}
                  value={narrative}
                  onChange={e => setNarrative(e.target.value)}
                  style={{ width: '100%', fontSize: 13.5, lineHeight: 1.6 }}
                />
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selectedReport.narrative}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <FileText size={40} style={{ color: 'var(--text-secondary)', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No Monthly Report Selected</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>Click &quot;Generate Report&quot; to roll up this month&apos;s progress and issued weekly reports.</p>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <Modal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Monthly Report">
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Rolls up cost/progress from the latest Payment Certificate and safety stats + narrative from this month&apos;s issued weekly reports.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Month</label>
              <select className="form-select" value={genForm.month} onChange={e => setGenForm({ ...genForm, month: Number(e.target.value) })}>
                {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Year</label>
              <input type="number" className="form-input" required value={genForm.year} onChange={e => setGenForm({ ...genForm, year: Number(e.target.value) || now.getFullYear() })} />
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

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { certificatesApi, projectsApi, boqApi } from '@/lib/api';
import {
  FileText, Building2, Plus, CheckCircle2, AlertCircle,
  DollarSign, Calculator, ChevronRight, FileCheck, Layers, Printer
} from 'lucide-react';
import Modal from '@/components/Modal';
import { useDictionary } from '@/lib/DictionaryContext';

export default function CertificatesPage() {
  const searchParams = useSearchParams();
  const { formatMoney, currencySymbol } = useDictionary();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate Certificate Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [certForm, setCertForm] = useState({
    periodStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEndDate: new Date().toISOString().split('T')[0],
    retentionPercentage: 5.0
  });

  // Query Certificate Modal
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryNotes, setQueryNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    projectsApi.getProjects()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setProjects(list);
        const paramId = Number(searchParams.get('project'));
        if (paramId && list.some((p: any) => p.id === paramId)) setSelectedProjectId(paramId);
        else if (list.length > 0) setSelectedProjectId(list[0].id);
      })
      .catch(() => setError('Failed to load projects.'));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    loadCertificates(selectedProjectId);
  }, [selectedProjectId]);

  const loadCertificates = async (projId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await certificatesApi.getByProject(projId);
      setCertificates(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        loadCertDetails(data[0].id);
      } else {
        setSelectedCert(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load Interim Payment Certificates.');
    } finally {
      setLoading(false);
    }
  };

  const loadCertDetails = async (id: number) => {
    try {
      const detail = await certificatesApi.getById(id);
      setSelectedCert(detail);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      const created = await certificatesApi.create({
        projectId: selectedProjectId,
        periodStartDate: certForm.periodStartDate,
        periodEndDate: certForm.periodEndDate,
        retentionPercentage: certForm.retentionPercentage
      });
      setShowGenerateModal(false);
      loadCertificates(selectedProjectId);
      loadCertDetails(created.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateItemMeasurement = async (itemId: number, currentQty: number) => {
    if (!selectedCert) return;
    try {
      await certificatesApi.updateMeasurements(selectedCert.id, [
        { certificateItemId: itemId, currentQuantity: currentQty }
      ]);
      loadCertDetails(selectedCert.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproveCert = async (id: number) => {
    if (!confirm('Are you sure you want to approve this Interim Payment Certificate?')) return;
    try {
      await certificatesApi.approve(id);
      loadCertDetails(id);
      if (selectedProjectId) loadCertificates(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitCert = async (id: number) => {
    setActionLoading(true);
    try {
      await certificatesApi.submitToConsultant(id);
      loadCertDetails(id);
      if (selectedProjectId) loadCertificates(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQueryCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCert) return;
    setActionLoading(true);
    try {
      await certificatesApi.query(selectedCert.id, queryNotes);
      setShowQueryModal(false);
      setQueryNotes('');
      loadCertDetails(selectedCert.id);
      if (selectedProjectId) loadCertificates(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueCert = async (id: number) => {
    if (!confirm('Issue this certificate to the client/consultant for payment?')) return;
    setActionLoading(true);
    try {
      await certificatesApi.issue(id);
      loadCertDetails(id);
      if (selectedProjectId) loadCertificates(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaidCert = async (id: number) => {
    if (!confirm('Mark this certificate as paid?')) return;
    setActionLoading(true);
    try {
      await certificatesApi.markPaid(id);
      loadCertDetails(id);
      if (selectedProjectId) loadCertificates(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const CERT_STATUS: Record<number, { label: string; badge: string }> = {
    0: { label: 'Draft', badge: 'badge-muted' },
    1: { label: 'Submitted', badge: 'badge-blue' },
    2: { label: 'Queried', badge: 'badge-amber' },
    3: { label: 'Approved', badge: 'badge-green' },
    4: { label: 'Issued', badge: 'badge-teal' },
    5: { label: 'Paid', badge: 'badge-violet' },
  };
  const statusInfo = (status: number) => CERT_STATUS[status] || CERT_STATUS[0];

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={28} style={{ color: '#10b981' }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Interim Payment Certificates (IPC)
            </h1>
          </div>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Quantity Surveying valuation against Bill of Quantities (BOQ). Calculates cumulative work completed, retention deduction, and net amount payable.
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
            onClick={() => setShowGenerateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <Plus size={14} /> Generate New Certificate
          </button>
        </div>
      </div>

      {/* Main Grid: Left side Certificate list, Right side Certificate Line-Item Valuations */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Certificate List sidebar */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Issued Certificates
          </h3>

          {certificates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {certificates.map(c => (
                <div 
                  key={c.id}
                  onClick={() => loadCertDetails(c.id)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                    background: selectedCert?.id === c.id ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface)',
                    border: selectedCert?.id === c.id ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.certificateNumber}</span>
                    <span className={`badge ${statusInfo(c.status).badge}`}>
                      {statusInfo(c.status).label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Period ending {new Date(c.periodEndDate).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', marginTop: 6 }}>
                    Net: {formatMoney(c.netAmountDue)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No payment certificates issued yet.
            </div>
          )}
        </div>

        {/* Certificate Line-Item Valuations Detail */}
        {selectedCert ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Financial Summary Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gross Valuation to Date</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  {formatMoney(selectedCert.grossValuationToDate)}
                </div>
              </div>
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Retention ({selectedCert.retentionPercentage}%)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
                  -{formatMoney(selectedCert.retentionDeductionToDate)}
                </div>
              </div>
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Previous Certified Paid</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-muted)', marginTop: 4 }}>
                  -{formatMoney(selectedCert.previousCertificatesPaid)}
                </div>
              </div>
              <div className="card" style={{ padding: 14, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: 11, color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Net Amount Due This Period</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                  {formatMoney(selectedCert.netAmountDue)}
                </div>
              </div>
            </div>

            {/* Line Items Measurement Sheet */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    Measured Work Valuation — {selectedCert.certificateNumber}
                  </h3>
                  <span className={`badge ${statusInfo(selectedCert.status).badge}`} style={{ marginTop: 6 }}>
                    {statusInfo(selectedCert.status).label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href={`/dashboard/certificates/${selectedCert.id}/print`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                  >
                    <Printer size={14} /> Print / Export PDF
                  </a>
                  {selectedCert.status === 0 && (
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={actionLoading}
                      onClick={() => handleSubmitCert(selectedCert.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      <FileCheck size={14} /> Submit to Consultant
                    </button>
                  )}
                  {selectedCert.status === 1 && (
                    <>
                      <button
                        className="btn btn-sm btn-secondary"
                        disabled={actionLoading}
                        onClick={() => setShowQueryModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                      >
                        <AlertCircle size={14} /> Query
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={actionLoading}
                        onClick={() => handleApproveCert(selectedCert.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                      >
                        <CheckCircle2 size={14} /> Approve & Sign Certificate
                      </button>
                    </>
                  )}
                  {selectedCert.status === 2 && (
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={actionLoading}
                      onClick={() => handleSubmitCert(selectedCert.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      <FileCheck size={14} /> Resubmit to Consultant
                    </button>
                  )}
                  {selectedCert.status === 3 && (
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={actionLoading}
                      onClick={() => handleIssueCert(selectedCert.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      <FileCheck size={14} /> Issue Certificate
                    </button>
                  )}
                  {selectedCert.status === 4 && (
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={actionLoading}
                      onClick={() => handleMarkPaidCert(selectedCert.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      <DollarSign size={14} /> Mark as Paid
                    </button>
                  )}
                </div>
              </div>

              {selectedCert.status === 2 && selectedCert.consultantNotes && (
                <div style={{ padding: '12px 20px', background: 'rgba(245, 158, 11, 0.08)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Consultant Query</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4 }}>{selectedCert.consultantNotes}</div>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 14px', width: '70px' }}>Item #</th>
                      <th style={{ padding: '10px 14px' }}>Description of Work</th>
                      <th style={{ padding: '10px 14px', width: '70px' }}>Unit</th>
                      <th style={{ padding: '10px 14px', width: '90px', textAlign: 'right' }}>BOQ Qty</th>
                      <th style={{ padding: '10px 14px', width: '100px', textAlign: 'right' }}>Rate ({currencySymbol})</th>
                      <th style={{ padding: '10px 14px', width: '120px', textAlign: 'right' }}>This Period Qty</th>
                      <th style={{ padding: '10px 14px', width: '120px', textAlign: 'right' }}>Cumulative Value</th>
                      <th style={{ padding: '10px 14px', width: '80px', textAlign: 'center' }}>% Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedCert.items || selectedCert.Items || []).map((item: any) => {
                      const boqItem = item.boqItem || item.BoqItem;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#3b82f6' }}>{boqItem?.itemNumber}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{boqItem?.description}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{boqItem?.unitOfMeasure}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>{Number(boqItem?.quantity || 0).toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>{formatMoney(boqItem?.rate)}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                            <input 
                              type="number"
                              step="any"
                              disabled={selectedCert.status !== 0 && selectedCert.status !== 2}
                              defaultValue={item.currentQuantityCompleted}
                              onBlur={(e) => handleUpdateItemMeasurement(item.id, parseFloat(e.target.value) || 0)}
                              style={{ 
                                width: '80px', padding: '4px 6px', textAlign: 'right', 
                                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', 
                                borderRadius: 4, color: 'var(--text-primary)', fontWeight: 600 
                              }}
                            />
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formatMoney(item.cumulativeValueCompleted)}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                              background: item.percentageComplete >= 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                              color: item.percentageComplete >= 100 ? '#10b981' : '#3b82f6'
                            }}>
                              {Math.round(item.percentageComplete || 0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approved Variations Included */}
            {(selectedCert.variations || selectedCert.Variations || []).length > 0 && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Approved Variations Included</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px 14px', width: '90px' }}>VO #</th>
                        <th style={{ padding: '10px 14px' }}>Title</th>
                        <th style={{ padding: '10px 14px', width: '140px', textAlign: 'right' }}>Valued Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCert.variations || selectedCert.Variations || []).map((cv: any) => {
                        const variation = cv.variation || cv.Variation;
                        return (
                          <tr key={cv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#3b82f6' }}>{variation?.variationNumber}</td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{variation?.title}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {formatMoney(cv.valuedAmount || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <Calculator size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>No Certificate Selected</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
              Select an issued certificate from the left or click "Generate New Certificate" to measure this month's progress.
            </p>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <Modal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Interim Payment Certificate">
        <form onSubmit={handleGenerateCertificate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            This will create a new Certificate pre-populated with all items from the project's Bill of Quantities.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Period Start Date</label>
              <input 
                type="date" className="form-input" required 
                value={certForm.periodStartDate} 
                onChange={e => setCertForm({ ...certForm, periodStartDate: e.target.value })} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Period End Date</label>
              <input 
                type="date" className="form-input" required 
                value={certForm.periodEndDate} 
                onChange={e => setCertForm({ ...certForm, periodEndDate: e.target.value })} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Retention Percentage (%)</label>
            <input 
              type="number" step="0.5" className="form-input" required 
              value={certForm.retentionPercentage} 
              onChange={e => setCertForm({ ...certForm, retentionPercentage: parseFloat(e.target.value) || 5 })} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Certificate</button>
          </div>
        </form>
      </Modal>

      {/* Query Modal */}
      <Modal open={showQueryModal} onClose={() => setShowQueryModal(false)} title="Query Certificate">
        <form onSubmit={handleQueryCert} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Send this certificate back to the contractor with a note explaining what needs to be addressed.
          </p>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Query Notes</label>
            <textarea
              className="form-input"
              required
              rows={4}
              value={queryNotes}
              onChange={e => setQueryNotes(e.target.value)}
              placeholder="e.g. Quantities for Item 4.2 exceed the site diary record for this period"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowQueryModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>Send Query</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

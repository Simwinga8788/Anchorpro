'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { boqApi, projectsApi } from '@/lib/api';
import {
  Building2, Plus, Upload, Trash2, Edit2, CheckCircle2,
  FileSpreadsheet, AlertCircle, Save, X, ChevronRight, Layers, DollarSign, Loader2,
  Lock, GitBranch, History
} from 'lucide-react';
import Modal from '@/components/Modal';
import { useDictionary } from '@/lib/DictionaryContext';

interface BoqItem {
  id: number;
  itemNumber: string;
  description: string;
  unitOfMeasure: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  notes?: string;
}

interface BoqSection {
  id: number;
  sectionCode: string;
  sectionName: string;
  subtotal: number;
  items: BoqItem[];
}

interface BOQ {
  id: number;
  projectId: number;
  title: string;
  versionNumber: number;
  status: number;
  totalContractSum: number;
  sections: BoqSection[];
}

export default function BoqPage() {
  const { formatMoney, currencySymbol } = useDictionary();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [boq, setBoq] = useState<BOQ | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionCode, setNewSectionCode] = useState('');
  const [newSectionName, setNewSectionName] = useState('');

  const [showAddItem, setShowAddItem] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<BoqItem | null>(null);
  const [itemForm, setItemForm] = useState({
    itemNumber: '',
    description: '',
    unitOfMeasure: 'm3',
    quantity: 0,
    rate: 0
  });

  const [showImportCsv, setShowImportCsv] = useState(false);
  const [csvContent, setCsvContent] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    projectsApi.getProjects()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setProjects(list);
        const paramId = Number(searchParams.get('project'));
        if (paramId && list.some((p: any) => p.id === paramId)) {
          setSelectedProjectId(paramId);
        } else if (list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      })
      .catch(() => setError('Failed to load projects.'));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    loadBoq(selectedProjectId);
  }, [selectedProjectId]);

  const loadBoq = async (projId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await boqApi.getByProject(projId);
      setBoq(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Bill of Quantities.');
    } finally {
      setLoading(false);
    }
  };

  const BOQ_STATUS: Record<number, { label: string; badge: string }> = {
    0: { label: 'Draft', badge: 'badge-muted' },
    1: { label: 'Under Review', badge: 'badge-blue' },
    2: { label: 'Approved', badge: 'badge-green' },
    3: { label: 'Revised', badge: 'badge-violet' },
  };
  const statusInfo = (status: number) => BOQ_STATUS[status] || BOQ_STATUS[0];
  const isLocked = !!boq && (boq.status === 2 || boq.status === 3);

  const handleApproveBoq = async () => {
    if (!boq) return;
    if (!confirm('Approve this Bill of Quantities? Once approved, line items can only change through a new revision.')) return;
    setActionLoading(true);
    try {
      await boqApi.approve(boq.id);
      if (selectedProjectId) loadBoq(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviseBoq = async () => {
    if (!boq) return;
    if (!confirm('Start a new revision? The current approved version will be kept as read-only history, and a new editable draft (version ' + (boq.versionNumber + 1) + ') will be created from it.')) return;
    setActionLoading(true);
    try {
      await boqApi.revise(boq.id);
      if (selectedProjectId) loadBoq(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openHistory = async () => {
    if (!selectedProjectId) return;
    setShowHistory(true);
    try {
      const data = await boqApi.getHistory(selectedProjectId);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boq) return;
    try {
      await boqApi.addSection(boq.id, { sectionCode: newSectionCode, sectionName: newSectionName });
      setShowAddSection(false);
      setNewSectionCode('');
      setNewSectionName('');
      loadBoq(boq.projectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openAddItem = (secId: number) => {
    setTargetSectionId(secId);
    setEditingItem(null);
    const sec = boq?.sections.find(s => s.id === secId);
    const nextIdx = (sec?.items.length || 0) + 1;
    setItemForm({
      itemNumber: `${sec?.sectionCode || 'A'}.${nextIdx}`,
      description: '',
      unitOfMeasure: 'm3',
      quantity: 0,
      rate: 0
    });
    setShowAddItem(true);
  };

  const openEditItem = (item: BoqItem) => {
    setEditingItem(item);
    setItemForm({
      itemNumber: item.itemNumber,
      description: item.description,
      unitOfMeasure: item.unitOfMeasure,
      quantity: item.quantity,
      rate: item.rate
    });
    setShowAddItem(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await boqApi.updateItem(editingItem.id, itemForm);
      } else if (targetSectionId) {
        await boqApi.addItem(targetSectionId, itemForm);
      }
      setShowAddItem(false);
      if (selectedProjectId) loadBoq(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this line item?')) return;
    try {
      await boqApi.deleteItem(itemId);
      if (selectedProjectId) loadBoq(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boq || !csvContent.trim()) return;
    try {
      await boqApi.importCsv(boq.id, csvContent);
      setShowImportCsv(false);
      setCsvContent('');
      loadBoq(boq.projectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet size={24} style={{ color: 'var(--accent-blue)' }} />
            <h1 className="topbar-title" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              Bill of Quantities (Agreed BOQ)
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Contractual measured work line items, trade rates, and project financial valuation baseline.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {projects.length > 0 && (
            <select
              className="form-select"
              style={{ width: 240 }}
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <button
            className="btn btn-secondary"
            onClick={openHistory}
            style={{ gap: 6 }}
          >
            <History size={14} /> Version History
          </button>

          {!isLocked && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowImportCsv(true)}
                style={{ gap: 6 }}
              >
                <Upload size={14} /> Import Excel / CSV
              </button>

              <button
                className="btn btn-primary"
                onClick={() => setShowAddSection(true)}
                style={{ gap: 6 }}
              >
                <Plus size={14} /> Add Trade Section
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contract Sum Banner */}
      {boq && (
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 20 
        }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Total Contract Sum (Agreed BOQ)
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 4, fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
              {formatMoney(boq.totalContractSum || 0)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--accent-emerald)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={13} /> {boq.sections?.length || 0} Trade Sections Priced
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                  BOQ Status & Version
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Version {boq.versionNumber}.0</span>
                  <span className={`badge ${statusInfo(boq.status).badge}`}>{statusInfo(boq.status).label}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {isLocked
                    ? 'Locked — line items are immutable. Start a revision to make changes.'
                    : 'Editable — approve once the contract sum is agreed.'}
                </div>
              </div>

              {boq.status === 2 ? (
                <button className="btn btn-sm btn-secondary" disabled={actionLoading} onClick={handleReviseBoq} style={{ gap: 6, whiteSpace: 'nowrap' }}>
                  <GitBranch size={13} /> Start Revision
                </button>
              ) : boq.status !== 3 ? (
                <button className="btn btn-sm btn-primary" disabled={actionLoading} onClick={handleApproveBoq} style={{ gap: 6, whiteSpace: 'nowrap' }}>
                  <CheckCircle2 size={13} /> Approve BOQ
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
          Loading Bill of Quantities...
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Sections and Item Breakdown */}
      {boq && boq.sections && boq.sections.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {boq.sections.map((sec) => (
            <div key={sec.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Section Header */}
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '12px 18px', background: 'var(--bg-elevated)', 
                borderBottom: '1px solid var(--border-subtle)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ 
                    background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', 
                    padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontSize: 12 
                  }}>
                    Section {sec.sectionCode}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {sec.sectionName}
                  </h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Section Subtotal: </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
                      {formatMoney(sec.subtotal || 0)}
                    </span>
                  </div>
                  {!isLocked && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => openAddItem(sec.id)}
                      style={{ gap: 4, fontSize: 12 }}
                    >
                      <Plus size={13} /> Add Item
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '9px 16px', width: '80px', fontWeight: 600 }}>Item #</th>
                      <th style={{ padding: '9px 16px', fontWeight: 600 }}>Description of Work</th>
                      <th style={{ padding: '9px 16px', width: '90px', fontWeight: 600 }}>Unit</th>
                      <th style={{ padding: '9px 16px', width: '110px', textAlign: 'right', fontWeight: 600 }}>Quantity</th>
                      <th style={{ padding: '9px 16px', width: '130px', textAlign: 'right', fontWeight: 600 }}>Rate ({currencySymbol})</th>
                      <th style={{ padding: '9px 16px', width: '140px', textAlign: 'right', fontWeight: 600 }}>Total Amount ({currencySymbol})</th>
                      <th style={{ padding: '9px 16px', width: '90px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sec.items || []).map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--accent-blue)' }}>{item.itemNumber}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-primary)' }}>{item.description}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{item.unitOfMeasure}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500 }}>{Number(item.quantity).toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatMoney(item.rate)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
                          {formatMoney(item.totalAmount)}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          {isLocked ? (
                            <Lock size={13} style={{ color: 'var(--text-secondary)' }} />
                          ) : (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button
                                onClick={() => openEditItem(item)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
                                title="Edit Item"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: 4 }}
                                title="Delete Item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!sec.items || sec.items.length === 0) && (
                      <tr>
                        <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No items in this section yet. Click &quot;+ Add Item&quot; to add work items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FileSpreadsheet size={40} style={{ color: 'var(--accent-blue)', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No Bill of Quantities Found</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13.5 }}>Click &quot;Add Trade Section&quot; to start measuring your project works.</p>
            <button className="btn btn-primary" onClick={() => setShowAddSection(true)}>
              <Plus size={14} /> Add First Trade Section
            </button>
          </div>
        )
      )}

      {/* Add Section Modal */}
      <Modal open={showAddSection} onClose={() => setShowAddSection(false)} title="Add Trade Section">
        <form onSubmit={handleAddSection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Section Code *</label>
            <input 
              className="form-input" 
              placeholder="e.g. C, SEC-3" 
              value={newSectionCode} 
              onChange={e => setNewSectionCode(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Section Name / Trade *</label>
            <input 
              className="form-input" 
              placeholder="e.g. Concrete, Formwork & Reinforcement" 
              value={newSectionName} 
              onChange={e => setNewSectionName(e.target.value)} 
              required 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddSection(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Section</button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Item Modal */}
      <Modal open={showAddItem} onClose={() => setShowAddItem(false)} title={editingItem ? 'Edit BOQ Line Item' : 'Add BOQ Line Item'}>
        <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Item # *</label>
              <input 
                className="form-input" 
                placeholder="e.g. C.1" 
                value={itemForm.itemNumber} 
                onChange={e => setItemForm({ ...itemForm, itemNumber: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Unit of Measure *</label>
              <select 
                className="form-select"
                value={itemForm.unitOfMeasure}
                onChange={e => setItemForm({ ...itemForm, unitOfMeasure: e.target.value })}
              >
                <option value="m3">m³ (Cubic Metre)</option>
                <option value="m2">m² (Square Metre)</option>
                <option value="m">m (Linear Metre)</option>
                <option value="ton">ton (Metric Tonne)</option>
                <option value="kg">kg (Kilogram)</option>
                <option value="nr">nr (Number / Each)</option>
                <option value="sum">sum (Lump Sum / Item)</option>
                <option value="hrs">hrs (Hours)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description of Work *</label>
            <textarea 
              className="form-input" 
              rows={3} 
              placeholder="e.g. 25MPa Reinforced concrete cast in foundation footings" 
              value={itemForm.description} 
              onChange={e => setItemForm({ ...itemForm, description: e.target.value })} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Quantity *</label>
              <input 
                className="form-input" 
                type="number" 
                step="any"
                value={itemForm.quantity || ''} 
                onChange={e => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })} 
                required 
              />
            </div>
            <div>
              <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Unit Rate ({currencySymbol}) *</label>
              <input 
                className="form-input" 
                type="number" 
                step="any"
                value={itemForm.rate || ''} 
                onChange={e => setItemForm({ ...itemForm, rate: parseFloat(e.target.value) || 0 })} 
                required 
              />
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Calculated Total Amount:</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
              {formatMoney((itemForm.quantity || 0) * (itemForm.rate || 0))}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddItem(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Line Item</button>
          </div>
        </form>
      </Modal>

      {/* Import CSV Modal */}
      <Modal open={showImportCsv} onClose={() => setShowImportCsv(false)} title="Import Takeoff (CSV / Excel)">
        <form onSubmit={handleImportCsv} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Paste CSV rows in the format: <br />
            <code>SectionCode, SectionName, ItemNumber, Description, Unit, Quantity, Rate</code>
          </p>
          <textarea 
            className="form-input" 
            rows={8} 
            placeholder="A, Preliminaries, A.1, Site Establishment, sum, 1, 15000&#10;B, Earthworks, B.1, Bulk Excavation, m3, 450, 22.50" 
            value={csvContent} 
            onChange={e => setCsvContent(e.target.value)} 
            required 
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowImportCsv(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Import Items</button>
          </div>
        </form>
      </Modal>

      {/* Version History Modal */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="BOQ Version History">
        {history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((v) => (
              <div
                key={v.id}
                style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: v.id === boq?.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)',
                  border: v.id === boq?.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                    Version {v.versionNumber}.0 <span className={`badge ${statusInfo(v.status).badge}`} style={{ marginLeft: 6 }}>{statusInfo(v.status).label}</span>
                  </div>
                  {v.approvedAt && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Approved {new Date(v.approvedAt).toLocaleDateString()}{v.approvedByName ? ` by ${v.approvedByName}` : ''}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {formatMoney(v.totalContractSum || 0)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No version history yet.</p>
        )}
      </Modal>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { boqApi, projectsApi } from '@/lib/api';
import { 
  Building2, Plus, Upload, Trash2, Edit2, CheckCircle2, 
  FileSpreadsheet, AlertCircle, Save, X, ChevronRight, Layers, DollarSign
} from 'lucide-react';
import Modal from '@/components/Modal';

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

  useEffect(() => {
    projectsApi.getProjects()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      })
      .catch(err => setError('Failed to load projects.'));
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

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await boqApi.updateItem(editingItem.id, itemForm);
      } else if (targetSectionId) {
        await boqApi.addItem(targetSectionId, itemForm);
      }
      setShowAddItem(false);
      setEditingItem(null);
      if (selectedProjectId) loadBoq(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this BOQ item?')) return;
    try {
      await boqApi.deleteItem(id);
      if (selectedProjectId) loadBoq(selectedProjectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boq) return;
    try {
      await boqApi.importCsv(boq.id, csvContent);
      setShowImportCsv(false);
      setCsvContent('');
      loadBoq(boq.projectId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openAddItem = (secId: number) => {
    setTargetSectionId(secId);
    setEditingItem(null);
    setItemForm({ itemNumber: '', description: '', unitOfMeasure: 'm3', quantity: 0, rate: 0 });
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

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet size={28} style={{ color: 'var(--accent-blue, #3b82f6)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Bill of Quantities (BOQ)
            </h1>
          </div>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Quantity Surveying & Contract pricing baseline. Structured into trade sections for interim payment valuation.
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
            className="btn btn-secondary"
            onClick={() => setShowImportCsv(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <Upload size={14} /> Import Excel / CSV
          </button>

          <button 
            className="btn btn-primary"
            onClick={() => setShowAddSection(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <Plus size={14} /> Add Trade Section
          </button>
        </div>
      </div>

      {/* Contract Sum Banner */}
      {boq && (
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 
        }}>
          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Contract Sum (Agreed BOQ)
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
              ${Number(boq.totalContractSum || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 12, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={13} /> {boq.sections?.length || 0} Trade Sections Priced
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              BOQ Status & Version
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>
              Version {boq.versionNumber}.0 — <span style={{ color: '#10b981' }}>Active Contract Baseline</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Ready for Monthly Interim Payment Certification
            </div>
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading Bill of Quantities...
        </div>
      )}

      {error && (
        <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#ef4444', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Sections and Item Breakdown */}
      {boq && boq.sections && boq.sections.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {boq.sections.map((sec) => (
            <div key={sec.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Section Header */}
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '14px 20px', background: 'var(--bg-surface, #1e293b)', 
                borderBottom: '1px solid var(--border-subtle)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ 
                    background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', 
                    padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontSize: 13 
                  }}>
                    Section {sec.sectionCode}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {sec.sectionName}
                  </h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Section Subtotal: </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      ${Number(sec.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => openAddItem(sec.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                  >
                    <Plus size={13} /> Add Item
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 16px', width: '80px' }}>Item #</th>
                      <th style={{ padding: '10px 16px' }}>Description of Work</th>
                      <th style={{ padding: '10px 16px', width: '90px' }}>Unit</th>
                      <th style={{ padding: '10px 16px', width: '110px', textAlign: 'right' }}>Quantity</th>
                      <th style={{ padding: '10px 16px', width: '130px', textAlign: 'right' }}>Rate ($)</th>
                      <th style={{ padding: '10px 16px', width: '140px', textAlign: 'right' }}>Total Amount ($)</th>
                      <th style={{ padding: '10px 16px', width: '90px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sec.items || []).map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: '#3b82f6' }}>{item.itemNumber}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-primary)' }}>{item.description}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{item.unitOfMeasure}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500 }}>{Number(item.quantity).toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>${Number(item.rate).toFixed(2)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                          ${Number(item.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button 
                              onClick={() => openEditItem(item)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                              title="Edit Item"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                              title="Delete Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!sec.items || sec.items.length === 0) && (
                      <tr>
                        <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No items in this section yet. Click "+ Add Item" to add work items.
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
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <FileSpreadsheet size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>No Trade Sections Found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 6, maxWidth: 500, margin: '6px auto 20px' }}>
              Start building your Bill of Quantities by creating your first trade section or importing an existing Excel takeoff spreadsheet.
            </p>
            <button className="btn btn-primary" onClick={() => setShowAddSection(true)}>
              <Plus size={16} /> Create First Section
            </button>
          </div>
        )
      )}

      {/* Add Section Modal */}
      <Modal open={showAddSection} onClose={() => setShowAddSection(false)} title="Add Trade Section">
        <form onSubmit={handleAddSection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Section Code (e.g. A, B, Sec-1)</label>
            <input 
              type="text" 
              className="input-field" 
              value={newSectionCode} 
              onChange={e => setNewSectionCode(e.target.value)} 
              placeholder="e.g. C" 
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Section Name / Trade</label>
            <input 
              type="text" 
              className="input-field" 
              value={newSectionName} 
              onChange={e => setNewSectionName(e.target.value)} 
              placeholder="e.g. Concrete, Formwork & Reinforcement" 
              required 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddSection(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Section</button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal open={showAddItem} onClose={() => setShowAddItem(false)} title={editingItem ? "Edit BOQ Item" : "Add BOQ Line Item"}>
        <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Item #</label>
              <input 
                type="text" 
                className="input-field" 
                value={itemForm.itemNumber} 
                onChange={e => setItemForm({ ...itemForm, itemNumber: e.target.value })} 
                placeholder="e.g. 1.1" 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Unit of Measure</label>
              <select 
                className="input-field"
                value={itemForm.unitOfMeasure}
                onChange={e => setItemForm({ ...itemForm, unitOfMeasure: e.target.value })}
              >
                <option value="m3">m3 (Cubic Metres)</option>
                <option value="m2">m2 (Square Metres)</option>
                <option value="m">m (Linear Metres)</option>
                <option value="ton">ton (Metric Tonnes)</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="nr">nr (Number / Quantity)</option>
                <option value="sum">sum (Lump Sum)</option>
                <option value="item">item (Single Item)</option>
                <option value="hrs">hrs (Hours)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description of Work</label>
            <textarea 
              className="input-field" 
              rows={3}
              value={itemForm.description} 
              onChange={e => setItemForm({ ...itemForm, description: e.target.value })} 
              placeholder="e.g. Supply and place 30MPa readymix concrete in ground floor slab..." 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Quantity</label>
              <input 
                type="number" 
                step="any"
                className="input-field" 
                value={itemForm.quantity} 
                onChange={e => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })} 
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Unit Rate ($)</label>
              <input 
                type="number" 
                step="any"
                className="input-field" 
                value={itemForm.rate} 
                onChange={e => setItemForm({ ...itemForm, rate: parseFloat(e.target.value) || 0 })} 
                required 
              />
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Calculated Item Total:</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#3b82f6' }}>
              ${((itemForm.quantity || 0) * (itemForm.rate || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddItem(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingItem ? "Save Changes" : "Add Item"}</button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal open={showImportCsv} onClose={() => setShowImportCsv(false)} title="Import BOQ from Spreadsheet / CSV">
        <form onSubmit={handleImportCsv} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Paste comma-separated CSV rows exported from Excel. Format required: <br/>
            <code>SectionCode, SectionName, ItemNumber, Description, Unit, Quantity, Rate</code>
          </p>
          <textarea
            className="input-field"
            rows={8}
            value={csvContent}
            onChange={e => setCsvContent(e.target.value)}
            placeholder={`SectionCode,SectionName,ItemNumber,Description,Unit,Quantity,Rate
A,Preliminaries,A.1,Contractor Site Establishment,sum,1,15000
B,Earthworks,B.1,Bulk excavation to reduced level,m3,450,22.50
B,Earthworks,B.2,Compacted gravel fill under slab,m3,120,45.00`}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowImportCsv(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Import BOQ</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

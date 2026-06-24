'use client';

import { Plus, Search, FileText, MoreHorizontal, Zap, Truck, Trash2, X, PackageCheck, ChevronDown, ChevronUp, ClipboardList, Check, Ban, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardApi, procurementApi, departmentsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import SlideOver from '@/components/SlideOver';
import ResponsiveTable from '@/components/ResponsiveTable';

const typeConfig: Record<number, { label: string; badge: string; color: string }> = {
  0: { label: 'Inventory Replenishment', badge: 'badge-blue',   color: 'var(--accent-blue)' },
  1: { label: 'Direct Purchase',         badge: 'badge-amber',  color: 'var(--accent-amber)' },
  2: { label: 'External Service',        badge: 'badge-violet', color: 'var(--accent-violet)' },
};

const statusConfig: Record<number, { label: string; badge: string }> = {
  0: { label: 'Draft',              badge: 'badge-muted' },
  1: { label: 'Submitted',          badge: 'badge-blue' },
  2: { label: 'Pending Approval',   badge: 'badge-amber' },
  3: { label: 'Approved',           badge: 'badge-green' },
  4: { label: 'Partly Received',    badge: 'badge-violet' },
  5: { label: 'Received',           badge: 'badge-green' },
  6: { label: 'Rejected',           badge: 'badge-rose' },
  7: { label: 'Cancelled',          badge: 'badge-muted' },
};

const prStatusConfig: Record<number, { label: string; badge: string }> = {
  0: { label: 'Draft',              badge: 'badge-muted' },
  1: { label: 'Pending Approval',   badge: 'badge-amber' },
  2: { label: 'Approved',           badge: 'badge-green' },
  3: { label: 'Rejected',           badge: 'badge-rose' },
  4: { label: 'Converted to PO',    badge: 'badge-blue' },
  5: { label: 'Cancelled',          badge: 'badge-muted' },
};

const SUPPLIER_BLANK = { name: '', contactPerson: '', email: '', phone: '', address: '', supplierCode: '', notes: '' };

export default function ProcurementPage() {
  const { user } = useAuth();
  
  // User authorization checks
  const roles = user?.roles || [];
  const canApprove = roles.some((r: string) => ['Admin', 'Finance', 'PlatformOwner'].includes(r));
  const canConvert = roles.some((r: string) => ['Admin', 'Purchasing', 'PlatformOwner'].includes(r));
  const isPowerUser = roles.some((r: string) => ['Admin', 'Finance', 'Supervisor', 'PlatformOwner'].includes(r));
  const [activeTab, setActiveTab] = useState<'requisitions' | 'orders' | 'suppliers'>('requisitions');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const allowedDepartments = isPowerUser
    ? departments
    : departments.filter(d => String(d.id) === String(user?.departmentId));
  const [loading, setLoading] = useState(true);

  // PO form state
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ supplierId: '', poType: 0, jobCardId: '', notes: '', items: [{ description: '', quantityOrdered: 1, unitCost: 0 }] });

  // Supplier form state
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState(SUPPLIER_BLANK);
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Receive PO state
  const [receivePO, setReceivePO] = useState<any | null>(null);
  const [receiveItems, setReceiveItems] = useState<{ id: number; description: string; quantityOrdered: number; quantityReceived: number }[]>([]);
  const [receiving, setReceiving] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // PR form state
  const [isPrSlideOpen, setIsPrSlideOpen] = useState(false);
  const [prFormData, setPrFormData] = useState({
    type: 'operational', // 'operational' | 'departmental'
    jobCardId: '',
    departmentId: '',
    notes: '',
    submitImmediately: true,
    items: [{ description: '', quantityRequested: 1, estimatedUnitCost: 0 }]
  });
  const [expandedRequisitionId, setExpandedRequisitionId] = useState<number | null>(null);

  // Convert PR to PO state
  const [convertingRequisition, setConvertingRequisition] = useState<any | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [converting, setConverting] = useState(false);

  // Auto-default department based on current user
  useEffect(() => {
    if (user?.departmentId) {
      setPrFormData(f => ({ ...f, departmentId: String(user.departmentId) }));
    }
  }, [user]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      dashboardApi.getPurchaseOrders(),
      dashboardApi.getSuppliers(),
      dashboardApi.getJobCards(),
      procurementApi.getRequisitions(),
      departmentsApi.getAll()
    ])
      .then(([ordersData, suppliersData, jobsData, requisitionsData, departmentsData]) => {
        setOrders(ordersData || []);
        setSuppliers(suppliersData || []);
        setJobs(jobsData || []);
        setRequisitions(requisitionsData || []);
        setDepartments(departmentsData || []);
      })
      .catch(err => console.error("Failed to load data", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const prefix = formData.poType === 2 ? 'PO-SUB' : 'PO';
      await dashboardApi.createPurchaseOrder({
        poNumber: `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierId: parseInt(formData.supplierId),
        poType: formData.poType,
        jobCardId: formData.jobCardId ? parseInt(formData.jobCardId) : undefined,
        notes: formData.notes || undefined,
        items: formData.items
      });
      setIsSlideOpen(false);
      setFormData({ supplierId: '', poType: 0, jobCardId: '', notes: '', items: [{ description: '', quantityOrdered: 1, unitCost: 0 }] });
      fetchData();
    } catch (err) {
      alert("Failed to raise PO");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { description: '', quantityOrdered: 1, unitCost: 0 }] });
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    setSavingSupplier(true);
    try {
      await procurementApi.createSupplier(supplierForm);
      setSupplierForm(SUPPLIER_BLANK);
      setShowSupplierForm(false);
      fetchData();
    } catch (err: any) {
      alert('Failed to save supplier: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Remove this supplier?')) return;
    await procurementApi.deleteSupplier(id);
    fetchData();
  };

  const openReceive = (order: any) => {
    const items = (order.items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityOrdered, // default to full receipt
    }));
    setReceiveItems(items);
    setReceivePO(order);
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivePO) return;
    setReceiving(true);
    try {
      await procurementApi.receiveItems(
        receivePO.id,
        receiveItems.map(i => ({ itemId: i.id, quantity: i.quantityReceived }))
      );
      setReceivePO(null);
      fetchData();
    } catch (err: any) {
      alert('Failed to receive PO: ' + (err.message || 'Unknown error'));
    } finally {
      setReceiving(false);
    }
  };

  const handleSendForApproval = async (id: number) => {
    try {
      await procurementApi.sendForApproval(id);
      fetchData();
    } catch (err: any) {
      alert('Failed to send for approval: ' + (err.message || 'Unknown error'));
    }
  };

  // Requisition Form handlers
  const handlePrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await procurementApi.createRequisition({
        purchaseRequisition: {
          requisitionNumber: 'TEMP',
          requestedById: 'TEMP',
          jobCardId: prFormData.type === 'operational' && prFormData.jobCardId ? parseInt(prFormData.jobCardId) : null,
          departmentId: prFormData.type === 'departmental' && prFormData.departmentId ? parseInt(prFormData.departmentId) : null,
          notes: prFormData.notes || null,
        },
        items: prFormData.items.map(i => ({
          description: i.description,
          quantityRequested: i.quantityRequested,
          estimatedUnitCost: i.estimatedUnitCost
        })),
        submitImmediately: prFormData.submitImmediately
      });
      setIsPrSlideOpen(false);
      setPrFormData({
        type: 'operational',
        jobCardId: '',
        departmentId: user?.departmentId ? String(user.departmentId) : '',
        notes: '',
        submitImmediately: true,
        items: [{ description: '', quantityRequested: 1, estimatedUnitCost: 0 }]
      });
      fetchData();
    } catch (err: any) {
      alert("Failed to raise requisition: " + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePrAddItem = () => {
    setPrFormData({
      ...prFormData,
      items: [...prFormData.items, { description: '', quantityRequested: 1, estimatedUnitCost: 0 }]
    });
  };

  const handlePrRemoveItem = (idx: number) => {
    setPrFormData({
      ...prFormData,
      items: prFormData.items.filter((_, i) => i !== idx)
    });
  };

  const handleApproveRequisition = async (id: number) => {
    if (!confirm('Approve this purchase requisition?')) return;
    try {
      await procurementApi.approveRequisition(id);
      fetchData();
    } catch (err: any) {
      alert('Failed to approve: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRejectRequisition = async (id: number) => {
    const reason = prompt('Enter reason for rejection:');
    if (reason === null) return;
    try {
      await procurementApi.rejectRequisition(id, reason || 'No reason provided');
      fetchData();
    } catch (err: any) {
      alert('Failed to reject: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSubmitRequisition = async (id: number) => {
    try {
      await procurementApi.submitRequisition(id);
      fetchData();
    } catch (err: any) {
      alert('Failed to submit: ' + (err.message || 'Unknown error'));
    }
  };

  const handleConvertRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingRequisition || !selectedSupplierId) return;
    setConverting(true);
    try {
      await procurementApi.convertToPO(convertingRequisition.id, parseInt(selectedSupplierId));
      setConvertingRequisition(null);
      setSelectedSupplierId('');
      setActiveTab('orders');
      fetchData();
    } catch (err: any) {
      alert('Failed to convert: ' + (err.message || 'Unknown error'));
    } finally {
      setConverting(false);
    }
  };

  // Filters
  const filteredOrders = orders.filter(o =>
    o.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRequisitions = requisitions.filter(r =>
    r.requisitionNumber?.toLowerCase().includes(search.toLowerCase()) ||
    (r.requestedBy ? `${r.requestedBy.firstName} ${r.requestedBy.lastName}`.toLowerCase() : '').includes(search.toLowerCase()) ||
    (r.department?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalSpend = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const pendingCount = orders.filter(o => o.status >= 1 && o.status <= 4).length;
  const receivedCount = orders.filter(o => o.status === 5).length;

  const prTotalEstimated = prFormData.items.reduce((sum, item) => sum + (item.quantityRequested * item.estimatedUnitCost), 0);

  return (
    <div>
      {/* ── Receive PO Modal ─────────────────────────────────────────────────── */}
      {receivePO && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setReceivePO(null)}>
          <div className="card-elevated" style={{ width: 520, padding: 28, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Receive Goods — {receivePO.poNumber}</h2>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{receivePO.supplier?.name} · {typeConfig[receivePO.poType]?.label}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setReceivePO(null)}><X size={16}/></button>
            </div>

            {receivePO.jobCardId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue)', marginBottom: 16, marginTop: 10 }}>
                <PackageCheck size={13} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontSize: 12, color: 'var(--accent-blue)' }}>
                  Cost will auto-sync to Job #{receivePO.jobCardId} ({typeConfig[receivePO.poType]?.label})
                </span>
              </div>
            )}

            <form onSubmit={handleReceive} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Confirm quantities received:</div>
              {receiveItems.map((item, idx) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px', gap: 10, alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'var(--bg-elevated)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Ordered: {item.quantityOrdered}</div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Qty Received</label>
                    <input
                      type="number" min={0} max={item.quantityOrdered} className="form-input"
                      style={{ textAlign: 'center', padding: '4px 8px' }}
                      value={item.quantityReceived}
                      onChange={e => {
                        const copy = [...receiveItems];
                        copy[idx].quantityReceived = Math.min(item.quantityOrdered, Math.max(0, parseInt(e.target.value) || 0));
                        setReceiveItems(copy);
                      }}
                    />
                  </div>
                </div>
              ))}
              {receiveItems.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No line items on this PO.</p>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReceivePO(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={receiving || receiveItems.length === 0} style={{ background: 'var(--accent-emerald)', border: 'none' }}>
                  <PackageCheck size={13} /> {receiving ? 'Processing...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Convert Requisition to PO Modal ────────────────────────────────────── */}
      {convertingRequisition && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConvertingRequisition(null)}>
          <div className="card-elevated" style={{ width: 420, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Convert Requisition to PO</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setConvertingRequisition(null)}><X size={16}/></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              This will convert requisition <strong>{convertingRequisition.requisitionNumber}</strong> into a draft Purchase Order. Please select the supplier.
            </p>
            <form onSubmit={handleConvertRequisition} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-field">
                <label className="form-label">Supplier *</label>
                <select className="form-select" required value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}>
                  <option value="">Select a supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setConvertingRequisition(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={converting || !selectedSupplierId}>
                  {converting ? 'Converting...' : 'Generate Draft PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Raise PO SlideOver ───────────────────────────────────────────────── */}
      <SlideOver open={isSlideOpen} onClose={() => setIsSlideOpen(false)} title="Raise Purchase Order" subtitle="Create a new PO for external suppliers.">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Supplier</label>
            <select className="form-select" required value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
              <option value="">Select a supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Order Type</label>
            <select className="form-select" value={formData.poType} onChange={e => setFormData({...formData, poType: parseInt(e.target.value)})}>
              {Object.entries(typeConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {(formData.poType === 1 || formData.poType === 2) && (
            <div className="form-field">
              <label className="form-label">Linked Job Card <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <select className="form-select" value={formData.jobCardId} onChange={e => setFormData({...formData, jobCardId: e.target.value})}>
                <option value="">— Not linked to a job —</option>
                {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.jobNumber} · {j.equipment?.name ?? ''}</option>)}
              </select>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input className="form-input" placeholder="Internal notes or reference..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          <div className="section-header" style={{ marginTop: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
            <div><div className="section-title" style={{ fontSize: 13 }}>Order Items</div></div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}><Plus size={12}/> Add Line</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formData.items.map((item, idx) => (
              <div key={idx} style={{ padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="form-input" placeholder="Item description / Part details" required value={item.description} onChange={e => {
                  const newI = [...formData.items]; newI[idx].description = e.target.value; setFormData({...formData, items: newI});
                }} />
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label" style={{ fontSize: 11 }}>Quantity</label>
                    <input type="number" className="form-input" required value={item.quantityOrdered} onChange={e => {
                      const newI = [...formData.items]; newI[idx].quantityOrdered = parseInt(e.target.value); setFormData({...formData, items: newI});
                    }} />
                  </div>
                  <div className="form-field">
                    <label className="form-label" style={{ fontSize: 11 }}>Unit Cost</label>
                    <input type="number" className="form-input" required value={item.unitCost} onChange={e => {
                      const newI = [...formData.items]; newI[idx].unitCost = parseFloat(e.target.value); setFormData({...formData, items: newI});
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSlideOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Draft PO'}</button>
          </div>
        </form>
      </SlideOver>

      {/* ── Raise PR SlideOver ───────────────────────────────────────────────── */}
      <SlideOver open={isPrSlideOpen} onClose={() => setIsPrSlideOpen(false)} title="Raise Purchase Requisition" subtitle="Create an internal requisition for parts or department overhead.">
        <form onSubmit={handlePrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Requisition Type</label>
            <select className="form-select" value={prFormData.type} onChange={e => setPrFormData({ ...prFormData, type: e.target.value, jobCardId: '', departmentId: user?.departmentId ? String(user.departmentId) : '' })}>
              <option value="operational">Operational (Job Card Part)</option>
              <option value="departmental">Department Overhead (Overhead Expenses)</option>
            </select>
          </div>

          {prFormData.type === 'operational' ? (
            <div className="form-field">
              <label className="form-label">Linked Job Card *</label>
              <select className="form-select" required value={prFormData.jobCardId} onChange={e => setPrFormData({ ...prFormData, jobCardId: e.target.value })}>
                <option value="">Select a job card...</option>
                {jobs.map((j: any) => (
                  <option key={j.id} value={j.id}>{j.jobNumber} · {j.equipment?.name ?? ''} · {j.description}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-field">
              <label className="form-label">Requesting Department *</label>
              <select className="form-select" required value={prFormData.departmentId} onChange={e => setPrFormData({ ...prFormData, departmentId: e.target.value })}>
                <option value="">Select a department...</option>
                {allowedDepartments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Purpose / Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input className="form-input" placeholder="e.g. Spare filter parts or office laptop upgrade..." value={prFormData.notes} onChange={e => setPrFormData({ ...prFormData, notes: e.target.value })} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input type="checkbox" id="submitImmediately" checked={prFormData.submitImmediately} onChange={e => setPrFormData({ ...prFormData, submitImmediately: e.target.checked })} />
            <label htmlFor="submitImmediately" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Submit for approval immediately</label>
          </div>

          <div className="section-header" style={{ marginTop: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
            <div><div className="section-title" style={{ fontSize: 13 }}>Items Requested</div></div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrAddItem}><Plus size={12}/> Add Item</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {prFormData.items.map((item, idx) => (
              <div key={idx} style={{ padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                {prFormData.items.length > 1 && (
                  <button type="button" style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }} onClick={() => handlePrRemoveItem(idx)}>
                    <Trash2 size={13} />
                  </button>
                )}
                <div className="form-field">
                  <label className="form-label" style={{ fontSize: 11 }}>Description / Part Details *</label>
                  <input className="form-input" placeholder="Item description" required value={item.description} onChange={e => {
                    const newItems = [...prFormData.items];
                    newItems[idx].description = e.target.value;
                    setPrFormData({ ...prFormData, items: newItems });
                  }} />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label" style={{ fontSize: 11 }}>Quantity</label>
                    <input type="number" min={1} className="form-input" required value={item.quantityRequested} onChange={e => {
                      const newItems = [...prFormData.items];
                      newItems[idx].quantityRequested = parseInt(e.target.value) || 1;
                      setPrFormData({ ...prFormData, items: newItems });
                    }} />
                  </div>
                  <div className="form-field">
                    <label className="form-label" style={{ fontSize: 11 }}>Est. Unit Cost (ZMW)</label>
                    <input type="number" min={0} step="0.01" className="form-input" required value={item.estimatedUnitCost} onChange={e => {
                      const newItems = [...prFormData.items];
                      newItems[idx].estimatedUnitCost = parseFloat(e.target.value) || 0;
                      setPrFormData({ ...prFormData, items: newItems });
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, padding: 14, background: 'var(--surface-secondary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Estimated Amount:</span>
            <span style={{ fontSize: 16, color: 'var(--accent-blue)', fontWeight: 700 }}>ZMW {prTotalEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPrSlideOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : prFormData.submitImmediately ? 'Submit PR' : 'Save Draft'}</button>
          </div>
        </form>
      </SlideOver>

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={22} className="text-accent-blue" /> Procurement Hub
          </h1>
          <p className="page-subtitle">
            {activeTab === 'requisitions' 
              ? `${requisitions.length} requisitions · ${requisitions.filter(r => r.status === 1).length} pending approval` 
              : activeTab === 'orders'
              ? `${orders.length} purchase orders · K ${totalSpend.toLocaleString()} committed`
              : `${suppliers.length} active suppliers`}
          </p>
        </div>
        {activeTab === 'requisitions' ? (
          <button className="btn btn-primary" onClick={() => setIsPrSlideOpen(true)}>
            <Plus size={14}/> Raise PR
          </button>
        ) : activeTab === 'orders' ? (
          <button className="btn btn-primary" onClick={() => setIsSlideOpen(true)}>
            <Plus size={14}/> Raise PO
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowSupplierForm(true)}>
            <Plus size={14}/> Add Supplier
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
        {[
          { key: 'requisitions', label: 'Requisitions (PR)', icon: <ClipboardList size={13}/> },
          ...(roles.some((r: string) => ['Admin', 'Finance', 'Purchasing', 'Storeman', 'PlatformOwner'].includes(r))
            ? [{ key: 'orders', label: 'Purchase Orders', icon: <FileText size={13}/> }]
            : []),
          ...(roles.some((r: string) => ['Admin', 'Finance', 'Purchasing', 'PlatformOwner'].includes(r))
            ? [{ key: 'suppliers', label: 'Suppliers', icon: <Truck size={13}/> }]
            : []),
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Requisitions Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'requisitions' && (
        <>
          <div className="stats-grid-3" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Requisitions', value: requisitions.length, color: 'var(--accent-blue)', icon: <ClipboardList size={16}/> },
              { label: 'Pending Approval', value: requisitions.filter(r => r.status === 1).length, color: 'var(--accent-amber)', icon: <AlertCircle size={16}/> },
              { label: 'Approved & Ready', value: requisitions.filter(r => r.status === 2).length, color: 'var(--accent-emerald)', icon: <PackageCheck size={16}/> },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  </div>
                  <div className="stat-icon" style={{ background: s.color + '20' }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search by PR number, requester, or department…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <ResponsiveTable>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PR Number</th>
                    <th>Requester</th>
                    <th>Source / Dept</th>
                    <th>Required Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Est. Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0' }}>Loading purchase requisitions...</td></tr>
                  ) : filteredRequisitions.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No requisitions found</td></tr>
                  ) : filteredRequisitions.map(pr => {
                    const statCfg = prStatusConfig[pr.status] || { label: 'Unknown', badge: 'badge-muted' };
                    const isExpanded = expandedRequisitionId === pr.id;
                    const isOperational = !!pr.jobCardId;

                    return (
                      <>
                        <tr key={pr.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedRequisitionId(isExpanded ? null : pr.id)}>
                          <td style={{ color: 'var(--accent-blue)', fontWeight: 600, fontSize: 13 }}>{pr.requisitionNumber}</td>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {pr.requestedBy ? `${pr.requestedBy.firstName} ${pr.requestedBy.lastName}` : 'System'}
                          </td>
                          <td>
                            {isOperational ? (
                              <span className="badge badge-blue" style={{ fontSize: 11 }}>
                                Job #{pr.jobCard?.jobNumber || pr.jobCardId}
                              </span>
                            ) : (
                              <span className="badge badge-violet" style={{ fontSize: 11 }}>
                                {pr.department?.name || 'Department Overhead'}
                              </span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{new Date(pr.requiredDate).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                              <span className={`badge ${statCfg.badge}`}>{statCfg.label}</span>
                              {pr.status === 3 && pr.notes && (
                                <div style={{ fontSize: '11px', color: 'var(--accent-rose)', fontStyle: 'italic', maxWidth: '150px' }}>
                                  Reason: {pr.notes}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                            K {pr.totalEstimatedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                              {pr.status === 0 && (
                                <button className="btn btn-secondary btn-sm" onClick={() => handleSubmitRequisition(pr.id)}>
                                  Submit
                                </button>
                              )}
                              {pr.status === 1 && canApprove && !isExpanded && (
                                <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setExpandedRequisitionId(pr.id); }}>
                                  Review
                                </button>
                              )}
                              {pr.status === 2 && canConvert && (
                                <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => { setConvertingRequisition(pr); setSelectedSupplierId(''); }}>
                                  <PackageCheck size={12} /> Convert to PO
                                </button>
                              )}
                              <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setExpandedRequisitionId(isExpanded ? null : pr.id)}>
                                {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (pr.items || []).length > 0 && (
                          <tr key={`${pr.id}-items`}>
                            <td colSpan={7} style={{ padding: '0 16px 14px 16px', background: 'var(--bg-app)' }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, marginTop: 8 }}>REQUISITION LINE ITEMS</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {pr.items.map((item: any) => (
                                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 110px', gap: 12, padding: '8px 12px', borderRadius: 6, background: 'var(--bg-elevated)', fontSize: 12 }}>
                                    <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                                    <span style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Qty: {item.quantityRequested}</span>
                                    <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>K {item.estimatedUnitCost?.toLocaleString()}/u</span>
                                    <span style={{ color: 'var(--text-secondary)', textAlign: 'right', fontWeight: 600 }}>K {(item.estimatedUnitCost * item.quantityRequested)?.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                              {pr.notes && pr.status !== 3 && (
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10, padding: '8px 12px', borderRadius: 6, background: 'var(--surface-secondary)', borderLeft: '3px solid var(--border-muted)' }}>
                                  <strong>Purpose / Description:</strong> {pr.notes}
                                </div>
                              )}
                              
                              {pr.status === 1 && canApprove && (
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                                  <button className="btn" style={{ background: 'var(--accent-rose)', color: '#fff', border: 'none' }} onClick={() => handleRejectRequisition(pr.id)}>
                                    Reject PR
                                  </button>
                                  <button className="btn" style={{ background: 'var(--accent-emerald)', color: '#fff', border: 'none' }} onClick={() => handleApproveRequisition(pr.id)}>
                                    Approve PR
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </ResponsiveTable>
          </div>
        </>
      )}

      {/* ── Purchase Orders Tab ──────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <>
          <div className="stats-grid-3" style={{ marginBottom: 20 }}>
            {[
              { label: 'Pending Processing', value: pendingCount, color: 'var(--accent-amber)', icon: <Zap size={16}/> },
              { label: 'Received',           value: receivedCount, color: 'var(--accent-emerald)', icon: <FileText size={16}/> },
              { label: 'Total Spend',        value: `K ${totalSpend.toLocaleString()}`, color: 'var(--accent-blue)', icon: <FileText size={16}/> },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  </div>
                  <div className="stat-icon" style={{ background: s.color + '20' }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search by PO number or supplier…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <ResponsiveTable>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Supplier</th>
                    <th>Type</th>
                    <th>Linked Job</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0' }}>Loading purchase orders...</td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No POs found</td></tr>
                  ) : filteredOrders.map(order => {
                    const typeCfg = typeConfig[order.poType] || { label: 'Unknown', badge: 'badge-muted' };
                    const statCfg = statusConfig[order.status] || { label: 'Unknown', badge: 'badge-muted' };
                    const canReceive = order.status === 3 || order.status === 4; // Approved, Partly Received
                    const isExpanded = expandedOrderId === order.id;

                    return (
                      <>
                        <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                          <td style={{ color: 'var(--accent-blue)', fontWeight: 600, fontSize: 13 }}>{order.poNumber}</td>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{order.supplier?.name || 'Unknown Supplier'}</td>
                          <td><span className={`badge ${typeCfg.badge}`}>{typeCfg.label}</span></td>
                          <td style={{ color: order.jobCardId ? 'var(--accent-blue)' : 'var(--text-muted)', fontSize: 13, fontWeight: order.jobCardId ? 600 : 400 }}>
                            {order.jobCardId ? `Job #${order.jobCardId}` : '—'}
                          </td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{new Date(order.orderDate).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                              <span className={`badge ${statCfg.badge}`}>{statCfg.label}</span>
                              {order.status === 1 && (
                                <button
                                  className="btn btn-sm"
                                  style={{ padding: '2px 6px', fontSize: '10px', background: 'var(--accent-blue)', color: '#fff', border: 'none', marginTop: 4 }}
                                  onClick={(e) => { e.stopPropagation(); handleSendForApproval(order.id); }}
                                >
                                  Send to Finance
                                </button>
                              )}
                              {order.status === 6 && order.notes && (
                                <div style={{ fontSize: '11px', color: 'var(--accent-rose)', fontStyle: 'italic', maxWidth: '150px' }} title={order.notes}>
                                  Reason: {order.notes}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                            K {order.totalAmount?.toLocaleString() || '0'}
                          </td>
                          <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                              {canReceive && (
                                <button
                                  className="btn btn-sm"
                                  style={{ background: 'var(--accent-emerald)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
                                  onClick={() => openReceive(order)}
                                  title="Receive goods against this PO"
                                >
                                  <PackageCheck size={12} /> Receive
                                </button>
                              )}
                              <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                                {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (order.items || []).length > 0 && (
                          <tr key={`${order.id}-items`}>
                            <td colSpan={8} style={{ padding: '0 16px 14px 16px', background: 'var(--bg-app)' }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, marginTop: 8 }}>LINE ITEMS</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {order.items.map((item: any) => (
                                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 110px', gap: 12, padding: '8px 12px', borderRadius: 6, background: 'var(--bg-elevated)', fontSize: 12 }}>
                                    <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                                    <span style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Qty: {item.quantityOrdered}</span>
                                    <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>K {item.unitCost?.toLocaleString()}/u</span>
                                    <span style={{ color: 'var(--text-secondary)', textAlign: 'right', fontWeight: 600 }}>K {(item.unitCost * item.quantityOrdered)?.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </ResponsiveTable>
          </div>
        </>
      )}

      {/* ── Suppliers Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'suppliers' && (
        <div>
          {/* Add Supplier Form Modal */}
          {showSupplierForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSupplierForm(false)}>
              <div className="card-elevated" style={{ width: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Add Supplier</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowSupplierForm(false)}><X size={16}/></button>
                </div>
                <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Company Name *</label>
                      <input className="form-input" required value={supplierForm.name} onChange={e => setSupplierForm(f => ({...f, name: e.target.value}))} placeholder="Acme Engineering Ltd" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Supplier Code</label>
                      <input className="form-input" value={supplierForm.supplierCode} onChange={e => setSupplierForm(f => ({...f, supplierCode: e.target.value}))} placeholder="SUP-001" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Contact Person</label>
                      <input className="form-input" value={supplierForm.contactPerson} onChange={e => setSupplierForm(f => ({...f, contactPerson: e.target.value}))} placeholder="John Mwanza" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={supplierForm.phone} onChange={e => setSupplierForm(f => ({...f, phone: e.target.value}))} placeholder="+260 97..." />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={supplierForm.email} onChange={e => setSupplierForm(f => ({...f, email: e.target.value}))} placeholder="info@supplier.com" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Address</label>
                      <input className="form-input" value={supplierForm.address} onChange={e => setSupplierForm(f => ({...f, address: e.target.value}))} placeholder="Lusaka, Zambia" />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Notes</label>
                    <input className="form-input" value={supplierForm.notes} onChange={e => setSupplierForm(f => ({...f, notes: e.target.value}))} placeholder="Specialises in electrical components..." />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowSupplierForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={savingSupplier}>{savingSupplier ? 'Saving...' : 'Add Supplier'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Suppliers List */}
          {suppliers.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Truck size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 14, marginBottom: 12 }}>No suppliers yet</div>
              <button className="btn btn-primary" onClick={() => setShowSupplierForm(true)}><Plus size={13}/> Add First Supplier</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {suppliers.map((s: any) => (
                <div key={s.id} className="card-elevated" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{s.name}</div>
                      {s.supplierCode && <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 2 }}>{s.supplierCode}</div>}
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--accent-rose)' }} onClick={() => handleDeleteSupplier(s.id)}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {s.contactPerson && <div>Contact: {s.contactPerson}</div>}
                    {s.phone && <div>Phone: {s.phone}</div>}
                    {s.email && <div>Email: {s.email}</div>}
                    {s.address && <div>Address: {s.address}</div>}
                    {s.notes && <div style={{ marginTop: 6, color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

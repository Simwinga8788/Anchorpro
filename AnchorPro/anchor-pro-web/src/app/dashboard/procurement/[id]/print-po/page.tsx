'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { procurementApi, tenantsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const PO_TYPE_LABEL: Record<number, string> = {
  0: 'Inventory Replenishment',
  1: 'Direct Purchase (Job-Specific)',
  2: 'Subcontracting',
};

const PO_STATUS_LABEL: Record<number, string> = {
  0: 'Draft',
  1: 'Submitted',
  2: 'Pending Approval',
  3: 'Approved',
  4: 'Partially Received',
  5: 'Received',
  6: 'Rejected',
  7: 'Cancelled',
};

const PO_STATUS_COLOR: Record<number, string> = {
  0: '#6b7280',
  1: '#f59e0b',
  2: '#f59e0b',
  3: '#2ecc8a',
  4: '#3b82f6',
  5: '#2ecc8a',
  6: '#ef4444',
  7: '#6b7280',
};

export default function PrintPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [po, setPo] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const poData = await procurementApi.getOrderById(id);
        setPo(poData);
        if (user?.tenantId) {
          const t = await tenantsApi.getById(user.tenantId).catch(() => null);
          setTenant(t);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user !== undefined) loadData();
  }, [id, user]);

  useEffect(() => {
    const hasTenantInfo = !user?.tenantId || tenant;
    if (!loading && po && hasTenantInfo) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, po, tenant, user]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading purchase order for print...</div>;
  }

  if (!po) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: Purchase Order not found.</div>;
  }

  const fmt = (n: number) => `K ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="print-page-wrapper">
      {/* On-screen controls bar (hidden on print) */}
      <div className="no-print print-controls-bar">
        <button onClick={() => router.push(`/dashboard/procurement`)} className="btn-back">
          ← Back to Procurement
        </button>
        <span className="doc-type-badge">Purchase Order Preview</span>
        <button onClick={() => window.print()} className="btn-print">
          Print / Save PDF
        </button>
      </div>

      {/* The actual document card */}
      <div className="print-document-card">

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: '20px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {tenant?.logoUrl ? (
              <img src={tenant.logoUrl.replace(/^https?:/i, '')} alt={`${tenant?.name || 'Company'} Logo`} style={{ height: '70px', objectFit: 'contain' }} />
            ) : (
              <img src="/AnchorPro_logo.png" alt="Anchor Pro Logo" style={{ height: '70px', objectFit: 'contain' }} />
            )}
            <div>
              <h1 style={{ margin: '0 0 2px 0', fontSize: '24px', color: '#1e3a5f', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                {tenant?.name?.toUpperCase() || 'ANCHOR PRO'}
              </h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#4b5563', fontWeight: 500 }}>
                {tenant?.address || 'Lusaka, Zambia'}
              </p>
              {(tenant?.contactEmail || tenant?.contactPhone) && (
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                  {tenant?.contactEmail}{tenant?.contactEmail && tenant?.contactPhone ? ' · ' : ''}{tenant?.contactPhone}
                </p>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '26px', color: '#1e3a5f', fontWeight: 800, letterSpacing: '1px' }}>PURCHASE ORDER</h2>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>{po.poNumber}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Date: {fmtDate(po.orderDate)}</p>
            {po.expectedDeliveryDate && (
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Expected Delivery: {fmtDate(po.expectedDeliveryDate)}</p>
            )}
            <span style={{
              display: 'inline-block', marginTop: '6px', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
              background: `${PO_STATUS_COLOR[po.status] || '#6b7280'}20`,
              color: PO_STATUS_COLOR[po.status] || '#6b7280',
              border: `1px solid ${PO_STATUS_COLOR[po.status] || '#6b7280'}40`,
            }}>
              {PO_STATUS_LABEL[po.status] ?? 'Unknown'}
            </span>
          </div>
        </div>

        {/* ── INFO BLOCK ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '28px' }}>

          {/* Supplier */}
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '1px', fontWeight: 700 }}>Supplier / Vendor</h3>
            <p style={{ margin: '0 0 3px 0', fontWeight: 700, fontSize: '15px', color: '#111827' }}>{po.supplier?.name || '—'}</p>
            {po.supplier?.contactPerson && <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#4b5563' }}>Attn: {po.supplier.contactPerson}</p>}
            {po.supplier?.email && <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#4b5563' }}>{po.supplier.email}</p>}
            {po.supplier?.phone && <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#4b5563' }}>{po.supplier.phone}</p>}
            {po.supplier?.address && <p style={{ margin: 0, fontSize: '12px', color: '#4b5563' }}>{po.supplier.address}</p>}
          </div>

          {/* Reference Details */}
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '1px', fontWeight: 700 }}>Reference Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#6b7280', padding: '3px 0', width: '120px' }}>PO Number:</td>
                  <td style={{ fontWeight: 700, color: '#111827' }}>{po.poNumber}</td>
                </tr>
                {po.purchaseRequisition?.requisitionNumber && (
                  <tr>
                    <td style={{ color: '#6b7280', padding: '3px 0' }}>PR Reference:</td>
                    <td style={{ fontWeight: 600, color: '#1e3a5f' }}>{po.purchaseRequisition.requisitionNumber}</td>
                  </tr>
                )}
                {po.jobCard?.jobNumber && (
                  <tr>
                    <td style={{ color: '#6b7280', padding: '3px 0' }}>Job Card:</td>
                    <td style={{ fontWeight: 600, color: '#4b5563' }}>#{po.jobCard.jobNumber}</td>
                  </tr>
                )}
                {po.department?.name && (
                  <tr>
                    <td style={{ color: '#6b7280', padding: '3px 0' }}>Department:</td>
                    <td style={{ color: '#4b5563' }}>{po.department.name}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ color: '#6b7280', padding: '3px 0' }}>PO Type:</td>
                  <td style={{ color: '#4b5563' }}>{PO_TYPE_LABEL[po.poType] ?? 'General'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', padding: '3px 0' }}>Raised By:</td>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{po.raisedBy || '—'}</td>
                </tr>
                {po.approvedBy && (
                  <tr>
                    <td style={{ color: '#6b7280', padding: '3px 0' }}>Approved By:</td>
                    <td style={{ fontWeight: 600, color: '#2ecc8a' }}>{po.approvedBy}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 12px 0', letterSpacing: '1px', fontWeight: 700 }}>Order Items</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#1e3a5f', color: '#ffffff' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderRadius: '4px 0 0 0' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Qty Ordered</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Qty Received</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Unit Cost</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderRadius: '0 4px 0 0' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(po.items || []).map((item: any, idx: number) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px', color: '#111827', fontWeight: 500 }}>
                    {item.description || item.inventoryItem?.name || '—'}
                    {item.inventoryItem?.partNumber && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>Part No: {item.inventoryItem.partNumber}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151' }}>{item.quantityOrdered}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: item.quantityReceived >= item.quantityOrdered ? '#2ecc8a' : '#f59e0b', fontWeight: 600 }}>
                    {item.quantityReceived ?? 0}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>{fmt(item.unitCost)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#111827' }}>{fmt(item.lineTotal)}</td>
                </tr>
              ))}
              {(!po.items || po.items.length === 0) && (
                <tr>
                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>No line items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── TOTALS ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '36px' }}>
          <div style={{ width: '260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #1e3a5f', fontSize: '16px', fontWeight: 800 }}>
              <span style={{ color: '#1e3a5f' }}>TOTAL AMOUNT</span>
              <span style={{ color: '#1e3a5f' }}>{fmt(po.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* ── NOTES ── */}
        {po.notes && (
          <div style={{ marginBottom: '36px', padding: '14px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Notes / Terms</h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#78350f', whiteSpace: 'pre-wrap' }}>{po.notes}</p>
          </div>
        )}

        {/* ── SIGNATURE BLOCKS ── */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          {[
            { label: 'Prepared / Raised By', value: po.raisedBy },
            { label: 'Authorized / Approved By', value: po.approvedBy },
            { label: 'Supplier Acknowledgement', value: null },
          ].map((block) => (
            <div key={block.label} style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '8px', marginTop: '40px' }}>
                {block.value && <p style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: 600, color: '#111827' }}>{block.value}</p>}
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>{block.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '14px', textAlign: 'center', fontSize: '10px', color: '#9ca3af' }}>
          <p style={{ margin: 0 }}>
            This Purchase Order was generated by AnchorPro · {tenant?.name || 'AnchorPro'} · Printed on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .print-page-wrapper {
          background-color: #f8fafc;
          min-height: 100vh;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .print-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 850px;
          background: #ffffff;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-sizing: border-box;
        }
        .btn-back {
          background: transparent;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-back:hover { background: #f1f5f9; border-color: #94a3b8; color: #1e293b; }
        .btn-print {
          background: #1e3a5f;
          color: #ffffff;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-print:hover { background: #162d4a; }
        .doc-type-badge { font-size: 14px; font-weight: 600; color: #0f172a; }
        .print-document-card {
          width: 100%;
          max-width: 850px;
          background: #ffffff;
          padding: 50px 60px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
          color: #1e293b;
          box-sizing: border-box;
        }
        @media print {
          @page { margin: 0; size: portrait; }
          body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .print-page-wrapper { background: #ffffff !important; padding: 0 !important; min-height: auto !important; }
          .no-print { display: none !important; }
          .print-document-card {
            box-shadow: none !important;
            border: none !important;
            padding: 1.5cm 1.5cm !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
        }
      `}} />
    </div>
  );
}

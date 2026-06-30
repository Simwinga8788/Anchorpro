'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { financialApi, tenantsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function PrintManualInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [invoice, setInvoice] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const invData = await financialApi.getInvoice(id);
        setInvoice(invData);
        if (user?.tenantId) {
          const t = await tenantsApi.getById(user.tenantId);
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
    if (!loading && invoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, invoice]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading invoice for print...</div>;
  }

  if (!invoice) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: Invoice not found.</div>;
  }

  return (
    <div className="print-page-wrapper">
      {/* On-screen controls bar (hidden on print) */}
      <div className="no-print print-controls-bar">
        <button onClick={() => {
          if (typeof window !== 'undefined') {
            if (window.opener || window.history.length === 1) {
              window.close();
            } else {
              router.back();
            }
          }
        }} className="btn-back">
          ← Back
        </button>
        <span className="doc-type-badge">Invoice Preview</span>
        <button onClick={() => window.print()} className="btn-print">
          Print / Save PDF
        </button>
      </div>

      {/* The actual document card */}
      <div className="print-document-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2563eb', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {tenant?.logoUrl && <img src={tenant.logoUrl} alt={`${tenant?.name || 'Company'} Logo`} style={{ height: '75px', objectFit: 'contain' }} />}
            <div>
              <h1 style={{ margin: '0 0 2px 0', fontSize: '26px', color: '#2563eb', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{tenant?.name?.toUpperCase() || 'COMPANY NAME'}</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>{tenant?.address || 'Company Address'}</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#6b7280' }}>{tenant?.contactEmail || 'contact@company.com'} {tenant?.contactPhone ? `· ${tenant.contactPhone}` : ''}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#111827', fontWeight: 700 }}>INVOICE</h2>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Invoice No: {invoice.invoiceNumber || 'Draft/Pending'}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Date: {new Date(invoice.createdAt || invoice.issueDate || Date.now()).toLocaleDateString()}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>Due Date: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt'}</p>
          </div>
        </div>

        {/* Info section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Bill To</h3>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '15px' }}>{invoice.customer?.name || invoice.customerName || 'Walk-In Customer'}</p>
            {invoice.customer?.customerNumber && (
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>Customer No: <strong>#{invoice.customer.customerNumber}</strong></p>
            )}
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>{invoice.customer?.email || '—'}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>{invoice.customer?.phone || '—'}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Reference Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', fontSize: '13px', color: '#4b5563' }}>
              <span style={{ color: '#6b7280' }}>Invoice Type:</span>
              <strong style={{ color: '#111827' }}>Manual / Ad-Hoc</strong>

              <span style={{ color: '#6b7280' }}>Payment Status:</span>
              <span style={{ color: invoice.paymentStatus === 2 ? '#2ecc8a' : invoice.paymentStatus === 0 || invoice.paymentStatus === 3 ? '#e84855' : '#f5a623', fontWeight: 600 }}>
                {invoice.paymentStatus === 0 ? 'Unpaid' : invoice.paymentStatus === 1 ? 'Partially Paid' : invoice.paymentStatus === 2 ? 'Paid' : invoice.paymentStatus === 3 ? 'Overdue' : 'Cancelled'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '35px', padding: '15px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Notes / Description</h4>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#4b5563', whiteSpace: 'pre-wrap' }}>{invoice.notes || 'General invoice for services rendered.'}</p>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ width: '280px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#4b5563' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>K {invoice.subtotal ? invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : (invoice.amount ? (invoice.amount / 1.16).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#4b5563' }}>VAT (16%)</span>
              <span style={{ color: '#4b5563' }}>K {invoice.taxAmount ? invoice.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : (invoice.amount ? (invoice.amount - (invoice.amount / 1.16)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #e5e7eb', fontSize: '15px', fontWeight: 700, marginTop: '8px' }}>
              <span>Total Amount Due</span>
              <span style={{ color: '#2563eb' }}>K {invoice.amount ? invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Footer / Payment Terms */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 600 }}>Thank you for your business!</p>
          <p style={{ margin: 0 }}>Payment terms: Net 30. Bank transfer instructions: Zanaco Bank · Acc: 1029384756 · Branch: Lusaka Corporate.</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* On-screen styling */
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
          max-width: 800px;
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
        .btn-back:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
          color: #1e293b;
        }
        .btn-print {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-print:hover {
          background: #1d4ed8;
        }
        .doc-type-badge {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
        .print-document-card {
          width: 100%;
          max-width: 800px;
          background: #ffffff;
          padding: 50px 60px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
          color: #1e293b;
          box-sizing: border-box;
        }

        /* Print media query overrides */
        @media print {
          @page {
            margin: 0;
            size: portrait;
          }
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-page-wrapper {
            background: #ffffff !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          .no-print {
            display: none !important;
          }
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

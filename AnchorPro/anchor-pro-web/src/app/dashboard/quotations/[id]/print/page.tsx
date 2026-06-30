'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quotationsApi } from '@/lib/api';

export default function PrintManualQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const qData = await quotationsApi.getById(id);
        setQuotation(qData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    if (!loading && quotation) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, quotation]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading quotation for print...</div>;
  }

  if (!quotation) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: Quotation not found.</div>;
  }

  return (
    <div className="print-page-wrapper">
      {/* On-screen controls bar (hidden on print) */}
      <div className="no-print print-controls-bar">
        <button onClick={() => router.back()} className="btn-back">
          ← Back
        </button>
        <span className="doc-type-badge">Quotation Preview</span>
        <button onClick={() => window.print()} className="btn-print">
          Print / Save PDF
        </button>
      </div>

      {/* The actual document card */}
      <div className="print-document-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2563eb', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="/AnchorPro_logo.png" alt="Anchor Pro Logo" style={{ height: '75px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: '0 0 2px 0', fontSize: '26px', color: '#2563eb', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>ANCHOR PRO</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>Production Planning & Service Operation Tool</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#6b7280' }}>Lusaka, Zambia · support@anchorpro.com</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#111827', fontWeight: 700 }}>QUOTATION</h2>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Quote No: {quotation.quotationNumber || 'Draft/Pending'}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Date: {new Date(quotation.quoteDate || quotation.createdAt || Date.now()).toLocaleDateString()}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>Expires: {quotation.expiryDate ? new Date(quotation.expiryDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        {/* Info section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Client Info</h3>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '15px' }}>{quotation.customer?.name || quotation.customerName || 'Walk-In Customer'}</p>
            {quotation.customer?.customerNumber && (
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>Customer No: <strong>#{quotation.customer.customerNumber}</strong></p>
            )}
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>{quotation.customer?.email || '—'}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>{quotation.customer?.phone || '—'}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Reference Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', fontSize: '13px', color: '#4b5563' }}>
              <span style={{ color: '#6b7280' }}>Quote Type:</span>
              <strong style={{ color: '#111827' }}>Manual / Ad-Hoc</strong>

              <span style={{ color: '#6b7280' }}>Status:</span>
              <span style={{ color: quotation.status === 2 ? '#2ecc8a' : quotation.status === 3 ? '#e84855' : '#f5a623', fontWeight: 600 }}>
                {quotation.status === 0 ? 'Draft' : quotation.status === 1 ? 'Sent' : quotation.status === 2 ? 'Accepted' : 'Rejected'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '35px', padding: '15px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scope / Notes</h4>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#4b5563', whiteSpace: 'pre-wrap' }}>{quotation.notes || 'General services/items quote.'}</p>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ width: '280px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#4b5563' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>K {quotation.subtotal ? quotation.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : (quotation.totalAmount ? (quotation.totalAmount / 1.16).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#4b5563' }}>VAT (16%)</span>
              <span style={{ color: '#4b5563' }}>K {quotation.taxAmount ? quotation.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : (quotation.totalAmount ? (quotation.totalAmount - (quotation.totalAmount / 1.16)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #e5e7eb', fontSize: '15px', fontWeight: 700, marginTop: '8px' }}>
              <span>Total Amount</span>
              <span style={{ color: '#2563eb' }}>K {quotation.totalAmount ? quotation.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 600 }}>Thank you for considering Anchor Pro!</p>
          <p style={{ margin: 0 }}>This quotation is valid until the expiry date shown above. Please sign and return to accept.</p>
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

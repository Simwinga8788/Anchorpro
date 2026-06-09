'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jobCardsApi, financialApi } from '@/lib/api';

export default function PrintInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [job, setJob] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const jobData = await jobCardsApi.getById(id);
        setJob(jobData);
        const invData = await financialApi.getInvoiceByJob(id);
        setInvoice(invData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    if (!loading && job && invoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, job, invoice]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading invoice for print...</div>;
  }

  if (!job || !invoice) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: Job or Invoice not found.</div>;
  }

  return (
    <div className="print-page-wrapper">
      {/* On-screen controls bar (hidden on print) */}
      <div className="no-print print-controls-bar">
        <button onClick={() => router.push(`/dashboard/jobs/${id}`)} className="btn-back">
          ← Back to Job Card
        </button>
        <span className="doc-type-badge">Invoice Preview</span>
        <button onClick={() => window.print()} className="btn-print">
          Print / Save PDF
        </button>
      </div>

      {/* The actual document card */}
      <div className="print-document-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #10b981', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#059669', fontWeight: 800, letterSpacing: '-0.5px' }}>ANCHOR PRO</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#4b5563' }}>Premium Engineering & Maintenance Services</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#6b7280' }}>Lusaka, Zambia · support@anchorpro.com</p>
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
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Bill To</h3>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '15px' }}>{job.customer?.name || 'Walk-In Customer'}</p>
            {job.customer?.customerNumber && (
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>Customer No: <strong>#{job.customer.customerNumber}</strong></p>
            )}
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>{job.customer?.email || '—'}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>{job.customer?.phone || '—'}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Reference Details</h3>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>Job Reference: <strong>#{job.jobNumber}</strong></p>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>Asset / Equipment: {job.equipment?.name || 'N/A'}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>Payment Status: <strong style={{ color: invoice.status === 2 ? '#10b981' : '#f59e0b' }}>
              {invoice.status === 0 ? 'Unpaid' : invoice.status === 1 ? 'Partially Paid' : invoice.status === 2 ? 'Paid' : 'Cancelled'}
            </strong></p>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '35px', padding: '15px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Scope / Description</h4>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#4b5563', whiteSpace: 'pre-wrap' }}>{job.description || 'General engineering and maintenance scope.'}</p>
        </div>

        {/* Line items */}
        <div style={{ marginBottom: '35px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 0', fontWeight: 600, color: '#374151' }}>Cost Category</th>
                <th style={{ padding: '8px 0', fontWeight: 600, color: '#374151' }}>Details</th>
                <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Amount (ZMW)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', fontWeight: 500 }}>Internal Labor & Diagnostics</td>
                <td style={{ padding: '10px 0', color: '#6b7280' }}>Technician labor time and diagnostics</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>K {(job.laborCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', fontWeight: 500 }}>Components & Parts</td>
                <td style={{ padding: '10px 0', color: '#6b7280' }}>Stock parts reserved and issued to job</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>K {(job.partsCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', fontWeight: 500 }}>Direct Purchases</td>
                <td style={{ padding: '10px 0', color: '#6b7280' }}>Non-stock items procured for job card</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>K {(job.directPurchaseCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 0', fontWeight: 500 }}>External Subcontracting</td>
                <td style={{ padding: '10px 0', color: '#6b7280' }}>Outsourced external services POs</td>
                <td style={{ padding: '10px 0', textAlign: 'right' }}>K {(job.subcontractingCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
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
              <span style={{ color: '#059669' }}>K {invoice.amount ? invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</span>
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
          background: #059669;
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
          background: #047857;
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

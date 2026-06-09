'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jobCardsApi, quotationsApi } from '@/lib/api';

export default function PrintQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [job, setJob] = useState<any>(null);
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const jobData = await jobCardsApi.getById(id);
        setJob(jobData);
        const qData = await quotationsApi.getByJob(id);
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
    if (!loading && job && quotation) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, job, quotation]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading quotation for print...</div>;
  }

  if (!job || !quotation) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: Job or Quotation not found.</div>;
  }

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif',
      color: '#1a1a1a',
      background: '#fff',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #6366f1', paddingBottom: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#4f46e5', fontWeight: 800, letterSpacing: '-0.5px' }}>ANCHOR PRO</h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#4b5563' }}>Premium Engineering & Maintenance Services</p>
          <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#6b7280' }}>Lusaka, Zambia · support@anchorpro.com</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#111827', fontWeight: 700 }}>QUOTATION</h2>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Quote No: {quotation.quotationNumber}</p>
          <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Date: {new Date(quotation.quoteDate).toLocaleDateString()}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>Expires: {new Date(quotation.expiryDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Info section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
        <div>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Client Info</h3>
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '15px' }}>{job.customer?.name || 'Walk-In Customer'}</p>
          {job.customer?.customerNumber && (
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>Customer No: <strong>#{job.customer.customerNumber}</strong></p>
          )}
          <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>{job.customer?.email || '—'}</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>{job.customer?.phone || '—'}</p>
        </div>
        <div>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Service Details</h3>
          <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>Job Reference: <strong>#{job.jobNumber}</strong></p>
          <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>Asset / Equipment: {job.equipment?.name || 'N/A'}</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>Job Type: {job.jobType?.name || 'General'}</p>
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
            <span style={{ fontWeight: 600 }}>K {quotation.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ color: '#4b5563' }}>VAT ({quotation.taxRate}%)</span>
            <span style={{ color: '#4b5563' }}>K {quotation.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #e5e7eb', fontSize: '15px', fontWeight: 700, marginTop: '8px' }}>
            <span>Total Quote</span>
            <span style={{ color: '#4f46e5' }}>K {quotation.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Footer / Notes */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 600 }}>Thank you for your business!</p>
        <p style={{ margin: 0 }}>Please sign and return to accept this quote. Upon acceptance, an invoice will be generated.</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
          <div style={{ borderTop: '1px dashed #9ca3af', width: '200px', paddingTop: '8px' }}>
            Authorized Signature
          </div>
          <div style={{ borderTop: '1px dashed #9ca3af', width: '200px', paddingTop: '8px' }}>
            Customer Acceptance (Sign & Date)
          </div>
        </div>
      </div>
    </div>
  );
}

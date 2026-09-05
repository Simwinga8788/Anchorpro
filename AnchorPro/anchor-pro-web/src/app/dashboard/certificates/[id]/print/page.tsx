'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { certificatesApi, tenantsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';

const STATUS_LABELS: Record<number, string> = {
  0: 'Draft',
  1: 'Submitted to Consultant',
  2: 'Queried',
  3: 'Approved',
  4: 'Issued',
  5: 'Paid',
};

export default function PrintCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [cert, setCert] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { formatMoney: money } = useDictionary();

  useEffect(() => {
    const loadData = async () => {
      try {
        const certData = await certificatesApi.getById(id);
        setCert(certData);
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
    if (!loading && cert) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, cert]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading certificate for print...</div>;
  }

  if (!cert) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: Payment Certificate not found.</div>;
  }

  const items = cert.items || cert.Items || [];
  const statusLabel = STATUS_LABELS[cert.status] || 'Draft';

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
        <span className="doc-type-badge">Payment Certificate Preview</span>
        <button onClick={() => window.print()} className="btn-print">
          Print / Save PDF
        </button>
      </div>

      {/* The actual document card */}
      <div className="print-document-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #10b981', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {tenant?.logoUrl && <img src={tenant.logoUrl.replace(/^https?:/i, '')} alt={`${tenant?.name || 'Company'} Logo`} style={{ height: '75px', objectFit: 'contain' }} />}
            <div>
              <h1 style={{ margin: '0 0 2px 0', fontSize: '26px', color: '#10b981', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{tenant?.name?.toUpperCase() || 'COMPANY NAME'}</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>{tenant?.address || 'Company Address'}</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#6b7280' }}>{tenant?.contactEmail || 'contact@company.com'} {tenant?.contactPhone ? `· ${tenant.contactPhone}` : ''}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#111827', fontWeight: 700 }}>INTERIM PAYMENT CERTIFICATE</h2>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Certificate No: {cert.certificateNumber}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              Period: {new Date(cert.periodStartDate).toLocaleDateString()} – {new Date(cert.periodEndDate).toLocaleDateString()}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Status: {statusLabel}</p>
          </div>
        </div>

        {/* Info section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Project</h3>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '15px' }}>{cert.project?.name || 'Project'}</p>
            {cert.consultantName && (
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#4b5563' }}>Consultant: <strong>{cert.consultantName}</strong></p>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Certification Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px', fontSize: '13px', color: '#4b5563' }}>
              <span style={{ color: '#6b7280' }}>Retention Rate:</span>
              <strong style={{ color: '#111827' }}>{cert.retentionPercentage}%</strong>

              {cert.approvedAt && (
                <>
                  <span style={{ color: '#6b7280' }}>Approved On:</span>
                  <strong style={{ color: '#111827' }}>{new Date(cert.approvedAt).toLocaleDateString()}</strong>
                </>
              )}
            </div>
          </div>
        </div>

        {cert.status === 2 && cert.consultantNotes && (
          <div style={{ marginBottom: '30px', padding: '15px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Consultant Query</h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#78350f', whiteSpace: 'pre-wrap' }}>{cert.consultantNotes}</p>
          </div>
        )}

        {/* Line-item breakdown */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Measured Work Valuation</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Item</th>
                <th style={{ padding: '6px 8px' }}>Description</th>
                <th style={{ padding: '6px 8px' }}>Unit</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>BOQ Qty</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Rate</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>This Period</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Cumulative Value</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>% Done</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => {
                const boqItem = item.boqItem || item.BoqItem;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600, color: '#2563eb' }}>{boqItem?.itemNumber}</td>
                    <td style={{ padding: '6px 8px' }}>{boqItem?.description}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{boqItem?.unitOfMeasure}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{Number(boqItem?.quantity || 0).toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{money(boqItem?.rate)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{Number(item.currentQuantityCompleted || 0).toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{money(item.cumulativeValueCompleted)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{Math.round(item.percentageComplete || 0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Approved variations included */}
        {(cert.variations || cert.Variations || []).length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Approved Variations Included</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>VO #</th>
                  <th style={{ padding: '6px 8px' }}>Title</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Valued Amount</th>
                </tr>
              </thead>
              <tbody>
                {(cert.variations || cert.Variations || []).map((cv: any) => {
                  const variation = cv.variation || cv.Variation;
                  return (
                    <tr key={cv.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: '#2563eb' }}>{variation?.variationNumber}</td>
                      <td style={{ padding: '6px 8px' }}>{variation?.title}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{money(cv.valuedAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary sheet */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ width: '300px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#4b5563' }}>Gross Valuation to Date</span>
              <span style={{ fontWeight: 600 }}>{money(cert.grossValuationToDate)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#4b5563' }}>Retention ({cert.retentionPercentage}%)</span>
              <span style={{ color: '#ef4444' }}>-{money(cert.retentionDeductionToDate)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#4b5563' }}>Previous Certificates Paid</span>
              <span style={{ color: '#4b5563' }}>-{money(cert.previousCertificatesPaid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #e5e7eb', fontSize: '15px', fontWeight: 700, marginTop: '8px' }}>
              <span>Net Amount Due This Period</span>
              <span style={{ color: '#10b981' }}>{money(cert.netAmountDue)}</span>
            </div>
          </div>
        </div>

        {/* Footer / Sign-off */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '24px', fontSize: '12px', color: '#4b5563' }}>
          <div>
            <p style={{ margin: '0 0 30px 0' }}>Contractor Signature: _______________________</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Date: _______________</p>
          </div>
          <div>
            <p style={{ margin: '0 0 30px 0' }}>Consultant / QS Signature: _______________________</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Date: _______________</p>
          </div>
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
          max-width: 900px;
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
          background: #10b981;
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
          background: #059669;
        }
        .doc-type-badge {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
        .print-document-card {
          width: 100%;
          max-width: 900px;
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

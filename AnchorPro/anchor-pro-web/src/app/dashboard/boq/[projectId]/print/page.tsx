'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { boqApi, projectsApi, tenantsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';

const STATUS_LABELS: Record<number, string> = {
  0: 'Draft',
  1: 'Under Review',
  2: 'Approved',
  3: 'Revised',
};

export default function PrintBoqPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.projectId as string);
  const [boq, setBoq] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { formatMoney: money } = useDictionary();

  useEffect(() => {
    const loadData = async () => {
      try {
        const boqData = await boqApi.getByProject(projectId);
        setBoq(boqData);
        const projectData = await projectsApi.getById(projectId);
        setProject(projectData);
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
  }, [projectId, user]);

  useEffect(() => {
    if (!loading && boq) {
      const timer = setTimeout(() => window.print(), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, boq]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading Bill of Quantities for print...</div>;
  }

  if (!boq) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: Bill of Quantities not found.</div>;
  }

  const sections = boq.sections || boq.Sections || [];
  const statusLabel = STATUS_LABELS[boq.status] || 'Draft';

  return (
    <div className="print-page-wrapper">
      <div className="no-print print-controls-bar">
        <button onClick={() => {
          if (typeof window !== 'undefined') {
            if (window.opener || window.history.length === 1) window.close();
            else router.back();
          }
        }} className="btn-back">
          ← Back
        </button>
        <span className="doc-type-badge">Bill of Quantities Preview</span>
        <button onClick={() => window.print()} className="btn-print">Print / Save PDF</button>
      </div>

      <div className="print-document-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2383E2', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {tenant?.logoUrl && <img src={tenant.logoUrl.replace(/^https?:/i, '')} alt={`${tenant?.name || 'Company'} Logo`} style={{ height: '75px', objectFit: 'contain' }} />}
            <div>
              <h1 style={{ margin: '0 0 2px 0', fontSize: '26px', color: '#2383E2', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{tenant?.name?.toUpperCase() || 'COMPANY NAME'}</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>{tenant?.address || 'Company Address'}</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#6b7280' }}>{tenant?.contactEmail || 'contact@company.com'} {tenant?.contactPhone ? `· ${tenant.contactPhone}` : ''}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#111827', fontWeight: 700 }}>BILL OF QUANTITIES</h2>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>{project?.name || 'Project'}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Version {boq.versionNumber}.0</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#2383E2', fontWeight: 600 }}>Status: {statusLabel}</p>
          </div>
        </div>

        {/* Sections & items */}
        {sections.map((sec: any) => {
          const items = sec.items || sec.Items || [];
          return (
            <div key={sec.id} style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', color: '#111827', margin: '0 0 8px 0', fontWeight: 700 }}>
                Sec {sec.sectionCode} — {sec.sectionName}
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px', width: '60px' }}>Item</th>
                    <th style={{ padding: '6px 8px' }}>Description of Work</th>
                    <th style={{ padding: '6px 8px', width: '60px' }}>Unit</th>
                    <th style={{ padding: '6px 8px', width: '80px', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '6px 8px', width: '90px', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '6px 8px', width: '100px', textAlign: 'right' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: '#2563eb' }}>{item.itemNumber}</td>
                      <td style={{ padding: '6px 8px' }}>{item.description}</td>
                      <td style={{ padding: '6px 8px', color: '#6b7280' }}>{item.unitOfMeasure}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{Number(item.quantity).toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{money(item.rate)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{money(item.totalAmount)}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '10px', textAlign: 'center', color: '#9ca3af' }}>No items in this section.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, borderTop: '1px solid #d1d5db' }}>Section Subtotal</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, borderTop: '1px solid #d1d5db' }}>{money(sec.subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ width: '300px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #e5e7eb', fontSize: '15px', fontWeight: 700 }}>
              <span>Total Contract Sum</span>
              <span style={{ color: '#2383E2' }}>{money(boq.totalContractSum)}</span>
            </div>
          </div>
        </div>

        {/* Sign-off */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '24px', fontSize: '12px', color: '#4b5563' }}>
          <div>
            <p style={{ margin: '0 0 30px 0' }}>Prepared By: _______________________</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Date: _______________</p>
          </div>
          <div>
            <p style={{ margin: '0 0 30px 0' }}>Approved By: _______________________</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Date: _______________</p>
          </div>
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
          background: #2383E2;
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
          background: #1a6fc4;
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

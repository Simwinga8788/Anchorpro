'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reportsApi, tenantsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_LABELS: Record<number, string> = { 0: 'Draft', 1: 'Approved', 2: 'Issued' };
const money = (n: any) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PrintMonthlyReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [report, setReport] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await reportsApi.monthly.getById(id);
        setReport(data);
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
    if (!loading && report) {
      const timer = setTimeout(() => window.print(), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, report]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading report for print...</div>;
  }

  if (!report) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: Monthly report not found.</div>;
  }

  const financialProgress = report.originalContractSum > 0
    ? Math.round((report.grossValuationToDate / report.originalContractSum) * 1000) / 10
    : 0;

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
        <span className="doc-type-badge">Monthly Report Preview</span>
        <button onClick={() => window.print()} className="btn-print">Print / Save PDF</button>
      </div>

      <div className="print-document-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #3b82f6', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {tenant?.logoUrl && <img src={tenant.logoUrl.replace(/^https?:/i, '')} alt={`${tenant?.name || 'Company'} Logo`} style={{ height: '75px', objectFit: 'contain' }} />}
            <div>
              <h1 style={{ margin: '0 0 2px 0', fontSize: '26px', color: '#3b82f6', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{tenant?.name?.toUpperCase() || 'COMPANY NAME'}</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>{tenant?.address || 'Company Address'}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#111827', fontWeight: 700 }}>
              MONTHLY PROGRESS REPORT — {MONTH_NAMES[report.reportMonth - 1].toUpperCase()} {report.reportYear}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>{report.project?.name}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Status: {STATUS_LABELS[report.status]}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '30px' }}>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Original Contract Sum</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginTop: '4px' }}>{money(report.originalContractSum)}</div>
          </div>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Gross Valuation to Date</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>{money(report.grossValuationToDate)}</div>
            <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '2px' }}>{financialProgress}% Financial Progress</div>
          </div>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Net Certified Payable {report.latestCertificateNumber ? `(${report.latestCertificateNumber})` : ''}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>{money(report.netCertifiedPayable)}</div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>1. Trade Section Progress Breakdown</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Section</th>
                <th style={{ padding: '6px 8px' }}>Trade Description</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>BOQ Budget</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Valued to Date</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>% Complete</th>
              </tr>
            </thead>
            <tbody>
              {(report.sectionBreakdown || []).map((s: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600, color: '#2563eb' }}>Sec {s.sectionCode}</td>
                  <td style={{ padding: '6px 8px' }}>{s.sectionName}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{money(s.budget)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{money(s.valuedToDate)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{s.percentComplete}%</td>
                </tr>
              ))}
              {(!report.sectionBreakdown || report.sectionBreakdown.length === 0) && (
                <tr><td colSpan={5} style={{ padding: '10px', textAlign: 'center', color: '#9ca3af' }}>No section-level data available for this report.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>2. Progress Narrative &amp; Safety Summary</h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
            Safety this month: {report.safetyIncidentsCount} incidents, {report.nearMissesCount} near misses. Permits-to-work: {report.activePermitsCount} active, {report.permitCompliancePercent?.toFixed(0) ?? 100}% compliant.
          </p>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap' }}>{report.narrative}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', borderTop: '1px solid #e5e7eb', marginTop: '30px', paddingTop: '24px', fontSize: '12px', color: '#4b5563' }}>
          <div>
            <p style={{ margin: '0 0 30px 0' }}>Prepared By: _______________________</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Date: _______________</p>
          </div>
          <div>
            <p style={{ margin: '0 0 30px 0' }}>Approved By (Director): _______________________</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Date: _______________</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .print-page-wrapper { background-color: #f8fafc; min-height: 100vh; padding: 30px 20px; display: flex; flex-direction: column; align-items: center; font-family: system-ui, -apple-system, sans-serif; }
        .print-controls-bar { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 900px; background: #ffffff; padding: 12px 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px; border: 1px solid #e2e8f0; box-sizing: border-box; }
        .btn-back { background: transparent; border: 1px solid #cbd5e1; color: #475569; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; }
        .btn-back:hover { background: #f1f5f9; }
        .btn-print { background: #3b82f6; color: #fff; border: none; padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-print:hover { background: #2563eb; }
        .doc-type-badge { font-size: 14px; font-weight: 600; color: #0f172a; }
        .print-document-card { width: 100%; max-width: 900px; background: #ffffff; padding: 50px 60px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; color: #1e293b; box-sizing: border-box; }
        @media print {
          @page { margin: 0; size: portrait; }
          body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .print-page-wrapper { background: #ffffff !important; padding: 0 !important; min-height: auto !important; }
          .no-print { display: none !important; }
          .print-document-card { box-shadow: none !important; border: none !important; padding: 1.5cm 1.5cm !important; margin: 0 !important; max-width: none !important; width: 100% !important; }
        }
      `}} />
    </div>
  );
}

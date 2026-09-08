'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { siteDiaryApi, tenantsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const STATUS_LABELS: Record<number, string> = {
  0: 'Draft',
  1: 'Submitted',
  2: 'Approved',
};

export default function PrintSiteDiaryPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [entry, setEntry] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const entryData = await siteDiaryApi.getById(id);
        setEntry(entryData);
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
    if (!loading && entry) {
      const timer = setTimeout(() => window.print(), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, entry]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading site diary for print...</div>;
  }

  if (!entry) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: Site Diary entry not found.</div>;
  }

  const labour = entry.labourHeadcounts || entry.LabourHeadcounts || [];
  const plant = entry.plantUsages || entry.PlantUsages || [];
  const deliveries = entry.deliveries || entry.Deliveries || [];
  const photos = entry.photos || entry.Photos || [];
  const safetyLogs = entry.safetyLogs || entry.SafetyLogs || [];
  const totalManHours = labour.reduce((sum: number, l: any) => sum + (Number(l.hoursWorked) || 0) * (Number(l.headcount) || 0), 0);
  const totalHeadcount = labour.reduce((sum: number, l: any) => sum + (Number(l.headcount) || 0), 0);
  const statusLabel = STATUS_LABELS[entry.status] || 'Draft';

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
        <span className="doc-type-badge">Daily Site Diary Preview</span>
        <button onClick={() => window.print()} className="btn-print">Print / Save PDF</button>
      </div>

      <div className="print-document-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #F59E0B', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {tenant?.logoUrl && <img src={tenant.logoUrl.replace(/^https?:/i, '')} alt={`${tenant?.name || 'Company'} Logo`} style={{ height: '75px', objectFit: 'contain' }} />}
            <div>
              <h1 style={{ margin: '0 0 2px 0', fontSize: '26px', color: '#F59E0B', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{tenant?.name?.toUpperCase() || 'COMPANY NAME'}</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>{tenant?.address || 'Company Address'}</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#6b7280' }}>{tenant?.contactEmail || 'contact@company.com'} {tenant?.contactPhone ? `· ${tenant.contactPhone}` : ''}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#111827', fontWeight: 700 }}>DAILY SITE DIARY</h2>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>{new Date(entry.diaryDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>Status: {statusLabel}</p>
          </div>
        </div>

        {/* Info section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '30px' }}>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Project</h3>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{entry.project?.name || entry.Project?.name || 'Project'}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Weather</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>{entry.weatherCondition}{entry.temperatureCelsius != null ? ` · ${entry.temperatureCelsius}°C` : ''}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Logged By</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>{entry.loggedBy ? `${entry.loggedBy.firstName} ${entry.loggedBy.lastName}` : '—'}</p>
          </div>
        </div>

        {/* Work performed */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Work Performed</h3>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#1e293b', whiteSpace: 'pre-wrap' }}>{entry.workPerformedSummary}</p>
        </div>

        {entry.siteInstructionsReceived && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>Site Instructions Received</h3>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#1e293b', whiteSpace: 'pre-wrap' }}>{entry.siteInstructionsReceived}</p>
          </div>
        )}

        {entry.delaysOrConstraints && (
          <div style={{ marginBottom: '24px', padding: '12px 15px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#92400e', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>Delays / Constraints</h3>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#78350f', whiteSpace: 'pre-wrap' }}>{entry.delaysOrConstraints}</p>
          </div>
        )}

        {/* Labour */}
        {labour.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
              Labour on Site — {totalHeadcount} workers, {totalManHours.toLocaleString()} man-hours
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Trade / Crew</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Headcount</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Hours</th>
                  <th style={{ padding: '6px 8px' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {labour.map((l: any) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{l.tradeOrCrewName}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{l.headcount}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{l.hoursWorked}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{l.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Plant */}
        {plant.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Plant &amp; Equipment</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Equipment</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Operating Hrs</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Idle Hrs</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Breakdown Hrs</th>
                </tr>
              </thead>
              <tbody>
                {plant.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{p.equipmentName}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.operatingHours}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.idleHours}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.breakdownHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Deliveries */}
        {deliveries.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Deliveries</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Supplier</th>
                  <th style={{ padding: '6px 8px' }}>Material</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '6px 8px' }}>Delivery Note #</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d: any) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{d.supplierName}</td>
                    <td style={{ padding: '6px 8px' }}>{d.materialDescription}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{d.quantityReceived} {d.unitOfMeasure}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{d.deliveryNoteNumber || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Safety */}
        {safetyLogs.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Safety</h3>
            {safetyLogs.map((s: any) => (
              <div key={s.id} style={{ fontSize: '12.5px', lineHeight: 1.7, color: '#1e293b', marginBottom: 8 }}>
                {s.toolboxTalkTopic && <p style={{ margin: '0 0 4px' }}><strong>Toolbox Talk:</strong> {s.toolboxTalkTopic}</p>}
                <p style={{ margin: '0 0 4px' }}><strong>Incidents:</strong> {s.incidentsReported} &nbsp; <strong>Near Misses:</strong> {s.nearMissesCount}</p>
                {s.hazardsIdentified && <p style={{ margin: '0 0 4px' }}><strong>Hazards Identified:</strong> {s.hazardsIdentified}</p>}
                {s.correctiveAction && <p style={{ margin: 0 }}><strong>Corrective Action:</strong> {s.correctiveAction}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>Site Photos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {photos.map((p: any) => (
                <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photoUrl} alt={p.caption || ''} style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign-off */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '24px', fontSize: '12px', color: '#4b5563' }}>
          <div>
            <p style={{ margin: '0 0 30px 0' }}>Logged By: _______________________</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Date: _______________</p>
          </div>
          <div>
            <p style={{ margin: '0 0 30px 0' }}>Site Manager / Approved By: _______________________</p>
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
          background: #F59E0B;
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
          background: #d97f06;
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

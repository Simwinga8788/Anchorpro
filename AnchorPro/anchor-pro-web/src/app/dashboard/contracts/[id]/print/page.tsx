'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { hrApi, tenantsApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function PrintContractPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [contract, setContract] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        const c = await hrApi.getContract(id);
        setContract(c);
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
    if (!loading && contract) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, contract]);

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading contract for print...</div>;
  }

  if (!contract) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>Error: Contract not found.</div>;
  }

  return (
    <div className="print-page-wrapper">
      {/* On-screen controls bar (hidden on print) */}
      <div className="no-print print-controls-bar">
        <button onClick={() => router.back()} className="btn-back">
          ← Back
        </button>
        <span className="doc-type-badge">Employment Contract</span>
        <button onClick={() => window.print()} className="btn-print">
          Print / Save PDF
        </button>
      </div>

      {/* The actual document card */}
      <div className="print-document-card" style={{ maxWidth: 900, margin: '0 auto' }}>
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
            <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#111827', fontWeight: 700 }}>EMPLOYMENT CONTRACT</h2>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Employee No: {contract.user?.employeeNumber || '—'}</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Contract Body */}
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: '"Times New Roman", Times, serif', 
          fontSize: '14.5px', 
          lineHeight: '1.6',
          color: '#111827',
          textAlign: 'justify',
          marginBottom: '60px'
        }}>
          {contract.contractBody || "No contract text found."}
        </div>

        {/* Signature Blocks */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', paddingTop: '30px' }}>
          <div style={{ width: '40%' }}>
            <div style={{ borderTop: '1px solid #111827', paddingTop: '8px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>For the Employer (Anchor Pro)</p>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>Name: ______________________</p>
              <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: '13px' }}>Date: ______________________</p>
            </div>
          </div>
          
          <div style={{ width: '40%' }}>
            <div style={{ borderTop: '1px solid #111827', paddingTop: '8px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>For the Employee</p>
              <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>Name: {contract.user?.firstName} {contract.user?.lastName}</p>
              <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: '13px' }}>Date: ______________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

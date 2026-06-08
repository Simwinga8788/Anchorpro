'use client';

import { useState, useEffect } from 'react';
import { toolsApi } from '@/lib/api';
import { Wrench, Plus, ArrowRightLeft, CheckCircle } from 'lucide-react';
import ReceiveToolModal from '@/components/tools/ReceiveToolModal';
import IssueToolModal from '@/components/tools/IssueToolModal';
import ReturnToolModal from '@/components/tools/ReturnToolModal';

const conditionMap: Record<number, { label: string, color: string }> = {
  1: { label: 'New', color: 'var(--accent-emerald)' },
  2: { label: 'Good', color: 'var(--accent-blue)' },
  3: { label: 'Fair', color: 'var(--accent-amber)' },
  4: { label: 'Damaged', color: 'var(--accent-rose)' },
};

const statusMap: Record<number, { label: string, badgeClass: string }> = {
  1: { label: 'Available', badgeClass: 'badge-success' },
  2: { label: 'Issued', badgeClass: 'badge-warning' },
  3: { label: 'Under Repair', badgeClass: 'badge-error' },
  4: { label: 'Lost', badgeClass: 'badge-error' },
  5: { label: 'Retired', badgeClass: 'badge-neutral' },
};

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'issued'>('all');
  const [tools, setTools] = useState<any[]>([]);
  const [issuedTools, setIssuedTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showReceive, setShowReceive] = useState(false);
  
  const [issueTarget, setIssueTarget] = useState<{ id: number, name: string, condition: number } | null>(null);
  const [returnTarget, setReturnTarget] = useState<{ id: number, toolName: string, assignedName: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allToolsData, issuedToolsData] = await Promise.all([
        toolsApi.getAll(),
        toolsApi.getIssued()
      ]);
      setTools(allToolsData);
      setIssuedTools(issuedToolsData);
    } catch (err) {
      console.error('Failed to fetch tools data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="fade-in">
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Wrench className="text-accent-blue" /> Tools Registry
        </h1>
        <button className="btn btn-primary" onClick={() => setShowReceive(true)}>
          <Plus size={16} /> Receive New Tool
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Tools ({tools.length})
        </button>
        <button 
          className={`tab ${activeTab === 'issued' ? 'active' : ''}`}
          onClick={() => setActiveTab('issued')}
        >
          Currently Issued ({issuedTools.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading tools...</div>
      ) : activeTab === 'all' ? (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Tag / S.N.</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Received Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tools.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                      No tools registered yet.
                    </td>
                  </tr>
                ) : tools.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.toolTag}</td>
                    <td>
                      <div>{t.name}</div>
                      {t.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.description}</div>}
                    </td>
                    <td>
                      <span className={`badge ${statusMap[t.status]?.badgeClass || 'badge-neutral'}`}>
                        {statusMap[t.status]?.label || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: conditionMap[t.condition]?.color, fontWeight: 500 }}>
                        {conditionMap[t.condition]?.label || 'Unknown'}
                      </span>
                    </td>
                    <td>{new Date(t.receivedDate).toLocaleDateString()}</td>
                    <td>
                      {t.status === 1 /* Available */ && (
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => setIssueTarget({ id: t.id, name: t.name, condition: t.condition })}
                        >
                          <ArrowRightLeft size={14} style={{ marginRight: 6 }}/> Issue
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Assigned To</th>
                  <th>Issued Date</th>
                  <th>Expected Return</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issuedTools.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                      No tools are currently issued.
                    </td>
                  </tr>
                ) : issuedTools.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tx.tool?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tag: {tx.tool?.toolTag}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tx.assignedToUser?.firstName} {tx.assignedToUser?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.assignedToUser?.email}</div>
                    </td>
                    <td>{new Date(tx.issuedAt).toLocaleDateString()}</td>
                    <td>
                      {tx.expectedReturnDate ? new Date(tx.expectedReturnDate).toLocaleDateString() : <span style={{ color: 'var(--text-muted)' }}>Not set</span>}
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => setReturnTarget({ 
                          id: tx.id, 
                          toolName: tx.tool?.name, 
                          assignedName: `${tx.assignedToUser?.firstName} ${tx.assignedToUser?.lastName}` 
                        })}
                      >
                        <CheckCircle size={14} style={{ marginRight: 6 }}/> Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showReceive && (
        <ReceiveToolModal 
          onClose={() => setShowReceive(false)} 
          onSuccess={fetchData} 
        />
      )}
      
      {issueTarget && (
        <IssueToolModal 
          toolId={issueTarget.id}
          toolName={issueTarget.name}
          currentCondition={issueTarget.condition}
          onClose={() => setIssueTarget(null)} 
          onSuccess={fetchData} 
        />
      )}
      
      {returnTarget && (
        <ReturnToolModal 
          transactionId={returnTarget.id}
          toolName={returnTarget.toolName}
          assignedToName={returnTarget.assignedName}
          onClose={() => setReturnTarget(null)} 
          onSuccess={fetchData} 
        />
      )}
    </div>
  );
}

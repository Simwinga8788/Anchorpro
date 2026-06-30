'use client';

import { useState, useEffect, useRef } from 'react';
import { toolsApi } from '@/lib/api';
import { Wrench, Plus, ArrowRightLeft, CheckCircle, Search, Download, Upload, FileSpreadsheet, Pencil } from 'lucide-react';
import ReceiveToolModal from '@/components/tools/ReceiveToolModal';
import IssueToolModal from '@/components/tools/IssueToolModal';
import ReturnToolModal from '@/components/tools/ReturnToolModal';
import EditToolModal from '@/components/tools/EditToolModal';
import ResponsiveTable from '@/components/ResponsiveTable';

const conditionMap: Record<number, { label: string, color: string, badgeClass: string }> = {
  1: { label: 'New', color: 'var(--accent-emerald)', badgeClass: 'badge-green' },
  2: { label: 'Good', color: 'var(--accent-blue)', badgeClass: 'badge-blue' },
  3: { label: 'Fair', color: 'var(--accent-amber)', badgeClass: 'badge-amber' },
  4: { label: 'Damaged', color: 'var(--accent-rose)', badgeClass: 'badge-red' },
};

const statusMap: Record<number, { label: string, badgeClass: string }> = {
  1: { label: 'Available', badgeClass: 'badge-green' },
  2: { label: 'Issued', badgeClass: 'badge-amber' },
  3: { label: 'Under Repair', badgeClass: 'badge-red' },
  4: { label: 'Lost', badgeClass: 'badge-red' },
  5: { label: 'Retired', badgeClass: 'badge-muted' },
};

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'issued'>('all');
  const [search, setSearch] = useState('');
  const [tools, setTools] = useState<any[]>([]);
  const [issuedTools, setIssuedTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showReceive, setShowReceive] = useState(false);
  const [issueTarget, setIssueTarget] = useState<{ id: number, name: string, condition: number } | null>(null);
  const [returnTarget, setReturnTarget] = useState<{ id: number, toolName: string, assignedName: string } | null>(null);
  const [editTarget,   setEditTarget]   = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export/tools/excel', { credentials: 'include' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tools-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Failed to export: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/tools/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      let errMsg = 'Import failed';
      if (!res.ok) {
        try {
          const json = await res.json();
          if (json.message) errMsg = json.message;
          else if (json.errors) errMsg = Object.values(json.errors).flat().join('\n');
        } catch {
          const text = await res.text();
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }
      
      const data = await res.json();
      alert(data.message || 'Import successful!');
      fetchData();
    } catch (err: any) {
      console.error('Import error:', err);
      alert('Failed to import: ' + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/export/tools/template';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allToolsData, issuedToolsData] = await Promise.all([
        toolsApi.getAll(),
        toolsApi.getIssued()
      ]);
      setTools(allToolsData || []);
      setIssuedTools(issuedToolsData || []);
    } catch (err) {
      console.error('Failed to fetch tools data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTools = tools.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) || 
    t.toolTag?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIssuedTools = issuedTools.filter(tx => 
    tx.tool?.name?.toLowerCase().includes(search.toLowerCase()) || 
    tx.tool?.toolTag?.toLowerCase().includes(search.toLowerCase()) ||
    `${tx.assignedToUser?.firstName} ${tx.assignedToUser?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="animate-in">
        {/* Page Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wrench className="text-accent-blue" size={22} /> Tools Registry
            </h1>
            <p className="page-subtitle">{tools.length} registered tools · {issuedTools.length} currently issued</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={handleDownloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileSpreadsheet size={14} /> Template
            </button>
            <button className="btn btn-secondary" onClick={handleExport} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> {exporting ? 'Exporting...' : 'Export'}
            </button>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={importing} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} /> {importing ? 'Importing...' : 'Import'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv,.xlsx"
              onChange={handleImport}
            />
            <button className="btn btn-primary" onClick={() => setShowReceive(true)}>
              <Plus size={14} /> Receive New Tool
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
          {[
            { key: 'all', label: `All Tools (${tools.length})`, icon: <Wrench size={13}/> },
            { key: 'issued', label: `Currently Issued (${issuedTools.length})`, icon: <ArrowRightLeft size={13}/> },
          ].map(tab => (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
                fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? 'var(--accent-blue)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Table Container */}
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Search Bar */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="search-input" 
                style={{ width: '100%', paddingLeft: 30 }} 
                placeholder="Search by name, tag, technician..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading tools...</div>
          ) : activeTab === 'all' ? (
            <div className="table-scroll">
              <ResponsiveTable>
<table className="data-table">
                <thead>
                  <tr>
                    <th>Tag / S.N.</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Condition</th>
                    <th>Received Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTools.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        No tools registered yet.
                      </td>
                    </tr>
                  ) : filteredTools.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-blue)', fontFamily: 'monospace', fontSize: 13 }}>{t.toolTag}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                        {t.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{t.description}</div>}
                      </td>
                      <td>
                        <span className={`badge ${statusMap[t.status]?.badgeClass || 'badge-muted'}`}>
                          {statusMap[t.status]?.label || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${conditionMap[t.condition]?.badgeClass || 'badge-muted'}`}>
                          {conditionMap[t.condition]?.label || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{new Date(t.receivedDate).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Edit tool details / rename tag"
                            onClick={() => setEditTarget(t)}
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          {t.status === 1 /* Available */ && (
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => setIssueTarget({ id: t.id, name: t.name, condition: t.condition })}
                            >
                              <ArrowRightLeft size={13} /> Issue
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
</ResponsiveTable>
            </div>
          ) : (
            <div className="table-scroll">
              <ResponsiveTable>
<table className="data-table">
                <thead>
                  <tr>
                    <th>Tool</th>
                    <th>Assigned To</th>
                    <th>Issued Date</th>
                    <th>Expected Return</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssuedTools.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        No tools are currently issued.
                      </td>
                    </tr>
                  ) : filteredIssuedTools.map(tx => {
                    const isOverdue = tx.expectedReturnDate && new Date(tx.expectedReturnDate) < new Date();
                    return (
                      <tr key={tx.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.tool?.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: 2 }}>Tag: {tx.tool?.toolTag}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.assignedToUser?.firstName} {tx.assignedToUser?.lastName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{tx.assignedToUser?.email}</div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{new Date(tx.issuedAt).toLocaleDateString()}</td>
                        <td>
                          {tx.expectedReturnDate ? (
                            <span className={`badge ${isOverdue ? 'badge-red' : 'badge-muted'}`} style={{ fontWeight: 600 }}>
                              {new Date(tx.expectedReturnDate).toLocaleDateString()}
                              {isOverdue && ' (Overdue)'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not set</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setReturnTarget({ 
                              id: tx.id, 
                              toolName: tx.tool?.name, 
                              assignedName: `${tx.assignedToUser?.firstName} ${tx.assignedToUser?.lastName}` 
                            })}
                          >
                            <CheckCircle size={13} /> Return
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
</ResponsiveTable>
            </div>
          )}
        </div>
      </div>

      {/* Modals rendered outside of the anim-transform block so position:fixed works relative to viewport */}
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
      {editTarget && (
        <EditToolModal
          tool={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={fetchData}
        />
      )}
    </>
  );
}

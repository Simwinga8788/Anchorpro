'use client';

import { useState } from 'react';
import { toolsApi } from '@/lib/api';
import { X } from 'lucide-react';

export default function ReturnToolModal({ 
  transactionId,
  toolName,
  assignedToName,
  onClose, 
  onSuccess 
}: { 
  transactionId: number, 
  toolName: string,
  assignedToName: string,
  onClose: () => void, 
  onSuccess: () => void 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    transactionId: transactionId,
    returnCondition: 2, // Default to Good
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await toolsApi.returnTool(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to return tool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.65)', 
        zIndex: 1000, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflowY: 'auto',
        padding: '40px 16px',
        backdropFilter: 'blur(2px)' 
      }} 
      onClick={onClose}
    >
      <div 
        className="card-elevated" 
        style={{ width: 480, padding: 28, position: 'relative' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Return Tool</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{toolName} · Returning from {assignedToName}</p>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16, marginTop: 10 }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
          <div className="form-field">
            <label className="form-label">Return Condition</label>
            <select 
              className="form-select"
              value={formData.returnCondition}
              onChange={e => setFormData({...formData, returnCondition: Number(e.target.value)})}
            >
              <option value={1}>New</option>
              <option value={2}>Good</option>
              <option value={3}>Fair</option>
              <option value={4}>Damaged</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Return Notes (Optional)</label>
            <textarea 
              className="form-textarea" 
              rows={3}
              placeholder="Any issues reported? e.g. calibration slightly off..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

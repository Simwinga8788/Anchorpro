'use client';

import { useState } from 'react';
import { toolsApi } from '@/lib/api';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Return Tool: {toolName}</h2>
        <p style={{ marginBottom: 16, color: 'var(--text-muted)' }}>
          Returning from {assignedToName}
        </p>
        {error && <div className="alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Return Condition</label>
            <select 
              className="input"
              value={formData.returnCondition}
              onChange={e => setFormData({...formData, returnCondition: Number(e.target.value)})}
            >
              <option value={1}>New</option>
              <option value={2}>Good</option>
              <option value={3}>Fair</option>
              <option value={4}>Damaged</option>
            </select>
          </div>

          <div className="form-group">
            <label>Return Notes (Optional)</label>
            <textarea 
              className="input" 
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Any issues reported?"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
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

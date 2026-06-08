'use client';

import { useState, useEffect } from 'react';
import { toolsApi, usersApi } from '@/lib/api';

export default function IssueToolModal({ 
  toolId,
  toolName,
  currentCondition,
  onClose, 
  onSuccess 
}: { 
  toolId: number, 
  toolName: string,
  currentCondition: number,
  onClose: () => void, 
  onSuccess: () => void 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    toolId: toolId,
    assignedToUserId: '',
    condition: currentCondition,
    expectedReturnDate: '',
    notes: ''
  });

  useEffect(() => {
    usersApi.getAll().then(setUsers).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assignedToUserId) {
      setError('Please select a technician');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await toolsApi.issueTool({
        ...formData,
        expectedReturnDate: formData.expectedReturnDate ? new Date(formData.expectedReturnDate).toISOString() : null
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to issue tool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Issue Tool: {toolName}</h2>
        {error && <div className="alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Assign To</label>
            <select 
              className="input"
              value={formData.assignedToUserId}
              onChange={e => setFormData({...formData, assignedToUserId: e.target.value})}
              required
            >
              <option value="">Select a technician...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Condition on Issue</label>
            <select 
              className="input"
              value={formData.condition}
              onChange={e => setFormData({...formData, condition: Number(e.target.value)})}
            >
              <option value={1}>New</option>
              <option value={2}>Good</option>
              <option value={3}>Fair</option>
              <option value={4}>Damaged</option>
            </select>
          </div>

          <div className="form-group">
            <label>Expected Return Date (Optional)</label>
            <input 
              type="datetime-local" 
              className="input" 
              value={formData.expectedReturnDate}
              onChange={e => setFormData({...formData, expectedReturnDate: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea 
              className="input" 
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Issuing...' : 'Issue Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

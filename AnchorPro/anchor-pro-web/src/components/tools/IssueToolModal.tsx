'use client';

import { useState, useEffect } from 'react';
import { toolsApi, usersApi } from '@/lib/api';
import { X } from 'lucide-react';

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
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.65)', 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
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
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Issue Tool</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{toolName}</p>
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
            <label className="form-label">Assign To</label>
            <select 
              className="form-select"
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

          <div className="form-field">
            <label className="form-label">Condition on Issue</label>
            <select 
              className="form-select"
              value={formData.condition}
              onChange={e => setFormData({...formData, condition: Number(e.target.value)})}
            >
              <option value={1}>New</option>
              <option value={2}>Good</option>
              <option value={3}>Fair</option>
              <option value={4}>Damaged</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Expected Return Date (Optional)</label>
            <input 
              type="datetime-local" 
              className="form-input" 
              value={formData.expectedReturnDate}
              onChange={e => setFormData({...formData, expectedReturnDate: e.target.value})}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Notes (Optional)</label>
            <textarea 
              className="form-textarea" 
              rows={3}
              placeholder="e.g. For the duration of the Crusher Maintenance job..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
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

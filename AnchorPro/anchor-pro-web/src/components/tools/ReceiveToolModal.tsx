'use client';

import { useState } from 'react';
import { toolsApi } from '@/lib/api';

export default function ReceiveToolModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    toolTag: '',
    description: '',
    condition: 1, // New = 1, Good = 2, Fair = 3, Damaged = 4
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await toolsApi.receiveTool(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to receive tool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Receive New Tool</h2>
        {error && <div className="alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tool Name</label>
            <input 
              type="text" 
              required
              className="input" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Tool Tag / Serial Number</label>
            <input 
              type="text" 
              required
              className="input" 
              value={formData.toolTag}
              onChange={e => setFormData({...formData, toolTag: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Initial Condition</label>
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
            <label>Description (Optional)</label>
            <textarea 
              className="input" 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

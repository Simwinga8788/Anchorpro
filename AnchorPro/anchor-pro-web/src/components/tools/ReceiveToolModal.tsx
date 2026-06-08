'use client';

import { useState } from 'react';
import { toolsApi } from '@/lib/api';
import { X } from 'lucide-react';

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Receive New Tool</h2>
          <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label className="form-label">Tool Name</label>
            <input 
              type="text" 
              required
              className="form-input" 
              placeholder="e.g. Impact Wrench 1/2-inch"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="form-field">
            <label className="form-label">Tool Tag / Serial Number</label>
            <input 
              type="text" 
              required
              className="form-input" 
              placeholder="e.g. TL-WRE-0042"
              value={formData.toolTag}
              onChange={e => setFormData({...formData, toolTag: e.target.value})}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Initial Condition</label>
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
            <label className="form-label">Description (Optional)</label>
            <textarea 
              className="form-textarea" 
              rows={3}
              placeholder="Manufacturer details, calibration requirements..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
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

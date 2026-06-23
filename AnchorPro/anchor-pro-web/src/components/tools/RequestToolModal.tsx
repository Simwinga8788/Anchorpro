import { useState } from 'react';
import { toolsApi } from '@/lib/api';
import { X } from 'lucide-react';

interface RequestToolModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestToolModal({ onClose, onSuccess }: RequestToolModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestedToolName, setRequestedToolName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await toolsApi.createRequest({ requestedToolName, notes });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-in">
        <div className="modal-header">
          <h2 className="modal-title">Request Tool</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label className="form-label">What tool do you need? *</label>
              <input 
                type="text" 
                className="form-control" 
                value={requestedToolName}
                onChange={e => setRequestedToolName(e.target.value)}
                placeholder="e.g. Heavy Duty Impact Wrench"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea 
                className="form-control" 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Why do you need it? Specific brand required?"
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !requestedToolName}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

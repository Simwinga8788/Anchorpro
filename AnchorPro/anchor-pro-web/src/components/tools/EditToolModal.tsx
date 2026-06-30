'use client';

import { useState } from 'react';
import { toolsApi } from '@/lib/api';
import { X, Save, Tag, Trash2 } from 'lucide-react';

const CONDITIONS = ['New', 'Good', 'Fair', 'Damaged'];

interface Tool {
  id: number;
  name: string;
  description?: string | null;
  toolTag: string;
  condition: number;
  purchaseCost?: number | null;
}

interface Props {
  tool: Tool;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditToolModal({ tool, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    name:         tool.name,
    description:  tool.description ?? '',
    toolTag:      tool.toolTag,
    condition:    tool.condition,
    purchaseCost: tool.purchaseCost != null ? String(tool.purchaseCost) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim())    { setError('Name is required.'); return; }
    if (!form.toolTag.trim()) { setError('Tag is required.'); return; }

    setSaving(true);
    setError('');
    try {
      await toolsApi.updateTool(tool.id, {
        name:         form.name.trim(),
        description:  form.description.trim() || null,
        toolTag:      form.toolTag.trim(),
        condition:    Number(form.condition),
        purchaseCost: form.purchaseCost ? parseFloat(form.purchaseCost) : null,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete tool "${tool.name}" (${tool.toolTag})? This action cannot be undone.`)) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      await toolsApi.deleteTool(tool.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete tool.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag size={18} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Edit Tool</span>
          </div>
          <button
            id="edit-tool-close"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px',
              fontSize: 13, color: 'var(--status-red)',
            }}>
              {error}
            </div>
          )}

          {/* Tool Tag — highlighted first because that's what the user asked about */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tool Tag *
            </label>
            <input
              id="edit-tool-tag"
              className="form-input"
              value={form.toolTag}
              onChange={e => setForm({ ...form, toolTag: e.target.value })}
              placeholder="e.g. T-DRILL-01"
              style={{ fontFamily: 'monospace' }}
              required
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Must be unique across your tools. Auto-generated tags can be renamed freely.
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Name *
            </label>
            <input
              id="edit-tool-name"
              className="form-input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Tool name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Description
            </label>
            <textarea
              id="edit-tool-desc"
              className="form-input"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Optional description"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Condition + Purchase Cost side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Condition
              </label>
              <select
                id="edit-tool-condition"
                className="form-input"
                value={form.condition}
                onChange={e => setForm({ ...form, condition: Number(e.target.value) })}
              >
                {CONDITIONS.map((c, i) => (
                  <option key={c} value={i}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Purchase Cost
              </label>
              <input
                id="edit-tool-cost"
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                value={form.purchaseCost}
                onChange={e => setForm({ ...form, purchaseCost: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <button
              type="button"
              id="edit-tool-delete"
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Trash2 size={13} />
              Delete Tool
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                id="edit-tool-cancel"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="edit-tool-save"
                className="btn btn-primary"
                disabled={saving}
              >
                <Save size={15} />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export default function SlideOver({
  open, onClose, title, subtitle, children, footer, width = 520
}: SlideOverProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="slideover-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="slideover-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width }}
      >
        {/* Header */}
        <div className="slideover-header">
          <div>
            <div className="slideover-title">{title}</div>
            {subtitle && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 6, borderRadius: 6 }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="slideover-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="slideover-footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

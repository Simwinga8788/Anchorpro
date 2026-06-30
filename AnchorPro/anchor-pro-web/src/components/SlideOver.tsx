'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import Portal from './Portal';

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
  open, onClose, title, subtitle, children, footer, width = 540
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
    <Portal>
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="modal-content animate-in" 
          onClick={e => e.stopPropagation()} 
          style={{ maxWidth: width, width: '90%' }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Header */}
          <div className="modal-header">
            <div>
              <h2 className="modal-title">{title}</h2>
              {subtitle && (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {subtitle}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="modal-close"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}

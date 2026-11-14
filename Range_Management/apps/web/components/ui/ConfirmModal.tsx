'use client';

import React, { useEffect } from 'react';
import { MaterialIcon } from './TacticalIcons';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  secondaryLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onSecondary?: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  secondaryLabel,
  danger = true,
  loading = false,
  onConfirm,
  onSecondary,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={() => !loading && onCancel()}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-[calc(1.5rem+var(--sab))] sm:pb-6 shadow-2xl space-y-4 animate-slide-up"
        style={{
          background: 'var(--bg-surface)',
          border: danger
            ? '1px solid rgba(255, 77, 109, 0.35)'
            : '1px solid var(--border-subtle)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center -mt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: danger ? 'rgba(255, 77, 109, 0.14)' : 'rgba(245, 166, 35, 0.14)',
              color: danger ? '#FF4D6D' : '#F5A623',
              border: danger ? '1px solid rgba(255, 77, 109, 0.3)' : '1px solid rgba(245, 166, 35, 0.3)',
            }}
          >
            <MaterialIcon name={danger ? 'warning' : 'verified_user'} className="text-[20px]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-modal-title"
              className="font-display font-bold text-base uppercase tracking-wide"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </h3>
            <p
              className="text-xs leading-relaxed mt-1 whitespace-pre-line"
              style={{ color: 'var(--text-secondary)' }}
            >
              {message}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider border border-white/15 transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: 'var(--text-secondary)' }}
          >
            {cancelLabel}
          </button>

          {secondaryLabel && onSecondary && (
            <button
              type="button"
              disabled={loading}
              onClick={() => void onSecondary()}
              className="px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider border border-[#F5A623]/40 bg-[#F5A623]/15 text-[#F5A623] hover:bg-[#F5A623]/25 transition-colors disabled:opacity-50"
            >
              {secondaryLabel}
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => void onConfirm()}
            className="px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            style={{
              background: danger ? '#FF4D6D' : '#F5A623',
              color: danger ? '#FFFFFF' : '#080A0F',
            }}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


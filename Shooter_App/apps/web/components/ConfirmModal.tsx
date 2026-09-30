// apps/web/components/ConfirmModal.tsx — Reusable confirmation dialog
'use client';

import React, { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

const VARIANT_STYLES = {
  danger: {
    icon: (
      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="#FF4D6D" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
        <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
      </svg>
    ),
    btn: 'bg-[#FF4D6D]/15 border-[#FF4D6D]/30 text-[#FF4D6D] hover:bg-[#FF4D6D]/25',
  },
  warning: {
    icon: (
      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="#F5A623" strokeWidth={1.5}>
        <path d="M12 9v4m0 4h.01M10.29 3.86l-8.8 15.32A2 2 0 003.23 22h17.54a2 2 0 001.74-2.82l-8.8-15.32a2 2 0 00-3.42 0z" />
      </svg>
    ),
    btn: 'bg-[#F5A623]/15 border-[#F5A623]/30 text-[#F5A623] hover:bg-[#F5A623]/25',
  },
  default: {
    icon: (
      <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="#4FC3F7" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
        <path d="M12 16v-4m0-4h.01" strokeLinecap="round" />
      </svg>
    ),
    btn: 'bg-[#4FC3F7]/15 border-[#4FC3F7]/30 text-[#4FC3F7] hover:bg-[#4FC3F7]/25',
  },
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const style = VARIANT_STYLES[variant];

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-sm rounded-xl border border-white/[0.06] bg-surface p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-4">
          {style.icon}
          <div>
            <h3 className="font-display text-lg font-semibold text-text-primary">{title}</h3>
            <p className="mt-1 text-sm text-text-secondary leading-relaxed">{message}</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn btn-ghost flex-1 text-xs py-2.5"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 rounded-lg border text-xs font-medium py-2.5 px-4 transition-colors disabled:opacity-50 ${style.btn}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

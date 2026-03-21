'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

/* ── Types ──────────────────────────────────────────────────────────────── */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

/* ── Context ────────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/* ── Constants ──────────────────────────────────────────────────────────── */

const AUTO_DISMISS_MS = 4000;
const EXIT_ANIMATION_MS = 350;
const MAX_VISIBLE = 3;

/* ── Color map ──────────────────────────────────────────────────────────── */

const colorMap: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: {
    border: '#00E5A0',
    icon: '#00E5A0',
    bg: 'rgba(0, 229, 160, 0.08)',
  },
  error: {
    border: '#FF4D6D',
    icon: '#FF4D6D',
    bg: 'rgba(255, 77, 109, 0.08)',
  },
  info: {
    border: '#4FC3F7',
    icon: '#4FC3F7',
    bg: 'rgba(79, 195, 247, 0.08)',
  },
  warning: {
    border: '#F5A623',
    icon: '#F5A623',
    bg: 'rgba(245, 166, 35, 0.08)',
  },
};

const iconMap: Record<ToastType, string> = {
  success: '\u2713',
  error: '\u2715',
  info: 'i',
  warning: '!',
};

/* ── Provider ───────────────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /* Remove a toast (with exit animation) */
  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  /* Public toast function */
  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((prev) => {
        const next = [...prev, { id, message, type, exiting: false }];
        /* If over the limit, start dismissing the oldest */
        if (next.filter((t) => !t.exiting).length > MAX_VISIBLE) {
          const oldest = next.find((t) => !t.exiting);
          if (oldest) {
            setTimeout(() => dismiss(oldest.id), 0);
          }
        }
        return next;
      });

      /* Auto-dismiss */
      const timer = setTimeout(() => {
        dismiss(id);
        timersRef.current.delete(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  /* Cleanup timers on unmount */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* ── Toast container ──────────────────────────────────────────── */}
      <div
        className="fixed z-[100] pointer-events-none"
        style={{
          top: '1rem',
          right: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: '24rem',
          width: '100%',
        }}
      >
        {toasts.map((t) => {
          const colors = colorMap[t.type];
          return (
            <div
              key={t.id}
              className={`toast toast-${t.type} pointer-events-auto`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: '0.625rem',
                background: 'rgba(12, 15, 26, 0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid rgba(255, 255, 255, 0.055)`,
                borderLeft: `3px solid ${colors.border}`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.45), inset 0 0 48px ${colors.bg}`,
                color: '#F0F4FF',
                animation: t.exiting
                  ? `toastExit ${EXIT_ANIMATION_MS}ms ease-in forwards`
                  : 'toastEnter 300ms ease-out forwards',
              }}
            >
              {/* Icon badge */}
              <span
                style={{
                  flexShrink: 0,
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-display, Rajdhani, sans-serif)',
                  background: colors.bg,
                  color: colors.icon,
                  border: `1px solid ${colors.border}33`,
                }}
              >
                {iconMap[t.type]}
              </span>

              {/* Message */}
              <span
                style={{
                  flex: 1,
                  fontSize: '0.875rem',
                  lineHeight: 1.45,
                  fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
                }}
              >
                {t.message}
              </span>

              {/* Dismiss button */}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                style={{
                  flexShrink: 0,
                  background: 'transparent',
                  border: 'none',
                  color: '#8892A4',
                  cursor: 'pointer',
                  padding: '0.125rem',
                  fontSize: '1rem',
                  lineHeight: 1,
                  fontFamily: 'var(--font-display, Rajdhani, sans-serif)',
                  transition: 'color 150ms',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = '#F0F4FF')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = '#8892A4')
                }
              >
                {'\u2715'}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Keyframe animations ──────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes toastEnter {
          0% {
            opacity: 0;
            transform: translateX(100%);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes toastExit {
          0% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        /* Mobile: bottom positioning */
        @media (max-width: 640px) {
          .fixed.z-\\[100\\] {
            top: auto !important;
            bottom: 1rem !important;
            right: 0.5rem !important;
            left: 0.5rem !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────────────────────── */

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

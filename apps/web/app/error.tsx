'use client';

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#080A0F] flex items-center justify-center px-6">
      <div className="flex flex-col items-center text-center max-w-md animate-slide-up">
        {/* Error icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: 'rgba(255,77,109,0.08)',
            border: '1px solid rgba(255,77,109,0.2)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF4D6D" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="font-display font-bold text-xl text-[#F0F4FF] mb-2">
          Something went wrong
        </h2>
        <p className="text-[#4A5568] text-sm mb-6">
          An unexpected error occurred. This has been logged and we will investigate.
        </p>

        <div className="flex gap-3">
          <button onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <a href="/dashboard" className="btn btn-ghost">
            Back to Dashboard
          </a>
        </div>

        {error.digest && (
          <p className="text-[#2A3040] text-[10px] font-data mt-6 select-all">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

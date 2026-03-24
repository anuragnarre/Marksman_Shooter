'use client';

import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient orbs */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '20%', left: '10%',
          width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(245,166,35,0.04) 0%, transparent 65%)',
          animation: 'orbFloat 18s ease-in-out infinite',
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: '10%', right: '5%',
          width: '30vw', height: '30vw',
          background: 'radial-gradient(circle, rgba(79,195,247,0.03) 0%, transparent 65%)',
          animation: 'orbFloat 22s ease-in-out infinite reverse',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md animate-slide-up">
        {/* Crosshair with "miss" effect */}
        <div className="relative mb-8">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-30">
            <circle cx="60" cy="60" r="50" stroke="#F5A623" strokeWidth="1" />
            <circle cx="60" cy="60" r="35" stroke="#F5A623" strokeWidth="1" />
            <circle cx="60" cy="60" r="20" stroke="#F5A623" strokeWidth="1" />
            <circle cx="60" cy="60" r="5" fill="#F5A623" />
            <line x1="60" y1="5" x2="60" y2="35" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="60" y1="85" x2="60" y2="115" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5" y1="60" x2="35" y2="60" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="85" y1="60" x2="115" y2="60" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {/* Miss indicator - shot outside target */}
          <div
            className="absolute w-3 h-3 rounded-full"
            style={{
              top: '15%', right: '10%',
              background: '#FF4D6D',
              boxShadow: '0 0 12px rgba(255,77,109,0.6)',
              animation: 'dotPop 600ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both',
            }}
          />
        </div>

        {/* 404 number */}
        <h1
          className="font-display font-black text-7xl sm:text-8xl tracking-tight mb-4"
          style={{
            background: 'linear-gradient(135deg, #F5A623 0%, #FFD580 50%, #F5A623 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 4s linear infinite',
          }}
        >
          404
        </h1>

        <h2 className="font-display font-bold text-xl text-text-primary mb-2">
          Shot missed the target
        </h2>
        <p className="text-text-muted text-sm mb-8 max-w-xs">
          The page you are looking for does not exist or has been moved to a different range.
        </p>

        <div className="flex gap-3">
          <Link href="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

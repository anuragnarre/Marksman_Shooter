'use client'
import { useEffect, useState } from 'react'

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 2500 // hard cap — never exceed 2.5s
    const tick = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100)
      setProgress(p)
      if (p >= 100) { clearInterval(tick); setTimeout(onComplete, 300) }
    }, 16)
    return () => clearInterval(tick)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'var(--bg-void)' }}>
      <svg viewBox="0 0 80 80" className="w-16 h-16 mb-6">
        {[36, 28, 20, 12].map((r, i) => (
          <circle key={r} cx="40" cy="40" r={r}
            fill="none" stroke="#F5A623"
            strokeWidth={i === 0 ? 0.5 : 0.3}
            opacity={0.3 + i * 0.15} />
        ))}
        <circle cx="40" cy="40" r="3" fill="#F5A623" />
      </svg>
      <p className="font-display font-bold text-xl tracking-[0.3em] mb-8" style={{ color: 'var(--text-primary)' }}>
        MARKSMAN
      </p>
      <div className="w-48 h-px overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
        <div
          className="h-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%`, background: 'var(--accent-primary)' }}
        />
      </div>
    </div>
  )
}

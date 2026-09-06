'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '../contexts/theme-context'

const navLinks = [
  { label: 'Features',     href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
]

export function MarketingNav() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <header 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled || mobileOpen
            ? 'border-b border-border-subtle shadow-xl'
            : 'bg-transparent'
        }`}
        style={scrolled || mobileOpen ? { backgroundColor: resolvedTheme === 'light' ? '#F1F5F9' : '#0E1118' } : undefined}
      >
        <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-12 h-16 flex items-center justify-between relative z-10">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <svg viewBox="0 0 24 24" className="w-7 h-7">
              {[11, 8, 5, 2].map((r, i) => (
                <circle key={r} cx="12" cy="12" r={r}
                  fill="none" stroke="#F5A623"
                  strokeWidth={i === 0 ? 0.5 : 0.4}
                  opacity={0.4 + i * 0.15} />
              ))}
              <circle cx="12" cy="12" r="1.5" fill="#F5A623" />
            </svg>
            <span className="font-display font-bold text-lg tracking-widest text-text-primary">
              MARKSMAN
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.href} href={l.href}
                className="font-body text-sm text-text-secondary hover:text-accent transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center rounded-lg"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link href="/auth/login"
              className="font-body text-sm text-text-secondary hover:text-text-primary transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/auth/register"
              className="font-body text-sm font-semibold bg-accent hover:bg-accent-hover text-bg-void px-5 py-2 rounded-lg transition-all shadow-accent hover:shadow-glow active:scale-95">
              Get Started →
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden text-text-secondary hover:text-accent transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
              {mobileOpen
                ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                : <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div 
            className="md:hidden border-t border-border-subtle px-6 py-6 flex flex-col gap-4 shadow-2xl relative z-20"
            style={{ backgroundColor: resolvedTheme === 'light' ? '#F1F5F9' : '#0E1118', opacity: 1 }}
          >
            {navLinks.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="font-body text-base font-medium text-text-primary hover:text-accent transition-colors py-2.5 min-h-[44px] flex items-center border-b border-border-subtle/40">
                {l.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => {
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                  setMobileOpen(false);
                }}
                className="font-body text-base text-text-secondary text-center py-3 border border-border-default rounded-xl hover:border-accent transition-colors min-h-[44px] flex items-center justify-center gap-2"
                style={{ backgroundColor: resolvedTheme === 'light' ? '#E2E8F0' : '#161B26' }}
              >
                {resolvedTheme === 'dark' ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
              </button>
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                className="font-body text-base text-text-primary text-center py-3 border border-border-default rounded-xl hover:border-accent transition-colors min-h-[44px] flex items-center justify-center"
                style={{ backgroundColor: resolvedTheme === 'light' ? '#E2E8F0' : '#161B26' }}>
                Sign in
              </Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)}
                className="font-body text-base font-bold bg-accent text-bg-void text-center py-3.5 rounded-xl shadow-accent min-h-[44px] flex items-center justify-center active:scale-95 transition-all">
                Get Started →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Dim backdrop when mobile menu is open */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)} 
          className="md:hidden fixed inset-0 z-40 bg-black/85 backdrop-blur-md transition-opacity"
        />
      )}
    </>
  )
}

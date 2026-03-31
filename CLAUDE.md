# MARKSMAN — Claude Code Design System Guide

> Single source of truth for all Claude Code sessions on this project.
> Covers design tokens, component patterns, homepage fixes, animation, mobile rules, and file-by-file checklists.
> Last updated: 2026-03-30 (v2 — absorbs DESIGN.md audit)

---

## Project Overview

**Marksman** is a precision shooting analytics platform for competitive shooters, coaches, and military/tactical units.
Aesthetic: **Dark Luxury Precision** — high-contrast, data-dense, tactically authoritative.
Think: Bloomberg Terminal × Olympic medal podium. Quiet confidence, no hype.

| Layer | Tech |
|-------|------|
| Web frontend | Next.js 15 (App Router) + Tailwind CSS |
| Mobile | Capacitor (iOS + Android, same codebase) |
| Backend | NestJS + Prisma + PostgreSQL |
| Charts | Recharts (custom-themed — see chart section) |
| Auth | JWT via `apps/web/contexts/auth-context.tsx` |
| API | `apps/web/lib/api.ts` → `apiFetch()` with Bearer token |
| Animations | CSS-only utilities in `globals.css` (no Framer needed yet) |

---

## Homepage Issues — Fix These First

Live audit of `marksmanspro.com` (March 2026). When working on `app/page.tsx` or any marketing component, address these before anything else.

### 🔴 Critical (Broken)

| # | Problem | Root Cause | Fix |
|---|---------|-----------|-----|
| 1 | Stats show `0 0 0 0` | Counter fires on mount, section is below fold — IntersectionObserver missing | Use `hooks/useCountUp.ts` (spec below) |
| 2 | Loading screen runs ~10s | No max duration, no progress feedback | Cap at 2.5s, add progress bar (spec below) |
| 3 | "Pricing" nav link 404s | No `/pricing` route exists | Add `id="pricing"` section to `page.tsx` (spec below) |
| 4 | Nav anchor links silent | Section `id=""` attributes missing, no smooth scroll | Add IDs + `scroll-behavior: smooth` to `html` in `globals.css` |

### 🟠 High Impact (Visual Gaps)

| # | Problem | Fix |
|---|---------|-----|
| 5 | Hero has no target graphic | Add animated SVG ring behind hero text (spec below) |
| 6 | No mobile nav on marketing page | Add hamburger + drawer to `MarketingNav` (spec below) |
| 7 | Real athlete names used as testimonials | Add disclaimer or replace with anonymized names until verified |
| 8 | Hero session card missing shot map | Add `MiniTargetCanvas` component (spec below) |
| 9 | Footer "All systems nominal" is decorative | Link to `status.marksmanspro.com` or remove |
| 10 | No OG/meta image | Add `openGraph` to `app/layout.tsx` metadata (spec below) |

### 🟡 Polish

| # | Problem | Fix |
|---|---------|-----|
| 11 | Feature card tier badges inconsistent | Use `tierStyles` map (spec below) |
| 12 | Section `<h2>` typography too flat | `font-display text-4xl font-bold tracking-wide` on all section headings |
| 13 | Final CTA section blends into page | Add `bg-bg-surface border-y border-border-subtle` |
| 14 | Country ticker doesn't pause on hover | Add `group-hover:[animation-play-state:paused]` |
| 15 | No `<title>` or `<meta description>` | Verify `metadata` export in `app/layout.tsx` |

---

## Design Token System

**Never hardcode hex values. Always use these CSS custom properties or their Tailwind aliases.**

```css
/* ── Backgrounds (use in elevation order) ─────────────────────── */
--bg-void:     #080A0F;   /* Page bg — deepest layer */
--bg-surface:  #0E1118;   /* Cards, sidebar, panels */
--bg-elevated: #161B26;   /* Hover states, inputs, dropdowns */
--bg-overlay:  #1E2535;   /* Modals, tooltips */

/* ── Brand Accent ──────────────────────────────────────────────── */
--accent-primary:       #F5A623;               /* Amber — CTAs, active nav, logo */
--accent-primary-hover: #E8941A;               /* Hover state */
--accent-glow:          rgba(245,166,35,0.15); /* Ambient glow */

/* ── Data Colors ───────────────────────────────────────────────── */
--data-blue:  #4FC3F7;   /* Data values, 10-ring shots, info */
--signal-red: #FF4D6D;   /* Errors, low scores, < 9-ring */
--success:    #00E5A0;   /* Emerald — positive trends, 9-ring shots */
--warning:    #FFB347;   /* Warnings, caution */

/* ── Shot Ring Colors ──────────────────────────────────────────── */
--ring-x:   #F5A623;   /* X-ring  ≥ 10.5 — Amber */
--ring-10:  #4FC3F7;   /* 10-ring ≥ 10.0 — Blue */
--ring-9:   #00E5A0;   /* 9-ring  ≥  9.0 — Emerald */
--ring-low: #FF4D6D;   /* Low       < 9.0 — Red */

/* ── Text ──────────────────────────────────────────────────────── */
--text-primary:   #F0F2F5;   /* Main content */
--text-secondary: #8B92A5;   /* Labels, captions, metadata */
--text-muted:     #4A5168;   /* Placeholder, disabled */
--text-accent:    #F5A623;   /* Amber inline text */

/* ── Borders ───────────────────────────────────────────────────── */
--border-subtle:  rgba(255,255,255,0.06);   /* Dividers, card edges */
--border-default: rgba(255,255,255,0.10);   /* Standard borders */
--border-accent:  rgba(245,166,35,0.40);    /* Focused inputs, active */

/* ── Shadows ───────────────────────────────────────────────────── */
--shadow-card:   0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px var(--border-subtle);
--shadow-accent: 0 0 20px rgba(245,166,35,0.2);
--shadow-glow:   0 0 40px rgba(245,166,35,0.08);
```

### Tailwind Config (`tailwind.config.ts`)

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-void':        'var(--bg-void)',
        'bg-surface':     'var(--bg-surface)',
        'bg-elevated':    'var(--bg-elevated)',
        'bg-overlay':     'var(--bg-overlay)',
        'accent':         'var(--accent-primary)',
        'accent-hover':   'var(--accent-primary-hover)',
        'data-blue':      'var(--data-blue)',
        'signal-red':     'var(--signal-red)',
        'emerald-data':   'var(--success)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        'border-subtle':  'var(--border-subtle)',
        'border-default': 'var(--border-default)',
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],      // All headings
        body:    ['DM Sans', 'sans-serif'],        // Body text
        mono:    ['JetBrains Mono', 'monospace'], // All numbers/data
      },
      boxShadow: {
        card:   'var(--shadow-card)',
        accent: 'var(--shadow-accent)',
        glow:   'var(--shadow-glow)',
      },
    },
  },
}
export default config
```

---

## Typography Rules

| Role | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| Hero headline | Rajdhani | 72–96px | 700 | `page.tsx` hero only |
| Page title | Rajdhani | 32–48px | 600–700 | `<h1>` per page |
| Section heading | Rajdhani | 36–48px | 700 | `<h2>` — must be large, not subtle |
| Card title | Rajdhani | 20–24px | 600 | Feature cards, session cards |
| Body text | DM Sans | 14–16px | 400 | Paragraphs, descriptions |
| Label / caption | DM Sans | 11–13px | 400–500 | Form labels, metadata |
| Data value (KPI) | JetBrains Mono | 24–40px | 600–700 | Scores, averages, stats |
| Data label | JetBrains Mono | 11–13px | 400 | Axis labels, table numbers |
| Button | DM Sans | 13–15px | 500–600 | All buttons |
| Nav item | DM Sans | 13–14px | 500 | Sidebar, bottom nav, marketing nav |

**Hard rules:**
- Every numeric value → `font-mono` (JetBrains Mono). No exceptions.
- Every heading `<h1>`–`<h3>` → `font-display` (Rajdhani).
- Section `<h2>` must be `text-4xl` minimum — flat headings are issue #12.
- Never `font-sans` (resolves to Inter/system). Always `font-body` or `font-display`.
- Rajdhani headings → `tracking-wide` minimum, `tracking-widest` for hero/logo.

---

## globals.css — Full Contents

Replace `apps/web/app/globals.css` with this exactly:

```css
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');

/* ── Tokens ────────────────────────────────────────────────────── */
:root {
  --bg-void:              #080A0F;
  --bg-surface:           #0E1118;
  --bg-elevated:          #161B26;
  --bg-overlay:           #1E2535;
  --accent-primary:       #F5A623;
  --accent-primary-hover: #E8941A;
  --accent-glow:          rgba(245,166,35,0.15);
  --data-blue:            #4FC3F7;
  --signal-red:           #FF4D6D;
  --success:              #00E5A0;
  --warning:              #FFB347;
  --ring-x:               #F5A623;
  --ring-10:              #4FC3F7;
  --ring-9:               #00E5A0;
  --ring-low:             #FF4D6D;
  --text-primary:         #F0F2F5;
  --text-secondary:       #8B92A5;
  --text-muted:           #4A5168;
  --text-accent:          #F5A623;
  --border-subtle:        rgba(255,255,255,0.06);
  --border-default:       rgba(255,255,255,0.10);
  --border-accent:        rgba(245,166,35,0.40);
  --shadow-card:          0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px var(--border-subtle);
  --shadow-accent:        0 0 20px rgba(245,166,35,0.2);
  --shadow-glow:          0 0 40px rgba(245,166,35,0.08);
}

/* ── Base ──────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

html { scroll-behavior: smooth; }  /* fixes issue #4 — nav anchor scroll */

body {
  background-color: var(--bg-void);
  color: var(--text-primary);
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 { font-family: 'Rajdhani', sans-serif; }

/* ── Page entry ────────────────────────────────────────────────── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fadeUp 0.4s ease-out both; }

/* Stagger — wrap parent in class="stagger" */
.stagger > *:nth-child(1) { animation-delay:   0ms; }
.stagger > *:nth-child(2) { animation-delay:  60ms; }
.stagger > *:nth-child(3) { animation-delay: 120ms; }
.stagger > *:nth-child(4) { animation-delay: 180ms; }
.stagger > *:nth-child(5) { animation-delay: 240ms; }
.stagger > *:nth-child(6) { animation-delay: 300ms; }

/* ── Skeleton shimmer ──────────────────────────────────────────── */
@keyframes shimmer { to { background-position: -200% 0; } }
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-surface)  25%,
    var(--bg-elevated) 50%,
    var(--bg-surface)  75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

/* ── Amber pulse (live / active indicator dot) ─────────────────── */
@keyframes amberPulse {
  0%, 100% { box-shadow: 0 0 0 0   rgba(245,166,35,0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(245,166,35,0);   }
}
.pulse-amber { animation: amberPulse 2s ease-in-out infinite; }

/* ── Country ticker (marketing page) ──────────────────────────── */
@keyframes ticker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.animate-ticker { animation: ticker 20s linear infinite; }

/* ── Scrollbar ─────────────────────────────────────────────────── */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-surface); }
::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent-primary); }
```

---

## New Files to Create

Create these files if they don't already exist. They're referenced throughout the codebase.

### `hooks/useCountUp.ts` — fixes issue #1

```ts
import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const progress = Math.min(1, (Date.now() - start) / duration)
          const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
          setCount(Math.round(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

// StatCard usage example:
// function StatCard({ value, label, suffix }: { value: number; label: string; suffix: string }) {
//   const { count, ref } = useCountUp(value)
//   return (
//     <div ref={ref} className="text-center">
//       <p className="font-mono text-4xl font-bold text-accent">
//         {count.toLocaleString()}{suffix}
//       </p>
//       <p className="font-body text-xs text-text-muted uppercase tracking-wider mt-1">{label}</p>
//     </div>
//   )
// }
//
// Stats data (replace the 0s on the homepage):
// const stats = [
//   { value: 847000, label: 'Shots Analyzed', suffix: '+' },
//   { value: 2847,   label: 'Sessions Logged', suffix: '+' },
//   { value: 12,     label: 'Nations Active',  suffix: '' },
//   { value: 94,     label: 'AI Accuracy',     suffix: '%' },
// ]
```

### `lib/chart-theme.ts` — Recharts custom theme

```ts
export const CHART_COLORS = {
  amber:   '#F5A623',
  blue:    '#4FC3F7',
  emerald: '#00E5A0',
  red:     '#FF4D6D',
  muted:   '#4A5168',
}

export const tooltipStyle = {
  contentStyle: {
    background: '#161B26', border: '1px solid rgba(245,166,35,0.3)',
    borderRadius: '8px', fontFamily: 'JetBrains Mono',
    fontSize: '12px', color: '#F0F2F5',
  },
  labelStyle: { color: '#8B92A5', fontFamily: 'DM Sans', fontSize: '11px', marginBottom: '4px' },
  cursor: { stroke: 'rgba(245,166,35,0.2)', strokeWidth: 1 },
}

export const axisStyle = {
  tick:     { fill: '#4A5168', fontFamily: 'JetBrains Mono', fontSize: 11 },
  axisLine: { stroke: 'rgba(255,255,255,0.06)' },
  tickLine: false as const,
}

export const gridStyle = {
  strokeDasharray: '3 3',
  stroke: 'rgba(255,255,255,0.04)',
  vertical: false,
}

export function AmberGradient() {
  return (
    <defs>
      <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#F5A623" stopOpacity={0.25} />
        <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#4FC3F7" stopOpacity={0.25} />
        <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#00E5A0" stopOpacity={0.25} />
        <stop offset="95%" stopColor="#00E5A0" stopOpacity={0} />
      </linearGradient>
    </defs>
  )
}
```

### `components/LoadingScreen.tsx` — fixes issue #2

```tsx
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
    <div className="fixed inset-0 bg-bg-void z-50 flex flex-col items-center justify-center">
      <svg viewBox="0 0 80 80" className="w-16 h-16 mb-6">
        {[36, 28, 20, 12].map((r, i) => (
          <circle key={r} cx="40" cy="40" r={r}
            fill="none" stroke="#F5A623"
            strokeWidth={i === 0 ? 0.5 : 0.3}
            opacity={0.3 + i * 0.15} />
        ))}
        <circle cx="40" cy="40" r="3" fill="#F5A623" />
      </svg>
      <p className="font-display font-bold text-xl text-text-primary tracking-[0.3em] mb-8">
        MARKSMAN
      </p>
      <div className="w-48 h-px bg-border-subtle overflow-hidden">
        <div className="h-full bg-accent transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
```

### `components/MarketingNav.tsx` — fixes issues #3, #4, #6

```tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const navLinks = [
  { label: 'Features',     href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
]

export function MarketingNav() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-bg-surface/90 backdrop-blur-md border-b border-border-subtle' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
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
          className="md:hidden text-text-secondary hover:text-accent transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
            {mobileOpen
              ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              : <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-bg-surface border-t border-border-subtle px-6 py-6 flex flex-col gap-4">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="font-body text-base text-text-secondary hover:text-accent transition-colors py-2 min-h-[44px] flex items-center">
              {l.label}
            </a>
          ))}
          <div className="border-t border-border-subtle pt-4 flex flex-col gap-3">
            <Link href="/auth/login"
              className="font-body text-base text-text-secondary text-center py-3 border border-border-default rounded-lg hover:border-accent transition-colors min-h-[44px] flex items-center justify-center">
              Sign in
            </Link>
            <Link href="/auth/register"
              className="font-body text-base font-semibold bg-accent text-bg-void text-center py-3 rounded-lg shadow-accent min-h-[44px] flex items-center justify-center">
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
```

### `components/MiniTargetCanvas.tsx` — fixes issue #8

```tsx
const DEMO_SHOTS = [
  { x: 50.4, y: 49.2, score: 10.9 },
  { x: 49.1, y: 50.8, score: 10.7 },
  { x: 51.2, y: 48.6, score: 10.6 },
  { x: 48.8, y: 51.4, score: 10.4 },
]

function shotColor(score: number): string {
  if (score >= 10.5) return '#F5A623'
  if (score >= 10)   return '#4FC3F7'
  if (score >= 9)    return '#00E5A0'
  return '#FF4D6D'
}

export function MiniTargetCanvas() {
  const toSVG = (c: number) => (c / 100) * 120
  return (
    <svg viewBox="0 0 120 120" className="w-full aspect-square max-w-[120px] mx-auto">
      {[50, 42, 34, 26, 18, 10, 4].map(r => (
        <circle key={r} cx="60" cy="60" r={r}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
      ))}
      {[
        [60, 2, 60, 22], [60, 98, 60, 118],
        [2, 60, 22, 60], [98, 60, 118, 60],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(245,166,35,0.25)" strokeWidth="0.5" />
      ))}
      <circle cx="60" cy="60" r="1.2" fill="rgba(245,166,35,0.6)" />
      {DEMO_SHOTS.map((s, i) => (
        <circle key={i}
          cx={toSVG(s.x)} cy={toSVG(s.y)} r="3.5"
          fill={shotColor(s.score)}
          stroke="rgba(0,0,0,0.5)" strokeWidth="0.5"
          style={{ animation: `fadeUp 0.4s ease-out ${i * 150}ms both` }}
        />
      ))}
    </svg>
  )
}
```

### `app/layout.tsx` — OG metadata (fixes issues #10, #15)

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marksman — Precision Shooting Analytics',
  description: 'Track every shot with millimetre precision. AI coaching after every session. Built for competitive shooters, coaches, and national teams.',
  keywords: ['shooting analytics', 'air rifle training', 'ISSF', 'shot analysis', 'precision shooting'],
  openGraph: {
    title: 'Marksman — Precision Shooting Analytics',
    description: 'Track every shot. Get AI coaching. Train smarter.',
    url: 'https://www.marksmanspro.com',
    siteName: 'Marksman',
    images: [{ url: 'https://www.marksmanspro.com/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marksman — Precision Shooting Analytics',
    description: 'Track every shot. Get AI coaching. Train smarter.',
    images: ['https://www.marksmanspro.com/og-image.png'],
  },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
}
// Also create public/og-image.png: 1200×630, dark #080A0F bg,
// MARKSMAN wordmark centered in Rajdhani bold white,
// amber target ring motif bottom-right.
```

---

## Component Patterns

### Standard Card
```tsx
<div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-card hover:border-border-default transition-colors">
  {/* content */}
</div>
```

### Metric Card (KPI)
```tsx
<div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
  <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-2">Avg Score</p>
  <p className="font-mono text-3xl font-bold text-text-primary">9.4</p>
  <p className="font-mono text-xs text-emerald-data mt-1">↑ +0.3 vs last session</p>
</div>
```

### Primary Button (CTA)
```tsx
<button className="bg-accent hover:bg-accent-hover text-bg-void font-body font-semibold px-6 py-3 rounded-lg transition-all duration-150 shadow-accent hover:shadow-glow active:scale-95">
  Start Session
</button>
```

### Ghost Button
```tsx
<button className="border border-border-default hover:border-accent text-text-secondary hover:text-accent font-body font-medium px-6 py-3 rounded-lg transition-all duration-150 bg-transparent">
  View Demo
</button>
```

### Input Field
```tsx
<input className="w-full bg-bg-elevated border border-border-default focus:border-accent focus:ring-1 focus:ring-accent/20 text-text-primary placeholder:text-text-muted font-body text-sm px-4 py-3 rounded-lg transition-colors outline-none" />
```

### Score Badge
```tsx
function ScoreBadge({ score }: { score: number }) {
  const s =
    score >= 10.5 ? 'bg-accent/15 text-accent border-accent/30' :
    score >= 10   ? 'bg-data-blue/15 text-data-blue border-data-blue/30' :
    score >= 9    ? 'bg-emerald-data/15 text-emerald-data border-emerald-data/30' :
                    'bg-signal-red/15 text-signal-red border-signal-red/30'
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded-md border ${s}`}>
      {score.toFixed(1)}
    </span>
  )
}
```

### Feature Card Tier Badges — fixes issue #11
```tsx
const tierStyles: Record<string, string> = {
  Core:   'bg-border-subtle    text-text-secondary border-border-default',
  Pro:    'bg-accent/10        text-accent         border-accent/20',
  Teams:  'bg-data-blue/10    text-data-blue      border-data-blue/20',
  AI:     'bg-emerald-data/10 text-emerald-data   border-emerald-data/20',
  Vision: 'bg-data-blue/10    text-data-blue      border-data-blue/20',
  Export: 'bg-border-subtle    text-text-secondary border-border-default',
}
// <span className={`font-mono text-xs px-2 py-0.5 rounded border ${tierStyles[tier]}`}>{tier}</span>
```

### Nav Item (Sidebar — app shell)
```tsx
// Active
<a className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-body font-medium text-sm min-h-[44px]">
  <Icon size={18} /> Sessions
</a>
// Inactive
<a className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-bg-elevated text-text-secondary hover:text-text-primary font-body font-medium text-sm transition-colors min-h-[44px]">
  <Icon size={18} /> Analytics
</a>
```

### Section Divider
```tsx
<div className="flex items-center gap-4 my-8">
  <div className="h-px flex-1 bg-border-subtle" />
  <span className="font-body text-xs text-text-muted uppercase tracking-widest">Performance</span>
  <div className="h-px flex-1 bg-border-subtle" />
</div>
```

### Skeleton
```tsx
<div className="skeleton h-8 w-32" />
<div className="skeleton h-4 w-48 mt-2" />
```

### Live Indicator Dot
```tsx
<span className="w-2 h-2 bg-emerald-data rounded-full pulse-amber" />
```

### Country Ticker — fixes issue #14
```tsx
<div className="group overflow-hidden whitespace-nowrap">
  <span className="inline-block animate-ticker group-hover:[animation-play-state:paused]">
    {countries}·{countries}·
  </span>
</div>
```

### Pricing Plans — fixes issue #3
```tsx
const plans = [
  {
    name: 'Athlete', price: 'Free', period: 'forever',
    description: 'For individual competitive shooters.',
    features: ['Unlimited sessions', 'Shot-by-shot analysis', 'AI coaching feedback', 'PDF exports', '1 weapon profile'],
    cta: 'Start Free', href: '/auth/register', highlight: false,
  },
  {
    name: 'Pro', price: '₹499', period: 'per month',
    description: 'For serious athletes and coaches.',
    features: ['Everything in Athlete', 'Up to 10 athletes', 'Live biometric sync', 'Session comparison', 'Priority AI analysis', 'Custom training plans'],
    cta: 'Start Pro Trial', href: '/auth/register?plan=pro', highlight: true,
  },
  {
    name: 'Team', price: '₹1,999', period: 'per month',
    description: 'For national teams and academies.',
    features: ['Everything in Pro', 'Unlimited athletes', 'Team analytics', 'National team reports', 'Dedicated support', 'Custom integrations'],
    cta: 'Contact Us', href: 'mailto:team@marksmanspro.com', highlight: false,
  },
]
// Pricing card: highlight=true → `border-accent shadow-accent` instead of `border-border-subtle`
// Section: <section id="pricing" className="py-24 max-w-6xl mx-auto px-6">
```

---

## Page-Level Patterns

### Homepage `app/page.tsx`

Section IDs (fixes issue #4 — nav scroll):
```tsx
<section id="features"     className="py-24 ...">  {/* Platform Capabilities */}
<section id="how-it-works" className="py-24 ...">  {/* Three Steps */}
<section id="pricing"      className="py-24 ...">  {/* Pricing plans */}
```

Target ring hero background (fixes issue #5):
```tsx
<div className="absolute inset-0 flex items-center justify-end pr-12 opacity-[0.06] pointer-events-none select-none">
  <svg viewBox="0 0 600 600" className="w-[640px] h-[640px]">
    {[280, 240, 200, 160, 120, 80, 40].map((r, i) => (
      <circle key={r} cx="300" cy="300" r={r}
        fill="none" stroke="#F5A623" strokeWidth={i === 0 ? 1 : 0.5} />
    ))}
    <line x1="0"   y1="300" x2="600" y2="300" stroke="#F5A623" strokeWidth="0.5"/>
    <line x1="300" y1="0"   x2="300" y2="600" stroke="#F5A623" strokeWidth="0.5"/>
  </svg>
</div>
```

CTA section distinct background (fixes issue #13):
```tsx
<section className="bg-bg-surface border-y border-border-subtle py-24">
  {/* "Train like an elite" */}
</section>
```

Testimonials disclaimer (fixes issue #7):
```tsx
<p className="text-center font-body text-xs text-text-muted mt-8 max-w-lg mx-auto">
  * Testimonials are representative examples. Performance results vary by athlete and training regimen.
  Marksman is currently in beta.
</p>
```

### Dashboard Layout
```
bg-bg-void (page)
└── Sidebar (desktop): bg-bg-surface · border-r border-border-subtle · w-64
└── Main: flex-1
    ├── TopBar: bg-bg-surface · border-b border-border-subtle · sticky top-0 z-40
    ├── Content: p-6 · max-w-7xl
    │   ├── h1: font-display text-3xl font-bold tracking-wide
    │   ├── KPI row: grid grid-cols-2 md:grid-cols-4 gap-4
    │   ├── Charts: grid grid-cols-1 lg:grid-cols-2 gap-6
    │   └── Table: bg-bg-surface rounded-xl border border-border-subtle
    └── BottomNav (mobile): bg-bg-surface · border-t border-border-subtle
```

### AI Coach Chat
```
Container:    bg-bg-void
User bubble:  bg-accent/10 · border border-accent/20 · rounded-xl rounded-br-sm · font-body
AI bubble:    bg-bg-elevated · border border-border-subtle · rounded-xl rounded-bl-sm
Input bar:    bg-bg-surface · border-t border-border-subtle
Input:        bg-bg-elevated · focus:border-accent
Send button:  bg-accent · text-bg-void
Typing dots:  3× span with staggered pulse-amber
```

---

## Mobile Rules (Capacitor)

Every tappable element → `min-h-[44px] min-w-[44px]`. Use padding, not icon size alone.

```css
/* In component wrapper styles — not globals: */
.bottom-nav { padding-bottom: env(safe-area-inset-bottom); }
.top-bar    { padding-top:    env(safe-area-inset-top);    }
```

Bottom nav active state:
```tsx
<div className="relative flex flex-col items-center gap-1 min-h-[44px] justify-center px-4">
  {isActive && <div className="absolute -top-0.5 w-6 h-0.5 bg-accent rounded-full" />}
  <Icon size={22} className={isActive ? 'text-accent' : 'text-text-muted'} />
  <span className={`text-[10px] font-body font-medium ${isActive ? 'text-accent' : 'text-text-muted'}`}>
    {label}
  </span>
</div>
```

Swipeable tab indicator:
```tsx
<div className="flex justify-center gap-1.5 py-2">
  {tabs.map((_, i) => (
    <div key={i} className={`h-1 rounded-full transition-all ${
      i === activeTab ? 'w-6 bg-accent' : 'w-1.5 bg-border-default'
    }`} />
  ))}
</div>
```

---

## File-by-File Checklist

When Claude Code touches any file, apply all relevant items automatically.

### `app/page.tsx` (marketing homepage)
- [ ] Use `MarketingNav` — sticky scroll, mobile drawer, working anchor links
- [ ] Section IDs: `features`, `how-it-works`, `pricing`
- [ ] `LoadingScreen` capped at 2.5s with progress bar
- [ ] Stats counters: `useCountUp` hook with realistic values (not 0)
- [ ] Hero: target ring SVG background
- [ ] Hero session card: `MiniTargetCanvas` inside it
- [ ] All `<h2>` → `font-display text-4xl font-bold tracking-wide`
- [ ] CTA section → `bg-bg-surface border-y border-border-subtle`
- [ ] Testimonials → disclaimer paragraph below
- [ ] Ticker → `group` + `group-hover:[animation-play-state:paused]`
- [ ] Feature cards → `FeatureBadge` with `tierStyles`
- [ ] Pricing section at `id="pricing"`

### `app/layout.tsx`
- [ ] `metadata` export with full `openGraph` + `twitter` fields
- [ ] `globals.css` has `html { scroll-behavior: smooth }`

### `components/AppShell.tsx`
- [ ] Sidebar: `bg-bg-surface border-r border-border-subtle`
- [ ] Logo: `font-display font-bold text-accent tracking-wider`
- [ ] Avatar: `bg-accent/15 text-accent border border-accent/20 rounded-full`

### `components/Sidebar.tsx`
- [ ] Wrapper: `w-64 bg-bg-surface border-r border-border-subtle flex flex-col`
- [ ] Section labels: `font-body text-xs text-text-muted uppercase tracking-widest px-4 mb-2`
- [ ] Nav items: pattern from Component Patterns above

### `components/TopBar.tsx`
- [ ] `bg-bg-surface border-b border-border-subtle sticky top-0 z-40`
- [ ] Title: `font-display font-semibold text-xl tracking-wide`
- [ ] Icons: `text-text-secondary hover:text-accent transition-colors`

### `components/BottomNav.tsx`
- [ ] `bg-bg-surface border-t border-border-subtle`
- [ ] Safe area inset bottom padding
- [ ] Active state: amber bar + `text-accent`
- [ ] All items: `min-h-[44px]`

### `components/TargetCanvas.tsx`
- [ ] Background: `#080A0F`
- [ ] Ring labels: `JetBrains Mono`, `text-text-muted`
- [ ] Shot dots: `shotColor()` with ring token vars
- [ ] MPI crosshair: `stroke="#F5A623" strokeWidth={1.5} opacity={0.8}`
- [ ] Toolbar: ghost button pattern

### `components/AnalyticsCharts.tsx`
- [ ] Import all from `lib/chart-theme.ts`
- [ ] No default `#8884d8` colors anywhere
- [ ] `<AmberGradient />` inside each `<AreaChart>`
- [ ] Chart containers: `animate-fade-up`

### `app/dashboard/page.tsx`
- [ ] `<h1>`: `font-display text-3xl font-bold tracking-wide`
- [ ] KPIs: `grid grid-cols-2 md:grid-cols-4 gap-4 mb-8`
- [ ] All numbers: `font-mono`

### `app/sessions/page.tsx`
- [ ] List wrapper: `stagger` class
- [ ] Cards: `hover:border-accent/30 cursor-pointer`
- [ ] Empty state: `text-text-muted font-body text-center py-16`

### `app/ai-coach/page.tsx`
- [ ] AI Coach Chat layout from Page-Level Patterns
- [ ] Typing indicator: staggered `pulse-amber` dots

---

## Common Mistakes → Corrections

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `text-white` on numbers | `font-mono text-text-primary` |
| Hardcoded `#F5A623` | `text-accent` / `bg-accent` / `var(--accent-primary)` |
| `bg-gray-900` for cards | `bg-bg-surface` |
| `font-sans` anywhere | `font-body` or `font-display` |
| `text-2xl font-bold` on section heading | `font-display text-4xl font-bold tracking-wide` |
| `style={{ color: '#888' }}` inline | `className="text-text-secondary"` |
| Default Recharts `#8884d8` | `CHART_COLORS` from `lib/chart-theme.ts` |
| `rounded-md` on cards | `rounded-xl` |
| `border-gray-700` | `border-border-subtle` or `border-border-default` |
| Default focus ring | `focus:border-accent focus:ring-1 focus:ring-accent/20` |
| Any number without `font-mono` | `font-mono` on every numeric element |
| `useEffect` counter on mount | `useCountUp` with IntersectionObserver |
| 10s loading screen | `LoadingScreen` capped at 2.5s |
| Nav `href="/pricing"` → 404 | `href="#pricing"` + `id="pricing"` section |
| Hero with no visual | Target ring SVG background + `MiniTargetCanvas` |
| Ticker with no hover pause | `group` + `group-hover:[animation-play-state:paused]` |

---

## New Component Checklist

Every new component must pass all 10:
1. **Fonts** — headings: `font-display`, numbers: `font-mono`, text: `font-body`
2. **Colors** — Tailwind token classes only, no hardcoded hex
3. **Backgrounds** — correct elevation: void → surface → elevated → overlay
4. **Borders** — `border-subtle` default, `border-default` hover, `border-accent` focus/active
5. **Rounding** — `rounded-xl` cards, `rounded-lg` buttons/inputs, `rounded-full` pills/avatars
6. **Loading** — skeleton placeholder when data is pending
7. **Mobile** — touch targets ≥ 44px, safe-area insets near edges
8. **Animation** — `animate-fade-up` on page-level blocks, `stagger` on lists
9. **Numbers** — `font-mono` + `.toFixed(n)` or `.toLocaleString()` on every value
10. **Empty state** — meaningful muted-text fallback, not a blank div

---

## Quick Command Reference

| Say this to Claude Code | What it does |
|------------------------|-------------|
| `"Fix the stats counters"` | Installs `useCountUp`, replaces 0s with IntersectionObserver |
| `"Fix the loading screen"` | Swaps to `LoadingScreen.tsx`, 2.5s cap + progress bar |
| `"Fix the nav"` | Installs `MarketingNav.tsx`, adds section IDs, fixes anchors |
| `"Add the shot map to hero"` | Adds `MiniTargetCanvas` to hero session card |
| `"Add pricing section"` | Builds 3-plan grid at `id="pricing"` |
| `"Fix the homepage design"` | Works through all 15 audit issues in priority order |
| `"Fix the charts"` | Applies full Recharts theme from `lib/chart-theme.ts` |
| `"Fix fonts"` | Rajdhani on headings, DM Sans on body, JetBrains Mono on data |
| `"Add loading states"` | Replaces blanks/spinners with `.skeleton` shimmer |
| `"Fix mobile"` | 44px targets, safe-area insets, bottom nav active states |
| `"Make it feel premium"` | Stagger + fade-up, shadow-accent CTAs, amber glow on hover |
| `"Fix feature badges"` | Applies `tierStyles` map to all 6 feature cards |

---

*MARKSMAN · Claude Code Design System · v2 · 2026-03-30*

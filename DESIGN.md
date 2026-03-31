# DESIGN.md — Marksman Homepage

> Full design audit, issue log, and implementation spec for `marksmanspro.com`.
> Feed this file to Claude Code when working on `apps/web/app/page.tsx` and related marketing components.

---

## Audit: What's Broken Right Now

After live inspection of `https://www.marksmanspro.com/` (March 2026), the following issues were found:

### 🔴 Critical (Broken Functionality)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | **Stats counters show 0** — `0 Shots Analyzed`, `0 Sessions Logged`, `0 Nations Active`, `0 AI Accuracy`. The `useEffect` counter animation is not triggering, likely because the section is not in the viewport when the animation fires, or the IntersectionObserver is missing. | Stats section, `page.tsx` | Use `IntersectionObserver` to trigger counters only when section scrolls into view. |
| 2 | **"Pricing" nav link goes nowhere** — there is no `/pricing` route. Clicking it causes a 404 or silent failure. | `<nav>` in `page.tsx` | Either create `app/(marketing)/pricing/page.tsx` with a pricing section, or change the link to `/#pricing` and add a `id="pricing"` section to the homepage. |
| 3 | **Nav anchor links don't scroll** — "Features" and "How it Works" are in the nav but clicking them does nothing. | Nav `<a>` tags | Change to `href="#features"` and `href="#how-it-works"` with smooth scroll: add `scroll-behavior: smooth` to `html` in `globals.css`. |
| 4 | **10-second loading screen with no progress** — the loading animation runs for ~10s before the page appears. Users see a blank amber loader and have no feedback that content is loading. Bounce rate will be very high. | Root `layout.tsx` or `page.tsx` loading state | Reduce to ≤3s. Add a subtle progress bar. Better: use Next.js `loading.tsx` with a minimal skeleton instead of a full-screen block. |

### 🟠 High Impact (Visual/UX Gaps)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 5 | **Hero has no visual target graphic** — the hero section contains only text and a data card. There is no shot target, ring diagram, or any visual that communicates "shooting analytics" at a glance. | Hero section | Add an animated SVG target ring behind or beside the hero text (see spec below). |
| 6 | **No mobile navigation on the marketing page** — the app shell `BottomNav` only appears inside the authenticated app. The marketing `<nav>` has no hamburger menu or mobile drawer. On small screens the nav overflows. | `page.tsx` nav | Add a hamburger menu that opens a slide-in drawer with nav links + CTA buttons. |
| 7 | **Testimonials use real athlete names without verification** — Arjun Babuta, Manu Bhaker, Sanjeev Rajput are real Indian Olympic shooters. Using their names and fake quotes is a legal/reputational risk unless they are actual users. | Testimonials section | Either: (a) add a disclaimer "Quotes are representative. Platform is in beta." or (b) replace with anonymized placeholder names until real testimonials are obtained. |
| 8 | **Live session card lacks a shot map** — the hero dashboard mockup shows a data table of shots but no actual target visualization. The platform's core feature is the shot canvas, and it's invisible on the marketing page. | Hero mockup card | Add a mini SVG target canvas with 4 animated shot dots placed at the listed coordinates. |
| 9 | **"All systems nominal" is decorative, not functional** — the footer status indicator is plain text. It adds no credibility without a real status link. | Footer | Link it to a status page (e.g. `status.marksmanspro.com`) or remove it if no uptime monitoring is set up. |
| 10 | **No OG/meta image** — social sharing (WhatsApp, Twitter, LinkedIn) shows a blank preview. | `app/layout.tsx` metadata | Add `openGraph` image to Next.js metadata. |

### 🟡 Polish (Design Consistency)

| # | Issue | Fix |
|---|-------|-----|
| 11 | **Feature cards have inconsistent badge labels** — "Core", "Pro", "Teams", "AI", "Vision", "Export" use different badge colors with no legend. | Use a consistent `tier` prop with defined color mapping. |
| 12 | **Typography hierarchy is flat** — the section headings ("Built for precision at every level", "Your entire session…") don't use Rajdhani bold at large enough size. They blend into body text. | All `<h2>` should be `font-display text-4xl font-bold tracking-wide`. |
| 13 | **CTA section background is identical to page background** — the final "Train like an elite" section is not visually distinct from the rest of the page. | Add `bg-bg-surface border-y border-border-subtle` or use an amber gradient border top. |
| 14 | **Country ticker has no animation pause on hover** — the scrolling country ticker (`IND·GER·CHN...`) doesn't pause when hovered. | Add `hover:[animation-play-state:paused]` to the ticker wrapper. |
| 15 | **No `<title>` or `<meta description>` visible in page source** — SEO metadata may be missing or misconfigured in the Next.js metadata export. | Verify `metadata` export in `app/layout.tsx` and `app/page.tsx`. |

---

## Design Direction

**Aesthetic:** `Tactical Luxury` — dark, precise, authoritative. Think: a Bloomberg Terminal crossed with an Olympic medal podium. Every detail communicates that this platform handles serious data for serious athletes.

**Mood:** Quiet confidence. No hype. The interface itself is the proof.

**Key visual identity:**
- Amber (`#F5A623`) as the single dominant accent — used sparingly for maximum impact
- Deep void backgrounds with subtle surface layering
- Rajdhani for all headings — wide-tracked, heavy, military-clean
- JetBrains Mono for all data — numbers should look like they mean something
- Target ring SVG motif — appears subtly in hero, section dividers, and loading screen

---

## Component Specs

### 1. Loading Screen (`LoadingScreen`)

**Current:** Full-screen amber loader, ~10 seconds, no progress feedback.

**Fix:**
```tsx
// components/LoadingScreen.tsx
'use client'
import { useEffect, useState } from 'react'

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate load — replace with actual readiness check
    const start = Date.now()
    const duration = 2500 // MAX 2.5 seconds
    const tick = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100)
      setProgress(p)
      if (p >= 100) { clearInterval(tick); setTimeout(onComplete, 300) }
    }, 16)
    return () => clearInterval(tick)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-bg-void z-50 flex flex-col items-center justify-center">
      {/* Target ring logo */}
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

      {/* Thin amber progress bar */}
      <div className="w-48 h-px bg-border-subtle overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
```

---

### 2. Navbar (`MarketingNav`)

**Current:** Desktop-only, no mobile menu, anchor links broken.

**Spec:**
```tsx
// components/MarketingNav.tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const navLinks = [
  { label: 'Features',     href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-bg-surface/90 backdrop-blur-md border-b border-border-subtle' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" className="w-7 h-7">
            {[11,8,5,2].map((r,i) => (
              <circle key={r} cx="12" cy="12" r={r}
                fill="none" stroke="#F5A623"
                strokeWidth={i===0?0.5:0.4}
                opacity={0.4+i*0.15} />
            ))}
            <circle cx="12" cy="12" r="1.5" fill="#F5A623" />
          </svg>
          <span className="font-display font-bold text-lg text-text-primary tracking-widest">
            MARKSMAN
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <a key={l.href} href={l.href}
              className="font-body text-sm text-text-secondary hover:text-accent transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
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

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-text-secondary hover:text-accent transition-colors p-2">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
            {mobileOpen
              ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
              : <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-bg-surface border-t border-border-subtle px-6 py-6 flex flex-col gap-4">
          {navLinks.map(l => (
            <a key={l.href} href={l.href}
              onClick={() => setMobileOpen(false)}
              className="font-body text-base text-text-secondary hover:text-accent transition-colors py-1">
              {l.label}
            </a>
          ))}
          <div className="border-t border-border-subtle pt-4 flex flex-col gap-3">
            <Link href="/auth/login"
              className="font-body text-base text-text-secondary hover:text-text-primary text-center py-3 border border-border-default rounded-lg transition-colors">
              Sign in
            </Link>
            <Link href="/auth/register"
              className="font-body text-base font-semibold bg-accent text-bg-void text-center py-3 rounded-lg shadow-accent">
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
```

---

### 3. Hero Section

**Current:** Text + data card only. No visual identity. No target graphic.

**Redesign spec — key changes:**
- Full-screen, `min-h-screen`, `pt-32 pb-20`
- Background: animated SVG target rings in the right half, very low opacity (~0.06), no parallax needed
- Headline: `Rajdhani 700`, 72–96px, 2 lines. Accent word on its own line.
- Sub-heading: DM Sans, 18px, muted, max-width 520px
- Two CTAs: amber filled + ghost
- Below CTA: thin divider with 3 stats in JetBrains Mono
- Right side: the live session card (redesigned with a mini shot canvas — see Component 5)

**Layout (desktop):**
```
|←— 55% text column ——→|←— 45% card column —→|
```

**Layout (mobile):** Stack vertically, card below text.

**Headline copy:**
```
THE PERFORMANCE
PLATFORM BUILT FOR
ELITE SHOOTERS.
```
Accent the word `ELITE` in amber.

**Stats row values (use realistic, not 0):**
```tsx
const stats = [
  { value: 847000, label: 'Shots Analyzed', suffix: '+' },
  { value: 2847,   label: 'Sessions Logged', suffix: '+' },
  { value: 12,     label: 'Nations Active', suffix: '' },
  { value: 94,     label: 'AI Accuracy',   suffix: '%' },
]
```
> Note: if these are real tracked numbers, fetch them from the API via `getServerSideProps` or a server component. If placeholder, hardcode with the values above and add a disclaimer in the footer.

---

### 4. Stats Counter (Fix the 0s)

**Root cause:** Counter animation uses `useEffect` on mount, but the section is below the fold. By the time it's visible, the effect has already run (and found 0 targets, or the DOM refs aren't ready).

**Fix — use IntersectionObserver:**
```tsx
// hooks/useCountUp.ts
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
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3)
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

// Usage in page.tsx:
function StatCard({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const { count, ref } = useCountUp(value)
  return (
    <div ref={ref} className="text-center">
      <p className="font-mono text-4xl font-bold text-accent">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="font-body text-xs text-text-muted uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}
```

---

### 5. Mini Shot Canvas (Hero Card)

**Current:** The session card shows only a list of shot coordinates with no visual.

**Add a mini SVG target canvas to the top of the session card:**
```tsx
// components/MiniTargetCanvas.tsx
const shots = [
  { x: 50.4, y: 49.2, score: 10.9 }, // gold ring
  { x: 49.1, y: 50.8, score: 10.7 },
  { x: 51.2, y: 48.6, score: 10.6 },
  { x: 48.8, y: 51.4, score: 10.4 },
]

// Map score to ring color
function shotColor(score: number) {
  if (score >= 10.5) return '#F5A623'  // amber X-ring
  if (score >= 10)   return '#4FC3F7'  // blue 10-ring
  if (score >= 9)    return '#00E5A0'  // emerald 9-ring
  return '#FF4D6D'
}

// Convert x/y (0-100 coordinate space) to SVG coords (SVG is 120×120)
function toSVG(coord: number) { return (coord / 100) * 120 }

export function MiniTargetCanvas() {
  return (
    <svg viewBox="0 0 120 120" className="w-full aspect-square max-w-[120px] mx-auto">
      {/* Target rings */}
      {[50, 42, 34, 26, 18, 10, 4].map((r, i) => (
        <circle key={r} cx="60" cy="60" r={r}
          fill="none" stroke="rgba(255,255,255,0.08)"
          strokeWidth={i === 0 ? 0.5 : 0.4} />
      ))}
      {/* Crosshair */}
      <line x1="60" y1="2"  x2="60" y2="22"  stroke="rgba(245,166,35,0.3)" strokeWidth="0.5"/>
      <line x1="60" y1="98" x2="60" y2="118" stroke="rgba(245,166,35,0.3)" strokeWidth="0.5"/>
      <line x1="2"  y1="60" x2="22"  y2="60" stroke="rgba(245,166,35,0.3)" strokeWidth="0.5"/>
      <line x1="98" y1="60" x2="118" y2="60" stroke="rgba(245,166,35,0.3)" strokeWidth="0.5"/>
      {/* MPI crosshair */}
      <circle cx="60" cy="60" r="1" fill="rgba(245,166,35,0.6)" />
      {/* Shot dots */}
      {shots.map((s, i) => (
        <circle key={i}
          cx={toSVG(s.x)} cy={toSVG(s.y)} r="3"
          fill={shotColor(s.score)}
          stroke="rgba(0,0,0,0.4)" strokeWidth="0.5"
          style={{ animation: `fadeIn 0.4s ease-out ${i * 0.15}s both` }}
        />
      ))}
    </svg>
  )
}
```

---

### 6. Feature Cards (Consistency Fix)

**Current:** Inconsistent badge labels with no color logic.

**Spec — tier color mapping:**
```tsx
const tierStyles = {
  Core:   'bg-border-subtle text-text-secondary border-border-default',
  Pro:    'bg-accent/10 text-accent border-accent/20',
  Teams:  'bg-data-blue/10 text-data-blue border-data-blue/20',
  AI:     'bg-success/10 text-success border-success/20',
  Vision: 'bg-data-blue/10 text-data-blue border-data-blue/20',
  Export: 'bg-border-subtle text-text-secondary border-border-default',
} as const

// Feature card component:
function FeatureCard({ tier, title, description }: FeatureCardProps) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 hover:border-accent/20 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <span className={`font-mono text-xs px-2 py-0.5 rounded border ${tierStyles[tier]}`}>
          {tier}
        </span>
      </div>
      <h3 className="font-display font-semibold text-xl text-text-primary tracking-wide mb-2 group-hover:text-accent transition-colors">
        {title}
      </h3>
      <p className="font-body text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  )
}
```

---

### 7. Pricing Section (Missing Page)

Since the nav links to `#pricing`, add a pricing section to `page.tsx`:

```tsx
// Add id="pricing" to the CTA section, or add a dedicated section before the CTA:

const plans = [
  {
    name: 'Athlete',
    price: 'Free',
    period: 'forever',
    description: 'For individual competitive shooters.',
    features: ['Unlimited sessions', 'Shot-by-shot analysis', 'AI coaching feedback', 'PDF exports', '1 weapon profile'],
    cta: 'Start Free',
    href: '/auth/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: 'per month',
    description: 'For serious athletes and coaches.',
    features: ['Everything in Athlete', 'Connect up to 10 athletes', 'Live biometric sync', 'Session comparison', 'Priority AI analysis', 'Custom training plans'],
    cta: 'Start Pro Trial',
    href: '/auth/register?plan=pro',
    highlight: true,
  },
  {
    name: 'Team',
    price: '₹1,999',
    period: 'per month',
    description: 'For national teams and academies.',
    features: ['Everything in Pro', 'Unlimited athletes', 'Team analytics dashboard', 'National team reports', 'Dedicated support', 'Custom integrations'],
    cta: 'Contact Us',
    href: 'mailto:team@marksmanspro.com',
    highlight: false,
  },
]
```

---

### 8. Navbar Scroll Behavior

Add to `globals.css`:
```css
html {
  scroll-behavior: smooth;
}
```

Ensure all section wrappers have the correct IDs:
```tsx
<section id="features"     className="...">  {/* Platform Capabilities section */}
<section id="how-it-works" className="...">  {/* Three Steps section */}
<section id="pricing"      className="...">  {/* New pricing section */}
```

---

### 9. OG / SEO Metadata

In `apps/web/app/layout.tsx` (or `page.tsx` for homepage-specific):
```tsx
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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}
```

**Create `/public/og-image.png`:** 1200×630px dark background, MARKSMAN logo centered, amber accent, target ring motif. Can be generated with Satori or designed in Figma.

---

### 10. Testimonials Disclaimer

Until real testimonials are obtained, add below the testimonial section:
```tsx
<p className="text-center font-body text-xs text-text-muted mt-8 max-w-lg mx-auto">
  * Testimonials are representative examples. Performance results vary by athlete and training regimen.
  Marksman is currently in beta.
</p>
```

Or, if the athletes are genuine beta users, add a "Verified beta user" badge to each card.

---

### 11. Country Ticker — Hover Pause

```tsx
// Change the ticker wrapper className to include:
className="group overflow-hidden whitespace-nowrap"

// Change the animated span to:
className="inline-block animate-ticker group-hover:[animation-play-state:paused]"

// In globals.css:
@keyframes ticker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.animate-ticker {
  animation: ticker 20s linear infinite;
}
```

---

## Implementation Priority Order

Work through these in order for maximum visible impact per hour of work:

1. **Fix loading screen** — reduce to 2.5s with progress bar (30 min)
2. **Fix stats counters** — use IntersectionObserver (45 min)
3. **Fix nav links** — add IDs, smooth scroll, mobile menu (1 hr)
4. **Add mini shot canvas to hero card** (45 min)
5. **Add target ring SVG to hero background** (30 min)
6. **Add pricing section** (1 hr)
7. **Fix feature card badge consistency** (20 min)
8. **Add OG metadata and og-image** (30 min)
9. **Add testimonials disclaimer** (5 min)
10. **Fix ticker hover pause** (10 min)

---

## Files to Touch

```
apps/web/
├── app/
│   ├── layout.tsx              → Add OG metadata, scroll-behavior
│   ├── page.tsx                → All hero, features, how-it-works, pricing, CTA sections
│   └── globals.css             → smooth scroll, ticker animation, skeleton
├── components/
│   ├── LoadingScreen.tsx       → New: 2.5s with progress bar
│   ├── MarketingNav.tsx        → New: sticky scroll, mobile drawer
│   └── MiniTargetCanvas.tsx   → New: SVG shot canvas for hero card
├── hooks/
│   └── useCountUp.ts           → New: IntersectionObserver counter
└── public/
    └── og-image.png            → New: 1200×630 OG image
```

---

## Design Tokens Reference (from CLAUDE.md)

```
Background: #080A0F (void) · #0E1118 (surface) · #161B26 (elevated)
Accent:     #F5A623 (amber primary) · #E8941A (hover)
Data:       #4FC3F7 (blue) · #00E5A0 (emerald) · #FF4D6D (red)
Text:       #F0F2F5 (primary) · #8B92A5 (secondary) · #4A5168 (muted)
Fonts:      Rajdhani (headings) · DM Sans (body) · JetBrains Mono (data)
```

---

*DESIGN.md — Marksman Homepage Audit & Spec · March 2026*

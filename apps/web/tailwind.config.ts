// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs:  '480px',
      sm:  '640px',
      md:  '768px',
      lg:  '1024px',
      xl:  '1280px',
      '2xl': '1536px',
    },
    extend: {
      // ── Color System ──────────────────────────────────────────────────────
      colors: {
        // Backgrounds — theme-aware via CSS variables
        void:     'var(--bg-void)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        subtle:   'var(--bg-subtle)',

        // Accent — Electric Amber (precision / energy) — same in both themes
        accent: {
          DEFAULT: '#F5A623',
          glow:    'var(--accent-glow)',
          dim:     'var(--accent-dim)',
          border:  'rgba(245, 166, 35, 0.375)',
        },

        // Accent — Ice Blue (data / analytics)
        blue: {
          data:    '#4FC3F7',
          glow:    'var(--data-blue-glow)',
        },

        // Accent — Signal Red (alerts / critical)
        red: {
          signal: '#FF4D6D',
          glow:   'var(--signal-red-glow)',
        },

        // Accent — Emerald (success / improvement)
        emerald: {
          signal: '#00E5A0',
          glow:   'var(--success-glow)',
        },

        // Typography — theme-aware
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',

        // Borders — theme-aware
        'border-subtle': 'var(--border-subtle)',
        'border-active': 'var(--border-active)',
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        display: ['var(--font-rajdhani)', 'sans-serif'],
        body:    ['var(--font-dm-sans)', 'sans-serif'],
        data:    ['var(--font-jetbrains)', 'monospace'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },

      // ── Keyframes ─────────────────────────────────────────────────────────
      keyframes: {
        slideUpFade: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 166, 35, 0.28)' },
          '50%':       { boxShadow: '0 0 24px 8px rgba(245, 166, 35, 0.28)' },
        },
        pulseGlowBlue: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(79, 195, 247, 0.22)' },
          '50%':       { boxShadow: '0 0 20px 6px rgba(79, 195, 247, 0.22)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% center' },
          to:   { backgroundPosition:  '200% center' },
        },
        dashDraw: {
          from: { strokeDashoffset: '1000' },
          to:   { strokeDashoffset:    '0' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)', opacity: '0.04' },
          '100%': { transform: 'translateY(400%)',  opacity: '0.04' },
        },
        dotPop: {
          '0%':   { transform: 'scale(0)',    opacity: '0' },
          '60%':  { transform: 'scale(1.35)', opacity: '1' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideDownFade: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-5px)' },
          '40%, 80%': { transform: 'translateX(5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        radialShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        progressFill: {
          from: { width: '0%' },
          to:   { width: '100%' },
        },
        arcFill: {
          from: { strokeDashoffset: 'var(--dash-circumference)' },
          to:   { strokeDashoffset: 'var(--dash-offset)' },
        },
        // 2026 additions
        borderFlow: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        radarPing: {
          '0%':        { transform: 'scale(0.8)', opacity: '1' },
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        neonFlicker: {
          '0%, 95%, 100%': { opacity: '1' },
          '96%':            { opacity: '0.7' },
          '97%':            { opacity: '1' },
          '98%':            { opacity: '0.85' },
        },
        glassReveal: {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        numberRoll: {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',      opacity: '1' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':       { transform: 'translate(16px, -18px) scale(1.06)' },
          '66%':       { transform: 'translate(-10px, 8px) scale(0.96)' },
        },
      },

      // ── Animations ────────────────────────────────────────────────────────
      animation: {
        'slide-up':       'slideUpFade 550ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-left':  'slideInLeft 450ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slideInRight 450ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down':     'slideDownFade 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-glow':     'pulseGlow 2.5s ease-in-out infinite',
        'pulse-blue':     'pulseGlowBlue 2.5s ease-in-out infinite',
        'shimmer':        'shimmer 2.2s linear infinite',
        'dash-draw':      'dashDraw 2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scan-line':      'scanLine 9s linear infinite',
        'dot-pop':        'dotPop 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':        'fadeIn 450ms ease both',
        'shake':          'shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'float':          'float 4s ease-in-out infinite',
        'float-y':        'floatY 5s ease-in-out infinite',
        'radial-shift':   'radialShift 8s ease infinite',
        'border-flow':    'borderFlow 5s linear infinite',
        'radar-ping':     'radarPing 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'neon-flicker':   'neonFlicker 8s ease-in-out infinite',
        'glass-reveal':   'glassReveal 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'number-roll':    'numberRoll 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'orb-float':      'orbFloat 12s ease-in-out infinite',
      },

      // ── Shadows / Glows ───────────────────────────────────────────────────
      boxShadow: {
        'glow-accent':  '0 0 40px -10px rgba(245, 166, 35, 0.4)',
        'glow-blue':    '0 0 40px -10px rgba(79, 195, 247, 0.35)',
        'glow-red':     '0 0 40px -10px rgba(255, 77, 109, 0.35)',
        'glow-emerald': '0 0 40px -10px rgba(0, 229, 160, 0.3)',
        'glow-sm':      '0 0 16px -4px rgba(245, 166, 35, 0.35)',
        'card':         '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover':   '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 40px -10px rgba(245, 166, 35, 0.2)',
        'inner-glow':   'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },

      // ── Transitions ───────────────────────────────────────────────────────
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      // ── Background Sizes ──────────────────────────────────────────────────
      backgroundSize: {
        '200%': '200%',
        '300%': '300%',
      },

      // ── Z-Index ───────────────────────────────────────────────────────────
      zIndex: {
        sidebar:  '40',
        topbar:   '30',
        modal:    '50',
        tooltip:  '60',
      },
    },
  },
  plugins: [],
};

export default config;

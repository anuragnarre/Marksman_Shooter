// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
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
      // ── Color System (Stitch Tactical Command Precision + Classic Tokens) ──
      colors: {
        // Stitch Surface Tokens
        surface: 'var(--stitch-surface)',
        'surface-dim': 'var(--stitch-surface-dim)',
        'surface-bright': 'var(--stitch-surface-bright)',
        'surface-container-lowest': 'var(--stitch-surface-container-lowest)',
        'surface-container-low': 'var(--stitch-surface-container-low)',
        'surface-container': 'var(--stitch-surface-container)',
        'surface-container-high': 'var(--stitch-surface-container-high)',
        'surface-container-highest': 'var(--stitch-surface-container-highest)',
        'on-surface': 'var(--stitch-on-surface)',
        'on-surface-variant': 'var(--stitch-on-surface-variant)',
        
        // Stitch Semantic Tokens
        primary: 'var(--stitch-primary)',
        'primary-container': 'var(--stitch-primary-container)',
        'on-primary': 'var(--stitch-on-primary)',
        'on-primary-container': 'var(--stitch-on-primary-container)',
        'primary-fixed': 'var(--stitch-primary-fixed)',
        'primary-fixed-dim': 'var(--stitch-primary-fixed-dim)',
        'on-primary-fixed': 'var(--stitch-on-primary-fixed)',

        secondary: 'var(--stitch-secondary)',
        'secondary-container': 'var(--stitch-secondary-container)',
        'on-secondary': 'var(--stitch-on-secondary)',
        'on-secondary-container': 'var(--stitch-on-secondary-container)',
        'secondary-fixed': 'var(--stitch-secondary-fixed)',
        'secondary-fixed-dim': 'var(--stitch-secondary-fixed-dim)',
        'on-secondary-fixed': 'var(--stitch-on-secondary-fixed)',

        tertiary: 'var(--stitch-tertiary)',
        'tertiary-container': 'var(--stitch-tertiary-container)',
        'on-tertiary': 'var(--stitch-on-tertiary)',
        'on-tertiary-container': 'var(--stitch-on-tertiary-container)',
        'tertiary-fixed': 'var(--stitch-tertiary-fixed)',
        'tertiary-fixed-dim': 'var(--stitch-tertiary-fixed-dim)',
        'on-tertiary-fixed': 'var(--stitch-on-tertiary-fixed)',

        outline: 'var(--stitch-outline)',
        'outline-variant': 'var(--stitch-outline-variant)',
        error: 'var(--stitch-error)',
        'error-container': 'var(--stitch-error-container)',
        'on-error': 'var(--stitch-on-error)',
        'on-error-container': 'var(--stitch-on-error-container)',

        // Legacy / AppShell Tokens
        void: 'var(--bg-void)',
        elevated: 'var(--bg-elevated)',
        subtle: 'var(--bg-subtle)',
        'bg-void': 'var(--bg-void)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-subtle': 'var(--bg-subtle)',
        accent: {
          DEFAULT: '#F5A623',
          glow: 'var(--accent-glow)',
          dim: 'var(--accent-dim)',
          border: 'rgba(245, 166, 35, 0.375)',
        },
        blue: {
          data: '#4FC3F7',
          glow: 'var(--data-blue-glow)',
        },
        red: {
          signal: '#FF4D6D',
          glow: 'var(--signal-red-glow)',
        },
        emerald: {
          signal: '#00E5A0',
          glow: 'var(--success-glow)',
        },
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'border-subtle': 'var(--border-subtle)',
        'border-active': 'var(--border-active)',
      },

      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.375rem',
        'space-md': '0.625rem',
        'space-lg': '0.875rem',
        'space-xl': '1.25rem',
        gutter: '0.75rem',
        'gutter-mobile': '0.5rem',
        'margin-mobile': '0.75rem',
      },

      fontFamily: {
        'telemetry-xl': ['JetBrains Mono', 'monospace'],
        'telemetry-lg': ['JetBrains Mono', 'monospace'],
        'telemetry-sm': ['JetBrains Mono', 'monospace'],
        'label-caps': ['JetBrains Mono', 'monospace'],
        'label-lg': ['JetBrains Mono', 'monospace'],
        'label-md': ['JetBrains Mono', 'monospace'],
        'label-sm': ['JetBrains Mono', 'monospace'],
        'headline-xl': ['Inter', 'sans-serif'],
        'headline-lg': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'headline-sm': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'body-sm': ['Inter', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
        body: ['Inter', 'DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },

      fontSize: {
        'telemetry-xl': ['32px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'telemetry-lg': ['20px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'telemetry-sm': ['13px', { lineHeight: '16px', fontWeight: '500' }],
        'label-caps': ['11px', { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '700' }],
        'label-lg': ['13px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-md': ['11px', { lineHeight: '14px', letterSpacing: '0.04em', fontWeight: '500' }],
        'label-sm': ['10px', { lineHeight: '12px', letterSpacing: '0.06em', fontWeight: '500' }],
        'headline-xl': ['32px', { lineHeight: '36px', letterSpacing: '-0.025em', fontWeight: '700' }],
        'headline-lg': ['24px', { lineHeight: '28px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['18px', { lineHeight: '22px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-sm': ['15px', { lineHeight: '18px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-md': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'body-sm': ['11px', { lineHeight: '15px', fontWeight: '400' }],
      },

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
        shimmer: {
          from: { backgroundPosition: '-200% center' },
          to:   { backgroundPosition:  '200% center' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in':  'fadeIn 0.3s ease-out forwards',
        'shimmer':  'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

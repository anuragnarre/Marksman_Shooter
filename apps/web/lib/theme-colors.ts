/**
 * CSS variable references for use in inline style={{}} props.
 * These resolve to the correct color based on the active theme.
 */
export const themeColors = {
  // Backgrounds
  bgVoid:       'var(--bg-void)',
  bgSurface:    'var(--bg-surface)',
  bgElevated:   'var(--bg-elevated)',
  bgSubtle:     'var(--bg-subtle)',

  // Typography
  textPrimary:   'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted:     'var(--text-muted)',

  // Borders
  borderSubtle:  'var(--border-subtle)',
  borderActive:  'var(--border-active)',

  // Glass
  glassBg:       'var(--glass-bg)',
  glassBorder:   'var(--glass-border)',
  glassHeavyBg:  'var(--glass-heavy-bg)',

  // Accents (same in both themes)
  accent:        'var(--accent-primary)',
  accentGlow:    'var(--accent-glow)',
  accentDim:     'var(--accent-dim)',
  dataBlue:      'var(--data-blue)',
  signalRed:     'var(--signal-red)',
  success:       'var(--success)',
} as const;

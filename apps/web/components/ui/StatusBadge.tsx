// apps/web/components/ui/StatusBadge.tsx
// DESIGN NOTE: Each variant has a semantically meaningful color + dot.
// Rajdhani uppercase gives it a technical, data-terminal feel.

interface StatusBadgeProps {
  variant: 'shooter' | 'coach' | 'soldier' | 'live' | 'pending' | 'approved' | 'discipline';
  label?: string;
  size?: 'sm' | 'md';
}

const VARIANT_CONFIG = {
  soldier: {
    dot:    'bg-[#00E5A0]',
    border: 'border-[#00E5A0]/30',
    text:   'text-[#00E5A0]',
    bg:     'bg-[rgba(0,229,160,0.1)]',
    label:  'Soldier',
  },
  shooter: {
    dot:    'bg-accent',
    border: 'border-accent/30',
    text:   'text-accent',
    bg:     'bg-accent/10',
    label:  'Shooter',
  },
  coach: {
    dot:    'bg-[#4FC3F7]',
    border: 'border-[#4FC3F7]/30',
    text:   'text-[#4FC3F7]',
    bg:     'bg-[rgba(79,195,247,0.1)]',
    label:  'Coach',
  },
  live: {
    dot:    'bg-accent animate-pulse',
    border: 'border-accent/30',
    text:   'text-accent',
    bg:     'bg-accent/10',
    label:  'Live',
  },
  pending: {
    dot:    'bg-[#F5A623]/50',
    border: 'border-[#F5A623]/20',
    text:   'text-[#F5A623]/70',
    bg:     'bg-[rgba(245,166,35,0.06)]',
    label:  'Pending',
  },
  approved: {
    dot:    'bg-[#00E5A0]',
    border: 'border-[#00E5A0]/30',
    text:   'text-[#00E5A0]',
    bg:     'bg-[rgba(0,229,160,0.1)]',
    label:  'Approved',
  },
  discipline: {
    dot:    'bg-[#8892A4]',
    border: 'border-border-subtle',
    text:   'text-text-secondary',
    bg:     'bg-subtle',
    label:  '',
  },
};

export function StatusBadge({ variant, label, size = 'md' }: StatusBadgeProps) {
  const cfg = VARIANT_CONFIG[variant];
  const displayLabel = label ?? cfg.label;

  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const fontSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';
  const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} ${cfg.bg} border ${cfg.border} rounded-full ${fontSize} font-display font-bold uppercase tracking-widest ${cfg.text}`}
      role="status"
      aria-label={displayLabel}
    >
      <span className={`${dotSize} rounded-full ${cfg.dot} shrink-0`} />
      {displayLabel}
    </span>
  );
}

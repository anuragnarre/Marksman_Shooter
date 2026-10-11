// apps/web/components/ui/SuggestionItem.tsx
'use client';

// DESIGN NOTE: Each suggestion slides in from the left with a staggered
// delay. Left border color communicates urgency. Icons use SVG inline
// to avoid icon library dependencies.

interface SuggestionItemProps {
  type: 'warning' | 'success' | 'info' | 'critical';
  title: string;
  detail?: string;
  index?: number; // for stagger delay
}

const TYPE_CONFIG = {
  warning: {
    border:     'border-l-[#F5A623]',
    bg:         'bg-[rgba(245,166,35,0.06)]',
    icon:       <WarningIcon />,
    iconColor:  'text-accent',
    label:      'Watch',
    labelColor: 'text-accent',
  },
  success: {
    border:     'border-l-[#00E5A0]',
    bg:         'bg-[rgba(0,229,160,0.06)]',
    icon:       <CheckIcon />,
    iconColor:  'text-[#00E5A0]',
    label:      'Good',
    labelColor: 'text-[#00E5A0]',
  },
  info: {
    border:     'border-l-[#4FC3F7]',
    bg:         'bg-[rgba(79,195,247,0.06)]',
    icon:       <InfoIcon />,
    iconColor:  'text-[#4FC3F7]',
    label:      'Note',
    labelColor: 'text-[#4FC3F7]',
  },
  critical: {
    border:     'border-l-[#FF4D6D]',
    bg:         'bg-[rgba(255,77,109,0.06)]',
    icon:       <CriticalIcon />,
    iconColor:  'text-[#FF4D6D]',
    label:      'Critical',
    labelColor: 'text-[#FF4D6D]',
  },
};

export function SuggestionItem({
  type,
  title,
  detail,
  index = 0,
}: SuggestionItemProps) {
  const cfg = TYPE_CONFIG[type];
  const delay = index * 100;

  return (
    <div
      className={`
        border-l-2 ${cfg.border} ${cfg.bg}
        rounded-r-lg px-4 py-3
        animate-slide-in-left
        transition-all duration-300
        hover:scale-[1.01] cursor-default
      `}
      style={{ animationDelay: `${delay}ms` }}
      role="listitem"
    >
      <div className="flex items-start gap-3">
        <span className={`${cfg.iconColor} mt-0.5 shrink-0`} aria-hidden="true">
          {cfg.icon}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-display font-bold uppercase tracking-widest ${cfg.labelColor}`}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-text-primary text-sm leading-snug font-medium">{title}</p>
          {detail && (
            <p className="text-text-secondary text-xs mt-1 leading-relaxed">{detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M7 1.5L13 12H1z" />
      <line x1="7" y1="6" x2="7" y2="8.5" />
      <circle cx="7" cy="10.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" />
      <polyline points="4.5,7 6.5,9 9.5,5" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" />
      <line x1="7" y1="6" x2="7" y2="10" />
      <circle cx="7" cy="4.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CriticalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" />
      <line x1="7" y1="4" x2="7" y2="8" />
      <circle cx="7" cy="9.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

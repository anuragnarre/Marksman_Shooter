// apps/web/components/ui/LiveIndicator.tsx
// DESIGN NOTE: Pulsing amber dot signals active session. Two-ring pulse (inner
// + outer) creates depth. Rajdhani uppercase for the label adds military precision.

interface LiveIndicatorProps {
  label?: string;
  size?: 'sm' | 'md';
}

export function LiveIndicator({ label = 'LIVE SESSION', size = 'md' }: LiveIndicatorProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label={label}
    >
      {/* Pulsing dot with outer glow ring */}
      <span className="relative flex items-center justify-center">
        {/* Outer pulse ring */}
        <span
          className={`absolute ${dotSize} rounded-full bg-accent opacity-40 animate-pulse-glow`}
          style={{ transform: 'scale(2.5)' }}
        />
        {/* Inner solid dot */}
        <span
          className={`relative ${dotSize} rounded-full bg-accent`}
          style={{ boxShadow: '0 0 8px rgba(245, 166, 35, 0.8)' }}
        />
      </span>

      {label && (
        <span
          className={`font-display font-semibold tracking-widest ${textSize} text-accent uppercase`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

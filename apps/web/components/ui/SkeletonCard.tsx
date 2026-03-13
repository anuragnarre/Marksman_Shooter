// apps/web/components/ui/SkeletonCard.tsx
// DESIGN NOTE: 2026 skeleton loaders — deep glass with diagonal shimmer sweep.

interface SkeletonCardProps {
  height?: number;
  lines?: number;
  className?: string;
  animationDelay?: number;
}

const shimmerStyle = (delay: number = 0): React.CSSProperties => ({
  background: 'linear-gradient(105deg, rgba(26,32,53,0.6) 25%, rgba(35,43,68,0.85) 50%, rgba(26,32,53,0.6) 75%)',
  backgroundSize: '200% 100%',
  animation: `shimmer 2s linear ${delay}ms infinite`,
  borderRadius: 8,
});

export function SkeletonCard({
  height = 120,
  lines = 2,
  className = '',
  animationDelay = 0,
}: SkeletonCardProps) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden p-5 animate-slide-up ${className}`}
      style={{
        minHeight: height,
        animationDelay: `${animationDelay}ms`,
        background: 'rgba(10,13,20,0.85)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Top accent shimmer */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'rgba(245,166,35,0.15)', ...shimmerStyle(animationDelay) }}
      />

      {/* Header label */}
      <div className="h-2.5 w-20 mb-4 rounded-lg" style={shimmerStyle(animationDelay)} />

      {/* Value */}
      <div className="h-9 w-28 mb-4 rounded-xl" style={shimmerStyle(animationDelay + 80)} />

      {/* Sub-lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 mb-2 rounded-lg"
          style={{ width: `${68 - i * 14}%`, ...shimmerStyle(animationDelay + 160 + i * 80) }}
        />
      ))}
    </div>
  );
}

export function SkeletonRow({ animationDelay = 0 }: { animationDelay?: number }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 animate-fade-in"
      style={{
        animationDelay: `${animationDelay}ms`,
        borderBottom: '1px solid rgba(26,32,53,0.6)',
      }}
      aria-hidden="true"
    >
      <div className="w-8 h-2.5 rounded-lg" style={shimmerStyle(animationDelay)} />
      <div className="w-14 h-2.5 rounded-lg" style={shimmerStyle(animationDelay + 60)} />
      <div className="w-24 h-2.5 rounded-lg" style={shimmerStyle(animationDelay + 120)} />
      <div className="w-12 h-2.5 rounded-lg ml-auto" style={shimmerStyle(animationDelay + 180)} />
    </div>
  );
}

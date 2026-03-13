// apps/web/components/ui/ScoreRing.tsx
'use client';

// DESIGN NOTE: SVG circle with stroke-dasharray creates the arc fill.
// The ring animates from 0 to value on mount via CSS transition.
// Score text uses JetBrains Mono for data precision feel.

import { useEffect, useRef } from 'react';

interface ScoreRingProps {
  score: number;          // 0–10.9
  size?: number;          // canvas px (square)
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  accent:  '#F5A623',
  blue:    '#4FC3F7',
  red:     '#FF4D6D',
  emerald: '#00E5A0',
};

export function ScoreRing({
  score,
  size = 80,
  strokeWidth = 5,
  color = 'accent',
  trackColor = 'rgba(255,255,255,0.06)',
  showLabel = true,
  label,
  animated = true,
}: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const strokeColor = COLOR_MAP[color] ?? color;

  const center = size / 2;
  const radius = center - strokeWidth * 1.5;
  const circumference = 2 * Math.PI * radius;
  // score/10.9 normalized to 0–1, then mapped to stroke offset
  const normalizedScore = Math.min(Math.max(score / 10.9, 0), 1);
  const dashOffset = circumference - normalizedScore * circumference;

  useEffect(() => {
    if (!circleRef.current || !animated) return;

    // Start at full offset (empty ring) then animate to target
    circleRef.current.style.strokeDashoffset = String(circumference);

    const timer = requestAnimationFrame(() => {
      if (circleRef.current) {
        circleRef.current.style.transition =
          'stroke-dashoffset 1000ms cubic-bezier(0.16, 1, 0.3, 1)';
        circleRef.current.style.strokeDashoffset = String(dashOffset);
      }
    });

    return () => cancelAnimationFrame(timer);
  }, [score, circumference, dashOffset, animated]);

  const fontSize = size * 0.22;
  const labelFontSize = size * 0.1;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Score ring: ${score.toFixed(1)}`}
      role="img"
    >
      {/* Background track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />

      {/* Score arc — starts at 12 o'clock via rotation */}
      <circle
        ref={circleRef}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={animated ? circumference : dashOffset}
        strokeLinecap="round"
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
          filter: `drop-shadow(0 0 6px ${strokeColor}60)`,
        }}
      />

      {/* Score value */}
      {showLabel && (
        <>
          <text
            x="50%"
            y={label ? '44%' : '50%'}
            dominantBaseline="middle"
            textAnchor="middle"
            fill={strokeColor}
            fontSize={fontSize}
            fontFamily="var(--font-jetbrains), 'JetBrains Mono', monospace"
            fontWeight="600"
          >
            {score.toFixed(1)}
          </text>
          {label && (
            <text
              x="50%"
              y="62%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="rgba(136, 146, 164, 0.8)"
              fontSize={labelFontSize}
              fontFamily="var(--font-rajdhani), 'Rajdhani', sans-serif"
              fontWeight="600"
              letterSpacing="0.08em"
              style={{ textTransform: 'uppercase' }}
            >
              {label}
            </text>
          )}
        </>
      )}
    </svg>
  );
}

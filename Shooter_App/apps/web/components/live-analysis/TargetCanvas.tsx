'use client';

import { useMemo } from 'react';
import { TargetSpec, ShotCoordinates, ShotResult } from '../../lib/target-specs';

interface TargetCanvasProps {
  spec: TargetSpec;
  shots: (ShotCoordinates & ShotResult)[];
}

function shotColor(score: number): string {
  if (score >= 10.5) return 'var(--ring-x)';
  if (score >= 10.0) return 'var(--ring-10)';
  if (score >= 9.0)  return 'var(--ring-9)';
  return 'var(--ring-low)';
}

export function TargetCanvas({ spec, shots }: TargetCanvasProps) {
  // Determine the canvas size based on the largest ring + margin
  // Ring 1 diameter is roughly max, but we use RingsCount to find max diameter.
  const maxDiameter = spec.tenRingDiameter + ((spec.ringsCount - 1) * 2 * spec.ringThickness);
  const canvasSize = maxDiameter * 1.1; // Add 10% margin
  const viewBox = `-${canvasSize / 2} -${canvasSize / 2} ${canvasSize} ${canvasSize}`;

  // Generate rings
  const rings = useMemo(() => {
    const arr = [];
    for (let i = spec.ringsCount; i >= 1; i--) {
      const diameter = spec.tenRingDiameter + ((10 - i) * 2 * spec.ringThickness);
      const isBlack = i >= spec.blackAreaStartRing;
      arr.push({ score: i, radius: diameter / 2, isBlack });
    }
    return arr;
  }, [spec]);

  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto bg-bg-surface rounded-xl border border-border-subtle shadow-card overflow-hidden">
      <svg viewBox={viewBox} className="w-full h-full">
        {/* Background color for the target paper */}
        <rect x={-canvasSize/2} y={-canvasSize/2} width={canvasSize} height={canvasSize} fill="#F0F2F5" />
        
        {/* Rings */}
        {rings.map((ring, idx) => (
          <circle 
            key={ring.score}
            cx="0" 
            cy="0" 
            r={ring.radius}
            fill={ring.isBlack ? '#080A0F' : 'none'}
            stroke={ring.isBlack ? 'rgba(255,255,255,0.8)' : '#080A0F'}
            strokeWidth={0.5}
          />
        ))}

        {/* Inner Ten Dot */}
        {spec.innerTenDiameter > 0 && (
          <circle 
            cx="0" 
            cy="0" 
            r={spec.innerTenDiameter / 2}
            fill="rgba(255,255,255,0.8)" 
          />
        )}

        {/* Crosshairs */}
        <line x1={-canvasSize/2} y1="0" x2={canvasSize/2} y2="0" stroke="rgba(0,0,0,0.1)" strokeWidth={0.5} />
        <line x1="0" y1={-canvasSize/2} x2="0" y2={canvasSize/2} stroke="rgba(0,0,0,0.1)" strokeWidth={0.5} />

        {/* Shots */}
        {shots.map((shot, i) => (
          <g key={i} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
            {/* Real Pellet Hole */}
            <circle 
              cx={shot.x} 
              cy={-shot.y} // Invert Y because SVG y-axis is downwards
              r={spec.pelletDiameter / 2}
              fill="#222"
              stroke={shotColor(shot.score)}
              strokeWidth={0.5}
            />
            {/* Outer Highlight */}
            <circle 
              cx={shot.x} 
              cy={-shot.y}
              r={(spec.pelletDiameter / 2) + 1.5}
              fill="none"
              stroke={shotColor(shot.score)}
              strokeWidth={0.5}
              opacity={0.7}
            />
          </g>
        ))}

        {/* Latest Shot Pulse (if any shots exist) */}
        {shots.length > 0 && (
          <circle 
            cx={shots[shots.length - 1].x} 
            cy={-shots[shots.length - 1].y}
            r={spec.pelletDiameter / 2}
            className="pulse-amber"
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}

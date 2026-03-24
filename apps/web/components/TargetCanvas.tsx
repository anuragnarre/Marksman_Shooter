// apps/web/components/TargetCanvas.tsx
'use client';

// DESIGN NOTE: Dark cockpit aesthetic for the target canvas. Ring colors go
// from dark navy (outer, danger) to white (inner, precision). Shot dots are
// colored by score range and animate in with a spring pop (0→1.2→1 scale),
// staggered 40ms per shot. Zoom via scroll or button bar. Export PNG included.

import { useRef, useEffect, useState, useCallback } from 'react';
import type { MeanPointOfImpact, Shot } from '@shooting-platform/shared-types';
import { drawTarget, toPixel, shotColor, SHOT_RADIUS, TARGET_EXTENT } from '../lib/draw-target';

interface TargetCanvasProps {
  shots: Shot[];
  mpi?: MeanPointOfImpact;
  size?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TargetCanvas({ shots, mpi, size = 460 }: TargetCanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom]       = useState(1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const animStartRef          = useRef<number | null>(null);
  const frameRef              = useRef<number>(0);

  const cx = size / 2;
  const cy = size / 2;
  // 4% padding on each side so outermost ring never clips
  const drawRadius = (size / 2) * 0.92;

  // ── Draw ──────────────────────────────────────────────────────────────────

  const draw = useCallback(
    (shotScales: number[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawTarget(ctx, { size, zoom, shots, mpi, shotScales });
    },
    [shots, mpi, zoom, size],
  );

  // ── Entrance animation loop ───────────────────────────────────────────────

  useEffect(() => {
    animStartRef.current = null;
    const stagger = 40;
    const DURATION = 350;

    function springScale(t: number): number {
      if (t >= 1) return 1;
      const progress = t < 0.6
        ? (t / 0.6) * 1.3
        : 1.3 - (t - 0.6) / 0.4 * 0.3;
      return Math.max(0, progress);
    }

    const animate = (timestamp: number) => {
      if (!animStartRef.current) animStartRef.current = timestamp;
      const elapsed = timestamp - animStartRef.current;

      const scales = shots.map((_, i) => {
        const shotStart = i * stagger;
        const shotElapsed = elapsed - shotStart;
        if (shotElapsed <= 0) return 0;
        return springScale(Math.min(shotElapsed / DURATION, 1));
      });

      draw(scales);

      const allDone = shots.every((_, i) => elapsed >= i * stagger + DURATION);
      if (!allDone) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [shots, mpi, zoom, draw]);

  // ── Zoom ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(5, Math.max(1, z + (e.deltaY < 0 ? 0.15 : -0.15))));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // ── Hover tooltip ─────────────────────────────────────────────────────────

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const HIT = SHOT_RADIUS + 5;

      for (const shot of shots) {
        const [px, py] = toPixel(shot.x, shot.y, cx, cy, drawRadius, zoom);
        if (Math.hypot(mx - px, my - py) <= HIT) {
          setTooltip({ x: mx, y: my, text: `Shot #${shot.shotNumber} — ${shot.score.toFixed(1)}` });
          return;
        }
      }
      setTooltip(null);
    },
    [shots, zoom, cx, cy, drawRadius],
  );

  // ── Export PNG ────────────────────────────────────────────────────────────

  function exportPNG() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `target-export.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas */}
      <div className="relative canvas-vignette rounded-xl overflow-hidden border border-border-subtle">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          className="w-full cursor-crosshair block"
          style={{ touchAction: 'none', maxHeight: '100%' }}
          aria-label="Interactive shooting target"
          role="img"
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="tooltip-glass absolute z-tooltip px-3 py-1.5 pointer-events-none"
            style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}
          >
            <span className="score-value text-accent text-sm">{tooltip.text}</span>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-2 px-1">
        <button
          onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          className="w-7 h-7 rounded bg-elevated border border-border-subtle text-text-secondary
                     hover:text-text-primary hover:border-[#2A3040] transition-all text-sm flex items-center justify-center"
          aria-label="Zoom out"
        >−</button>

        <span className="score-value text-xs text-text-muted w-10 text-center">
          {zoom.toFixed(1)}×
        </span>

        <button
          onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
          className="w-7 h-7 rounded bg-elevated border border-border-subtle text-text-secondary
                     hover:text-text-primary hover:border-[#2A3040] transition-all text-sm flex items-center justify-center"
          aria-label="Zoom in"
        >+</button>

        <button
          onClick={() => setZoom(1)}
          className="px-3 h-7 rounded bg-elevated border border-border-subtle text-text-secondary text-xs
                     hover:text-text-primary hover:border-[#2A3040] transition-all font-display uppercase tracking-wide"
          aria-label="Reset zoom"
        >
          Reset
        </button>

        <button
          onClick={exportPNG}
          className="ml-auto px-3 h-7 rounded bg-accent/10 border border-accent/30 text-accent text-xs
                     hover:bg-accent/20 transition-all font-display uppercase tracking-wide"
          aria-label="Export target as PNG"
        >
          Export PNG
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1 text-[10px] font-display uppercase tracking-widest text-text-muted">
        {[
          { color: '#F5A623', label: '10.X+' },
          { color: '#4FC3F7', label: '10' },
          { color: '#00E5A0', label: '9' },
          { color: '#FF4D6D', label: '<9' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}80` }} />
            {label}
          </span>
        ))}
        {mpi && (
          <span className="flex items-center gap-1.5 text-[#4FC3F7]">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <line x1="0" y1="6" x2="12" y2="6" stroke="#4FC3F7" strokeWidth="2" />
              <line x1="6" y1="0" x2="6" y2="12" stroke="#4FC3F7" strokeWidth="2" />
            </svg>
            MPI
          </span>
        )}
      </div>
    </div>
  );
}

// apps/web/components/TargetCanvas.tsx
'use client';

// DESIGN NOTE: Dark cockpit aesthetic for the target canvas. Ring colors go
// from dark navy (outer, danger) to white (inner, precision). Shot dots are
// colored by score range and animate in with a spring pop (0→1.2→1 scale),
// staggered 40ms per shot. Zoom via scroll or button bar. Export PNG included.

import { useRef, useEffect, useState, useCallback } from 'react';
import type { MeanPointOfImpact, Shot } from '@shooting-platform/shared-types';

interface TargetCanvasProps {
  shots: Shot[];
  mpi?: MeanPointOfImpact;
  size?: number;
}

// ── Design constants ──────────────────────────────────────────────────────────

const SHOT_RADIUS     = 5.5;
const MPI_ARM         = 12;
const TARGET_EXTENT   = 10;   // coord space: -10 to +10

// Ring fill colors: 1 (outer) → 10 (inner)
// DESIGN NOTE: outer rings are dark navy, fading to lighter as we approach
// the scoring rings, then white for 9 and 10. Mirrors real ISSF target paper.
function getRingFill(ringNumber: number): string {
  if (ringNumber <= 3) return '#1a1a2e';
  if (ringNumber <= 6) return '#16213e';
  if (ringNumber <= 8) return '#0f3460';
  return '#f8f8f8'; // rings 9 and 10: white
}

// Non-linear ring radius (power 1.7 — inner rings closer together)
function ringRadius(ringNumber: number, maxR: number): number {
  const fraction = (11 - ringNumber) / 10;
  return maxR * Math.pow(fraction, 1.7);
}

// Shot color by score range
// DESIGN NOTE: Gold=excellence, Blue=good, Emerald=acceptable, Red=needs work
function shotColor(score: number): string {
  if (score >= 10.5) return '#F5A623'; // Gold — X ring
  if (score >= 10.0) return '#4FC3F7'; // Blue — 10 ring
  if (score >= 9.0)  return '#00E5A0'; // Emerald — 9 ring
  return '#FF4D6D';                    // Red — below 9
}

// Target coordinate → canvas pixel
// pixelX = cx + (tx / maxExtent) * drawRadius * zoom
// pixelY = cy - (ty / maxExtent) * drawRadius * zoom  (Y inverted: canvas Y ↓)
function toPixel(
  tx: number, ty: number,
  cx: number, cy: number,
  drawRadius: number, zoom: number,
): [number, number] {
  return [
    cx + (tx / TARGET_EXTENT) * drawRadius * zoom,
    cy - (ty / TARGET_EXTENT) * drawRadius * zoom,
  ];
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

      ctx.clearRect(0, 0, size, size);

      // ── Background radial vignette ─────────────────────────────────────
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.7);
      bg.addColorStop(0,   '#0d1117');
      bg.addColorStop(1,   '#080A0F');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      const zR = drawRadius * zoom;

      // ── Rings — outer (1) to inner (10) ───────────────────────────────
      for (let ring = 1; ring <= 10; ring++) {
        const r = ringRadius(ring, zR);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = getRingFill(ring);
        ctx.fill();

        ctx.strokeStyle = '#334155';
        ctx.lineWidth   = ring === 10 ? 1.5 : 0.8;
        ctx.stroke();
      }

      // X-ring amber tint (inner bullseye — ~0.5mm radius at 10m scale)
      const xRingR = ringRadius(10, zR) * 0.35;
      ctx.beginPath();
      ctx.arc(cx, cy, xRingR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245,166,35,0.35)';
      ctx.fill();

      // ── Crosshair lines with arrowheads ────────────────────────────────
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = '#1E2D3D';
      ctx.lineWidth   = 0.8;
      ctx.beginPath(); ctx.moveTo(cx - zR, cy); ctx.lineTo(cx + zR, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - zR); ctx.lineTo(cx, cy + zR); ctx.stroke();
      ctx.setLineDash([]);

      // Arrowheads at crosshair ends
      const AH = 5, AW = 3;
      ctx.fillStyle = '#1E2D3D';
      // Right arrow (X+)
      ctx.beginPath(); ctx.moveTo(cx+zR, cy); ctx.lineTo(cx+zR-AH, cy-AW); ctx.lineTo(cx+zR-AH, cy+AW); ctx.closePath(); ctx.fill();
      // Left arrow (X-)
      ctx.beginPath(); ctx.moveTo(cx-zR, cy); ctx.lineTo(cx-zR+AH, cy-AW); ctx.lineTo(cx-zR+AH, cy+AW); ctx.closePath(); ctx.fill();
      // Top arrow (Y+)
      ctx.beginPath(); ctx.moveTo(cx, cy-zR); ctx.lineTo(cx-AW, cy-zR+AH); ctx.lineTo(cx+AW, cy-zR+AH); ctx.closePath(); ctx.fill();
      // Bottom arrow (Y-)
      ctx.beginPath(); ctx.moveTo(cx, cy+zR); ctx.lineTo(cx-AW, cy+zR-AH); ctx.lineTo(cx+AW, cy+zR-AH); ctx.closePath(); ctx.fill();

      // ── 4 Coordinate direction indicators (fixed corners) ─────────────
      const labelColor = 'rgba(74,85,104,0.85)'; // muted blue-gray
      const arrowColor = 'rgba(79,195,247,0.65)'; // data-blue, slightly stronger
      const pad = 10;

      // Helper: draw a corner direction indicator (symbol + coordinate labels)
      const c = ctx; // capture non-null ref for nested fn
      function drawCorner(
        bx: number, by: number,
        ha: CanvasTextAlign, va: CanvasTextBaseline,
        label: string, arrowLabel: string,
      ) {
        // Draw the directional symbol (⬉⬈⬋⬊) with system font for Unicode support
        c.fillStyle = arrowColor;
        c.font = 'bold 14px Arial, "Segoe UI Symbol", sans-serif';
        c.textAlign = ha; c.textBaseline = va;
        c.fillText(arrowLabel, bx, by);
        // Draw coordinate label text below/above
        c.fillStyle = labelColor;
        c.font = '600 7.5px "JetBrains Mono", monospace';
        const lineH = 10;
        const lines = label.split('\n');
        lines.forEach((line, i) => {
          const dy = va === 'top'
            ? 18 + i * lineH
            : -(lines.length - 1 - i) * lineH - 18;
          c.fillText(line, bx, by + dy);
        });
      }

      drawCorner(pad, pad,           'left',  'top',    'Top-Left\n(X−, Y+)',    '⬉');
      drawCorner(size-pad, pad,      'right', 'top',    'Top-Right\n(X+, Y+)',   '⬈');
      drawCorner(pad, size-pad,      'left',  'bottom', 'Bottom-Left\n(X−, Y−)', '⬋');
      drawCorner(size-pad, size-pad, 'right', 'bottom', 'Bottom-Right\n(X+, Y−)','⬊');

      // ── Shot dots ──────────────────────────────────────────────────────
      shots.forEach((shot, i) => {
        const scale = shotScales[i] ?? 1;
        if (scale <= 0) return;

        const [px, py] = toPixel(shot.x, shot.y, cx, cy, drawRadius, zoom);
        const color    = shotColor(shot.score);
        const r        = SHOT_RADIUS * scale;

        // Drop shadow / glow matching dot color
        ctx.shadowColor = color;
        ctx.shadowBlur  = 8 * scale;

        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.shadowBlur = 0;

        // White ring outline
        ctx.beginPath();
        ctx.arc(px, py, r + 1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth   = 1;
        ctx.stroke();
      });

      // ── MPI crosshair (blue) ───────────────────────────────────────────
      if (mpi) {
        const [mx, my] = toPixel(mpi.x, mpi.y, cx, cy, drawRadius, zoom);

        ctx.strokeStyle = '#4FC3F7';
        ctx.lineWidth   = 2;
        ctx.shadowColor = '#4FC3F7';
        ctx.shadowBlur  = 10;
        ctx.lineCap     = 'round';

        ctx.beginPath();
        ctx.moveTo(mx - MPI_ARM, my); ctx.lineTo(mx + MPI_ARM, my);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mx, my - MPI_ARM); ctx.lineTo(mx, my + MPI_ARM);
        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#4FC3F7';
        ctx.fill();
      }
    },
    [shots, mpi, zoom, size, cx, cy, drawRadius],
  );

  // ── Entrance animation loop ───────────────────────────────────────────────

  useEffect(() => {
    // Each shot animates independently: starts at animDelay = i * 40ms
    // Scale: 0 → 1.3 → 1 (spring overshoot)
    animStartRef.current = null;
    const stagger = 40; // ms per shot

    const DURATION = 350; // ms for individual shot animation

    function springScale(t: number): number {
      // t: 0→1. Overshoot at ~0.6, settle at 1.
      if (t >= 1) return 1;
      // Cubic ease-out with overshoot
      const progress = t < 0.6
        ? (t / 0.6) * 1.3           // 0 → 1.3 in first 60%
        : 1.3 - (t - 0.6) / 0.4 * 0.3; // 1.3 → 1.0 in last 40%
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
  // React attaches wheel listeners as passive by default (browser perf opt),
  // so e.preventDefault() inside onWheel is silently ignored. We must attach
  // the listener manually with { passive: false } to block page scroll.

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
      <div className="relative canvas-vignette rounded-xl overflow-hidden border border-[#1E2433]">
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
          className="w-7 h-7 rounded bg-[#161B26] border border-[#1E2433] text-[#8892A4]
                     hover:text-[#F0F4FF] hover:border-[#2A3040] transition-all text-sm flex items-center justify-center"
          aria-label="Zoom out"
        >−</button>

        <span className="score-value text-xs text-[#4A5568] w-10 text-center">
          {zoom.toFixed(1)}×
        </span>

        <button
          onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
          className="w-7 h-7 rounded bg-[#161B26] border border-[#1E2433] text-[#8892A4]
                     hover:text-[#F0F4FF] hover:border-[#2A3040] transition-all text-sm flex items-center justify-center"
          aria-label="Zoom in"
        >+</button>

        <button
          onClick={() => setZoom(1)}
          className="px-3 h-7 rounded bg-[#161B26] border border-[#1E2433] text-[#8892A4] text-xs
                     hover:text-[#F0F4FF] hover:border-[#2A3040] transition-all font-display uppercase tracking-wide"
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
      <div className="flex flex-wrap items-center gap-4 px-1 text-[10px] font-display uppercase tracking-widest text-[#4A5568]">
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

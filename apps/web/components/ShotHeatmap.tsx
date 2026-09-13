'use client';

// ShotHeatmap — canvas-based density heatmap for shot clusters.
// Renders radial gradient "heat blobs" at each shot position.
// Hot zones (amber) emerge where multiple shots overlap.
// Cold outliers stay blue/teal.

import { useEffect, useRef, useState } from 'react';
import type { Shot } from '@shooting-platform/shared-types';
import { shotColor } from '../lib/draw-target';

// ── Target geometry (matches TargetCanvas.tsx coordinate system) ──────────────
const W   = 320;        // canvas width/height
const CX  = W / 2;
const CY  = W / 2;
const R10 = W * 0.098;  // 10-ring radius  (inner)
const R9  = W * 0.135;
const R8  = W * 0.175;
const R7  = W * 0.218;
const R6  = W * 0.265;

// Shot canvas coords are in a 366×366 space → normalise to our W×H
const SRC  = 366;
const SCALE = W / SRC;

interface ShotHeatmapProps {
  shots: Shot[];
  showRings?: boolean;
  className?: string;
  /** Glow radius multiplier per shot (default 18) */
  blobRadius?: number;
  /** Animate blobs appearing one-by-one on mount */
  animated?: boolean;
}

export function ShotHeatmap({
  shots,
  showRings = true,
  className = '',
  blobRadius = 18,
  animated = true,
}: ShotHeatmapProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible]   = useState(0);   // how many blobs drawn so far
  const rafRef     = useRef<number>(0);
  const startRef   = useRef<number>(0);
  const mountedRef = useRef(false);

  // ── Draw heatmap ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const count = animated ? visible : shots.length;
    const subset = shots.slice(0, count);

    ctx.clearRect(0, 0, W, W);

    // ── Background ────────────────────────────────────────────────────────
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim() || '#0C0F1A';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, W, 16);
    ctx.fill();

    // ── Target rings ──────────────────────────────────────────────────────
    if (showRings) {
      const rings = [
        { r: R6,  stroke: 'rgba(30,36,67,0.8)',  width: 0.5 },
        { r: R7,  stroke: 'rgba(30,36,67,0.8)',  width: 0.5 },
        { r: R8,  stroke: 'rgba(30,36,67,0.8)',  width: 0.5 },
        { r: R9,  stroke: 'rgba(79,195,247,0.25)', width: 0.8 },
        { r: R10, stroke: 'rgba(245,166,35,0.35)', width: 1.2 },
      ];

      rings.forEach(({ r, stroke, width }) => {
        ctx.beginPath();
        ctx.arc(CX, CY, r, 0, Math.PI * 2);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.stroke();
      });

      // Crosshair
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(30,36,67,0.5)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(CX - R6, CY); ctx.lineTo(CX + R6, CY);
      ctx.moveTo(CX, CY - R6); ctx.lineTo(CX, CY + R6);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Heat blobs ────────────────────────────────────────────────────────
    // Use 'screen' blend mode so overlapping shots add up to white-hot
    ctx.globalCompositeOperation = 'screen';

    subset.forEach((shot, i) => {
      const x = (shot.x ?? CX / SCALE) * SCALE;
      const y = (shot.y ?? CY / SCALE) * SCALE;
      const c = shotColor(shot.score);
      const r = blobRadius * (0.7 + shot.score / 30);

      // Fade-in alpha for the latest blob
      const alpha = animated && i === count - 1 ? 0.7 : 0.8;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, hexToRgba(c, alpha));
      grad.addColorStop(0.4, hexToRgba(c, alpha * 0.5));
      grad.addColorStop(1, hexToRgba(c, 0));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';

    // ── Shot dots ─────────────────────────────────────────────────────────
    subset.forEach((shot) => {
      const x = (shot.x ?? CX / SCALE) * SCALE;
      const y = (shot.y ?? CY / SCALE) * SCALE;
      const c = shotColor(shot.score);

      // Glow
      ctx.shadowBlur = 6;
      ctx.shadowColor = c;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // White core
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── MPI crosshair ─────────────────────────────────────────────────────
    if (subset.length > 2) {
      const mpiX = subset.reduce((s, sh) => s + (sh.x ?? CX / SCALE), 0) / subset.length * SCALE;
      const mpiY = subset.reduce((s, sh) => s + (sh.y ?? CY / SCALE), 0) / subset.length * SCALE;
      ctx.strokeStyle = 'rgba(79,195,247,0.7)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#4FC3F7';
      ctx.beginPath();
      ctx.moveTo(mpiX - 10, mpiY); ctx.lineTo(mpiX + 10, mpiY);
      ctx.moveTo(mpiX, mpiY - 10); ctx.lineTo(mpiX, mpiY + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mpiX, mpiY, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ── Score legend ──────────────────────────────────────────────────────
    const total = subset.length;
    if (total > 0) {
      const avg = subset.reduce((s, sh) => s + sh.score, 0) / total;
      ctx.font = `700 11px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#F5A623';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(245,166,35,0.6)';
      ctx.fillText(avg.toFixed(2), 10, W - 12);
      ctx.shadowBlur = 0;
      ctx.font = `600 9px "Rajdhani", sans-serif`;
      ctx.fillStyle = '#4A5568';
      ctx.fillText(`AVG  ·  ${total} shots`, 44, W - 12);
    }

  }, [shots, visible, showRings, blobRadius, animated]);

  // ── Animate blobs appearing ───────────────────────────────────────────────
  useEffect(() => {
    if (!animated || shots.length === 0) {
      setVisible(shots.length);
      return;
    }

    // Short delay then reveal one-by-one
    const STEP_MS = 120;
    let idx = 0;

    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const target = Math.min(Math.floor(elapsed / STEP_MS) + 1, shots.length);

      if (target !== idx) {
        idx = target;
        setVisible(target);
      }

      if (target < shots.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    // Kick off after a short mount delay
    const timeout = setTimeout(() => {
      startRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }, 300);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [shots, animated]);

  // Reset animation when shots change
  useEffect(() => {
    if (mountedRef.current) {
      setVisible(0);
      startRef.current = 0;
    } else {
      mountedRef.current = true;
    }
  }, [shots]);

  const noData = shots.length === 0;

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={W}
        height={W}
        className="w-full h-auto rounded-2xl"
        style={{
          boxShadow: '0 0 0 1px rgba(245,166,35,0.08), 0 8px 32px rgba(0,0,0,0.5)',
        }}
        aria-label={`Shot heatmap showing ${shots.length} shots`}
      />

      {/* No-data overlay */}
      {noData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="opacity-20 mb-3">
            {[16, 11, 6].map((r, i) => (
              <circle key={r} cx="20" cy="20" r={r} fill="none" stroke="#F5A623" strokeWidth="0.8"
                style={{ animation: `fadeIn 400ms ${i*150}ms both` }} />
            ))}
            <circle cx="20" cy="20" r="2" fill="#F5A623" />
          </svg>
          <p className="text-text-muted text-xs font-display uppercase tracking-widest">No shot data</p>
        </div>
      )}

      {/* Legend chips */}
      {!noData && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          {[
            { label: 'X', color: '#F5A623' },
            { label: '10', color: '#4FC3F7' },
            { label: '9+', color: '#00E5A0' },
            { label: '<9', color: '#FF4D6D' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
              <span className="text-[9px] font-display" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Utility ────────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

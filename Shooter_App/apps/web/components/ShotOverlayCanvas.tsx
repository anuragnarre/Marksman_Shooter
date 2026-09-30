'use client';

/**
 * ShotOverlayCanvas
 *
 * Renders a clean ISSF target with detected shot holes overlaid at their
 * exact warp-space coordinates.  Responsive (fills container up to maxWidth),
 * DPR-aware (sharp on Retina displays).
 *
 * Shot colour legend
 * ──────────────────
 *  Gold   ring  ≥ 10.5  (X-ring)
 *  Blue   ring  ≥ 10.0
 *  Green  ring  ≥  9.0
 *  Red    ring  <  9.0
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { VisionShotResult } from '@shooting-platform/shared-types';

// ---------------------------------------------------------------------------
// ISSF target specs (mirrors pipeline/target_specs.py)
// ---------------------------------------------------------------------------

interface TargetRenderSpec {
  outerRadiusMm: number;
  ringWidthMm: number;
  numRings: number;
  darkCenterRings: number;
  innerTenRadiusMm: number;
}

const TARGET_RENDER_SPECS: Record<string, TargetRenderSpec> = {
  air_rifle_10m:  { outerRadiusMm: 22.75, ringWidthMm: 2.5,  numRings: 10, darkCenterRings: 5, innerTenRadiusMm: 0.25  },
  air_pistol_10m: { outerRadiusMm: 85.0,  ringWidthMm: 8.0,  numRings: 10, darkCenterRings: 4, innerTenRadiusMm: 2.5   },
  nr_50m:         { outerRadiusMm: 77.2,  ringWidthMm: 8.0,  numRings: 10, darkCenterRings: 5, innerTenRadiusMm: 2.5   },
  nr_25m:         { outerRadiusMm: 250.0, ringWidthMm: 25.0, numRings: 10, darkCenterRings: 4, innerTenRadiusMm: 25.0  },
};

function getTargetSpec(targetType: string): TargetRenderSpec {
  return TARGET_RENDER_SPECS[targetType] ?? TARGET_RENDER_SPECS['air_rifle_10m'];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function holeColor(score: number): string {
  if (score >= 10.5) return '#F5A623';
  if (score >= 10.0) return '#4FC3F7';
  if (score >= 9.0)  return '#00E5A0';
  return '#FF4D6D';
}

function drawISSFTarget(
  ctx: CanvasRenderingContext2D,
  spec: TargetRenderSpec,
  cx: number,
  cy: number,
  mmToDisplayPx: number,
  offsetX: number,
  offsetY: number,
  drawW: number,
  drawH: number,
) {
  // Reset state that may bleed from shot rendering
  ctx.shadowBlur  = 0;
  ctx.shadowColor = 'transparent';
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);

  // Cream card background
  ctx.fillStyle = '#F5F0DC';
  ctx.fillRect(offsetX, offsetY, drawW, drawH);

  // Dark center zone
  const darkZoneR = spec.darkCenterRings * spec.ringWidthMm * mmToDisplayPx;
  ctx.beginPath();
  ctx.arc(cx, cy, darkZoneR, 0, Math.PI * 2);
  ctx.fillStyle = '#0A0A0A';
  ctx.fill();

  // Ring lines
  for (let ring = 1; ring <= spec.numRings; ring++) {
    const rMm = spec.outerRadiusMm - (ring - 1) * spec.ringWidthMm;
    const r   = rMm * mmToDisplayPx;
    if (r < 0.5) continue;
    const inDark = r <= darkZoneR + 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = inDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)';
    ctx.lineWidth   = Math.max(0.5, 0.7 / mmToDisplayPx);
    ctx.stroke();
  }

  // Ring number labels (cream zone only, 3 o'clock — ISSF standard position)
  ctx.save();
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = 'rgba(0,0,0,0.65)';

  for (let ring = 1; ring <= spec.numRings; ring++) {
    const rMm      = spec.outerRadiusMm - (ring - 1) * spec.ringWidthMm;
    const r        = rMm * mmToDisplayPx;
    const bandPx   = spec.ringWidthMm * mmToDisplayPx;
    const inDark   = r <= darkZoneR + 0.5;
    if (inDark) continue;
    if (r < 12)   continue; // band too small to label
    const fontSize = Math.max(9, Math.min(14, bandPx * 0.55));
    ctx.font       = `500 ${fontSize}px "JetBrains Mono", monospace`;
    // Midpoint of ring band at 3 o'clock
    ctx.fillText(String(ring), cx + r - bandPx * 0.5, cy);
  }
  ctx.restore();

  // Crosshairs (dark zone in white, cream zone in dark)
  const armR = spec.outerRadiusMm * mmToDisplayPx;
  ctx.setLineDash([2, 3]);
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.moveTo(cx - armR, cy); ctx.lineTo(cx - darkZoneR, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + darkZoneR, cy); ctx.lineTo(cx + armR, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - armR); ctx.lineTo(cx, cy - darkZoneR); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + darkZoneR); ctx.lineTo(cx, cy + armR); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath(); ctx.moveTo(cx - darkZoneR, cy); ctx.lineTo(cx + darkZoneR, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - darkZoneR); ctx.lineTo(cx, cy + darkZoneR); ctx.stroke();
  ctx.setLineDash([]);

  // Inner ten dot (X-ring)
  const innerTenR = spec.innerTenRadiusMm * mmToDisplayPx;
  if (innerTenR >= 0.8) {
    ctx.beginPath();
    ctx.arc(cx, cy, innerTenR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
  }

  // Outer border
  const outerR = spec.outerRadiusMm * mmToDisplayPx;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.lineWidth   = 1;
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ShotOverlayCanvasProps {
  /** Object URL — kept for backward compat but not displayed (clean target is drawn instead). */
  imageUrl: string | null;
  shots: VisionShotResult[];
  /** Target type for correct ring dimensions. */
  targetType?: string;
  /** Warp-space metadata from vision service. */
  warpCenterX?: number;
  warpCenterY?: number;
  warpWidth?: number;
  warpHeight?: number;
  warpMmPerPixel?: number;
  /** Maximum display size in CSS pixels. Component fills its container up to this width. Default: 360. */
  displaySize?: number;
  showScores?: boolean;
  showNumbers?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShotOverlayCanvas({
  shots,
  targetType     = 'air_rifle_10m',
  warpCenterX    = 500,
  warpCenterY    = 500,
  warpWidth      = 1000,
  warpHeight     = 1000,
  warpMmPerPixel = 0.17,
  displaySize    = 360,
  showScores     = true,
  showNumbers    = false,
  className      = '',
}: ShotOverlayCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(displaySize);
  const [ready, setReady] = useState(false);

  // Track wrapper width so the canvas fills its container responsively
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setSize(Math.round(w));
    });
    ro.observe(el);
    // Initial measurement
    const initial = el.getBoundingClientRect().width;
    if (initial > 0) setSize(Math.round(initial));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr      = window.devicePixelRatio || 1;
    const cssSize  = size;

    // Set physical canvas dimensions (DPR-scaled for sharpness on Retina)
    canvas.width        = Math.round(cssSize * dpr);
    canvas.height       = Math.round(cssSize * dpr);
    canvas.style.width  = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;
    ctx.scale(dpr, dpr);

    // Letterbox warp space into the square canvas
    const warpAspect = warpWidth / warpHeight;
    let drawW: number, drawH: number, offsetX: number, offsetY: number;
    if (warpAspect >= 1) {
      drawW   = cssSize;
      drawH   = cssSize / warpAspect;
      offsetX = 0;
      offsetY = (cssSize - drawH) / 2;
    } else {
      drawH   = cssSize;
      drawW   = cssSize * warpAspect;
      offsetX = (cssSize - drawW) / 2;
      offsetY = 0;
    }

    // Void background
    ctx.fillStyle = '#080A0F';
    ctx.fillRect(0, 0, cssSize, cssSize);

    // Draw clean ISSF target
    const spec           = getTargetSpec(targetType);
    const scaleX         = drawW / warpWidth;
    const scaleY         = drawH / warpHeight;
    const cx             = offsetX + warpCenterX * scaleX;
    const cy             = offsetY + warpCenterY * scaleY;
    const mmToDisplayPx  = scaleX / warpMmPerPixel;

    drawISSFTarget(ctx, spec, cx, cy, mmToDisplayPx, offsetX, offsetY, drawW, drawH);

    // Coordinate mapper
    function warpToDisplay(px: number, py: number): [number, number] {
      return [offsetX + px * scaleX, offsetY + py * scaleY];
    }

    // Hole radius — fixed visual size so dots stay visible at any scale
    const holeRadiusDisplay = Math.max(3.5, (4.5 / 2 / warpMmPerPixel) * scaleX);

    // Draw each detected shot
    shots.forEach((shot) => {
      const [dx, dy] = warpToDisplay(shot.pixelX, shot.pixelY);
      const color    = holeColor(shot.score);
      const r        = holeRadiusDisplay;

      ctx.save();

      // Outer glow
      ctx.beginPath();
      ctx.arc(dx, dy, r + 3, 0, Math.PI * 2);
      ctx.fillStyle = color + '28';
      ctx.fill();

      // X-ring amber halo
      if (shot.isInnerTen) {
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(dx, dy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#F5A623';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Hole fill
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8,10,15,0.75)';
      ctx.fill();

      // Coloured border
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.8;
      ctx.stroke();

      // Shot number (always white — hole fill is always dark)
      if (showNumbers) {
        ctx.fillStyle    = 'rgba(255,255,255,0.92)';
        ctx.font         = `bold ${Math.max(7, r * 0.85)}px "JetBrains Mono", monospace`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(shot.shotNumber), dx, dy);
      }

      // Score label chip
      if (showScores) {
        const scoreText = shot.isInnerTen ? `${shot.score}X` : String(shot.score);
        const labelX    = dx + r + 4;
        const labelY    = dy - r;
        const fSize     = Math.max(8, r * 0.75);
        ctx.font        = `600 ${fSize}px "JetBrains Mono", monospace`;
        const tw        = ctx.measureText(scoreText).width;
        const ph        = fSize + 2;
        ctx.fillStyle   = 'rgba(8,10,15,0.82)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(labelX - 2, labelY - ph / 2 - 1, tw + 8, ph + 2, 3);
        } else {
          ctx.rect(labelX - 2, labelY - ph / 2 - 1, tw + 8, ph + 2);
        }
        ctx.fill();
        ctx.fillStyle    = color;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(scoreText, labelX + 2, labelY);
      }

      ctx.restore();
    });

    // Centre crosshair dot
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(79,195,247,0.65)';
    ctx.fill();

    setReady(true);
  }, [shots, targetType, warpCenterX, warpCenterY, warpWidth, warpHeight,
      warpMmPerPixel, size, showScores, showNumbers]);

  return (
    <div
      ref={wrapperRef}
      className={`w-full ${className}`}
      style={{ maxWidth: displaySize }}
      aria-label="Target shot overlay"
    >
      <canvas
        ref={canvasRef}
        className={`block w-full aspect-square rounded-lg ${ready ? '' : 'animate-pulse bg-bg-surface'}`}
      />
    </div>
  );
}

'use client';

/**
 * ShotOverlayCanvas
 *
 * Draws the original target photo and overlays all detected shot holes and
 * their ISSF decimal scores on a <canvas> element.
 *
 * Overlay legend
 * ──────────────
 *  Gold  ring  ≥ 10.5  (X-ring shots get an extra amber halo)
 *  Blue  ring  ≥ 10.0
 *  Green ring  ≥  9.0
 *  Red   ring  <  9.0
 *
 * Coordinate system
 * ─────────────────
 * The vision service returns (pixelX, pixelY) in the warped 1000×1000 canvas
 * space.  This component re-projects those coordinates onto the displayed
 * image using a simple scale factor:
 *   displayPx = (warpedPx / WARP_SIZE) × displaySize
 */

import { useEffect, useRef, useState } from 'react';
import type { VisionShotResult } from '@shooting-platform/shared-types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WARP_SIZE  = 1000;   // the canonical warped canvas from the vision pipeline
const HOLE_ALPHA = 0.85;   // opacity of the hole overlay circle

/** Hole border colour by score band — matches the design system. */
function holeColor(score: number): string {
  if (score >= 10.5) return '#F5A623';   // amber gold
  if (score >= 10.0) return '#4FC3F7';   // data blue
  if (score >= 9.0)  return '#00E5A0';   // success green
  return '#FF4D6D';                       // signal red
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ShotOverlayCanvasProps {
  /** Object URL (or data URL) for the original captured image. */
  imageUrl: string;
  /** Shots returned by the vision service. */
  shots: VisionShotResult[];
  /**
   * Display size of the canvas in CSS pixels.
   * The canvas is always square; the image is letterboxed if non-square.
   * Default: 320.
   */
  displaySize?: number;
  /** Show score labels next to each hole. Default true. */
  showScores?: boolean;
  /** Show shot number inside each hole circle. Default false. */
  showNumbers?: boolean;
  /** Additional CSS class names. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShotOverlayCanvas({
  imageUrl,
  shots,
  displaySize = 320,
  showScores  = true,
  showNumbers = false,
  className   = '',
}: ShotOverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      // --- Determine draw region (letterbox into square canvas) ---
      const canvasW = displaySize;
      const canvasH = displaySize;
      canvas.width  = canvasW;
      canvas.height = canvasH;

      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawW: number, drawH: number, offsetX: number, offsetY: number;
      if (imgAspect >= 1) {
        drawW   = canvasW;
        drawH   = canvasW / imgAspect;
        offsetX = 0;
        offsetY = (canvasH - drawH) / 2;
      } else {
        drawH   = canvasH;
        drawW   = canvasH * imgAspect;
        offsetX = (canvasW - drawW) / 2;
        offsetY = 0;
      }

      // --- Draw photo ---
      ctx.clearRect(0, 0, canvasW, canvasH);
      ctx.fillStyle = '#080A0F';
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // --- Coordinate mapper: warped-space → display-space ---
      // The vision pipeline warps the target to WARP_SIZE × WARP_SIZE.
      // We scale the (pixelX, pixelY) from that space into the draw region.
      const scaleX = drawW / WARP_SIZE;
      const scaleY = drawH / WARP_SIZE;

      function warpToDisplay(px: number, py: number): [number, number] {
        return [offsetX + px * scaleX, offsetY + py * scaleY];
      }

      // Hole radius on display: ~2 mm at the current scale
      // 10m card: 0.17 mm/px → 2 mm = 11.8 px on warp canvas → scaled to display
      const holeRadiusDisplay = Math.max(4, 11 * scaleX);

      // --- Draw each detected hole ---
      shots.forEach((shot) => {
        const [dx, dy] = warpToDisplay(shot.pixelX, shot.pixelY);
        const color    = holeColor(shot.score);
        const r        = holeRadiusDisplay;

        // Outer glow
        ctx.beginPath();
        ctx.arc(dx, dy, r + 3, 0, Math.PI * 2);
        ctx.fillStyle = color + '30';   // 19% opacity glow
        ctx.fill();

        // X-ring amber halo
        if (shot.isInnerTen) {
          ctx.beginPath();
          ctx.arc(dx, dy, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#F5A623';
          ctx.lineWidth   = 1.5;
          ctx.globalAlpha = 0.55;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Hole fill circle
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(8,10,15,0.72)';   // semi-transparent void
        ctx.fill();

        // Coloured border ring
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth   = 2;
        ctx.globalAlpha = HOLE_ALPHA;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Shot number inside hole
        if (showNumbers) {
          ctx.fillStyle  = color;
          ctx.font       = `bold ${Math.max(8, r * 0.8)}px "JetBrains Mono", monospace`;
          ctx.textAlign  = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(shot.shotNumber), dx, dy);
        }

        // Score label above/beside the hole
        if (showScores) {
          const labelX = dx + r + 4;
          const labelY = dy - r;

          // Background pill
          const scoreText = shot.isInnerTen ? `${shot.score}X` : String(shot.score);
          ctx.font = `600 ${Math.max(9, r * 0.75)}px "JetBrains Mono", monospace`;
          const tw = ctx.measureText(scoreText).width;
          const ph = Math.max(10, r * 0.9);

          ctx.fillStyle   = 'rgba(8,10,15,0.82)';
          ctx.beginPath();
          ctx.roundRect?.(labelX - 2, labelY - ph / 2 - 1, tw + 8, ph + 2, 3);
          ctx.fill();

          // Score text
          ctx.fillStyle    = color;
          ctx.textAlign    = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(scoreText, labelX + 2, labelY);
        }
      });

      // --- Centre crosshair ---
      const [cx, cy] = warpToDisplay(WARP_SIZE / 2, WARP_SIZE / 2);
      const arm = 10;
      ctx.strokeStyle = 'rgba(79,195,247,0.5)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cx - arm, cy); ctx.lineTo(cx + arm, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - arm); ctx.lineTo(cx, cy + arm); ctx.stroke();
      ctx.setLineDash([]);

      setReady(true);
    };

    img.onerror = () => {
      // Image failed to load — draw placeholder
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#0E1118';
      ctx.fillRect(0, 0, displaySize, displaySize);
      ctx.fillStyle = '#334155';
      ctx.font = '12px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Image unavailable', displaySize / 2, displaySize / 2);
    };
  }, [imageUrl, shots, displaySize, showScores, showNumbers]);

  return (
    <canvas
      ref={canvasRef}
      width={displaySize}
      height={displaySize}
      className={`block rounded-lg ${ready ? '' : 'animate-pulse bg-surface'} ${className}`}
      style={{ width: displaySize, height: displaySize }}
      aria-label="Target shot overlay"
    />
  );
}

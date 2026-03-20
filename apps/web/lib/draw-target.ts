// apps/web/lib/draw-target.ts
// Extracted target drawing functions shared by TargetCanvas (interactive) and ExportSessionModal (static).

import type { MeanPointOfImpact, Shot } from '@shooting-platform/shared-types';

// Ring radii (as fraction of max radius) and corresponding scores — ISSF 10m Air Rifle
export const RING_RADII  = [0.05, 0.10, 0.18, 0.27, 0.37, 0.48, 0.60, 0.73, 0.86, 1.00];
export const RING_SCORES = [10.9, 10.0, 9.0,  8.0,  7.0,  6.0,  5.0,  4.0,  3.0,  2.0];

export function scoreFromCoords(x: number, y: number): number {
  const dist = Math.sqrt(x * x + y * y);
  const norm = dist / 10; // target coords ±10; normalise to 0–1
  for (let i = 0; i < RING_RADII.length; i++) {
    if (norm <= RING_RADII[i]) return RING_SCORES[i];
  }
  return 1.0;
}

export const SHOT_RADIUS   = 5.5;
export const MPI_ARM       = 12;
export const TARGET_EXTENT = 10;

// Ring fill colors: 1 (outer) → 10 (inner)
export function getRingFill(ringNumber: number): string {
  if (ringNumber <= 3) return '#1a1a2e';
  if (ringNumber <= 6) return '#16213e';
  if (ringNumber <= 8) return '#0f3460';
  return '#f8f8f8';
}

// Non-linear ring radius (power 1.7 — inner rings closer together)
export function ringRadius(ringNumber: number, maxR: number): number {
  const fraction = (11 - ringNumber) / 10;
  return maxR * Math.pow(fraction, 1.7);
}

// Shot color by score range
export function shotColor(score: number): string {
  if (score >= 10.5) return '#F5A623';
  if (score >= 10.0) return '#4FC3F7';
  if (score >= 9.0)  return '#00E5A0';
  return '#FF4D6D';
}

// Target coordinate → canvas pixel
export function toPixel(
  tx: number, ty: number,
  cx: number, cy: number,
  drawRadius: number, zoom: number,
): [number, number] {
  return [
    cx + (tx / TARGET_EXTENT) * drawRadius * zoom,
    cy - (ty / TARGET_EXTENT) * drawRadius * zoom,
  ];
}

export interface DrawTargetOptions {
  size: number;
  zoom?: number;
  shots: Shot[];
  mpi?: MeanPointOfImpact;
  /** Per-shot scale factors for animation (default: all 1) */
  shotScales?: number[];
  /** Skip corner direction labels (cleaner for export) */
  hideCornerLabels?: boolean;
}

/**
 * Draw a complete target on any canvas 2D context.
 * Pure function — no DOM side-effects beyond the provided ctx.
 */
export function drawTarget(ctx: CanvasRenderingContext2D, opts: DrawTargetOptions): void {
  const { size, shots, mpi, hideCornerLabels = false } = opts;
  const zoom = opts.zoom ?? 1;
  const shotScales = opts.shotScales ?? shots.map(() => 1);

  const cx = size / 2;
  const cy = size / 2;
  const drawRadius = (size / 2) * 0.92;

  ctx.clearRect(0, 0, size, size);

  // Background radial vignette
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.7);
  bg.addColorStop(0, '#0d1117');
  bg.addColorStop(1, '#080A0F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const zR = drawRadius * zoom;

  // Rings — outer (1) to inner (10)
  for (let ring = 1; ring <= 10; ring++) {
    const r = ringRadius(ring, zR);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = getRingFill(ring);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = ring === 10 ? 1.5 : 0.8;
    ctx.stroke();
  }

  // X-ring amber tint
  const xRingR = ringRadius(10, zR) * 0.35;
  ctx.beginPath();
  ctx.arc(cx, cy, xRingR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245,166,35,0.35)';
  ctx.fill();

  // Crosshair lines
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = '#1E2D3D';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(cx - zR, cy); ctx.lineTo(cx + zR, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - zR); ctx.lineTo(cx, cy + zR); ctx.stroke();
  ctx.setLineDash([]);

  // Arrowheads
  const AH = 5, AW = 3;
  ctx.fillStyle = '#1E2D3D';
  ctx.beginPath(); ctx.moveTo(cx + zR, cy); ctx.lineTo(cx + zR - AH, cy - AW); ctx.lineTo(cx + zR - AH, cy + AW); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - zR, cy); ctx.lineTo(cx - zR + AH, cy - AW); ctx.lineTo(cx - zR + AH, cy + AW); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx, cy - zR); ctx.lineTo(cx - AW, cy - zR + AH); ctx.lineTo(cx + AW, cy - zR + AH); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx, cy + zR); ctx.lineTo(cx - AW, cy + zR - AH); ctx.lineTo(cx + AW, cy + zR - AH); ctx.closePath(); ctx.fill();

  // Corner direction indicators (optional)
  if (!hideCornerLabels) {
    const labelColor = 'rgba(74,85,104,0.85)';
    const arrowColor = 'rgba(79,195,247,0.65)';
    const pad = 10;

    function drawCorner(
      bx: number, by: number,
      ha: CanvasTextAlign, va: CanvasTextBaseline,
      label: string, arrowLabel: string,
    ) {
      ctx.fillStyle = arrowColor;
      ctx.font = 'bold 14px Arial, "Segoe UI Symbol", sans-serif';
      ctx.textAlign = ha; ctx.textBaseline = va;
      ctx.fillText(arrowLabel, bx, by);
      ctx.fillStyle = labelColor;
      ctx.font = '600 7.5px "JetBrains Mono", monospace';
      const lineH = 10;
      const lines = label.split('\n');
      lines.forEach((line, i) => {
        const dy = va === 'top'
          ? 18 + i * lineH
          : -(lines.length - 1 - i) * lineH - 18;
        ctx.fillText(line, bx, by + dy);
      });
    }

    drawCorner(pad, pad, 'left', 'top', 'Top-Left\n(X−, Y+)', '⬉');
    drawCorner(size - pad, pad, 'right', 'top', 'Top-Right\n(X+, Y+)', '⬈');
    drawCorner(pad, size - pad, 'left', 'bottom', 'Bottom-Left\n(X−, Y−)', '⬋');
    drawCorner(size - pad, size - pad, 'right', 'bottom', 'Bottom-Right\n(X+, Y−)', '⬊');
  }

  // Shot dots
  shots.forEach((shot, i) => {
    const scale = shotScales[i] ?? 1;
    if (scale <= 0) return;

    const [px, py] = toPixel(shot.x, shot.y, cx, cy, drawRadius, zoom);
    const color = shotColor(shot.score);
    const r = SHOT_RADIUS * scale;

    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * scale;

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(px, py, r + 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // MPI crosshair
  if (mpi) {
    const [mx, my] = toPixel(mpi.x, mpi.y, cx, cy, drawRadius, zoom);

    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4FC3F7';
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';

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
}

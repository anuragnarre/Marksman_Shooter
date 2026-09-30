// apps/web/lib/draw-target.ts
// Extracted target drawing functions shared by TargetCanvas (interactive) and ExportSessionModal (static).

import type { MeanPointOfImpact, Shot } from '@shooting-platform/shared-types';

// ── ISSF Target Specifications ────────────────────────────────────────────────

export interface ISSFTargetSpec {
  outerRadiusMm: number;    // radius of ring 1 (outermost) in mm
  ringWidthMm: number;      // width of each scoring ring in mm
  darkCenterRings: number;  // how many innermost rings are black
  innerTenRadiusMm: number; // radius of the X-ring (inner-10) in mm
}

export const ISSF_TARGET_SPECS: Record<string, ISSFTargetSpec> = {
  air_rifle_10m:  { outerRadiusMm: 22.75, ringWidthMm: 2.5,  darkCenterRings: 5, innerTenRadiusMm: 0.25 },
  air_pistol_10m: { outerRadiusMm: 85.0,  ringWidthMm: 8.0,  darkCenterRings: 4, innerTenRadiusMm: 2.5  },
  nr_50m:         { outerRadiusMm: 77.2,  ringWidthMm: 8.0,  darkCenterRings: 5, innerTenRadiusMm: 2.5  },
  nr_25m:         { outerRadiusMm: 250.0, ringWidthMm: 25.0, darkCenterRings: 4, innerTenRadiusMm: 25.0 },
};

// Legacy constants kept for backward compatibility
export const RING_RADII  = [0.05, 0.10, 0.18, 0.27, 0.37, 0.48, 0.60, 0.73, 0.86, 1.00];
export const RING_SCORES = [10.9, 10.0, 9.0,  8.0,  7.0,  6.0,  5.0,  4.0,  3.0,  2.0];

// ISSF-accurate scoring: distance in normalised ±10 space → score
export function scoreFromCoords(x: number, y: number, targetType?: string): number {
  const spec = ISSF_TARGET_SPECS[targetType ?? 'air_rifle_10m'] ?? ISSF_TARGET_SPECS['air_rifle_10m'];
  const distNorm = Math.sqrt(x * x + y * y);
  if (distNorm === 0) return 10.9;
  const distMm = (distNorm / 10) * spec.outerRadiusMm;
  const raw    = 10.9 - distMm / spec.ringWidthMm;
  return Math.round(Math.max(0, Math.min(10.9, raw)) * 10) / 10;
}

export const SHOT_RADIUS   = 5.5;
export const MPI_ARM       = 12;
export const TARGET_EXTENT = 10;

// Legacy ring fill/radius — kept for any external consumers
export function getRingFill(ringNumber: number): string {
  if (ringNumber <= 3) return '#1a1a2e';
  if (ringNumber <= 6) return '#16213e';
  if (ringNumber <= 8) return '#0f3460';
  return '#f8f8f8';
}

export function ringRadius(ringNumber: number, maxR: number): number {
  return maxR * Math.pow((11 - ringNumber) / 10, 1.7);
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
  /** Skip corner direction labels (unused in ISSF rendering) */
  hideCornerLabels?: boolean;
  /** ISSF target type — defaults to 'air_rifle_10m' */
  targetType?: string;
}

/**
 * Draw an ISSF-authentic target on any canvas 2D context.
 * Cream background · black centre zone · correct ring proportions per target type.
 * Pure function — no DOM side-effects beyond the provided ctx.
 */
export function drawTarget(ctx: CanvasRenderingContext2D, opts: DrawTargetOptions): void {
  const { size, shots, mpi, targetType = 'air_rifle_10m' } = opts;
  const zoom       = opts.zoom ?? 1;
  const shotScales = opts.shotScales ?? shots.map(() => 1);
  const spec       = ISSF_TARGET_SPECS[targetType] ?? ISSF_TARGET_SPECS['air_rifle_10m'];
  const { outerRadiusMm, ringWidthMm, darkCenterRings, innerTenRadiusMm } = spec;

  const cx         = size / 2;
  const cy         = size / 2;
  const drawRadius = (size / 2) * 0.92;
  const zR         = drawRadius * zoom;

  // k=1 is outermost ring; first dark ring index:
  const firstDarkRing   = 11 - darkCenterRings;
  const darkZoneOuterMm = outerRadiusMm - (firstDarkRing - 1) * ringWidthMm;
  const darkZoneR       = zR * Math.max(0, darkZoneOuterMm) / outerRadiusMm;
  // Dark zone boundary in normalised ±10 space (for shot zone detection)
  const darkZoneNorm    = Math.max(0, (10 * darkZoneOuterMm) / outerRadiusMm);

  ctx.clearRect(0, 0, size, size);
  // Reset any shadow/alpha state that may have leaked from a previous draw call
  ctx.shadowBlur  = 0;
  ctx.shadowColor = 'transparent';
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  ctx.lineCap = 'butt';

  // ── Dark page background ───────────────────────────────────────────────────
  ctx.fillStyle = '#0E1118';
  ctx.fillRect(0, 0, size, size);

  // ── Cream disc (full target) ───────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, zR, 0, Math.PI * 2);
  ctx.fillStyle = '#F0ECD6';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Dark centre zone ───────────────────────────────────────────────────────
  if (darkZoneR > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, darkZoneR, 0, Math.PI * 2);
    ctx.fillStyle = '#0A0A08';
    ctx.fill();
  }

  // ── Ring dividing lines ────────────────────────────────────────────────────
  // Draw inner boundary of ring k  (= boundary between ring k and ring k+1)
  for (let k = 1; k <= 9; k++) {
    const innerMm = outerRadiusMm - k * ringWidthMm;
    const rPx     = zR * Math.max(0, innerMm) / outerRadiusMm;
    if (rPx < 1) continue;
    const insideDark = rPx <= darkZoneR + 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
    ctx.strokeStyle  = insideDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)';
    ctx.lineWidth    = k === firstDarkRing - 1 ? 1.0 : 0.45;
    ctx.stroke();
  }

  // ── Ring score labels at 3 o'clock (cream zone only) ─────────────────────
  // Matches ISSF print standard and ShotOverlayCanvas / ShotCorrectionCanvas.
  const ringBandPx = zR * ringWidthMm / outerRadiusMm;
  if (ringBandPx >= 8) {
    ctx.save();
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(9, Math.min(14, ringBandPx * 0.55));
    ctx.font = `500 ${fontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';

    for (let k = 1; k <= 9; k++) {
      const outerMm = outerRadiusMm - (k - 1) * ringWidthMm;
      const innerMm = outerRadiusMm - k * ringWidthMm;
      if (innerMm < 0) break;
      const inDark = k >= firstDarkRing;
      if (inDark) continue; // skip dark zone — labels only on cream background
      const rOuter = zR * outerMm / outerRadiusMm;
      if (rOuter < 12) continue; // too small to be readable
      // 3 o'clock: start text at the midpoint of the ring band
      ctx.fillText(String(k), cx + rOuter - ringBandPx * 0.5, cy);
    }
    ctx.restore();
  }

  // ── Crosshair lines ────────────────────────────────────────────────────────
  ctx.setLineDash([2, 4]);
  ctx.lineWidth = 0.6;
  // Cream zone portion
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.moveTo(cx - zR, cy);         ctx.lineTo(cx - darkZoneR, cy);    ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + darkZoneR, cy);  ctx.lineTo(cx + zR, cy);           ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - zR);         ctx.lineTo(cx, cy - darkZoneR);    ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + darkZoneR);  ctx.lineTo(cx, cy + zR);           ctx.stroke();
  // Dark zone portion
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.moveTo(cx - darkZoneR, cy);  ctx.lineTo(cx + darkZoneR, cy);    ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - darkZoneR);  ctx.lineTo(cx, cy + darkZoneR);    ctx.stroke();
  ctx.setLineDash([]);

  // ── X-ring (inner-10) circle ───────────────────────────────────────────────
  const xRingR = zR * innerTenRadiusMm / outerRadiusMm;
  if (xRingR > 1) {
    ctx.beginPath();
    ctx.arc(cx, cy, xRingR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth   = 0.8;
    ctx.stroke();
  }

  // ── Shot dots ─────────────────────────────────────────────────────────────
  shots.forEach((shot, i) => {
    const scale = shotScales[i] ?? 1;
    if (scale <= 0) return;

    const [px, py] = toPixel(shot.x, shot.y, cx, cy, drawRadius, zoom);
    const color    = shotColor(shot.score);
    const r        = SHOT_RADIUS * scale;
    const inDark   = Math.sqrt(shot.x * shot.x + shot.y * shot.y) < darkZoneNorm;

    // Glow halo
    ctx.shadowColor = color;
    ctx.shadowBlur  = 7 * scale;

    // Bullet hole (near-black fill)
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = '#111111';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Score-colour ring
    ctx.beginPath();
    ctx.arc(px, py, r + 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.8;
    ctx.stroke();

    // Outer contrast ring
    ctx.beginPath();
    ctx.arc(px, py, r + 2.8, 0, Math.PI * 2);
    ctx.strokeStyle = inDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
    ctx.lineWidth   = 0.8;
    ctx.stroke();
  });

  // ── MPI crosshair ─────────────────────────────────────────────────────────
  if (mpi) {
    const [mx, my] = toPixel(mpi.x, mpi.y, cx, cy, drawRadius, zoom);

    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth   = 2;
    ctx.shadowColor = '#4FC3F7';
    ctx.shadowBlur  = 10;
    ctx.lineCap     = 'round';

    ctx.beginPath(); ctx.moveTo(mx - MPI_ARM, my); ctx.lineTo(mx + MPI_ARM, my); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx, my - MPI_ARM); ctx.lineTo(mx, my + MPI_ARM); ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(mx, my, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#4FC3F7';
    ctx.fill();
  }
}

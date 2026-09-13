'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { VisionShotResult } from '@shooting-platform/shared-types';
import {
  calculateDecimalScore,
  type TargetType,
} from '../lib/vision-service';

// ── Constants ──────────────────────────────────────────────────────────────────
const HIT_RADIUS_PX = 12;
const DRAG_THRESHOLD = 5;
const MAX_HISTORY = 50;
const DOT_RADIUS = 5;
const DOT_RADIUS_SELECTED = 7;
const DOT_RADIUS_DRAGGING = 8;
const SHOT_COLOR = '#FF4D6D';

// ── ISSF target specs for clean rendering ─────────────────────────────────────
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

// ── Types ──────────────────────────────────────────────────────────────────────
interface ImgRect {
  w: number; h: number; top: number; left: number;
  contentW: number; contentH: number; contentLeft: number; contentTop: number;
}

export interface ShotCorrectionCanvasProps {
  /** Raw camera image URL — kept as layout anchor (hidden behind the canvas). */
  imageObjectUrl: string;
  shots: VisionShotResult[];
  targetType: TargetType;
  /** Warp-space metadata from vision service. */
  warpCenterX?: number;
  warpCenterY?: number;
  warpWidth?: number;
  warpHeight?: number;
  warpMmPerPixel?: number;
  onConfirm: (shots: VisionShotResult[]) => void;
  onCancel: () => void;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ── Clean ISSF target renderer ─────────────────────────────────────────────────
function drawISSFTarget(
  ctx: CanvasRenderingContext2D,
  spec: TargetRenderSpec,
  cx: number,
  cy: number,
  mmPerPxWarp: number,
  scaleX: number,
  scaleY: number,
  contentLeft: number,
  contentTop: number,
  contentW: number,
  contentH: number,
) {
  // mm → display pixels: 1mm = (1/mmPerPxWarp) warp px * scaleX display px/warp px
  const mmToDisplayPx = scaleX / mmPerPxWarp;

  // Cream card background
  ctx.fillStyle = '#F5F0DC';
  ctx.fillRect(contentLeft, contentTop, contentW, contentH);

  // Dark center zone
  const darkZoneRDisplay = spec.darkCenterRings * spec.ringWidthMm * mmToDisplayPx;
  ctx.beginPath();
  ctx.arc(cx, cy, darkZoneRDisplay, 0, Math.PI * 2);
  ctx.fillStyle = '#0A0A0A';
  ctx.fill();

  // Ring lines (from ring 1 outer edge inward)
  for (let ring = 1; ring <= spec.numRings; ring++) {
    const rMm = spec.outerRadiusMm - (ring - 1) * spec.ringWidthMm;
    const rDisplay = rMm * mmToDisplayPx;
    if (rDisplay < 0.5) continue;
    const inDark = rDisplay <= darkZoneRDisplay + 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rDisplay, 0, Math.PI * 2);
    ctx.strokeStyle = inDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)';
    ctx.lineWidth = Math.max(0.5, 0.8 / mmToDisplayPx);
    ctx.stroke();
  }

  // Ring number labels (cream zone only, 3 o'clock — ISSF standard position)
  ctx.save();
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = 'rgba(0,0,0,0.65)';

  for (let ring = 1; ring <= spec.numRings; ring++) {
    const rMm      = spec.outerRadiusMm - (ring - 1) * spec.ringWidthMm;
    const rDisplay = rMm * mmToDisplayPx;
    const bandPx   = spec.ringWidthMm * mmToDisplayPx;
    const inDark   = rDisplay <= darkZoneRDisplay + 0.5;
    if (inDark) continue;
    if (rDisplay < 12) continue;
    const fontSize = Math.max(9, Math.min(14, bandPx * 0.55));
    ctx.font       = `500 ${fontSize}px "JetBrains Mono", monospace`;
    ctx.fillText(String(ring), cx + rDisplay - bandPx * 0.5, cy);
  }
  ctx.restore();

  // Crosshair lines through center
  const armMm = spec.outerRadiusMm;
  const armDisplay = armMm * mmToDisplayPx;
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(cx - armDisplay, cy); ctx.lineTo(cx + armDisplay, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - armDisplay); ctx.lineTo(cx, cy + armDisplay); ctx.stroke();
  ctx.setLineDash([]);

  // Inner ten dot (X-ring)
  const innerTenDisplay = spec.innerTenRadiusMm * mmToDisplayPx;
  if (innerTenDisplay >= 1) {
    ctx.beginPath();
    ctx.arc(cx, cy, innerTenDisplay, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
  }

  // Outer border ring
  const outerDisplay = spec.outerRadiusMm * mmToDisplayPx;
  ctx.beginPath();
  ctx.arc(cx, cy, outerDisplay, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ShotCorrectionCanvas({
  imageObjectUrl,
  shots: initialShots,
  targetType,
  warpCenterX = 500,
  warpCenterY = 500,
  warpWidth   = 1000,
  warpHeight  = 1000,
  warpMmPerPixel = 0.17,
  onConfirm,
  onCancel,
}: ShotCorrectionCanvasProps) {
  const imgRef    = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  const [shots, setShots]       = useState<VisionShotResult[]>(initialShots);
  const [history, setHistory]   = useState<VisionShotResult[][]>([]);
  const [mode, setMode]         = useState<'move' | 'add'>('move');
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [imgRect, setImgRect]   = useState<ImgRect>({ w: 1, h: 1, top: 0, left: 0, contentW: 1, contentH: 1, contentLeft: 0, contentTop: 0 });
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  // A transparent SVG placeholder sized to warpWidth × warpHeight.
  // Used as the <img> source so ResizeObserver computes the correct content
  // area for the coordinate transform — without displaying the raw camera photo.
  const placeholderSrc = useMemo(
    () => `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${warpWidth}" height="${warpHeight}"/>`,
    [warpWidth, warpHeight],
  );

  // ── Coordinate transforms ──────────────────────────────────────────────────
  // pixel_x/pixel_y from the vision service are in warpWidth×warpHeight space.
  // Map them onto the rendered content area (letterbox-corrected).

  const warpToDisplay = useCallback(
    (px: number, py: number): [number, number] => [
      imgRect.contentLeft + px * (imgRect.contentW / warpWidth),
      imgRect.contentTop  + py * (imgRect.contentH / warpHeight),
    ],
    [imgRect, warpWidth, warpHeight],
  );

  const displayToWarp = useCallback(
    (dx: number, dy: number): [number, number] => [
      (dx - imgRect.contentLeft) * (warpWidth  / imgRect.contentW),
      (dy - imgRect.contentTop)  * (warpHeight / imgRect.contentH),
    ],
    [imgRect, warpWidth, warpHeight],
  );

  // ── History helpers ────────────────────────────────────────────────────────

  function pushHistory(current: VisionShotResult[]) {
    setHistory((h) => [...h.slice(-(MAX_HISTORY - 1)), current]);
  }

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setShots(prev);
      setSelected(null);
      return h.slice(0, -1);
    });
  }, []);

  // ── Score recalc ───────────────────────────────────────────────────────────

  function recalcShot(
    shot: VisionShotResult,
    warpX: number,
    warpY: number,
  ): VisionShotResult {
    const { score, isInnerTen, distMm } = calculateDecimalScore(
      warpX, warpY, targetType,
      warpWidth, warpCenterX, warpCenterY, warpMmPerPixel,
    );
    return { ...shot, pixelX: Math.round(warpX), pixelY: Math.round(warpY), score, isInnerTen, distMm };
  }

  // ── Hit test ───────────────────────────────────────────────────────────────

  function hitTest(dx: number, dy: number): number | null {
    for (let i = shots.length - 1; i >= 0; i--) {
      const [sx, sy] = warpToDisplay(shots[i].pixelX, shots[i].pixelY);
      if (Math.sqrt((dx - sx) ** 2 + (dy - sy) ** 2) <= HIT_RADIUS_PX) return i;
    }
    return null;
  }

  // ── ResizeObserver: track rendered image dimensions ───────────────────────

  useLayoutEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    function update() {
      if (!el || !wrapRef.current) return;
      const r  = el.getBoundingClientRect();
      const wr = wrapRef.current.getBoundingClientRect();
      const elemW = r.width;
      const elemH = r.height;
      const natW = el.naturalWidth  || warpWidth;
      const natH = el.naturalHeight || warpHeight;
      const scale    = Math.min(elemW / natW, elemH / natH);
      const contentW = natW * scale;
      const contentH = natH * scale;
      setImgRect({
        w: elemW, h: elemH,
        top:  r.top  - wr.top,
        left: r.left - wr.left,
        contentW,
        contentH,
        contentLeft: (elemW - contentW) / 2,
        contentTop:  (elemH - contentH) / 2,
      });
    }

    function safeUpdate() {
      if (!el || el.naturalWidth === 0) return;
      update();
    }
    // Fire immediately since SVG data URLs load synchronously
    setTimeout(safeUpdate, 0);
    el.addEventListener('load', safeUpdate);
    const ro = new ResizeObserver(safeUpdate);
    ro.observe(el);
    return () => {
      ro.disconnect();
      el.removeEventListener('load', safeUpdate);
    };
  }, [warpWidth, warpHeight]);

  // ── Canvas draw ────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || imgRect.w <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(imgRect.w * dpr);
    canvas.height = Math.round(imgRect.h * dpr);
    canvas.style.width  = `${imgRect.w}px`;
    canvas.style.height = `${imgRect.h}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, imgRect.w, imgRect.h);

    // ── Draw dark void background ──────────────────────────────────────────
    ctx.fillStyle = '#080A0F';
    ctx.fillRect(0, 0, imgRect.w, imgRect.h);

    // ── Draw clean ISSF target ─────────────────────────────────────────────
    const spec   = getTargetSpec(targetType);
    const scaleX = imgRect.contentW / warpWidth;
    const scaleY = imgRect.contentH / warpHeight;
    const [cx, cy] = warpToDisplay(warpCenterX, warpCenterY);

    drawISSFTarget(
      ctx, spec, cx, cy,
      warpMmPerPixel, scaleX, scaleY,
      imgRect.contentLeft, imgRect.contentTop,
      imgRect.contentW, imgRect.contentH,
    );

    // ── Draw shot dots ─────────────────────────────────────────────────────
    shots.forEach((shot, i) => {
      const [sx, sy] = warpToDisplay(shot.pixelX, shot.pixelY);
      const isDraggingThis = dragging === i;
      const isSelectedThis = selected === i;
      const isLowConf = (shot.confidence ?? 1) < 0.6;
      const r = isDraggingThis ? DOT_RADIUS_DRAGGING : isSelectedThis ? DOT_RADIUS_SELECTED : DOT_RADIUS;

      ctx.save();
      if (isDraggingThis) { ctx.shadowColor = SHOT_COLOR; ctx.shadowBlur = 10; }

      // Thin white halo
      ctx.beginPath();
      ctx.arc(sx, sy, r + 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 0.75;
      ctx.stroke();

      // Red ring
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      if (isLowConf) ctx.setLineDash([2, 2]);
      ctx.strokeStyle = SHOT_COLOR;
      ctx.lineWidth = isSelectedThis ? 2 : 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Selection pulse
      if (isSelectedThis && !isDraggingThis) {
        ctx.beginPath();
        ctx.arc(sx, sy, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = `${SHOT_COLOR}55`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Shot number label
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const numLabel = String(shot.shotNumber);
      const tw = ctx.measureText(numLabel).width;
      const lx = sx;
      const ly = sy - r - 2;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(lx - tw / 2 - 1, ly - 8, tw + 2, 9);
      ctx.fillStyle = '#fff';
      ctx.fillText(numLabel, lx, ly);

      if (isLowConf) {
        ctx.font = '7px sans-serif';
        ctx.fillStyle = SHOT_COLOR;
        ctx.textBaseline = 'top';
        ctx.fillText('?', sx + r + 2, sy - 3);
      }

      if (isDraggingThis) {
        const label = shot.score.toFixed(1);
        ctx.font = '10px "JetBrains Mono", monospace';
        const scoreW = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(sx + r + 3, sy - 9, scoreW + 6, 18);
        ctx.fillStyle = SHOT_COLOR;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, sx + r + 6, sy);
      }

      ctx.restore();
    });

    // Add-mode crosshair
    if (mode === 'add' && hoverPos) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(hoverPos.x - 14, hoverPos.y); ctx.lineTo(hoverPos.x + 14, hoverPos.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hoverPos.x, hoverPos.y - 14); ctx.lineTo(hoverPos.x, hoverPos.y + 14); ctx.stroke();
      ctx.restore();
    }
  }, [shots, dragging, selected, imgRect, mode, hoverPos, warpToDisplay,
      targetType, warpCenterX, warpCenterY, warpWidth, warpHeight, warpMmPerPixel]);

  // ── Pointer handlers ───────────────────────────────────────────────────────

  function getCanvasXY(e: React.PointerEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const { x, y } = getCanvasXY(e);
    const hit = hitTest(x, y);

    if (mode === 'add') {
      const [wx, wy] = displayToWarp(x, y);
      const warpX = clamp(wx, 0, warpWidth);
      const warpY = clamp(wy, 0, warpHeight);
      pushHistory(shots);
      const newShot: VisionShotResult = recalcShot(
        { shotNumber: shots.length + 1, score: 0, x: 0, y: 0, pixelX: Math.round(warpX), pixelY: Math.round(warpY), confidence: 1, isInnerTen: false, distMm: 0 },
        warpX, warpY,
      );
      setShots((prev) => [...prev, newShot]);
      setSelected(shots.length);
      return;
    }

    if (hit !== null) {
      dragStartPos.current = { x, y };
      didDrag.current = false;
      setDragging(hit);
      setSelected(hit);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      setSelected(null);
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const { x, y } = getCanvasXY(e);

    if (mode === 'add') {
      setHoverPos({ x, y });
      return;
    }

    if (dragging === null || dragStartPos.current === null) return;

    const dx = x - dragStartPos.current.x;
    const dy = y - dragStartPos.current.y;
    if (!didDrag.current && Math.sqrt(dx ** 2 + dy ** 2) < DRAG_THRESHOLD) return;
    didDrag.current = true;

    const [wx, wy] = displayToWarp(x, y);
    const warpX = clamp(wx, 0, warpWidth);
    const warpY = clamp(wy, 0, warpHeight);

    setShots((prev) => prev.map((s, i) => i === dragging ? recalcShot(s, warpX, warpY) : s));
  }

  function handlePointerUp(_e: React.PointerEvent) {
    if (dragging === null) return;
    if (didDrag.current) pushHistory(shots);
    setDragging(null);
    dragStartPos.current = null;
  }

  function handlePointerLeave() {
    setHoverPos(null);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit !== null) {
      pushHistory(shots);
      setShots((prev) => prev.filter((_, i) => i !== hit).map((s, i) => ({ ...s, shotNumber: i + 1 })));
      setSelected(null);
    }
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected !== null) {
        e.preventDefault();
        setShots((prev) => {
          pushHistory(prev);
          return prev.filter((_, i) => i !== selected).map((s, i) => ({ ...s, shotNumber: i + 1 }));
        });
        setSelected(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, undo]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const avgScore = shots.length > 0
    ? shots.reduce((s, sh) => s + sh.score, 0) / shots.length
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">

      {/* Image + canvas overlay */}
      <div ref={wrapRef} className="relative w-full" style={{ lineHeight: 0 }}>
        {/* Transparent placeholder with correct warp aspect ratio — hidden but
            drives the ResizeObserver so the coordinate mapping is correct. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="w-full rounded-lg"
          style={{ objectFit: 'contain', maxHeight: '60vh', display: 'block', visibility: 'hidden' }}
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          className="absolute rounded-lg"
          style={{
            top: imgRect.top,
            left: imgRect.left,
            width: imgRect.w > 1 ? `${imgRect.w}px` : '100%',
            height: imgRect.h > 1 ? `${imgRect.h}px` : undefined,
            cursor: mode === 'add' ? 'crosshair' : dragging !== null ? 'grabbing' : 'default',
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onContextMenu={handleContextMenu}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { setMode('move'); setHoverPos(null); }}
          className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-widest transition-all
            ${mode === 'move'
              ? 'bg-accent text-[#080A0F] font-bold'
              : 'border border-border-default text-text-secondary hover:border-accent hover:text-accent'}`}
        >
          Move
        </button>
        <button
          type="button"
          onClick={() => setMode('add')}
          className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-widest transition-all
            ${mode === 'add'
              ? 'bg-accent text-[#080A0F] font-bold'
              : 'border border-border-default text-text-secondary hover:border-accent hover:text-accent'}`}
        >
          + Add
        </button>
        <button
          type="button"
          onClick={() => {
            if (selected !== null) {
              pushHistory(shots);
              setShots((prev) =>
                prev.filter((_, i) => i !== selected).map((s, i) => ({ ...s, shotNumber: i + 1 })),
              );
              setSelected(null);
            }
          }}
          disabled={selected === null}
          className="px-3 py-1.5 rounded text-xs font-display uppercase tracking-widest border border-border-default
                     text-text-secondary hover:border-signal-red hover:text-signal-red transition-all disabled:opacity-30"
        >
          × Remove
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={history.length === 0}
          className="px-3 py-1.5 rounded text-xs font-display uppercase tracking-widest border border-border-default
                     text-text-secondary hover:border-accent hover:text-accent transition-all disabled:opacity-30 ml-auto"
        >
          ↩ Undo
        </button>
      </div>

      {/* Shot list panel */}
      {shots.length > 0 && (
        <div className="rounded-lg border border-border-subtle bg-bg-elevated p-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-muted text-xs font-display uppercase tracking-widest">
              {shots.length} shot{shots.length !== 1 ? 's' : ''}
            </span>
            <span className="font-mono text-sm" style={{ color: SHOT_COLOR }}>
              {avgScore.toFixed(1)} avg
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
            {shots.map((shot, i) => (
              <div
                key={i}
                onClick={() => setSelected(i)}
                className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer
                  transition-colors text-xs
                  ${selected === i
                    ? 'bg-[rgba(245,166,35,0.15)] border border-accent/40'
                    : 'hover:bg-bg-surface'}`}
              >
                <span className="font-mono" style={{ color: SHOT_COLOR }}>
                  #{shot.shotNumber} {shot.score.toFixed(1)}
                </span>
                {(shot.confidence ?? 1) < 0.6 && (
                  <span className="text-warning text-[10px] mr-1">⚠</span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    pushHistory(shots);
                    setShots((prev) =>
                      prev.filter((_, j) => j !== i).map((s, j) => ({ ...s, shotNumber: j + 1 })),
                    );
                    if (selected === i) setSelected(null);
                  }}
                  className="text-text-muted hover:text-signal-red transition-colors ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-border-default text-text-secondary
                     hover:border-accent hover:text-accent text-xs font-display uppercase tracking-widest transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(shots)}
          disabled={shots.length === 0}
          className="flex-1 py-2 rounded-lg border text-xs font-display uppercase tracking-widest transition-all
                     bg-[rgba(0,229,160,0.1)] border-[rgba(0,229,160,0.3)] text-[#00E5A0]
                     hover:bg-[rgba(0,229,160,0.2)] disabled:opacity-30"
        >
          ✓ Save to session
        </button>
      </div>
    </div>
  );
}

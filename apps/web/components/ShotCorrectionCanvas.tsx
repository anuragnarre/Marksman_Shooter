'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { VisionShotResult } from '@shooting-platform/shared-types';
import {
  calculateDecimalScore,
  type TargetType,
} from '../lib/vision-service';

// ── Constants ──────────────────────────────────────────────────────────────────
const WARP_SIZE = 1000;
const HIT_RADIUS_PX = 14;
const DRAG_THRESHOLD = 5;
const MAX_HISTORY = 50;
const DOT_RADIUS = 9;
const DOT_RADIUS_SELECTED = 12;
const DOT_RADIUS_DRAGGING = 14;

// ── Types ──────────────────────────────────────────────────────────────────────
interface ImgRect { w: number; h: number; top: number; left: number }

export interface ShotCorrectionCanvasProps {
  imageObjectUrl: string;
  shots: VisionShotResult[];
  targetType: TargetType;
  onConfirm: (shots: VisionShotResult[]) => void;
  onCancel: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function shotColor(score: number): string {
  if (score >= 10.5) return '#F5A623';
  if (score >= 10.0) return '#4FC3F7';
  if (score >= 9.0)  return '#00E5A0';
  return '#FF4D6D';
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ShotCorrectionCanvas({
  imageObjectUrl,
  shots: initialShots,
  targetType,
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
  const [imgRect, setImgRect]   = useState<ImgRect>({ w: 1, h: 1, top: 0, left: 0 });
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  // ── Coordinate transforms ──────────────────────────────────────────────────

  const warpToDisplay = useCallback(
    (px: number, py: number): [number, number] => [
      px * (imgRect.w / WARP_SIZE),
      py * (imgRect.h / WARP_SIZE),
    ],
    [imgRect],
  );

  const displayToWarp = useCallback(
    (dx: number, dy: number): [number, number] => [
      dx * (WARP_SIZE / imgRect.w),
      dy * (WARP_SIZE / imgRect.h),
    ],
    [imgRect],
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
    const { score, isInnerTen, distMm } = calculateDecimalScore(warpX, warpY, targetType);
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
      setImgRect({ w: r.width, h: r.height, top: r.top - wr.top, left: r.left - wr.left });
    }

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

    // Centre crosshair
    const [cx, cy] = warpToDisplay(500, 500);
    ctx.save();
    ctx.strokeStyle = 'rgba(245,166,35,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke();
    ctx.restore();

    shots.forEach((shot, i) => {
      const [sx, sy] = warpToDisplay(shot.pixelX, shot.pixelY);
      const isDraggingThis = dragging === i;
      const isSelectedThis = selected === i;
      const isLowConf = (shot.confidence ?? 1) < 0.6;
      const r = isDraggingThis ? DOT_RADIUS_DRAGGING : isSelectedThis ? DOT_RADIUS_SELECTED : DOT_RADIUS;

      ctx.save();
      if (isDraggingThis) { ctx.shadowColor = shotColor(shot.score); ctx.shadowBlur = 16; }

      // White outline ring
      ctx.beginPath();
      ctx.arc(sx, sy, r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = isSelectedThis ? 2.5 : 1.5;
      ctx.stroke();

      // Selection ring
      if (isSelectedThis && !isDraggingThis) {
        ctx.beginPath();
        ctx.arc(sx, sy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Dot fill
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);

      if (isLowConf) {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = shotColor(shot.score);
        ctx.lineWidth = 2;
        ctx.fillStyle = `${shotColor(shot.score)}55`;
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#F5A623';
        ctx.font = `${Math.round(r * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', sx, sy);
      } else {
        ctx.fillStyle = shotColor(shot.score);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = `bold ${Math.round(r * 0.9)}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(shot.shotNumber), sx, sy);
      }

      // Live score tooltip while dragging
      if (isDraggingThis) {
        const label = shot.score.toFixed(1);
        ctx.font = '11px JetBrains Mono, monospace';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(sx + r + 4, sy - 10, tw + 8, 20);
        ctx.fillStyle = shotColor(shot.score);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, sx + r + 8, sy);
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
  }, [shots, dragging, selected, imgRect, mode, hoverPos, warpToDisplay]);

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
      const warpX = clamp(wx, 0, WARP_SIZE);
      const warpY = clamp(wy, 0, WARP_SIZE);
      pushHistory(shots);
      const newShot: VisionShotResult = recalcShot(
        { shotNumber: shots.length + 1, score: 0, x: 0, y: 0, pixelX: Math.round(warpX), pixelY: Math.round(warpY), confidence: 1, isInnerTen: false, distMm: 0 },
        warpX,
        warpY,
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
    const warpX = clamp(wx, 0, WARP_SIZE);
    const warpY = clamp(wy, 0, WARP_SIZE);

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageObjectUrl}
          alt="Target photo"
          className="w-full rounded-lg"
          style={{ objectFit: 'contain', maxHeight: '60vh', display: 'block' }}
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          className="absolute rounded-lg"
          style={{
            top: imgRect.top,
            left: imgRect.left,
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
            <span className="font-mono text-sm" style={{ color: shotColor(avgScore) }}>
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
                <span className="font-mono" style={{ color: shotColor(shot.score) }}>
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

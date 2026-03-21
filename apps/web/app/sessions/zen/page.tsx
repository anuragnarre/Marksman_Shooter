'use client';

// Zen Mode — distraction-free shooting session UI with speech synthesis score announcement

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { shotColor, RING_RADII, RING_SCORES } from '../../../lib/draw-target';
import type { Session, Shot } from '@shooting-platform/shared-types';

// Ring colors for canvas rendering
const RING_COLORS = ['#F5A623', '#4FC3F7', '#00E5A0', '#00E5A0',
                     '#F0F4FF', '#F0F4FF', '#F0F4FF', '#F0F4FF', '#F0F4FF', '#F0F4FF'];

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate  = 0.9;
  utter.pitch = 1.0;
  window.speechSynthesis.speak(utter);
}

// ── Inner component — uses useSearchParams (must be inside Suspense) ──────────

function ZenModeInner() {
  const router    = useRouter();
  const params    = useSearchParams();
  const sessionId = params.get('id') ?? '';

  const [session,    setSession]    = useState<Session | null>(null);
  const [shots,      setShots]      = useState<Shot[]>([]);
  const [score,      setScore]      = useState('');
  const [xVal,       setXVal]       = useState('');
  const [yVal,       setYVal]       = useState('');
  const [elapsed,    setElapsed]    = useState(0);
  const [lastScore,  setLastScore]  = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError,  setLoadError]  = useState<string | null>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const startTime  = useRef(Date.now());
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load session ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!sessionId) return;
    apiFetch<Session>(`/sessions/${sessionId}`)
      .then((s) => {
        setSession(s);
        setShots((s.shots ?? []) as Shot[]);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [sessionId]);

  // ── Elapsed timer ───────────────────────────────────────────────────────────

  useEffect(() => {
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)),
      1000,
    );
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Target canvas ───────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W  = canvas.width;
    const H  = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const maxR = Math.min(W, H) * 0.46;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(8,10,15,1)';
    ctx.fillRect(0, 0, W, H);

    // Rings — draw outermost first so inner rings sit on top
    [...RING_RADII].reverse().forEach((r, i) => {
      const idx = RING_RADII.length - 1 - i;
      ctx.beginPath();
      ctx.arc(cx, cy, r * maxR, 0, Math.PI * 2);
      ctx.strokeStyle = `${RING_COLORS[idx]}25`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Crosshairs
    ctx.strokeStyle = 'rgba(245,166,35,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Shot dots
    shots.forEach((shot) => {
      const px = cx + (shot.x / 10) * maxR;
      const py = cy - (shot.y / 10) * maxR;
      const c  = shotColor(shot.score);

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle   = c;
      ctx.shadowBlur  = 14;
      ctx.shadowColor = c;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [shots]);

  // ── Shot submission — POST /shots/manual ────────────────────────────────────

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum)) return;

    const xNum = isNaN(parseFloat(xVal)) ? 0 : parseFloat(xVal);
    const yNum = isNaN(parseFloat(yVal)) ? 0 : parseFloat(yVal);

    setSubmitting(true);
    try {
      await apiFetch('/shots/manual', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          shots: [{ shotNumber: shots.length + 1, score: scoreNum, x: xNum, y: yNum }],
        }),
      });

      setShots((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          sessionId,
          shotNumber: prev.length + 1,
          score: scoreNum,
          x: xNum,
          y: yNum,
          timestamp: new Date(),
        },
      ]);
      setLastScore(scoreNum);
      speak(String(scoreNum));
      setScore('');
      setXVal('');
      setYVal('');
    } catch {
      // error is silently ignored to stay in zen — timer/count still work
    } finally {
      setSubmitting(false);
    }
  }, [score, xVal, yVal, shots.length, sessionId]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const lastColor = lastScore !== null ? shotColor(lastScore) : '#F0F4FF';

  if (!sessionId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(8,10,15,0.98)' }}>
        <p className="text-[#4A5568] font-display">No session specified. <a href="/sessions" className="text-[#F5A623]">Back to sessions</a></p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: 'rgba(8,10,15,0.98)', zIndex: 9999 }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="flex items-center gap-4">
          <span
            className="font-display font-black text-sm tracking-[0.22em]"
            style={{ color: '#F5A623' }}
          >
            ZEN MODE
          </span>
          {session && (
            <span className="text-[#4A5568] text-xs font-display">{session.discipline}</span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="font-data font-bold text-xl" style={{ color: '#F5A623' }}>{shots.length}</p>
            <p className="text-[#4A5568] text-[10px] font-display uppercase tracking-wide">Shots</p>
          </div>
          <div className="text-center">
            <p className="font-data font-bold text-xl" style={{ color: '#4FC3F7' }}>{formatTime(elapsed)}</p>
            <p className="text-[#4A5568] text-[10px] font-display uppercase tracking-wide">Elapsed</p>
          </div>
          <button
            onClick={() => router.push(`/sessions/${sessionId}`)}
            className="flex items-center gap-1.5 text-[#4A5568] hover:text-[#F0F4FF] text-xs font-display
                       uppercase tracking-wide transition-colors px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <CloseIcon />
            Exit
          </button>
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Target canvas */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <canvas
            ref={canvasRef}
            width={460}
            height={460}
            className="max-w-full max-h-full"
            style={{ borderRadius: '50%' }}
          />
        </div>

        {/* Right panel */}
        <div
          className="w-64 lg:w-72 shrink-0 flex flex-col p-4 gap-3 overflow-y-auto"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.04)' }}
        >

          {/* Last shot score */}
          {lastScore !== null && (
            <div
              className="rounded-xl p-4 text-center shrink-0"
              style={{
                background: `${lastColor}0D`,
                border: `1px solid ${lastColor}30`,
              }}
            >
              <p className="text-[#4A5568] text-[10px] font-display uppercase tracking-widest mb-1">Last</p>
              <p className="font-data font-black text-5xl leading-none" style={{ color: lastColor }}>
                {lastScore}
              </p>
            </div>
          )}

          {/* Shot form */}
          <form onSubmit={handleSubmit} className="space-y-2 shrink-0">
            <div>
              <label className="label block mb-1">Score *</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10.9"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="field w-full font-data text-center text-2xl font-bold"
                style={{ color: '#F5A623' }}
                placeholder="10.5"
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label block mb-1">X</label>
                <input
                  type="number"
                  step="0.1"
                  value={xVal}
                  onChange={(e) => setXVal(e.target.value)}
                  className="field w-full font-data text-center text-sm"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="label block mb-1">Y</label>
                <input
                  type="number"
                  step="0.1"
                  value={yVal}
                  onChange={(e) => setYVal(e.target.value)}
                  className="field w-full font-data text-center text-sm"
                  placeholder="0.0"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || !score}
              className="btn btn-primary w-full py-3 text-sm font-bold disabled:opacity-50"
            >
              {submitting ? '…' : 'Log Shot'}
            </button>
          </form>

          {/* Shot history */}
          {shots.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              <p className="label">History</p>
              {[...shots].reverse().map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg px-3 py-1.5"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <span className="text-[#4A5568] text-xs font-data">#{s.shotNumber}</span>
                  <span
                    className="font-data font-bold text-sm"
                    style={{ color: shotColor(s.score) }}
                  >
                    {s.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page export with Suspense boundary (required by Next.js 15 for useSearchParams) ──

export default function ZenModePage() {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(8,10,15,0.98)' }}
        >
          <div className="w-10 h-10 rounded-full border-2 border-[#F5A623] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ZenModeInner />
    </Suspense>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="1" y1="1" x2="11" y2="11" />
      <line x1="11" y1="1" x2="1" y2="11" />
    </svg>
  );
}

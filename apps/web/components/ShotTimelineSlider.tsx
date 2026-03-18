'use client';

// ShotTimelineSlider — interactive shot replay scrubber.
// Scrub through a session's shots chronologically.
// Stats update live as you drag. Auto-play mode shows the session unfolding.

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Shot } from '@shooting-platform/shared-types';

// ── Target canvas geometry ────────────────────────────────────────────────────
const W    = 240;
const CX   = W / 2;
const CY   = W / 2;
const SRC  = 366;
const SCAL = W / SRC;

const RINGS = [
  { r: W * 0.098, stroke: '#F5A623', opacity: 0.5 },  // 10-ring
  { r: W * 0.135, stroke: '#4FC3F7', opacity: 0.25 },
  { r: W * 0.175, stroke: '#1E2433', opacity: 0.8  },
  { r: W * 0.218, stroke: '#1E2433', opacity: 0.8  },
  { r: W * 0.265, stroke: '#1E2433', opacity: 0.5  },
];

function shotColor(score: number) {
  if (score >= 10.5) return '#F5A623';
  if (score >= 10.0) return '#4FC3F7';
  if (score >= 9.0)  return '#00E5A0';
  return '#FF4D6D';
}

interface ShotTimelineSliderProps {
  shots: Shot[];
  autoPlayInterval?: number;  // ms between shots in auto-play (default 350)
  className?: string;
}

export function ShotTimelineSlider({
  shots,
  autoPlayInterval = 350,
  className = '',
}: ShotTimelineSliderProps) {
  const [index, setIndex]         = useState(shots.length > 0 ? shots.length - 1 : 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const subset     = shots.slice(0, index + 1);
  const current    = shots[index];
  const avg        = subset.length > 0 ? subset.reduce((s, sh) => s + sh.score, 0) / subset.length : 0;

  // ── Draw ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, W);

    // Background
    ctx.fillStyle = '#080A0F';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, W, 12);
    ctx.fill();

    // Rings
    RINGS.forEach(({ r, stroke, opacity }) => {
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.strokeStyle = stroke;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Crosshair dashes
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(30,36,67,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(CX - W * 0.28, CY); ctx.lineTo(CX + W * 0.28, CY);
    ctx.moveTo(CX, CY - W * 0.28); ctx.lineTo(CX, CY + W * 0.28);
    ctx.stroke();
    ctx.setLineDash([]);

    // Shot path — faint trail
    if (subset.length > 1) {
      ctx.beginPath();
      subset.forEach((sh, i) => {
        const x = (sh.x ?? SRC / 2) * SCAL;
        const y = (sh.y ?? SRC / 2) * SCAL;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(245,166,35,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Historical dots (faded)
    subset.slice(0, -1).forEach((sh) => {
      const x = (sh.x ?? SRC / 2) * SCAL;
      const y = (sh.y ?? SRC / 2) * SCAL;
      const c = shotColor(sh.score);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // MPI
    if (subset.length > 1) {
      const mpiX = subset.reduce((s, sh) => s + (sh.x ?? SRC / 2), 0) / subset.length * SCAL;
      const mpiY = subset.reduce((s, sh) => s + (sh.y ?? SRC / 2), 0) / subset.length * SCAL;
      ctx.strokeStyle = 'rgba(79,195,247,0.5)';
      ctx.lineWidth = 0.8;
      ctx.shadowBlur = 3;
      ctx.shadowColor = '#4FC3F7';
      ctx.beginPath();
      ctx.moveTo(mpiX - 8, mpiY); ctx.lineTo(mpiX + 8, mpiY);
      ctx.moveTo(mpiX, mpiY - 8); ctx.lineTo(mpiX, mpiY + 8);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Current (active) dot — largest, glowing
    if (current) {
      const x = (current.x ?? SRC / 2) * SCAL;
      const y = (current.y ?? SRC / 2) * SCAL;
      const c = shotColor(current.score);

      // Outer glow ring
      ctx.shadowBlur = 12;
      ctx.shadowColor = c;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Filled dot
      ctx.fillStyle = c;
      ctx.shadowBlur = 6;
      ctx.shadowColor = c;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // White core
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [shots, index, subset, current]);

  // ── Auto-play ─────────────────────────────────────────────────────────────
  const stopPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlay = useCallback(() => {
    if (shots.length < 2) return;
    setIndex(0);
    setIsPlaying(true);
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      if (i >= shots.length) {
        stopPlay();
        return;
      }
      setIndex(i);
    }, autoPlayInterval);
  }, [shots, autoPlayInterval, stopPlay]);

  useEffect(() => () => stopPlay(), [stopPlay]);

  // Reset on new shots
  useEffect(() => {
    stopPlay();
    setIndex(shots.length > 0 ? shots.length - 1 : 0);
  }, [shots, stopPlay]);

  if (shots.length === 0) {
    return (
      <div className={`flex items-center justify-center h-40 rounded-2xl ${className}`}
        style={{ background: '#0C0F1A', border: '1px solid #1E2433' }}>
        <p className="text-[#4A5568] text-xs font-display uppercase tracking-widest">No shots to replay</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>

      {/* Target canvas */}
      <div className="flex gap-4 items-start">
        <canvas
          ref={canvasRef}
          width={W}
          height={W}
          className="rounded-xl shrink-0"
          style={{
            width: 160, height: 160,
            border: '1px solid rgba(255,255,255,0.04)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
          aria-label="Shot replay canvas"
        />

        {/* Live stats */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div>
            <p className="text-[10px] font-display uppercase tracking-[0.12em]" style={{ color: '#4A5568' }}>Shot</p>
            <p className="font-data font-black text-2xl leading-none tabular-nums"
              style={{ color: current ? shotColor(current.score) : '#F0F4FF',
                       textShadow: current ? `0 0 16px ${shotColor(current.score)}60` : 'none' }}>
              {current?.score.toFixed(1) ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-display uppercase tracking-[0.12em]" style={{ color: '#4A5568' }}>Running Avg</p>
            <p className="font-data font-semibold text-base leading-none tabular-nums" style={{ color: '#F5A623' }}>
              {avg.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-display uppercase tracking-[0.12em]" style={{ color: '#4A5568' }}>Shots shown</p>
            <p className="font-data font-semibold text-base leading-none tabular-nums" style={{ color: '#8892A4' }}>
              {index + 1} / {shots.length}
            </p>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="flex flex-col gap-2">
        <input
          type="range"
          min={0}
          max={shots.length - 1}
          value={index}
          onChange={(e) => {
            stopPlay();
            setIndex(Number(e.target.value));
          }}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #F5A623 0%, #F5A623 ${(index / (shots.length - 1)) * 100}%, rgba(26,32,53,0.8) ${(index / (shots.length - 1)) * 100}%, rgba(26,32,53,0.8) 100%)`,
            outline: 'none',
          }}
          aria-label="Shot timeline"
        />

        {/* Shot score markers */}
        <div className="relative h-3">
          {shots.map((sh, i) => (
            <div
              key={i}
              className="absolute top-0 w-0.5 h-2 rounded-full -translate-x-1/2 cursor-pointer"
              style={{
                left: `${(i / (shots.length - 1)) * 100}%`,
                background: shotColor(sh.score),
                opacity: i <= index ? 1 : 0.3,
                boxShadow: i === index ? `0 0 4px ${shotColor(sh.score)}` : 'none',
              }}
              onClick={() => { stopPlay(); setIndex(i); }}
              title={`Shot ${i + 1}: ${sh.score.toFixed(1)}`}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={isPlaying ? stopPlay : startPlay}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-display font-bold
                     uppercase tracking-[0.1em] transition-all duration-200"
          style={{
            background: isPlaying ? 'rgba(255,77,109,0.1)' : 'rgba(245,166,35,0.1)',
            border: `1px solid ${isPlaying ? 'rgba(255,77,109,0.3)' : 'rgba(245,166,35,0.3)'}`,
            color: isPlaying ? '#FF4D6D' : '#F5A623',
          }}
        >
          {isPlaying ? <StopIcon /> : <PlayIcon />}
          {isPlaying ? 'Stop' : 'Replay'}
        </button>

        <button
          onClick={() => { stopPlay(); setIndex(0); }}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#4A5568' }}
          title="Reset to first shot"
        >
          <ResetIcon />
        </button>

        <button
          onClick={() => { stopPlay(); setIndex(shots.length - 1); }}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#4A5568' }}
          title="Jump to last shot"
        >
          <EndIcon />
        </button>

        <span className="ml-auto font-data text-[11px] tabular-nums" style={{ color: '#4A5568' }}>
          {index + 1} / {shots.length}
        </span>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <polygon points="2,1 11,6 2,11" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <rect x="2" y="2" width="8" height="8" rx="1" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 6a4 4 0 1 1 .9 2.5" />
      <polyline points="2,3.5 2,6.5 5,6.5" />
    </svg>
  );
}

function EndIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <polygon points="1,1 8,6 1,11" fill="currentColor" stroke="none" />
      <line x1="10" y1="1" x2="10" y2="11" />
    </svg>
  );
}

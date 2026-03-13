// apps/web/components/ui/ShotTable.tsx
'use client';

import React, { useState } from 'react';
import type { Shot } from '@shooting-platform/shared-types';

// ── Score helpers ─────────────────────────────────────────────────────────────

function getRingLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 10.5) return { label: 'X',  color: '#F5A623', bg: 'rgba(245,166,35,0.15)' };
  if (score >= 10.0) return { label: '10', color: '#4FC3F7', bg: 'rgba(79,195,247,0.12)' };
  if (score >= 9.0)  return { label: '9',  color: '#00E5A0', bg: 'rgba(0,229,160,0.10)' };
  if (score >= 8.0)  return { label: '8',  color: '#F0F4FF', bg: 'rgba(240,244,255,0.06)' };
  if (score >= 7.0)  return { label: '7',  color: '#FF4D6D', bg: 'rgba(255,77,109,0.08)' };
  return              { label: '<7', color: '#FF4D6D', bg: 'rgba(255,77,109,0.12)' };
}

function getScoreColor(score: number): string {
  if (score >= 10.5) return '#F5A623';
  if (score >= 10.0) return '#4FC3F7';
  if (score >= 9.0)  return '#00E5A0';
  if (score >= 8.0)  return '#F0F4FF';
  return '#FF4D6D';
}

// ── Direction Indicator ───────────────────────────────────────────────────────
// Coordinate space: X+ = right, Y+ = up (standard math, Y flipped from canvas).
// A shot at (x=+2, y=+3) landed Top-Right of the bullseye → ⬈

const AXIS_THRESHOLD = 0.4; // within ±0.4 units of an axis → cardinal direction

interface Direction {
  symbol: string;
  label:  string;
  color:  string;
}

function getDirection(x: number, y: number): Direction {
  const nearX = Math.abs(x) <= AXIS_THRESHOLD;
  const nearY = Math.abs(y) <= AXIS_THRESHOLD;

  // Dead center
  if (nearX && nearY) return { symbol: '●', label: 'Center', color: '#F5A623' };

  // Diagonal quadrants — primary indicators requested by user
  if (!nearX && !nearY) {
    if (x > 0 && y > 0) return { symbol: '⬈', label: 'Top-Right',    color: '#4FC3F7' };
    if (x < 0 && y > 0) return { symbol: '⬉', label: 'Top-Left',     color: '#4FC3F7' };
    if (x > 0 && y < 0) return { symbol: '⬊', label: 'Bottom-Right', color: '#8892A4' };
    /* x < 0 && y < 0 */return { symbol: '⬋', label: 'Bottom-Left',  color: '#8892A4' };
  }

  // Cardinal (one axis near zero)
  if (nearX && y > 0) return { symbol: '↑', label: 'Top',    color: '#4FC3F7' };
  if (nearX && y < 0) return { symbol: '↓', label: 'Bottom', color: '#8892A4' };
  if (x > 0)          return { symbol: '→', label: 'Right',  color: '#4FC3F7' };
  /* x < 0 */         return { symbol: '←', label: 'Left',   color: '#8892A4' };
}

// ── Timestamp formatter ───────────────────────────────────────────────────────

function fmtTime(ts: Date | string | undefined | null): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour:   '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '—';
  }
}

// ── Coordinate color ──────────────────────────────────────────────────────────

function xColor(v: number) { return v < 0 ? '#FF4D6D' : v > 0 ? '#4FC3F7' : '#8892A4'; }
function yColor(v: number) { return v < 0 ? '#FF4D6D' : v > 0 ? '#00E5A0' : '#8892A4'; }

// ── Main Component ────────────────────────────────────────────────────────────

interface ShotTableProps {
  shots: Shot[];
  highlightSeries?: boolean;
}

export function ShotTable({ shots, highlightSeries = true }: ShotTableProps) {
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (shots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BlinkingCrosshair />
        <p className="text-[#F0F4FF] font-display font-semibold text-lg mt-4">No shots recorded</p>
        <p className="text-[#4A5568] text-sm mt-1">Choose an input method above to begin logging shots.</p>
      </div>
    );
  }

  const sorted       = sortDir === 'asc' ? [...shots] : [...shots].reverse();
  const avgScore     = shots.reduce((s, sh) => s + sh.score, 0) / shots.length;
  const bestScore    = Math.max(...shots.map((s) => s.score));
  const xRingCount   = shots.filter((s) => s.score >= 10.5).length;
  const tenRingCount = shots.filter((s) => s.score >= 10.0).length;

  // Group into series of 10
  const series: Shot[][] = [];
  for (let i = 0; i < sorted.length; i += 10) series.push(sorted.slice(i, i + 10));

  return (
    <div>
      {/* ── Header stats bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5 border-b border-[#1E2433] bg-[#0A0D12]">
        <StatPill label="Shots"   value={String(shots.length)} />
        <Divider />
        <StatPill label="Average" value={avgScore.toFixed(2)}  color={getScoreColor(avgScore)} />
        <Divider />
        <StatPill label="Best"    value={bestScore.toFixed(1)} color={getScoreColor(bestScore)} />
        <Divider />
        <StatPill label="X-Ring"  value={String(xRingCount)}   color="#F5A623" dot />
        <Divider />
        <StatPill label="10+"     value={String(tenRingCount)}  color="#4FC3F7" dot />

        <button
          className="ml-auto flex items-center gap-1 text-[10px] font-display uppercase tracking-widest
                     text-[#4A5568] hover:text-[#8892A4] transition-colors"
          onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
          aria-label="Toggle sort direction"
        >
          #{sortDir === 'asc' ? '1→N' : 'N→1'}
          <SortIcon dir={sortDir} />
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label="Shot data">
          <thead>
            <tr className="border-b border-[#1E2433] bg-[rgba(10,13,18,0.95)]">
              <th className="text-left py-2.5 px-4 label text-[10px] w-10">#</th>
              <th className="text-left py-2.5 px-3 label text-[10px]">Ring</th>
              <th className="text-right py-2.5 px-4 label text-[10px]">Score</th>
              <th className="text-left py-2.5 px-4 label text-[10px]">Direction</th>
              <th className="text-right py-2.5 px-3 label text-[10px] hidden sm:table-cell">X</th>
              <th className="text-right py-2.5 px-3 label text-[10px] hidden sm:table-cell">Y</th>
              <th className="text-right py-2.5 px-4 label text-[10px] hidden md:table-cell">Time</th>
              <th className="text-center py-2.5 px-3 label text-[10px] hidden lg:table-cell w-8">Δ</th>
            </tr>
          </thead>

          <tbody>
            {series.map((group, si) => {
              const seriesAvg   = group.reduce((s, sh) => s + sh.score, 0) / group.length;
              const seriesTotal = group.reduce((s, sh) => s + sh.score, 0);
              const seriesMin   = Math.min(...group.map((s) => s.score));
              const seriesMax   = Math.max(...group.map((s) => s.score));

              return (
                <React.Fragment key={`series-${si}`}>
                  {group.map((shot, rowIdx) => {
                    const globalIdx = si * 10 + rowIdx;
                    const prevScore = globalIdx > 0 ? sorted[globalIdx - 1].score : null;
                    const ring      = getRingLabel(shot.score);
                    const dir       = getDirection(shot.x, shot.y);
                    const trend     = prevScore === null ? null : shot.score - prevScore;

                    return (
                      <tr
                        key={shot.id}
                        className="group border-b border-[#1E2433]/40 hover:bg-[#161B26] transition-colors duration-100"
                      >
                        {/* Shot # */}
                        <td className="py-2.5 px-4 text-[#4A5568] font-data text-xs tabular-nums">
                          {shot.shotNumber}
                        </td>

                        {/* Ring badge */}
                        <td className="py-2.5 px-3">
                          <span
                            className="inline-flex items-center justify-center w-7 h-5 rounded text-[10px] font-display font-bold tracking-wide"
                            style={{ color: ring.color, background: ring.bg }}
                          >
                            {ring.label}
                          </span>
                        </td>

                        {/* Score */}
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className="font-data font-bold text-base tabular-nums"
                            style={{ color: ring.color }}
                          >
                            {shot.score.toFixed(1)}
                          </span>
                        </td>

                        {/* Direction */}
                        <td className="py-2.5 px-4">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="text-base leading-none select-none"
                              style={{ color: dir.color }}
                              aria-hidden="true"
                            >
                              {dir.symbol}
                            </span>
                            <span
                              className="text-[10px] font-display uppercase tracking-wide hidden sm:inline"
                              style={{ color: dir.color, opacity: 0.75 }}
                            >
                              {dir.label}
                            </span>
                          </span>
                        </td>

                        {/* X coordinate */}
                        <td className="py-2.5 px-3 text-right font-data text-xs tabular-nums hidden sm:table-cell">
                          <span style={{ color: xColor(shot.x) }}>
                            {shot.x >= 0 ? '+' : ''}{shot.x.toFixed(2)}
                          </span>
                        </td>

                        {/* Y coordinate */}
                        <td className="py-2.5 px-3 text-right font-data text-xs tabular-nums hidden sm:table-cell">
                          <span style={{ color: yColor(shot.y) }}>
                            {shot.y >= 0 ? '+' : ''}{shot.y.toFixed(2)}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="py-2.5 px-4 text-right font-data text-[11px] text-[#4A5568] tabular-nums hidden md:table-cell">
                          {fmtTime(shot.timestamp)}
                        </td>

                        {/* Trend Δ */}
                        <td className="py-2.5 px-3 text-center hidden lg:table-cell">
                          {trend === null ? (
                            <span className="text-[#4A5568] text-xs">—</span>
                          ) : trend > 0.05 ? (
                            <span
                              className="text-[#00E5A0] text-xs font-bold"
                              title={`+${trend.toFixed(1)}`}
                            >↑</span>
                          ) : trend < -0.05 ? (
                            <span
                              className="text-[#FF4D6D] text-xs font-bold"
                              title={trend.toFixed(1)}
                            >↓</span>
                          ) : (
                            <span className="text-[#4A5568] text-xs" title="Stable">→</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* ── Series summary row ──────────────────────────────── */}
                  {highlightSeries && (
                    <tr className="border-y border-[#1E2433] bg-[rgba(245,166,35,0.04)]">
                      <td className="py-2 px-4">
                        <span className="text-[10px] font-display font-bold uppercase tracking-widest text-accent">
                          S{si + 1}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-display text-[#4A5568] uppercase tracking-wide">
                          {group.length} shots
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span className="font-data font-bold text-accent text-sm tabular-nums">
                          {seriesAvg.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#4A5568] ml-1">avg</span>
                      </td>
                      {/* Direction col — series direction distribution hint */}
                      <td className="py-2 px-4">
                        <SeriesDirectionHint shots={group} />
                      </td>
                      <td className="py-2 px-3 hidden sm:table-cell">
                        <span className="text-[10px] text-[#4A5568] font-data tabular-nums">
                          Σ {seriesTotal.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3 hidden sm:table-cell">
                        <span className="text-[10px] text-[#4A5568] font-data tabular-nums">
                          {seriesMin.toFixed(1)}–{seriesMax.toFixed(1)}
                        </span>
                      </td>
                      <td className="hidden md:table-cell" />
                      <td className="hidden lg:table-cell" />
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Direction legend ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 border-t border-[#1E2433] bg-[#0A0D12]">
        <span className="text-[9px] font-display uppercase tracking-widest text-[#2A3040]">Direction</span>
        {([
          { symbol: '⬉', label: 'Top-Left',     color: '#4FC3F7' },
          { symbol: '⬈', label: 'Top-Right',    color: '#4FC3F7' },
          { symbol: '⬋', label: 'Bottom-Left',  color: '#8892A4' },
          { symbol: '⬊', label: 'Bottom-Right', color: '#8892A4' },
          { symbol: '●', label: 'Center',        color: '#F5A623' },
        ] as const).map(({ symbol, label, color }) => (
          <span key={label} className="flex items-center gap-1 text-[10px] font-display text-[#4A5568]">
            <span style={{ color }} aria-hidden="true">{symbol}</span>
            {label}
          </span>
        ))}
        <span className="ml-auto text-[9px] font-display uppercase tracking-widest text-[#2A3040]">
          X+ right · X− left · Y+ up · Y− down
        </span>
      </div>
    </div>
  );
}

// ── Series direction hint — shows dominant quadrant ───────────────────────────

function SeriesDirectionHint({ shots }: { shots: Shot[] }) {
  const counts: Record<string, number> = {};
  for (const s of shots) {
    const { label } = getDirection(s.x, s.y);
    counts[label] = (counts[label] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const dir = getDirection(
    top[0].includes('Right') ? 1 : top[0].includes('Left') ? -1 : 0,
    top[0].includes('Top')   ? 1 : top[0].includes('Bottom') ? -1 : 0,
  );
  return (
    <span
      className="text-[10px] font-display uppercase tracking-wide inline-flex items-center gap-1"
      style={{ color: dir.color, opacity: 0.7 }}
      title={`Most shots: ${top[0]} (${top[1]})`}
    >
      <span style={{ color: dir.color }}>{dir.symbol}</span>
      {top[0]}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatPill({ label, value, color, dot }: { label: string; value: string; color?: string; dot?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />}
      <span className="text-[10px] font-display uppercase tracking-widest text-[#4A5568]">{label}</span>
      <span className="font-data font-bold text-sm tabular-nums" style={{ color: color ?? '#F0F4FF' }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-[#1E2433] shrink-0" />;
}

// ── Empty state ───────────────────────────────────────────────────────────────

function BlinkingCrosshair() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="opacity-30 animate-pulse" aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke="#F5A623" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="6"  stroke="#F5A623" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="2"  fill="#F5A623" />
      <line x1="24" y1="4"  x2="24" y2="14" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="34" x2="24" y2="44" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4"  y1="24" x2="14" y2="24" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34" y1="24" x2="44" y2="24" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SortIcon({ dir }: { dir: 'asc' | 'desc' }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      {dir === 'asc' ? <path d="M5 2l4 6H1z" /> : <path d="M5 8L1 2h8z" />}
    </svg>
  );
}

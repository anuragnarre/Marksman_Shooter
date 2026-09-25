// apps/web/components/ExportSessionModal.tsx
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { drawTarget } from '../lib/draw-target';
import { exportShotsCSV, exportAnalyticsCSV, exportSessionJSON } from '../lib/export';
import type {
  AnalyticsResult,
  Session,
  Shot,
  DeepAnalysis,
} from '@shooting-platform/shared-types';

interface ExportSessionModalProps {
  open: boolean;
  onClose: () => void;
  session: Session;
  shots: Shot[];
  analytics: AnalyticsResult | null;
  deepAnalysis: DeepAnalysis | null;
}

// ── Constants ───────────────────────────────────────────────────────────────

const W = 1200;
const H = 1600;
function getThemeColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    BG:       s.getPropertyValue('--bg-void').trim()      || '#080A0F',
    SURFACE:  s.getPropertyValue('--bg-surface').trim()   || '#0E1118',
    BORDER:   s.getPropertyValue('--border-subtle').trim() || '#1E2433',
    TEXT_PRI: s.getPropertyValue('--text-primary').trim()  || '#F0F4FF',
    TEXT_SEC: s.getPropertyValue('--text-secondary').trim()|| '#8892A4',
    TEXT_MUT: s.getPropertyValue('--text-muted').trim()    || '#4A5568',
    ACCENT:   '#F5A623',
    BLUE:     '#4FC3F7',
    GREEN:    '#00E5A0',
    RED:      '#FF4D6D',
  };
}
const ACCENT     = '#F5A623';
const BLUE       = '#4FC3F7';
const GREEN      = '#00E5A0';
const RED        = '#FF4D6D';

// ── Helpers ─────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fmtDate(d: Date | string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Score distribution buckets ──────────────────────────────────────────────

function getDistribution(shots: Shot[]) {
  const buckets = [
    { label: '10.X', min: 10.5, max: Infinity, count: 0, color: ACCENT },
    { label: '10',   min: 10.0, max: 10.5,     count: 0, color: BLUE },
    { label: '9',    min: 9.0,  max: 10.0,     count: 0, color: GREEN },
    { label: '8',    min: 8.0,  max: 9.0,      count: 0, color: 'var(--text-secondary)' },
    { label: '7',    min: 7.0,  max: 8.0,      count: 0, color: '#6B7280' },
    { label: '<7',   min: -Infinity, max: 7.0,  count: 0, color: RED },
  ];
  for (const s of shots) {
    for (const b of buckets) {
      if (s.score >= b.min && s.score < b.max) { b.count++; break; }
    }
  }
  return buckets;
}

// ── Main render function ────────────────────────────────────────────────────

function renderExport(
  ctx: CanvasRenderingContext2D,
  session: Session,
  shots: Shot[],
  analytics: AnalyticsResult | null,
  deepAnalysis: DeepAnalysis | null,
) {
  const { BG, SURFACE, BORDER, TEXT_PRI, TEXT_SEC, TEXT_MUT } = getThemeColors();
  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(30,36,51,0.3)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  let cursorY = 0;

  // ── Header ────────────────────────────────────────────────────────────────
  const headerH = 90;
  ctx.fillStyle = SURFACE;
  ctx.fillRect(0, 0, W, headerH);
  // Amber accent line
  const grad = ctx.createLinearGradient(0, headerH - 1, W, headerH - 1);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.3, `${ACCENT}80`);
  grad.addColorStop(0.5, ACCENT);
  grad.addColorStop(0.7, `${ACCENT}80`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, headerH - 2, W, 2);

  // Logo text
  ctx.fillStyle = ACCENT;
  ctx.font = 'bold 28px Rajdhani, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('PULSE', 40, headerH / 2 - 8);
  ctx.fillStyle = TEXT_SEC;
  ctx.font = '600 13px Rajdhani, sans-serif';
  ctx.fillText('SHOOTING PLATFORM', 40, headerH / 2 + 16);

  // Title right
  ctx.textAlign = 'right';
  ctx.fillStyle = TEXT_PRI;
  ctx.font = 'bold 20px Rajdhani, sans-serif';
  ctx.fillText('SESSION REPORT', W - 40, headerH / 2 - 8);
  ctx.fillStyle = TEXT_MUT;
  ctx.font = '500 12px "DM Sans", sans-serif';
  ctx.fillText(fmtDate(new Date()), W - 40, headerH / 2 + 14);

  cursorY = headerH + 24;

  // ── Session Info Card ─────────────────────────────────────────────────────
  const infoH = 80;
  ctx.fillStyle = SURFACE;
  roundRect(ctx, 40, cursorY, W - 80, infoH, 12);
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  roundRect(ctx, 40, cursorY, W - 80, infoH, 12);
  ctx.stroke();

  const infoItems = [
    { label: 'DISCIPLINE', value: session.discipline },
    { label: 'DATE', value: fmtDate(session.sessionDate) },
    { label: 'DISTANCE', value: `${session.distance}m` },
    { label: 'WEAPON', value: session.weaponType },
    { label: 'SHOTS', value: `${shots.length}/${session.numberOfShots}` },
  ];
  if (session.trainingMode) {
    infoItems.push({ label: 'MODE', value: session.trainingMode });
  }

  const colW = (W - 80) / infoItems.length;
  infoItems.forEach((item, i) => {
    const x = 40 + i * colW + colW / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = TEXT_MUT;
    ctx.font = '600 9px Rajdhani, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(item.label, x, cursorY + 16);
    ctx.fillStyle = TEXT_PRI;
    ctx.font = '700 15px "JetBrains Mono", monospace';
    ctx.fillText(item.value, x, cursorY + 36);
  });

  cursorY += infoH + 20;

  // ── Target View + Analytics side by side ──────────────────────────────────
  const targetSize = 480;
  const targetX = 40;
  const analyticsX = 40 + targetSize + 24;
  const analyticsW = W - 80 - targetSize - 24;

  // Target card background
  ctx.fillStyle = SURFACE;
  roundRect(ctx, targetX, cursorY, targetSize + 16, targetSize + 16, 12);
  ctx.fill();
  ctx.strokeStyle = BORDER;
  roundRect(ctx, targetX, cursorY, targetSize + 16, targetSize + 16, 12);
  ctx.stroke();

  // Draw target
  ctx.save();
  ctx.translate(targetX + 8, cursorY + 8);
  // Create an offscreen canvas for the target to avoid clipping issues
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetSize;
  targetCanvas.height = targetSize;
  const tctx = targetCanvas.getContext('2d')!;
  drawTarget(tctx, {
    size: targetSize,
    zoom: 1,
    shots,
    mpi: analytics?.mpi,
    hideCornerLabels: true,
  });
  ctx.drawImage(targetCanvas, 0, 0);
  ctx.restore();

  // Legend under target
  const legendY = cursorY + targetSize + 16 + 12;
  const legendItems = [
    { color: ACCENT, label: '10.X+' },
    { color: BLUE,   label: '10' },
    { color: GREEN,  label: '9' },
    { color: RED,    label: '<9' },
  ];
  ctx.textAlign = 'left';
  let lx = targetX + 8;
  legendItems.forEach(({ color, label }) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lx + 5, legendY + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = TEXT_MUT;
    ctx.font = '600 10px Rajdhani, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx + 14, legendY + 5);
    lx += 60;
  });
  // MPI label
  if (analytics?.mpi) {
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, legendY + 5); ctx.lineTo(lx + 10, legendY + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx + 5, legendY); ctx.lineTo(lx + 5, legendY + 10); ctx.stroke();
    ctx.fillStyle = TEXT_MUT;
    ctx.font = '600 10px Rajdhani, sans-serif';
    ctx.fillText('MPI', lx + 14, legendY + 5);
  }

  // ── Analytics Panel ─────────────────────────────────────────────────────
  if (analytics) {
    ctx.fillStyle = SURFACE;
    roundRect(ctx, analyticsX, cursorY, analyticsW, targetSize + 16, 12);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    roundRect(ctx, analyticsX, cursorY, analyticsW, targetSize + 16, 12);
    ctx.stroke();

    // Section title
    ctx.fillStyle = TEXT_PRI;
    ctx.font = 'bold 14px Rajdhani, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('PERFORMANCE METRICS', analyticsX + 20, cursorY + 16);

    // Amber underline
    ctx.fillStyle = `${ACCENT}60`;
    ctx.fillRect(analyticsX + 20, cursorY + 36, 120, 1);

    const metrics = [
      { label: 'Average Score', value: analytics.averageScore.toFixed(2), color: ACCENT },
      { label: 'Best Shot',     value: analytics.maxScore.toFixed(1),     color: GREEN },
      { label: 'Std Deviation', value: analytics.stdDev.toFixed(3),       color: BLUE },
      { label: 'Group Radius',  value: analytics.groupRadius.toFixed(2),  color: BLUE },
      { label: 'MPI X',         value: analytics.mpi.x.toFixed(2),        color: ACCENT },
      { label: 'MPI Y',         value: analytics.mpi.y.toFixed(2),        color: ACCENT },
      { label: 'Total Shots',   value: String(analytics.totalShots),      color: BLUE },
    ];

    const metricStartY = cursorY + 50;
    const metricH = 54;
    metrics.forEach((m, i) => {
      const my = metricStartY + i * metricH;

      // Subtle separator
      if (i > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(analyticsX + 20, my - 4, analyticsW - 40, 1);
      }

      ctx.fillStyle = TEXT_MUT;
      ctx.font = '600 10px Rajdhani, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(m.label.toUpperCase(), analyticsX + 20, my + 4);

      ctx.fillStyle = m.color;
      ctx.font = '800 24px "JetBrains Mono", monospace';
      ctx.fillText(m.value, analyticsX + 20, my + 20);
    });

    // ── Series averages sparkline ───────────────────────────────────────
    const seriesAvgs = analytics.seriesAverages ?? [];
    if (seriesAvgs.length >= 2) {
      const sparkY = metricStartY + metrics.length * metricH + 10;
      ctx.fillStyle = TEXT_PRI;
      ctx.font = 'bold 12px Rajdhani, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('SERIES AVERAGES', analyticsX + 20, sparkY);

      const sparkTop = sparkY + 22;
      const sparkH = 50;
      const sparkW = analyticsW - 60;
      const sparkLeft = analyticsX + 30;

      const minV = Math.min(...seriesAvgs) - 0.2;
      const maxV = Math.max(...seriesAvgs) + 0.2;
      const range = maxV - minV || 1;

      // Gradient area
      const areaGrad = ctx.createLinearGradient(0, sparkTop, 0, sparkTop + sparkH);
      areaGrad.addColorStop(0, `${ACCENT}30`);
      areaGrad.addColorStop(1, `${ACCENT}00`);
      ctx.fillStyle = areaGrad;
      ctx.beginPath();
      ctx.moveTo(sparkLeft, sparkTop + sparkH);
      seriesAvgs.forEach((v, i) => {
        const x = sparkLeft + (i / (seriesAvgs.length - 1)) * sparkW;
        const y = sparkTop + sparkH - ((v - minV) / range) * sparkH;
        if (i === 0) ctx.lineTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(sparkLeft + sparkW, sparkTop + sparkH);
      ctx.closePath();
      ctx.fill();

      // Line
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      seriesAvgs.forEach((v, i) => {
        const x = sparkLeft + (i / (seriesAvgs.length - 1)) * sparkW;
        const y = sparkTop + sparkH - ((v - minV) / range) * sparkH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Dots
      seriesAvgs.forEach((v, i) => {
        const x = sparkLeft + (i / (seriesAvgs.length - 1)) * sparkW;
        const y = sparkTop + sparkH - ((v - minV) / range) * sparkH;
        ctx.fillStyle = ACCENT;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Labels
      ctx.fillStyle = TEXT_MUT;
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      seriesAvgs.forEach((v, i) => {
        const x = sparkLeft + (i / (seriesAvgs.length - 1)) * sparkW;
        ctx.fillText(`S${i + 1}`, x, sparkTop + sparkH + 4);
      });
    }
  }

  cursorY += targetSize + 16 + 32;

  // ── Score Distribution Bar Chart ──────────────────────────────────────────
  const dist = getDistribution(shots);
  const distH = 130;

  ctx.fillStyle = SURFACE;
  roundRect(ctx, 40, cursorY, (W - 80) / 2 - 10, distH, 12);
  ctx.fill();
  ctx.strokeStyle = BORDER;
  roundRect(ctx, 40, cursorY, (W - 80) / 2 - 10, distH, 12);
  ctx.stroke();

  ctx.fillStyle = TEXT_PRI;
  ctx.font = 'bold 12px Rajdhani, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SCORE DISTRIBUTION', 60, cursorY + 14);

  const barAreaX = 60;
  const barAreaW = (W - 80) / 2 - 50;
  const barTop = cursorY + 38;
  const barH = distH - 58;
  const maxCount = Math.max(1, ...dist.map(b => b.count));
  const barGap = 8;
  const barW = (barAreaW - barGap * (dist.length - 1)) / dist.length;

  dist.forEach((b, i) => {
    const bx = barAreaX + i * (barW + barGap);
    const fillH = (b.count / maxCount) * (barH - 16);
    const by = barTop + barH - 16 - fillH;

    // Bar
    ctx.fillStyle = b.color + '40';
    roundRect(ctx, bx, by, barW, fillH, 3);
    ctx.fill();
    ctx.fillStyle = b.color;
    roundRect(ctx, bx, by, barW, Math.min(fillH, 4), 3);
    ctx.fill();

    // Count
    if (b.count > 0) {
      ctx.fillStyle = b.color;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(b.count), bx + barW / 2, by - 3);
    }

    // Label
    ctx.fillStyle = TEXT_MUT;
    ctx.font = '600 9px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(b.label, bx + barW / 2, barTop + barH - 12);
  });

  // ── Deep Analysis Card ────────────────────────────────────────────────────
  const deepX = 40 + (W - 80) / 2 + 10;
  const deepW = (W - 80) / 2 - 10;

  ctx.fillStyle = SURFACE;
  roundRect(ctx, deepX, cursorY, deepW, distH, 12);
  ctx.fill();
  ctx.strokeStyle = BORDER;
  roundRect(ctx, deepX, cursorY, deepW, distH, 12);
  ctx.stroke();

  ctx.fillStyle = TEXT_PRI;
  ctx.font = 'bold 12px Rajdhani, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('DEEP ANALYSIS', deepX + 20, cursorY + 14);

  if (deepAnalysis) {
    const daItems = [
      { label: 'Fatigue Index', value: (deepAnalysis.fatigueIndex >= 0 ? '+' : '') + deepAnalysis.fatigueIndex.toFixed(3), color: deepAnalysis.fatigueIndex >= 0 ? GREEN : RED },
      { label: 'Focus Score',   value: `${deepAnalysis.focusScore}/100`, color: BLUE },
      { label: 'Clusters',      value: String(deepAnalysis.clusterCount), color: ACCENT },
      { label: 'Warmup Shots',  value: String(deepAnalysis.warmupShots), color: TEXT_SEC },
    ];

    const daColW = (deepW - 40) / 2;
    daItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const ix = deepX + 20 + col * daColW;
      const iy = cursorY + 40 + row * 40;

      ctx.fillStyle = TEXT_MUT;
      ctx.font = '600 9px Rajdhani, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(item.label.toUpperCase(), ix, iy);

      ctx.fillStyle = item.color;
      ctx.font = '800 18px "JetBrains Mono", monospace';
      ctx.fillText(item.value, ix, iy + 14);
    });
  } else {
    ctx.fillStyle = TEXT_MUT;
    ctx.font = '500 12px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No deep analysis data available', deepX + deepW / 2, cursorY + distH / 2 + 10);
  }

  cursorY += distH + 20;

  // ── Footer ────────────────────────────────────────────────────────────────
  // Position footer at bottom
  const footerY = H - 50;
  ctx.fillStyle = SURFACE;
  ctx.fillRect(0, footerY, W, 50);
  ctx.fillStyle = `${ACCENT}40`;
  ctx.fillRect(0, footerY, W, 1);

  ctx.fillStyle = TEXT_MUT;
  ctx.font = '500 11px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Generated by Pulse Shooting Platform', W / 2, footerY + 25);

  ctx.textAlign = 'right';
  ctx.fillText(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC', W - 40, footerY + 25);

  ctx.textAlign = 'left';
  ctx.fillStyle = ACCENT;
  ctx.font = 'bold 12px Rajdhani, sans-serif';
  ctx.fillText('PULSE', 40, footerY + 25);
}

// ── Component ───────────────────────────────────────────────────────────────

export function ExportSessionModal({
  open,
  onClose,
  session,
  shots,
  analytics,
  deepAnalysis,
}: ExportSessionModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(0.92);
  const [rendered, setRendered] = useState(false);
  const BORDER = typeof window !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue('--border-subtle').trim() || '#1E2433')
    : '#1E2433';
  const BG = typeof window !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue('--bg-void').trim() || '#080A0F')
    : '#080A0F';
  const TEXT_MUT = typeof window !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#4A5568')
    : '#4A5568';

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderExport(ctx, session, shots, analytics, deepAnalysis);
    setRendered(true);
  }, [session, shots, analytics, deepAnalysis]);

  useEffect(() => {
    if (open) {
      // Small delay so modal DOM is ready
      const t = setTimeout(render, 50);
      return () => clearTimeout(t);
    } else {
      setRendered(false);
    }
  }, [open, render]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const dataUrl = canvas.toDataURL(mime, format === 'jpeg' ? quality : undefined);
    const link = document.createElement('a');
    link.download = `session-report-${session.id}.${ext}`;
    link.href = dataUrl;
    link.click();
  }

  function handlePrint() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Session Report</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; display: flex; justify-content: center; align-items: flex-start; background: #000; }
            img { width: 100%; max-width: 100vw; height: auto; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
    win.document.close();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{ animation: 'glassReveal 300ms ease forwards' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: BORDER }}>
          <div>
            <h2 className="font-display font-bold text-lg text-text-primary">Export / Print</h2>
            <p className="text-xs text-text-muted mt-0.5">Session report with analytics and target view</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-elevated transition-all"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="p-5">
          <div
            className="rounded-xl overflow-hidden border mx-auto"
            style={{
              borderColor: BORDER,
              maxWidth: 600,
              background: BG,
            }}
          >
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="w-full h-auto block"
              style={{ imageRendering: 'auto' }}
            />
            {!rendered && (
              <div className="flex items-center justify-center py-20 text-text-muted text-sm">
                Rendering preview...
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 pb-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Format toggle */}
            <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border" style={{ borderColor: BORDER }}>
              {(['png', 'jpeg'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className="px-3 py-1.5 rounded-md text-xs font-display font-semibold uppercase tracking-wide transition-all"
                  style={{
                    background: format === f ? `${ACCENT}18` : 'transparent',
                    color: format === f ? ACCENT : TEXT_MUT,
                    border: format === f ? `1px solid ${ACCENT}40` : '1px solid transparent',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* JPEG quality slider */}
            {format === 'jpeg' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted font-display uppercase tracking-wide">Quality</span>
                <input
                  type="range"
                  min={70}
                  max={100}
                  value={Math.round(quality * 100)}
                  onChange={(e) = /> setQuality(parseInt(e.target.value) / 100)}
                  className="w-24 accent-[#F5A623]"
                />
                <span className="text-xs font-mono text-text-secondary w-8">{Math.round(quality * 100)}%</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 ml-auto">
              <button
                onClick={() => exportShotsCSV(shots, session)}
                className="btn text-xs py-2 px-3"
                style={{ background: 'rgba(0,229,160,0.08)', borderColor: 'rgba(0,229,160,0.25)', color: '#00E5A0' }}
              >
                CSV
              </button>
              <button
                onClick={() => exportSessionJSON(session, analytics)}
                className="btn text-xs py-2 px-3"
                style={{ background: 'rgba(79,195,247,0.08)', borderColor: 'rgba(79,195,247,0.25)', color: '#4FC3F7' }}
              >
                JSON
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-ghost text-xs py-2 px-4"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
              <button
                onClick={handleExport}
                className="btn btn-primary text-xs py-2 px-4"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {format.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
// apps/web/components/LiveFeedPanel.tsx
// MJPEG live camera preview with shot overlay canvas.

import React, { useRef, useEffect, useState } from 'react';
import { LiveShot } from '../hooks/useLiveRange';

interface LiveFeedPanelProps {
  streamUrl?: string;       // MJPEG stream URL (default: env NEXT_PUBLIC_STREAM_URL)
  shots?: LiveShot[];       // Shots to overlay on canvas
  isConnected?: boolean;
  className?: string;
  showOverlay?: boolean;
  targetSize?: number;      // Canvas coordinate space (default: 1000)
}

export default function LiveFeedPanel({
  streamUrl,
  shots = [],
  isConnected = false,
  className = '',
  showOverlay = true,
  targetSize = 1000,
}: LiveFeedPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const feedUrl = streamUrl ?? process.env.NEXT_PUBLIC_STREAM_URL ?? 'http://localhost:8001';
  const mjpegUrl = `${feedUrl}/mjpeg`;

  // Draw shot overlays on canvas above the <img>
  useEffect(() => {
    if (!showOverlay || !canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Draw each shot
    shots.forEach((shot, i) => {
      const px = (shot.pixelX / targetSize) * width;
      const py = (shot.pixelY / targetSize) * height;
      const score = shot.score;

      // Colour by ring
      let color = '#FF4D6D';
      if (score >= 10.0) color = '#F5A623';
      else if (score >= 9.0) color = '#00E5A0';
      else if (score >= 8.0) color = '#4FC3F7';

      // Shot circle
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cross-hair center dot
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Score label
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      ctx.fillText(`${score.toFixed(1)}`, px + 13, py + 4);

      // Shot number badge
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(8,10,15,0.85)';
      ctx.fillRect(px - 8, py - 8, 16, 10);
      ctx.fillStyle = '#F0F2F5';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, px, py);
      ctx.textAlign = 'left';
    });
  }, [shots, showOverlay, targetSize]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl bg-bg-void border border-border-subtle ${className}`}
    >
      {/* Status badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00E5A0] animate-pulse' : 'bg-[#FF4D6D]'}`}
        />
        <span className="font-display font-bold text-[10px] uppercase tracking-widest text-text-muted">
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Shot count badge */}
      {shots.length > 0 && (
        <div className="absolute top-3 right-3 z-20 bg-accent text-bg-void font-mono font-bold text-[11px] px-2.5 py-1 rounded-lg">
          {shots.length} SHOTS
        </div>
      )}

      {/* MJPEG stream */}
      {!imgError ? (
        <img
          src={mjpegUrl}
          alt="Live camera feed"
          className="w-full h-full object-cover"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          style={{ display: imgLoaded ? 'block' : 'none' }}
        />
      ) : null}

      {/* Placeholder when stream unavailable */}
      {(imgError || !imgLoaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-surface">
          <div className="w-16 h-16 rounded-full border border-border-subtle flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-[13px] text-text-secondary mb-1">Camera Feed Unavailable</p>
            <p className="font-mono text-[11px] text-text-muted">{feedUrl}/mjpeg</p>
          </div>
          {!imgError && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          {imgError && (
            <button
              onClick={() => { setImgError(false); setImgLoaded(false); }}
              className="font-display font-bold text-[11px] uppercase tracking-widest text-accent border border-accent/30 px-4 py-2 rounded-lg hover:bg-accent/10 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Shot overlay canvas */}
      {showOverlay && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      )}
    </div>
  );
}

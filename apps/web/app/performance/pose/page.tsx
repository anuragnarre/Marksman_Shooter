'use client';

// Stance Analysis — upload photo → MediaPipe Pose → skeleton overlay + issues

import React, { useRef, useState, useCallback } from 'react';
import { AppShell } from '../../../components/AppShell';
import type { PoseAnalysisResult } from '@shooting-platform/shared-types';

// MediaPipe Pose skeleton connections (33 landmarks)
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // arms
  [11, 23], [12, 24], [23, 24], // torso
  [23, 25], [25, 27], [24, 26], [26, 28], // legs
  [27, 29], [29, 31], [28, 30], [30, 32], // feet
  [0, 1], [1, 3], [0, 2], [2, 4], [3, 5], [4, 6], // face
];

const VISION_URL = process.env.NEXT_PUBLIC_VISION_URL ?? 'http://localhost:8000';

export default function PosePage() {
  const [result,   setResult]   = useState<PoseAnalysisResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [imgSrc,   setImgSrc]   = useState<string | null>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  const analyze = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setImgSrc(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${VISION_URL}/pose`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const data: PoseAnalysisResult = await res.json();
      setResult(data);
      // Draw skeleton after image loads
      setTimeout(() => drawSkeleton(data), 100);
    } catch (e: any) {
      setError(e.message ?? 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const drawSkeleton = (data: PoseAnalysisResult) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.detected || !data.keypoints) return;
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const W = canvas.width;
      const H = canvas.height;
      const kp = data.keypoints!;

      // Draw connections
      ctx.strokeStyle = 'rgba(245,166,35,0.75)';
      ctx.lineWidth = Math.max(2, W * 0.003);
      POSE_CONNECTIONS.forEach(([a, b]) => {
        const pa = kp[a];
        const pb = kp[b];
        if (!pa || !pb) return;
        if (pa[3] < 0.3 || pb[3] < 0.3) return; // low visibility
        ctx.beginPath();
        ctx.moveTo(pa[0] * W, pa[1] * H);
        ctx.lineTo(pb[0] * W, pb[1] * H);
        ctx.stroke();
      });

      // Draw keypoints
      kp.forEach((p) => {
        if (p[3] < 0.3) return;
        ctx.beginPath();
        ctx.arc(p[0] * W, p[1] * H, Math.max(4, W * 0.006), 0, Math.PI * 2);
        ctx.fillStyle = '#F5A623';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#F5A623';
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };
    img.src = imgSrc!;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) void analyze(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void analyze(file);
  };

  const reset = () => {
    setResult(null);
    setImgSrc(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const scoreColor = (s: number) =>
    s >= 80 ? '#00E5A0' : s >= 50 ? '#F5A623' : '#FF4D6D';

  return (
    <AppShell title="Stance Analysis">
      <div className="space-y-6 max-w-3xl">

        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="font-display font-bold text-2xl text-[#F0F4FF]">Stance Analysis</h1>
          <p className="text-[#4A5568] text-sm mt-1">
            Upload a standing photo to analyse your shooting posture via MediaPipe Pose
          </p>
        </div>

        {/* Upload zone */}
        {!result && !loading && (
          <div
            className="card p-10 flex flex-col items-center gap-4 cursor-pointer animate-slide-up stagger-1
                       hover:border-[rgba(245,166,35,0.3)] transition-colors duration-200"
            style={{ border: '2px dashed rgba(255,255,255,0.08)' }}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon />
            <div className="text-center">
              <p className="font-display font-semibold text-[#F0F4FF]">Drop a photo or click to upload</p>
              <p className="text-[#4A5568] text-sm mt-1">JPEG · PNG · BMP · Max 20 MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/bmp"
              className="sr-only"
              onChange={onFileChange}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card p-8 flex flex-col items-center gap-4 animate-slide-up">
            <div className="w-12 h-12 rounded-full border-2 border-[#F5A623] border-t-transparent animate-spin" />
            <p className="font-display font-semibold text-[#F0F4FF]">Analysing stance…</p>
          </div>
        )}

        {error && (
          <div className="card p-4 border border-[rgba(255,77,109,0.25)] bg-[rgba(255,77,109,0.06)]">
            <p className="text-[#FF4D6D] text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-slide-up">
            {result.detected ? (
              <>
                {/* Posture score */}
                <div className="card p-5">
                  <div className="flex items-center gap-6">
                    {/* Score dial */}
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: `conic-gradient(${scoreColor(result.postureScore!)} ${result.postureScore! * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                        boxShadow: `0 0 24px ${scoreColor(result.postureScore!)}30`,
                      }}
                    >
                      <div
                        className="w-16 h-16 rounded-full flex flex-col items-center justify-center"
                        style={{ background: '#0E1118' }}
                      >
                        <span
                          className="font-data font-bold text-2xl"
                          style={{ color: scoreColor(result.postureScore!) }}
                        >
                          {result.postureScore}
                        </span>
                        <span className="text-[#4A5568] text-[9px] font-display uppercase">Score</span>
                      </div>
                    </div>

                    {/* Measurements */}
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      {[
                        { label: 'Elbow Angle', value: `${result.elbowAngle}°`, ideal: result.elbowAngle! >= 140 },
                        { label: 'Shoulder Tilt', value: `${result.shoulderTilt}%`, ideal: result.shoulderTilt! <= 5 },
                        { label: 'Head Tilt', value: `${result.headTilt}%`, ideal: result.headTilt! <= 12 },
                      ].map((m) => (
                        <div key={m.label} className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <p className="font-data font-bold text-lg" style={{ color: m.ideal ? '#00E5A0' : '#FF4D6D' }}>
                            {m.value}
                          </p>
                          <p className="text-[#4A5568] text-[10px] font-display uppercase mt-1">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Issues list */}
                {result.issues && result.issues.length > 0 && (
                  <div className="card p-4 space-y-2">
                    <p className="label mb-2">Issues Detected</p>
                    {result.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2"
                        style={{ background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.15)' }}>
                        <span className="text-[#FF4D6D] mt-0.5">
                          <WarningIcon />
                        </span>
                        <p className="text-[#F0F4FF] text-sm">{issue}</p>
                      </div>
                    ))}
                  </div>
                )}

                {result.issues?.length === 0 && (
                  <div className="card p-4 flex items-center gap-3"
                    style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.2)' }}>
                    <CheckIcon />
                    <p className="text-[#00E5A0] text-sm font-semibold">Excellent posture — no issues detected</p>
                  </div>
                )}

                {/* Skeleton overlay canvas */}
                {imgSrc && (
                  <div className="card overflow-hidden">
                    <p className="label px-4 pt-4 pb-2">Skeleton Overlay</p>
                    <canvas ref={canvasRef} className="w-full object-contain" />
                  </div>
                )}
              </>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-[#F5A623] font-display font-semibold mb-2">No pose detected</p>
                <p className="text-[#4A5568] text-sm">
                  Ensure the full body is visible in the photo and lighting is adequate.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={reset} className="btn btn-ghost text-xs py-2">
                Retake
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 32v8a2 2 0 002 2h28a2 2 0 002-2v-8" />
      <polyline points="32,16 24,8 16,16" />
      <line x1="24" y1="8" x2="24" y2="32" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 2L1.5 13.5h13L8 2z" />
      <line x1="8" y1="7" x2="8" y2="10" />
      <circle cx="8" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#00E5A0" strokeWidth="2" strokeLinecap="round">
      <circle cx="10" cy="10" r="8" />
      <polyline points="6,10 9,13 14,7" />
    </svg>
  );
}

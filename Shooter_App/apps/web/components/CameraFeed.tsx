'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FiCamera, FiVideoOff, FiRefreshCcw, FiCrosshair, FiSettings } from 'react-icons/fi';
import { isNative, getNativePhoto, requestCameraPermission } from '../lib/capacitor';

interface CameraFeedProps {
  onAnalyze: (file: Blob) => Promise<void>;
  isAnalyzing: boolean;
  defaultMode?: 'device' | 'mjpeg';
}

export function CameraFeed({ onAnalyze, isAnalyzing, defaultMode = 'device' }: CameraFeedProps) {
  const [mode, setMode] = useState<'device' | 'mjpeg'>(defaultMode);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mjpegUrl, setMjpegUrl] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopDeviceCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const startDeviceCamera = useCallback(async () => {
    try {
      setCameraError(null);
      await requestCameraPermission();
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera live preview unsupported in this WebView — use Native Camera below.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError(err?.message ? `Camera unavailable: ${err.message}` : 'Failed to access device camera');
    }
  }, []);

  useEffect(() => {
    if (mode === 'device') {
      void startDeviceCamera();
    } else {
      stopDeviceCamera();
    }
    return () => stopDeviceCamera();
  }, [mode, startDeviceCamera, stopDeviceCamera]);

  const handleNativeCapture = async () => {
    if (isAnalyzing) return;
    try {
      setCameraError(null);
      const granted = await requestCameraPermission();
      if (!granted) {
        setCameraError('Camera permission denied.');
        return;
      }
      const file = await getNativePhoto('camera');
      if (file) {
        await onAnalyze(file);
      }
    } catch (err: any) {
      setCameraError(err?.message || 'Native camera capture failed');
    }
  };

  const handleCapture = async () => {
    if (isAnalyzing) return;

    let blob: Blob | null = null;

    if (mode === 'device' && videoRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
      }
    } else if (mode === 'device' && !stream && isNative()) {
      await handleNativeCapture();
      return;
    } else if (mode === 'mjpeg' && mjpegUrl) {
      try {
        const response = await fetch(mjpegUrl, { cache: 'no-store' });
        blob = await response.blob();
      } catch (err: any) {
        setCameraError('Failed to fetch frame from URL: ' + err.message);
        return;
      }
    }

    if (blob) {
      await onAnalyze(blob);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-bg-surface border border-border-subtle rounded-lg">
        <button
          onClick={() => setMode('device')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'device'
              ? 'bg-accent text-void font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Device Camera
        </button>
        <button
          onClick={() => setMode('mjpeg')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'mjpeg'
              ? 'bg-accent text-void font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Wi-Fi Camera
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="relative bg-black rounded-lg overflow-hidden border border-border-subtle aspect-video flex items-center justify-center">
        {mode === 'device' && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-red-400 p-4 text-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <FiVideoOff className="w-5 h-5 shrink-0" />
                  <span>{cameraError}</span>
                </div>
                {isNative() && (
                  <button
                    onClick={handleNativeCapture}
                    disabled={isAnalyzing}
                    className="px-4 py-2 rounded-lg bg-accent text-void font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                  >
                    <FiCamera className="w-4 h-4" />
                    Capture with Android Camera
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {mode === 'mjpeg' && (
          <>
            {mjpegUrl ? (
              <img
                src={mjpegUrl}
                alt="Wi-Fi Camera Stream"
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
                onError={() => setCameraError('Failed to load image stream')}
              />
            ) : (
              <div className="text-slate-300 text-sm flex flex-col items-center">
                <FiSettings className="w-8 h-8 mb-2 opacity-60" />
                Enter a camera URL below
              </div>
            )}
          </>
        )}

        {/* Hidden canvas for capturing frames */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        {mode === 'mjpeg' && (
          <input
            type="text"
            value={mjpegUrl}
            onChange={(e) => setMjpegUrl(e.target.value)}
            placeholder="e.g., http://192.168.1.100/stream"
            className="w-full bg-bg-elevated border border-border-subtle text-text-primary text-sm rounded-lg px-4 py-2 focus:border-accent focus:outline-none"
          />
        )}

        <button
          onClick={handleCapture}
          disabled={isAnalyzing || (mode === 'mjpeg' && !mjpegUrl) || (mode === 'device' && !stream && !isNative())}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-accent hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-void rounded-lg font-display font-bold uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
        >
          {isAnalyzing ? (
            <>
              <FiRefreshCcw className="w-5 h-5 animate-spin" />
              Analyzing Target...
            </>
          ) : (
            <>
              <FiCrosshair className="w-5 h-5" />
              {mode === 'device' && !stream && isNative() ? 'Open Android Camera' : 'Detect Shots'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

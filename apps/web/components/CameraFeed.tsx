'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FiCamera, FiVideoOff, FiRefreshCcw, FiCrosshair, FiSettings } from 'react-icons/fi';

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

  const startDeviceCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError('Failed to access camera: ' + err.message);
    }
  }, []);

  const stopDeviceCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (mode === 'device') {
      startDeviceCamera();
    } else {
      stopDeviceCamera();
    }
    return () => stopDeviceCamera();
  }, [mode, startDeviceCamera, stopDeviceCamera]);

  const handleCapture = async () => {
    if (isAnalyzing) return;
    
    let blob: Blob | null = null;

    if (mode === 'device' && videoRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.9));
      }
    } else if (mode === 'mjpeg' && mjpegUrl) {
      // Fetch the current frame from the MJPEG stream or snapshot URL
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
      <div className="flex gap-2 p-1 bg-surface-base border border-surface-divider rounded-lg">
        <button
          onClick={() => setMode('device')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'device' ? 'bg-primary-500 text-white' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Device Camera
        </button>
        <button
          onClick={() => setMode('mjpeg')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'mjpeg' ? 'bg-primary-500 text-white' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Wi-Fi Camera
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="relative bg-black rounded-lg overflow-hidden border border-surface-divider aspect-video flex items-center justify-center">
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-red-400 p-4 text-center">
                <FiVideoOff className="w-6 h-6 mr-2" />
                {cameraError}
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
                onError={() = /> setCameraError('Failed to load image stream')}
              />
            ) : (
              <div className="text-text-secondary text-sm flex flex-col items-center">
                <FiSettings className="w-8 h-8 mb-2 opacity-50" />
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
            onChange={(e) = /> setMjpegUrl(e.target.value)}
            placeholder="e.g., http://192.168.1.100/stream"
            className="w-full bg-surface-elevated border border-surface-divider text-text-primary text-sm rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        )}
        
        <button
          onClick={handleCapture}
          disabled={isAnalyzing || (mode === 'mjpeg' && !mjpegUrl) || (mode === 'device' && !stream)}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-sm transition-all active:scale-[0.98]"
        >
          {isAnalyzing ? (
            <>
              <FiRefreshCcw className="w-5 h-5 animate-spin" />
              Analyzing Target...
            </>
          ) : (
            <>
              <FiCrosshair className="w-5 h-5" />
              Detect Shots
            </>
          )}
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ShieldAlert, AlertTriangle, CheckCircle2, Volume2, VolumeX, X } from 'lucide-react';

interface CeasefireState {
  active: boolean;
  reason?: string;
  initiatedBy?: string;
  timestamp?: string;
}

export function RangeEmergencyBanner() {
  const [ceasefire, setCeasefire] = useState<CeasefireState | null>(null);
  const [showAllClear, setShowAllClear] = useState(false);
  const [muted, setMuted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play attention buzzer using Web Audio API (safe, zero external asset dependencies)
  const playAlertTone = () => {
    if (muted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3); // drop to A4
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  useEffect(() => {
    const urls = [
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
      'http://localhost:3003',
    ];

    const sockets: Socket[] = [];

    const handleCeasefire = (data: any) => {
      if (data?.active) {
        setCeasefire({
          active: true,
          reason: data.reason || 'Range Safety Officer Order',
          initiatedBy: data.initiatedBy || 'Range Master',
          timestamp: data.timestamp || new Date().toLocaleTimeString(),
        });
        setShowAllClear(false);
        playAlertTone();
      } else {
        // Ceasefire cleared
        setCeasefire(null);
        setShowAllClear(true);
        const timer = setTimeout(() => {
          setShowAllClear(false);
        }, 6000);
      }
    };

    urls.forEach((url) => {
      try {
        const sock = io(url, { transports: ['websocket'], reconnectionAttempts: 3 });
        sock.on('range_ceasefire', handleCeasefire);
        sockets.push(sock);
      } catch (e) {
        // Fallback gracefully
      }
    });

    return () => {
      sockets.forEach((s) => s.disconnect());
    };
  }, [muted]);

  if (!ceasefire?.active && !showAllClear) {
    return null;
  }

  if (showAllClear) {
    return (
      <div 
        role="alert" 
        className="fixed top-0 left-0 right-0 z-[9999] bg-[#00E5A0] text-black px-4 py-2.5 shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 font-sans"
      >
        <div className="flex items-center gap-3 mx-auto">
          <CheckCircle2 className="w-5 h-5 text-black shrink-0 animate-bounce" />
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-sm">ALL CLEAR — RANGE IS HOT</span>
            <span className="hidden sm:inline text-xs font-medium text-black/80">| Weapons may be handled upon RSO command.</span>
          </div>
        </div>
        <button 
          onClick={() => setShowAllClear(false)}
          className="text-black/70 hover:text-black p-1 rounded transition-colors"
          title="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div 
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-[#D32F2F] via-[#FF1744] to-[#D32F2F] text-white px-4 py-3 shadow-[0_4px_30px_rgba(255,23,68,0.8)] border-b-2 border-white/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse font-sans"
    >
      <div className="flex items-center gap-3">
        <div className="bg-white text-[#D32F2F] p-1.5 rounded-full shrink-0 shadow-md">
          <ShieldAlert className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-black/40 text-white text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-white/30">
              🚨 CEASEFIRE IN EFFECT
            </span>
            <span className="font-black text-sm sm:text-base tracking-tight uppercase drop-shadow">
              UNLOAD AND BENCH ALL WEAPONS — STEP BEHIND FIRING LINE
            </span>
          </div>
          <p className="text-xs text-white/90 mt-0.5 font-medium">
            Reason: <strong className="text-white underline">{ceasefire?.reason}</strong> &bull; Auth: {ceasefire?.initiatedBy} &bull; Time: {ceasefire?.timestamp}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={() => setMuted(!muted)}
          className="bg-black/30 hover:bg-black/50 text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/20 flex items-center gap-1.5 transition-colors"
          title={muted ? 'Unmute Audio' : 'Mute Buzzer'}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span className="hidden md:inline">{muted ? 'Unmuted' : 'Mute'}</span>
        </button>
        <div className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
          STANDBY FOR ALL-CLEAR
        </div>
      </div>
    </div>
  );
}

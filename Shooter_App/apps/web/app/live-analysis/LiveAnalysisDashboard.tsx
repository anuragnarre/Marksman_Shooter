'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { TargetType, TARGET_SPECS, ShotCoordinates, ShotResult, calculateScore } from '../../lib/target-specs';
import { TargetCanvas } from '../../components/live-analysis/TargetCanvas';
import { MultiCameraTargetView, ShotImpactSnapshot } from '../../components/live-analysis/MultiCameraTargetView';
import { RealTimeScoreboard } from '../../components/live-analysis/RealTimeScoreboard';
import { LiveTargetSelector } from '../../components/live-analysis/LiveTargetSelector';

type ShotData = ShotCoordinates & ShotResult;

export function LiveAnalysisDashboard() {
  const [selectedTarget, setSelectedTarget] = useState<TargetType>('10m_air_rifle');
  const [shots, setShots] = useState<ShotData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isCeasefireActive, setIsCeasefireActive] = useState(false);
  const [ceasefireReason, setCeasefireReason] = useState('');
  const [assignedLane, setAssignedLane] = useState<{ laneNumber?: number; status?: string } | null>(null);
  const [latestImpactSnapshot, setLatestImpactSnapshot] = useState<ShotImpactSnapshot | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket Server
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join a generic live range room for demo purposes
      socket.emit('joinLiveRange', 'demo_lane_1');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('range_ceasefire', (data: any) => {
      setIsCeasefireActive(Boolean(data?.active));
      setCeasefireReason(data?.reason || 'Downrange maintenance / RSO command');
    });

    socket.on('lane_status_updated', (data: any) => {
      if (data?.laneNumber) {
        setAssignedLane({
          laneNumber: data.laneNumber,
          status: data.status,
        });
      }
    });

    socket.on('shot_impact_snapshot', (payload: ShotImpactSnapshot) => {
      setLatestImpactSnapshot(payload);
    });

    socket.on('shot_detected', (payload: ShotCoordinates) => {
      // The payload only contains raw coordinates (x, y)
      // We calculate the exact score here based on the CURRENT target type
      setShots((prev) => {
        // Warning: if we change target type, we might want to recalculate old scores.
        // For simplicity in this real-time view, we just calculate for the new shot.
        const currentTargetType = selectedTarget; // Note: closure might be stale, better to use state callback or ref
        // Let's rely on the latest target spec.
        return prev; // We will fix the stale closure below
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Run once on mount

  // Fixing stale state in socket event handler:
  const selectedTargetRef = useRef(selectedTarget);
  useEffect(() => {
    selectedTargetRef.current = selectedTarget;
  }, [selectedTarget]);

  useEffect(() => {
    if (!socketRef.current) return;
    
    const handleShot = (payload: ShotCoordinates) => {
      const result = calculateScore(payload, selectedTargetRef.current);
      setShots(prev => [...prev, { ...payload, ...result }]);
    };

    socketRef.current.on('shot_detected', handleShot);
    
    return () => {
      socketRef.current?.off('shot_detected', handleShot);
    };
  }, []);

  const handleTargetChange = (type: TargetType) => {
    setSelectedTarget(type);
    // Recalculate existing shots for the new target format
    setShots(prev => prev.map(shot => ({
      ...shot,
      ...calculateScore({ x: shot.x, y: shot.y }, type)
    })));
  };

  // Calculate ballistics dispersion metrics & split cadences
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [lastSplitTime, setLastSplitTime] = useState<number | null>(null);
  const lastShotTimestampRef = useRef<number | null>(null);

  const groupStats = (() => {
    if (shots.length === 0) return { meanRadius: 0, extremeSpread: 0, centerX: 0, centerY: 0, innerTens: 0 };
    const avgX = shots.reduce((sum, s) => sum + s.x, 0) / shots.length;
    const avgY = shots.reduce((sum, s) => sum + s.y, 0) / shots.length;
    const meanRadius = shots.reduce((sum, s) => {
      const dist = Math.sqrt(Math.pow(s.x - avgX, 2) + Math.pow(s.y - avgY, 2));
      return sum + dist;
    }, 0) / shots.length;

    let maxDist = 0;
    for (let i = 0; i < shots.length; i++) {
      for (let j = i + 1; j < shots.length; j++) {
        const d = Math.sqrt(Math.pow(shots[i].x - shots[j].x, 2) + Math.pow(shots[i].y - shots[j].y, 2));
        if (d > maxDist) maxDist = d;
      }
    }

    const innerTens = shots.filter(s => s.isInnerTen || s.score >= 10.3).length;

    return {
      meanRadius: Number(meanRadius.toFixed(2)),
      extremeSpread: Number(maxDist.toFixed(2)),
      centerX: Number(avgX.toFixed(2)),
      centerY: Number(avgY.toFixed(2)),
      innerTens,
    };
  })();

  const playShotFeedback = (score: number) => {
    if (!audioFeedback || typeof window === 'undefined') return;
    try {
      // Gentle tactical synth beep
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(score >= 10.0 ? 880 : 587, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);

      // Voice score callout if speech synthesis is supported
      if ('speechSynthesis' in window && score >= 9.0) {
        const utterance = new SpeechSynthesisUtterance(score.toFixed(1));
        utterance.rate = 1.3;
        utterance.pitch = 1.1;
        utterance.volume = 0.4;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {}
  };

  const triggerMockShot = () => {
    if (isCeasefireActive) {
      alert("EMERGENCY CEASEFIRE ACTIVE — Weapons must remain grounded and unhandled.");
      return;
    }
    const r1 = Math.random();
    const r2 = Math.random();
    const radius = Math.sqrt(-2.0 * Math.log(r1)) * 3.0;
    const theta = 2.0 * Math.PI * r2;
    
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    
    const now = Date.now();
    if (lastShotTimestampRef.current) {
      setLastSplitTime(Number(((now - lastShotTimestampRef.current) / 1000).toFixed(2)));
    }
    lastShotTimestampRef.current = now;

    const result = calculateScore({ x, y }, selectedTarget);
    setShots(prev => [...prev, { x, y, ...result }]);
    playShotFeedback(result.score);

    // Generate local mock impact proof for demonstration/offline testing
    setLatestImpactSnapshot({
      laneId: assignedLane?.laneNumber ? `Lane-${assignedLane.laneNumber}` : 'Demo-1',
      shotNumber: shots.length + 1,
      score: result.score,
      xMm: x,
      yMm: y,
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect width="400" height="225" fill="%23060913"/><circle cx="200" cy="112" r="80" stroke="%23334155" stroke-width="1.5" fill="none"/><circle cx="200" cy="112" r="50" stroke="%23334155" stroke-width="1.5" fill="none"/><circle cx="200" cy="112" r="25" stroke="%23334155" stroke-width="1.5" fill="%230F172A"/><circle cx="200" cy="112" r="6" fill="%23EF4444"/><text x="14" y="24" fill="%2300E5A0" font-family="monospace" font-size="11" font-weight="bold">DOWNRANGE HIGH-RES OPTICAL CAPTURE</text><text x="14" y="42" fill="%2394A3B8" font-family="monospace" font-size="10">TRIGGERED BY EDGE YOLOv8 BULLET-DETECTION</text></svg>',
      timestamp: Date.now(),
    });
  };


  const clearSession = () => {
    setShots([]);
    setLastSplitTime(null);
    lastShotTimestampRef.current = null;
  };

  return (
    <div className="flex flex-col gap-6">
      {assignedLane && (
        <div className="flex items-center justify-between bg-surface-container/60 border border-primary/30 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-white">
              ASSIGNED LANE: <strong className="text-primary font-mono">LANE {assignedLane.laneNumber}</strong>
            </span>
            <span className="text-xs text-text-muted">({assignedLane.status || 'ACTIVE'})</span>
          </div>
          <span className="text-xs bg-primary/20 text-primary border border-primary/40 px-2.5 py-0.5 rounded-full font-bold">
            Live Synchronized
          </span>
        </div>
      )}

      <LiveTargetSelector 
        selectedTarget={selectedTarget}
        onChange={handleTargetChange}
        isConnected={isConnected}
      />

      {/* Ballistics Dispersion & Shot Group Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-[#0F172A] border border-border-subtle shadow-md">
        <div className="border-l-2 border-[#10B981] pl-3">
          <span className="text-[10px] font-mono text-text-muted uppercase block">MEAN RADIUS</span>
          <span className="text-lg font-mono font-bold text-white">{groupStats.meanRadius} mm</span>
        </div>
        <div className="border-l-2 border-[#F5A623] pl-3">
          <span className="text-[10px] font-mono text-text-muted uppercase block">EXTREME SPREAD</span>
          <span className="text-lg font-mono font-bold text-[#F5A623]">{groupStats.extremeSpread} mm</span>
        </div>
        <div className="border-l-2 border-[#38BDF8] pl-3">
          <span className="text-[10px] font-mono text-text-muted uppercase block">MPI (OFFSET X, Y)</span>
          <span className="text-lg font-mono font-bold text-[#38BDF8]">{groupStats.centerX}, {groupStats.centerY} mm</span>
        </div>
        <div className="border-l-2 border-[#A855F7] pl-3">
          <span className="text-[10px] font-mono text-text-muted uppercase block">SPLIT CADENCE</span>
          <span className="text-lg font-mono font-bold text-white">{lastSplitTime ? `${lastSplitTime}s` : '—'}</span>
        </div>
        <div className="border-l-2 border-[#EF4444] pl-3">
          <span className="text-[10px] font-mono text-text-muted uppercase block">INNER 10s (X)</span>
          <span className="text-lg font-mono font-bold text-white">{groupStats.innerTens} / {shots.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <MultiCameraTargetView 
            spec={TARGET_SPECS[selectedTarget]} 
            shots={shots}
            isCeasefireActive={isCeasefireActive}
            latestImpactSnapshot={latestImpactSnapshot}
          />
        </div>
        
        <div className="xl:col-span-1">
          <RealTimeScoreboard shots={shots} />
        </div>
      </div>

      {/* Developer Controls - Live Vision Controls */}
      <div className="p-4 rounded-2xl bg-[#0F172A] border border-border-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioFeedback(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              audioFeedback
                ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                : 'bg-black/30 border-white/10 text-text-muted'
            }`}
          >
            🔊 {audioFeedback ? 'Voice Callouts ON' : 'Voice Callouts OFF'}
          </button>
          <span className="text-xs font-mono text-text-muted">
            FPS: 60 • YOLOv8 Sub-mm Resolution: 0.12mm/px
          </span>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={triggerMockShot}
            className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-mono font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
          >
            + Trigger Live Impact
          </button>
          <button 
            onClick={clearSession}
            className="bg-transparent hover:bg-[#EF4444]/10 text-[#EF4444] font-mono text-xs px-4 py-2 rounded-xl transition-all border border-[#EF4444]/30"
          >
            Reset Target
          </button>
        </div>
      </div>
    </div>
  );
}


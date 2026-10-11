'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { TargetType, TARGET_SPECS, ShotCoordinates, ShotResult, calculateScore } from '../../lib/target-specs';
import { TargetCanvas } from '../../components/live-analysis/TargetCanvas';
import { RealTimeScoreboard } from '../../components/live-analysis/RealTimeScoreboard';
import { LiveTargetSelector } from '../../components/live-analysis/LiveTargetSelector';
import { LiveVisionDark } from '../../components/vision/LiveVisionDark';

type ShotData = ShotCoordinates & ShotResult;

export function LiveAnalysisDashboard() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'precision'>('matrix');
  const [selectedTarget, setSelectedTarget] = useState<TargetType>('10m_air_rifle');
  const [shots, setShots] = useState<ShotData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket Server
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinLiveRange', 'demo_lane_1');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
    setShots(prev => prev.map(shot => ({
      ...shot,
      ...calculateScore({ x: shot.x, y: shot.y }, type)
    })));
  };

  const triggerMockShot = () => {
    const r1 = Math.random();
    const r2 = Math.random();
    const radius = Math.sqrt(-2.0 * Math.log(r1)) * 3.0;
    const theta = 2.0 * Math.PI * r2;
    
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    
    const result = calculateScore({ x, y }, selectedTarget);
    setShots(prev => [...prev, { x, y, ...result }]);
  };

  const clearSession = () => setShots([]);

  // Calculate ballistics dispersion metrics
  const groupStats = (() => {
    if (shots.length === 0) return { meanRadius: 0, extremeSpread: 0, centerX: 0, centerY: 0 };
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

    return {
      meanRadius: Number(meanRadius.toFixed(2)),
      extremeSpread: Number(maxDist.toFixed(2)),
      centerX: Number(avgX.toFixed(2)),
      centerY: Number(avgY.toFixed(2)),
    };
  })();

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top View Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0F172A] border border-border-subtle shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'matrix'
                ? 'bg-[#F5A623] text-black shadow-lg shadow-[#F5A623]/20'
                : 'bg-black/40 text-text-secondary hover:text-white border border-white/5'
            }`}
          >
            <span>📹</span>
            <span>Range Bay Multi-Camera Grid</span>
          </button>
          <button
            onClick={() => setActiveTab('precision')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'precision'
                ? 'bg-[#F5A623] text-black shadow-lg shadow-[#F5A623]/20'
                : 'bg-black/40 text-text-secondary hover:text-white border border-white/5'
            }`}
          >
            <span>🎯</span>
            <span>Precision ISSF Target Telemetry</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-text-muted">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
            WS: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
          <span className="text-text-muted">|</span>
          <span className="text-[#38BDF8]">CALIBRATION: 0.12mm / px</span>
        </div>
      </div>

      {/* VIEW A: MULTI-CAMERA MATRIX */}
      {activeTab === 'matrix' && (
        <div className="w-full">
          <LiveVisionDark />
        </div>
      )}

      {/* VIEW B: PRECISION ISSF TARGET TELEMETRY */}
      {activeTab === 'precision' && (
        <div className="flex flex-col gap-6">
          <LiveTargetSelector 
            selectedTarget={selectedTarget}
            onChange={handleTargetChange}
            isConnected={isConnected}
          />

          {/* Group Ballistics Dispersion Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#0F172A] border border-border-subtle">
            <div className="border-l-2 border-[#10B981] pl-3">
              <span className="text-[10px] font-mono text-text-muted uppercase block">MEAN RADIUS</span>
              <span className="text-xl font-mono font-bold text-white">{groupStats.meanRadius} mm</span>
            </div>
            <div className="border-l-2 border-[#F5A623] pl-3">
              <span className="text-[10px] font-mono text-text-muted uppercase block">EXTREME SPREAD (C-T-C)</span>
              <span className="text-xl font-mono font-bold text-[#F5A623]">{groupStats.extremeSpread} mm</span>
            </div>
            <div className="border-l-2 border-[#38BDF8] pl-3">
              <span className="text-[10px] font-mono text-text-muted uppercase block">MPI (CENTER X, Y)</span>
              <span className="text-xl font-mono font-bold text-[#38BDF8]">{groupStats.centerX}, {groupStats.centerY} mm</span>
            </div>
            <div className="border-l-2 border-[#EF4444] pl-3">
              <span className="text-[10px] font-mono text-text-muted uppercase block">SHOT COUNT</span>
              <span className="text-xl font-mono font-bold text-white">{shots.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TargetCanvas 
                spec={TARGET_SPECS[selectedTarget]} 
                shots={shots}
              />
            </div>
            
            <div className="lg:col-span-1">
              <RealTimeScoreboard shots={shots} />
            </div>
          </div>

          {/* Precision Controls */}
          <div className="p-4 rounded-xl bg-[#0F172A] border border-border-subtle flex items-center justify-between">
            <p className="font-mono text-xs text-text-muted uppercase tracking-wider">
              Optical Computer Vision Simulator
            </p>
            <div className="flex gap-3">
              <button 
                onClick={triggerMockShot}
                className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-mono font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-md"
              >
                + Trigger Sub-mm Impact
              </button>
              <button 
                onClick={clearSession}
                className="bg-transparent hover:bg-[#EF4444]/10 text-[#EF4444] font-mono text-xs px-4 py-2 rounded-lg transition-colors border border-[#EF4444]/30"
              >
                Clear Target Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


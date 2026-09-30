'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { TargetType, TARGET_SPECS, ShotCoordinates, ShotResult, calculateScore } from '../../lib/target-specs';
import { TargetCanvas } from '../../components/live-analysis/TargetCanvas';
import { RealTimeScoreboard } from '../../components/live-analysis/RealTimeScoreboard';
import { LiveTargetSelector } from '../../components/live-analysis/LiveTargetSelector';

type ShotData = ShotCoordinates & ShotResult;

export function LiveAnalysisDashboard() {
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
      // Join a generic live range room for demo purposes
      socket.emit('joinLiveRange', 'demo_lane_1');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
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

  // Mock test tool
  const triggerMockShot = () => {
    // Generate a somewhat realistic shot near the center
    // Random gaussian-like distribution
    const r1 = Math.random();
    const r2 = Math.random();
    const radius = Math.sqrt(-2.0 * Math.log(r1)) * 3.0; // standard deviation ~ 3mm
    const theta = 2.0 * Math.PI * r2;
    
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    
    if (socketRef.current?.connected) {
      // If we have a real backend, we shouldn't trigger from here usually,
      // but we can send it to the server to broadcast back.
      // For standalone frontend testing:
      const result = calculateScore({ x, y }, selectedTarget);
      setShots(prev => [...prev, { x, y, ...result }]);
    } else {
      // Local fallback
      const result = calculateScore({ x, y }, selectedTarget);
      setShots(prev => [...prev, { x, y, ...result }]);
    }
  };

  const clearSession = () => setShots([]);

  return (
    <div className="flex flex-col gap-6">
      <LiveTargetSelector 
        selectedTarget={selectedTarget}
        onChange={handleTargetChange}
        isConnected={isConnected}
      />

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

      {/* Developer Controls - Only visible in DEV or easily hidden */}
      <div className="mt-8 border-t border-border-subtle pt-6">
        <p className="font-body text-xs text-text-muted uppercase tracking-widest mb-4">
          Simulation Controls (Dev)
        </p>
        <div className="flex gap-4">
          <button 
            onClick={triggerMockShot}
            className="bg-bg-elevated hover:bg-border-subtle text-text-primary font-body text-sm px-4 py-2 rounded-lg transition-colors border border-border-default"
          >
            Simulate Shot
          </button>
          <button 
            onClick={clearSession}
            className="bg-transparent hover:bg-signal-red/10 text-signal-red font-body text-sm px-4 py-2 rounded-lg transition-colors border border-signal-red/30"
          >
            Clear Session
          </button>
        </div>
      </div>
    </div>
  );
}

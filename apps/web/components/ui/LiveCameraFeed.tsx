import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';
import { GlassCard } from './Card';

interface LiveCameraFeedProps {
  laneId: string;
  laneNumber: number;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({ laneId, laneNumber }) => {
  const [frame, setFrame] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Connect to the WebSocket Gateway
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      // Join the lane room to start receiving frames
      socket.emit('watch_lane_camera', { laneId }, (response: any) => {
        if (response && response.data) {
          setIsStreaming(response.data.isStreaming);
        }
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsStreaming(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setError("Unable to connect to camera server.");
    });

    socket.on('camera_stream_started', (data: any) => {
      if (data.laneId === laneId) {
        setIsStreaming(true);
        setError(null);
      }
    });

    socket.on('camera_stream_stopped', (data: any) => {
      if (data.laneId === laneId) {
        setIsStreaming(false);
        setFrame(null);
      }
    });

    socket.on('camera_frame_update', (data: any) => {
      if (data.laneId === laneId && data.frame) {
        setIsStreaming(true);
        setFrame(`data:image/jpeg;base64,${data.frame}`);
      }
    });

    return () => {
      socket.emit('stop_watch_lane_camera', { laneId });
      socket.disconnect();
    };
  }, [laneId]);

  return (
    <GlassCard className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col h-full w-full aspect-video">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <Camera size={16} className={isStreaming ? "text-[var(--emerald-signal)]" : "text-[var(--text-muted)]"} />
          <span className="font-bold font-mono text-sm tracking-widest text-white shadow-black drop-shadow-md">
            LANE {String(laneNumber).padStart(2, '0')} CAM
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStreaming ? 'bg-[var(--emerald-signal)]' : 'bg-yellow-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreaming ? 'bg-[var(--emerald-signal)]' : 'bg-yellow-500'}`}></span>
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-[var(--signal-red)]"></span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] shadow-black drop-shadow-md">
            {isConnected ? (isStreaming ? "LIVE" : "STANDBY") : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Feed Area */}
      <div className="flex-1 w-full bg-black flex items-center justify-center">
        {frame ? (
          <img src={frame} alt={`Lane ${laneNumber} Feed`} className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
            {error ? (
              <>
                <AlertCircle size={32} className="text-[var(--signal-red)] opacity-50" />
                <p className="text-xs uppercase tracking-widest">{error}</p>
              </>
            ) : !isConnected ? (
              <>
                <RefreshCw size={32} className="animate-spin opacity-50" />
                <p className="text-xs uppercase tracking-widest">Connecting to Server...</p>
              </>
            ) : (
              <>
                <Camera size={32} className="opacity-20" />
                <p className="text-xs uppercase tracking-widest text-center">
                  Waiting for Target Camera<br/>App to start streaming
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

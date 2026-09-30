'use client';
// apps/web/hooks/useLiveRange.ts
// Socket.io hook for subscribing to live range shot events.

import { useEffect, useRef, useCallback, useState } from 'react';

export interface LiveShot {
  x: number;
  y: number;
  score: number;
  pixelX: number;
  pixelY: number;
  targetType: string;
  confidence: number;
  timestamp: number;
}

interface UseLiveRangeOptions {
  rangeId: string;
  enabled?: boolean;
  onShot?: (shot: LiveShot) => void;
}

interface UseLiveRangeReturn {
  shots: LiveShot[];
  isConnected: boolean;
  connectionError: string | null;
  clearShots: () => void;
}

export function useLiveRange({
  rangeId,
  enabled = true,
  onShot,
}: UseLiveRangeOptions): UseLiveRangeReturn {
  const [shots, setShots] = useState<LiveShot[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  const clearShots = useCallback(() => setShots([]), []);

  useEffect(() => {
    if (!enabled || !rangeId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

    let socket: any;

    const connect = async () => {
      try {
        // Dynamically import socket.io-client to avoid SSR issues
        const { io } = await import('socket.io-client');
        socket = io(wsUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          setIsConnected(true);
          setConnectionError(null);
          socket.emit('joinLiveRange', rangeId);
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });

        socket.on('connect_error', (err: Error) => {
          setIsConnected(false);
          setConnectionError(`Connection failed: ${err.message}`);
        });

        socket.on('shot_detected', (payload: LiveShot) => {
          const shot: LiveShot = {
            x:          payload.x ?? 0,
            y:          payload.y ?? 0,
            score:      payload.score ?? 0,
            pixelX:     payload.pixelX ?? 500,
            pixelY:     payload.pixelY ?? 500,
            targetType: payload.targetType ?? 'air_rifle_10m',
            confidence: payload.confidence ?? 1.0,
            timestamp:  payload.timestamp ?? Date.now(),
          };
          setShots((prev) => [...prev, shot]);
          onShot?.(shot);
        });

      } catch (err) {
        setConnectionError(`Socket.io init failed: ${String(err)}`);
      }
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveLiveRange', rangeId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [rangeId, enabled]);

  return { shots, isConnected, connectionError, clearShots };
}

'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export function useLiveVision(rangeId: string = '1') {
  const [lanes, setLanes] = useState<any[]>([
    { id: '1', number: 1, status: 'OCCUPIED', shooterName: 'Marcus Vance', targetType: '10m Air Rifle', distance: '10m', battery: 92, fps: 60, latency: 12 },
    { id: '2', number: 2, status: 'IDLE', shooterName: null, targetType: '25m Rapid Fire', distance: '25m', battery: 85, fps: 60, latency: 15 },
    { id: '3', number: 3, status: 'OCCUPIED', shooterName: 'Elena Rostova', targetType: '50m Rifle 3-Pos', distance: '50m', battery: 78, fps: 60, latency: 14 },
    { id: '4', number: 4, status: 'OFFLINE', shooterName: null, targetType: '10m Air Pistol', distance: '10m', battery: 0, fps: 0, latency: 999 },
  ]);
  const [selectedLaneId, setSelectedLaneId] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchLanes() {
      try {
        const data = await apiFetch<any[]>(`/range-operations/${rangeId}/lanes`);
        if (data && data.length > 0) {
          setLanes(data);
          setSelectedLaneId(data[0].id);
        }
      } catch (err) {
        // use default configured lanes
      }
    }
    if (rangeId) fetchLanes();
  }, [rangeId]);

  return { lanes, isLoading, selectedLaneId, setSelectedLaneId };
}

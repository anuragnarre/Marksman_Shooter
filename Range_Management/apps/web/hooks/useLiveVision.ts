'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export interface LaneCornerPoint {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface LaneCalibration {
  glareThreshold: number;
  contrast: number;
  edgeSensitivity: number; // mm (e.g. 0.15)
  diameterMm: number;      // e.g. 4.5 | 5.5 | 6.35
  corners: [LaneCornerPoint, LaneCornerPoint, LaneCornerPoint, LaneCornerPoint];
}

export interface ConfiguredLane {
  id: string;
  number: number;
  laneNumber: number;
  name: string;
  status: 'OCCUPIED' | 'IDLE' | 'MAINTENANCE' | 'OFFLINE' | string;
  shooterName: string | null;
  targetType: string;
  distance: '10m' | '25m' | '50m' | string;
  cameraId: string;
  rtspUrl: string;
  token: string;
  battery: number;
  fps: number;
  latency: number;
  calibration: LaneCalibration;
}

export const DEFAULT_CORNERS: [LaneCornerPoint, LaneCornerPoint, LaneCornerPoint, LaneCornerPoint] = [
  { x: 18, y: 12 },
  { x: 82, y: 15 },
  { x: 88, y: 86 },
  { x: 12, y: 82 },
];

function inferDistance(raw: any, laneNum: number): '10m' | '25m' | '50m' {
  const txt = `${raw?.distance || ''} ${raw?.targetType || ''} ${raw?.name || ''}`.toLowerCase();
  if (txt.includes('50m')) return '50m';
  if (txt.includes('25m')) return '25m';
  if (txt.includes('10m')) return '10m';
  if (laneNum === 3) return '50m';
  if (laneNum === 2) return '25m';
  return '10m';
}

function normalizeLane(raw: any, index = 0): ConfiguredLane {
  const num = Number(raw?.laneNumber ?? raw?.number ?? index + 1) || index + 1;
  const padded = String(num).padStart(2, '0');
  const dist = inferDistance(raw, num);
  return {
    id: String(raw?.id ?? num),
    number: num,
    laneNumber: num,
    name: String(raw?.name ?? `Lane ${padded} — ${raw?.targetType || `${dist} Air Target`}`),
    status: String(raw?.status ?? 'IDLE'),
    shooterName: raw?.shooterName ?? null,
    targetType: String(raw?.targetType ?? `${dist} ISSF Target`),
    distance: dist,
    cameraId: String(raw?.cameraId ?? `CAM-${padded}-ESP`),
    rtspUrl: String(raw?.rtspUrl ?? `192.168.1.${103 + num}:8080/live/lane_${padded}`),
    token: String(raw?.token ?? `MK-${padded}-9F2A`),
    battery: typeof raw?.battery === 'number' ? raw.battery : 90,
    fps: typeof raw?.fps === 'number' ? raw.fps : 60,
    latency: typeof raw?.latency === 'number' ? raw.latency : 14,
    calibration: raw?.calibration ?? {
      glareThreshold: 68,
      contrast: 82,
      edgeSensitivity: 0.15,
      diameterMm: 4.5,
      corners: DEFAULT_CORNERS,
    },
  };
}

const DEFAULT_LANES: ConfiguredLane[] = [
  normalizeLane({
    id: '1',
    number: 1,
    name: 'Lane 01 — 10m Olympic Hall',
    status: 'OCCUPIED',
    shooterName: 'Marcus Vance',
    targetType: '10m Air Rifle',
    distance: '10m',
    cameraId: 'CAM-01-ESP (S21 Pro)',
    battery: 92,
    fps: 60,
    latency: 12,
  }),
  normalizeLane({
    id: '2',
    number: 2,
    name: 'Lane 02 — 25m Rapid Bay',
    status: 'IDLE',
    shooterName: null,
    targetType: '25m Rapid Fire',
    distance: '25m',
    cameraId: 'CAM-02-USB (Logi Brio)',
    battery: 85,
    fps: 60,
    latency: 15,
  }),
  normalizeLane({
    id: '3',
    number: 3,
    name: 'Lane 03 — 50m Three-Pos',
    status: 'OCCUPIED',
    shooterName: 'Elena Rostova',
    targetType: '50m Rifle 3-Pos',
    distance: '50m',
    cameraId: 'CAM-03-IP (Axis M11)',
    battery: 78,
    fps: 60,
    latency: 14,
  }),
  normalizeLane({
    id: '4',
    number: 4,
    name: 'Lane 04 — 10m Air Pistol',
    status: 'MAINTENANCE',
    shooterName: null,
    targetType: '10m Air Pistol',
    distance: '10m',
    cameraId: 'CAM-04-ESP (Standby)',
    battery: 0,
    fps: 0,
    latency: 999,
  }),
];

export function useLiveVision(rangeId: string = '1') {
  const [lanes, setLanes] = useState<ConfiguredLane[]>(DEFAULT_LANES);
  const [selectedLaneId, setSelectedLaneId] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchLanes() {
      setIsLoading(true);
      try {
        const data = await apiFetch<any[]>(`/range-operations/${rangeId}/lanes`);
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((item, idx) => normalizeLane(item, idx));
          setLanes(normalized);
          setSelectedLaneId(normalized[0].id);
        }
      } catch {
        // Use pre-configured offline lanes
      } finally {
        setIsLoading(false);
      }
    }
    if (rangeId) fetchLanes();
  }, [rangeId]);

  const addLane = useCallback(
    async (input: { name: string; distance: '10m' | '25m' | '50m'; cameraId: string; status?: string }) => {
      const nextNum = lanes.reduce((max, l) => Math.max(max, l.number), 0) + 1;
      const created = normalizeLane({
        id: `lane-${Date.now().toString().slice(-5)}`,
        number: nextNum,
        laneNumber: nextNum,
        name: input.name.trim() || `Lane ${String(nextNum).padStart(2, '0')} — ${input.distance} Bay`,
        distance: input.distance,
        targetType: `${input.distance} ISSF Target`,
        cameraId: input.cameraId.trim() || `CAM-${String(nextNum).padStart(2, '0')}-IP`,
        status: input.status || 'IDLE',
        fps: 60,
        latency: 14,
      });

      try {
        await apiFetch(`/range-operations/${rangeId}/lanes`, {
          method: 'POST',
          body: JSON.stringify(created),
        });
      } catch {
        // Offline local state addition
      }

      setLanes((prev) => [...prev, created]);
      setSelectedLaneId(created.id);
      return created;
    },
    [lanes, rangeId],
  );

  const updateLane = useCallback(
    async (id: string, patch: Partial<ConfiguredLane>) => {
      setLanes((prev) =>
        prev.map((lane) => (lane.id === id ? { ...lane, ...patch } : lane)),
      );
      try {
        await apiFetch(`/range-operations/${rangeId}/lanes/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
      } catch {
        // Persist in-memory locally offline
      }
    },
    [rangeId],
  );

  return { lanes, isLoading, selectedLaneId, setSelectedLaneId, addLane, updateLane };
}

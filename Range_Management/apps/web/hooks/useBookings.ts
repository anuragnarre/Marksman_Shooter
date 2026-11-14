'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export interface NormalizedBookingEvent {
  id: string;
  title: string;
  laneId: string;
  laneNumber: number;
  shooterName: string;
  type: string;
  caliber: string;
  startTime: string;
  endTime: string;
  start?: string;
  end?: string;
  bay: '10M' | '25M';
  status: string;
  fee?: number;
}

export interface NormalizedBookingRequest {
  id: string;
  shooterName: string;
  requestedDate: string;
  requestedTime: string;
  laneId: string;
  status: string;
}

export interface CreateBookingPayload {
  shooterName: string;
  airgunProfile: string;
  caliber?: string;
  laneNumber: number;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  totalFee?: number;
  mode?: 'MEMBER' | 'WALKIN';
}

function toHHMM(val: unknown, fallback: string): string {
  if (typeof val === 'string') {
    const clean = val.trim();
    const hm = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (hm) {
      return `${hm[1].padStart(2, '0')}:${hm[2]}`;
    }
    const parsed = new Date(clean);
    if (!Number.isNaN(parsed.getTime())) {
      return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
    }
  }
  return fallback;
}

function parseLaneNumber(raw: any): number {
  if (typeof raw?.laneNumber === 'number' && !Number.isNaN(raw.laneNumber)) {
    return raw.laneNumber;
  }
  const str = String(raw?.laneId ?? raw?.lane ?? '1');
  const digits = str.replace(/\D/g, '');
  const n = Number(digits);
  return n >= 1 && n <= 16 ? n : 1;
}

function normalizeEvent(raw: any): NormalizedBookingEvent {
  const laneNumber = parseLaneNumber(raw);
  const laneId = `L-${String(laneNumber).padStart(2, '0')}`;
  const startTime = toHHMM(raw?.startTime ?? raw?.start, '09:00');
  const endTime = toHHMM(raw?.endTime ?? raw?.end, '11:00');
  return {
    id: String(raw?.id ?? `evt-${Date.now()}`),
    title: String(raw?.title ?? 'Range Session'),
    laneId,
    laneNumber,
    shooterName: String(raw?.shooterName ?? raw?.user?.name ?? raw?.title ?? 'Assigned Shooter'),
    type: String(raw?.type ?? raw?.title ?? 'Member (Live)'),
    caliber: String(raw?.caliber ?? (laneNumber <= 4 ? '4.5mm (.177)' : '.22 / 5.5mm')),
    startTime,
    endTime,
    start: raw?.start,
    end: raw?.end,
    bay: laneNumber <= 4 ? '10M' : '25M',
    status: String(raw?.status ?? 'CONFIRMED'),
    fee: typeof raw?.fee === 'number' ? raw.fee : undefined,
  };
}

function normalizeRequest(raw: any): NormalizedBookingRequest {
  const laneNumber = parseLaneNumber(raw);
  const dateObj = raw?.startTime ? new Date(raw.startTime) : null;
  const hasValidDate = dateObj !== null && !Number.isNaN(dateObj.getTime());
  return {
    id: String(raw?.id ?? `req-${Date.now()}`),
    shooterName: String(raw?.shooterName ?? raw?.user?.name ?? 'Walk-in Applicant'),
    requestedDate: String(
      raw?.requestedDate ??
        (hasValidDate ? dateObj!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'),
    ),
    requestedTime: String(
      raw?.requestedTime ??
        (hasValidDate ? `${String(dateObj!.getHours()).padStart(2, '0')}:${String(dateObj!.getMinutes()).padStart(2, '0')}` : '14:00'),
    ),
    laneId: `L-${String(laneNumber).padStart(2, '0')}`,
    status: String(raw?.status ?? 'PENDING'),
  };
}

const DEFAULT_EVENTS: NormalizedBookingEvent[] = [
  normalizeEvent({
    id: 'evt-101',
    title: 'Precision Air Rifle Training',
    laneNumber: 1,
    shooterName: 'Marcus Vance',
    type: 'Steyr Challenge HFT (Member)',
    caliber: '4.5mm (.177)',
    startTime: '09:00',
    endTime: '11:00',
    status: 'CONFIRMED',
  }),
  normalizeEvent({
    id: 'evt-102',
    title: 'Walk-in 10m Bay Session',
    laneNumber: 2,
    shooterName: 'K. Takahashi',
    type: 'Feinwerkbau 800 (Walk-in)',
    caliber: '4.5mm (.177)',
    startTime: '10:00',
    endTime: '12:00',
    status: 'CONFIRMED',
  }),
  normalizeEvent({
    id: 'evt-103',
    title: 'Olympic Rapid Fire Simulation',
    laneNumber: 3,
    shooterName: 'Elena Rostova',
    type: 'Walther LG400 Monotec',
    caliber: '4.5mm (.177)',
    startTime: '11:00',
    endTime: '13:00',
    status: 'CONFIRMED',
  }),
  normalizeEvent({
    id: 'evt-104',
    title: 'Junior Match Prep',
    laneNumber: 6,
    shooterName: 'North Squad Juniors',
    type: '25m Match Rifle Allocation',
    caliber: '.22 LR / 5.5mm',
    startTime: '13:00',
    endTime: '15:00',
    status: 'CONFIRMED',
  }),
];

const DEFAULT_REQUESTS: NormalizedBookingRequest[] = [
  normalizeRequest({
    id: 'req-201',
    user: { name: 'Alex Cooper', email: 'alex.cooper@marksman.dev' },
    laneId: 'Lane 04',
    requestedDate: 'Today',
    requestedTime: '15:00',
    status: 'PENDING',
  }),
  normalizeRequest({
    id: 'req-202',
    shooterName: 'D. Kowalski',
    laneId: 'Lane 07',
    requestedDate: 'Today',
    requestedTime: '16:00',
    status: 'PENDING',
  }),
];

export function useBookings() {
  const [events, setEvents] = useState<NormalizedBookingEvent[]>(DEFAULT_EVENTS);
  const [requests, setRequests] = useState<NormalizedBookingRequest[]>(DEFAULT_REQUESTS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any>('/schedule-requests');
      if (data) {
        if (Array.isArray(data) && data.length > 0) {
          setRequests(data.map(normalizeRequest));
        } else if (!Array.isArray(data)) {
          if (Array.isArray(data.requests) && data.requests.length > 0) {
            setRequests(data.requests.map(normalizeRequest));
          }
          if (Array.isArray(data.events) && data.events.length > 0) {
            setEvents(data.events.map(normalizeEvent));
          }
        }
      }
    } catch {
      // Keep normalized demo defaults offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = useCallback(async (payload: CreateBookingPayload) => {
    const startTime = payload.startTime || '14:00';
    const mins = payload.durationMinutes || 60;
    const [sh, sm] = startTime.split(':').map(Number);
    const totalEndMins = (sh || 14) * 60 + (sm || 0) + mins;
    const endH = Math.min(23, Math.floor(totalEndMins / 60));
    const endM = totalEndMins % 60;
    const endTime = payload.endTime || `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const newEvent = normalizeEvent({
      id: `evt-${Date.now().toString().slice(-6)}`,
      title: `${payload.mode === 'WALKIN' ? 'Walk-in' : 'Member'} — ${payload.airgunProfile}`,
      laneNumber: payload.laneNumber,
      shooterName: payload.shooterName,
      type: payload.airgunProfile,
      caliber: payload.caliber || (payload.laneNumber <= 4 ? '4.5mm (.177)' : '.22 / 5.5mm'),
      startTime,
      endTime,
      status: 'CONFIRMED',
      fee: payload.totalFee,
    });

    try {
      await apiFetch('/schedule-requests', {
        method: 'POST',
        body: JSON.stringify({
          shooterName: payload.shooterName,
          laneId: newEvent.laneId,
          laneNumber: payload.laneNumber,
          startTime,
          endTime,
          type: payload.airgunProfile,
          fee: payload.totalFee,
        }),
      });
    } catch {
      // Commit locally in offline demo mode
    }

    setEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  }, []);

  const approveRequest = useCallback(async (id: string) => {
    try {
      await apiFetch(`/schedule-requests/${id}/approve`, { method: 'POST' });
    } catch {}
    setRequests((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) {
        const laneNumber = parseLaneNumber(target);
        const startTime = target.requestedTime || '15:00';
        const [h, m] = startTime.split(':').map(Number);
        const endTime = `${String(Math.min(23, (h || 15) + 1)).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
        setEvents((curr) => [
          normalizeEvent({
            id: `evt-apr-${id}`,
            title: 'Approved Range Request',
            laneNumber,
            shooterName: target.shooterName,
            type: 'Approved Reservation',
            startTime,
            endTime,
            status: 'CONFIRMED',
          }),
          ...curr,
        ]);
      }
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const rejectRequest = useCallback(async (id: string) => {
    try {
      await apiFetch(`/schedule-requests/${id}/reject`, { method: 'POST' });
    } catch {}
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    events,
    requests,
    isLoading,
    createBooking,
    approveRequest,
    rejectRequest,
    refresh: fetchBookings,
  };
}

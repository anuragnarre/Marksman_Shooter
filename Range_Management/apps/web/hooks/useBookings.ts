'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export function useBookings() {
  const [events, setEvents] = useState<any[]>([
    {
      id: 'evt-1',
      title: 'Precision Air Rifle Training',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 7200000).toISOString(),
      laneNumber: 1,
      shooterName: 'Marcus Vance',
      status: 'CONFIRMED'
    },
    {
      id: 'evt-2',
      title: 'Olympic Rapid Fire Simulation',
      start: new Date(Date.now() + 10800000).toISOString(),
      end: new Date(Date.now() + 18000000).toISOString(),
      laneNumber: 3,
      shooterName: 'Elena Rostova',
      status: 'CONFIRMED'
    }
  ]);
  const [requests, setRequests] = useState<any[]>([
    {
      id: 'req-1',
      user: { name: 'Alex Cooper', email: 'alex.cooper@marksman.dev' },
      laneId: 'Lane 02',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      status: 'PENDING'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any>('/schedule-requests');
      if (data) {
        if (Array.isArray(data)) {
          setRequests(data);
        } else {
          if (data.requests) setRequests(data.requests);
          if (data.events) setEvents(data.events);
        }
      }
    } catch {
      // Keep defaults
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const approveRequest = async (id: string) => {
    try {
      await apiFetch(`/schedule-requests/${id}/approve`, { method: 'POST' });
    } catch {}
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const rejectRequest = async (id: string) => {
    try {
      await apiFetch(`/schedule-requests/${id}/reject`, { method: 'POST' });
    } catch {}
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return { events, requests, isLoading, approveRequest, rejectRequest, refresh: fetchBookings };
}

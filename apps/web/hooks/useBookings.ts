import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export interface BookingEvent {
  id: string;
  laneId: string;
  startTime: string;
  endTime: string;
  shooterName: string;
  type: string;
  status: string;
  caliber: string;
}

export interface ScheduleRequest {
  id: string;
  shooterName: string;
  requestedDate: string;
  requestedTime: string;
  status: string;
}

export function useBookings() {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      setIsLoading(true);
      try {
        const rangeId = "default-range-id"; // Will be dynamic later
        const [eventsRes, requestsRes] = await Promise.allSettled([
          apiFetch<BookingEvent[]>(`/range-operations/${rangeId}/bookings`),
          apiFetch<ScheduleRequest[]>(`/range-operations/${rangeId}/schedule-requests`)
        ]);

        let loadedEvents = false;
        let loadedRequests = false;

        if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value)) {
          setEvents(eventsRes.value);
          loadedEvents = true;
        }
        if (requestsRes.status === 'fulfilled' && Array.isArray(requestsRes.value)) {
          setRequests(requestsRes.value);
          loadedRequests = true;
        }

        // Fallback for missing backend implementation during dev
        if (!loadedEvents) {
          setEvents([
            { id: "e1", laneId: "L-01", startTime: "09:00", endTime: "11:00", shooterName: "Markus Rossi", type: "Member (Live)", status: "ACTIVE", caliber: "4.5mm" },
            { id: "e2", laneId: "L-02", startTime: "10:00", endTime: "12:00", shooterName: "Elena Rostova", type: "Walk-in", status: "SCHEDULED", caliber: "9mm" },
            { id: "e3", laneId: "L-03", startTime: "13:00", endTime: "14:00", shooterName: "Alex Vance", type: "Junior Match", status: "SCHEDULED", caliber: ".22 LR" }
          ]);
        }
        if (!loadedRequests) {
          setRequests([
            { id: "r1", shooterName: "John Doe", requestedDate: "2025-11-14", requestedTime: "15:00", status: "PENDING" },
            { id: "r2", shooterName: "Jane Smith", requestedDate: "2025-11-14", requestedTime: "16:00", status: "PENDING" }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
  }, []);

  const approveRequest = async (id: string) => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status: "APPROVED" } : req));
    // Optional: make API call
  };

  const rejectRequest = async (id: string) => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status: "REJECTED" } : req));
    // Optional: make API call
  };

  return { events, requests, isLoading, approveRequest, rejectRequest };
}

"use client";
export const dynamic = 'force-dynamic';

import React from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { BookingsDark } from "@/components/bookings/BookingsDark";
import { BookingsLight } from "@/components/bookings/BookingsLight";
import { useTheme } from "@/contexts/theme-context";
import { useBookings } from "@/hooks/useBookings";

export default function BookingsPage() {
  const { resolvedTheme } = useTheme();
  const { events, requests, isLoading, approveRequest, rejectRequest } = useBookings();

  return (
    <DashboardLayout role="RANGE_OPERATOR">
      {resolvedTheme === "light" ? (
        <BookingsLight 
          events={events} 
          requests={requests} 
          isLoading={isLoading} 
          approveRequest={approveRequest}
          rejectRequest={rejectRequest}
        />
      ) : (
        <BookingsDark 
          events={events} 
          requests={requests} 
          isLoading={isLoading} 
          approveRequest={approveRequest}
          rejectRequest={rejectRequest}
        />
      )}
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '../../../components/TopBar';
import { apiFetch } from '../../../lib/api';

export default function BookingsPage() {
  const [range, setRange] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRange() {
      try {
        const myRanges = await apiFetch('/ranges');
        if (myRanges && myRanges.length > 0) {
          const details = await apiFetch(`/ranges/${myRanges[0].id}`);
          setRange(details);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRange();
  }, []);

  if (loading) return <div className="p-8 text-center text-text-muted">Loading Bookings...</div>;

  if (!range) {
    return (
      <div className="flex flex-col h-full bg-void text-text-primary">
        <TopBar title="Bookings" backUrl="/range-operator/dashboard" />
        <div className="p-8 text-center text-text-muted">No range found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-void text-text-primary">
      <TopBar title="Bookings & Payments" backUrl="/range-operator/dashboard" />
      
      <div className="p-4 md:p-8 flex-1 overflow-y-auto">
        <div className="panel">
          <h2 className="text-xl font-bold mb-6 font-display uppercase tracking-widest">Upcoming Bookings</h2>
          
          {range.bookings && range.bookings.length > 0 ? (
            <div className="space-y-4">
              {range.bookings.map((booking: any) => (
                <div key={booking.id} className="p-4 bg-surface rounded-lg border border-border-subtle flex justify-between items-center">
                  <div>
                    <p className="font-bold">{booking.user?.name || 'Guest'}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleString()}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Lane: {booking.lane?.laneNumber || 'TBD'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-primary font-bold">${booking.amount}</p>
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded mt-1 inline-block ${
                      booking.paymentStatus === 'PAID' ? 'bg-primary/20 text-primary' : 'bg-surface-elevated text-text-muted'
                    }`}>
                      {booking.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted">
              No bookings yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

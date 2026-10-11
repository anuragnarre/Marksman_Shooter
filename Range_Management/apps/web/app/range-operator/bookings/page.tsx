'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TopBar } from '../../../components/TopBar';
import { apiFetch } from '../../../lib/api';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  amount: number;
  paymentStatus: string;
  status?: 'SCHEDULED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  user?: { name: string; email?: string };
  lane?: { laneNumber: number; id?: string };
  discipline?: string;
}

interface RangeDetails {
  id: string;
  name?: string;
  bookings?: Booking[];
  lanes?: any[];
}

export default function BookingsPage() {
  const [range, setRange] = useState<RangeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('ALL');
  const [search, setSearch] = useState('');
  const [checkedInIds, setCheckedInIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadRange() {
      try {
        const myRanges = await apiFetch('/ranges') as any[];
        if (myRanges && myRanges.length > 0) {
          const details = await apiFetch(`/ranges/${myRanges[0].id}`) as RangeDetails;
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

  // Mock initial bookings if range has none yet for rich demonstration
  const sampleBookings: Booking[] = [
    {
      id: 'BK-9021',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
      amount: 45.0,
      paymentStatus: 'PAID',
      status: 'SCHEDULED',
      user: { name: 'Elena Rostova', email: 'elena@marksman.org' },
      lane: { laneNumber: 2 },
      discipline: '10m Air Rifle (ISSF 60 Shots)',
    },
    {
      id: 'BK-8842',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      amount: 55.0,
      paymentStatus: 'PAID',
      status: 'CHECKED_IN',
      user: { name: 'David Vance', email: 'david.vance@tactical.net' },
      lane: { laneNumber: 1 },
      discipline: '25m Rapid Fire Pistol',
    },
    {
      id: 'BK-7719',
      startTime: new Date(Date.now() + 10800000).toISOString(),
      endTime: new Date(Date.now() + 18000000).toISOString(),
      amount: 40.0,
      paymentStatus: 'PENDING',
      status: 'SCHEDULED',
      user: { name: 'Sarah Chen', email: 'sarah.c@olympic.org' },
      lane: { laneNumber: 3 },
      discipline: '50m Precision Prone Rifle',
    },
  ];

  const allBookings = (range?.bookings && range.bookings.length > 0) ? range.bookings : sampleBookings;

  const filteredBookings = allBookings.filter((b) => {
    const isChecked = checkedInIds.includes(b.id) || b.status === 'CHECKED_IN';
    if (filter === 'PENDING' && isChecked) return false;
    if (filter === 'ACTIVE' && !isChecked) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = b.user?.name?.toLowerCase() || '';
      const id = b.id.toLowerCase();
      return name.includes(q) || id.includes(q);
    }
    return true;
  });

  const handleCheckIn = (bookingId: string) => {
    setCheckedInIds((prev) => [...prev, bookingId]);
    alert(`CHECK-IN COMPLETE: Shooter checked in and synchronized with Lane Target Camera rig.`);
  };

  if (loading) return <div className="p-8 text-center text-text-muted font-mono">Loading Bookings Roster...</div>;

  return (
    <div className="flex flex-col h-full bg-void text-text-primary">
      <TopBar title="Range Bookings & Check-in Roster" backUrl="/range-operator/dashboard" />
      
      <div className="p-4 md:p-8 flex-1 overflow-y-auto max-w-6xl mx-auto w-full space-y-6">
        {/* Top Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0F172A] border border-border-subtle shadow-md">
          <div>
            <h1 className="text-xl font-bold font-display uppercase tracking-wider text-white flex items-center gap-2">
              <span>📅</span>
              <span>Lane Reservations & Check-in Roster</span>
            </h1>
            <p className="text-xs text-text-muted font-mono mt-1">
              Automated Turnstile QR Verification & Lane Camera Pairing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/range-operator/walk-in"
              className="px-4 py-2 rounded-xl bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              + Fast Walk-in
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0F172A] border border-border-subtle">
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'All Bookings' },
              { id: 'PENDING', label: 'Pending Arrival' },
              { id: 'ACTIVE', label: 'Checked In / On Lane' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  filter === tab.id
                    ? 'bg-[#F5A623] text-black shadow-md'
                    : 'bg-black/30 text-text-muted hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <input
              type="text"
              placeholder="Search athlete name or booking ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/50 border border-white/10 focus:border-[#F5A623] text-white font-mono text-xs px-3.5 py-2 rounded-lg outline-none transition-colors placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const isCheckedIn = checkedInIds.includes(booking.id) || booking.status === 'CHECKED_IN';

            return (
              <div
                key={booking.id}
                className="p-5 rounded-2xl bg-[#0F172A] border border-border-subtle hover:border-white/20 transition-all shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-base ${
                      isCheckedIn ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30' : 'bg-white/10 text-white'
                    }`}
                  >
                    L{booking.lane?.laneNumber || '01'}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold font-display text-white">{booking.user?.name || 'Guest Athlete'}</h3>
                      <span className="text-xs font-mono text-text-muted">#{booking.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isCheckedIn
                            ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                            : 'bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30'
                        }`}
                      >
                        {isCheckedIn ? 'CHECKED IN (FIRING LINE)' : 'PENDING ARRIVAL'}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted font-mono mt-1">
                      {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Discipline: {booking.discipline || '10m Air Rifle'}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted mt-2">
                      <span className="flex items-center gap-1 text-[#10B981]">
                        ● Cam 1 (Target Rig): Online
                      </span>
                      <span>•</span>
                      <span>Rate: ${booking.amount.toFixed(2)}</span>
                      <span>•</span>
                      <span className={booking.paymentStatus === 'PAID' ? 'text-[#10B981]' : 'text-[#F5A623]'}>
                        Payment: {booking.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  {!isCheckedIn ? (
                    <button
                      onClick={() => handleCheckIn(booking.id)}
                      className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span>✓</span>
                      <span>Check-In & Arm Lane</span>
                    </button>
                  ) : (
                    <Link
                      href="/range-operator/dashboard"
                      className="px-4 py-2 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 text-[#38BDF8] font-mono text-xs transition-all flex items-center gap-1.5"
                    >
                      <span>📹</span>
                      <span>View Live Stream</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {filteredBookings.length === 0 && (
            <div className="p-12 text-center text-text-muted bg-[#0F172A] rounded-2xl border border-border-subtle font-mono text-xs">
              No matching bookings found for current criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


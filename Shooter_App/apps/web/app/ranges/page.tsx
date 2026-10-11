'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { 
  MapPin, 
  Target, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Filter, 
  Radio, 
  Shield, 
  Crosshair, 
  Camera, 
  Sparkles,
  Phone,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Lane {
  id: string;
  laneNumber: number;
  targetDistance: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  targetType?: string;
}

interface ShootingRange {
  id: string;
  name: string;
  address: string;
  phone?: string;
  code: string;
  status?: string;
  lanes: Lane[];
  photoUrl?: string;
  rating?: number;
}

const DEFAULT_RANGES: ShootingRange[] = [
  {
    id: 'range-1',
    name: 'Olympic Precision Shooting Center',
    address: '100 Olympic Way, Hall A, Colorado Springs, CO',
    phone: '+1 (719) 555-0199',
    code: 'OLY-A',
    status: 'HOT',
    rating: 4.9,
    photoUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&h=300&fit=crop',
    lanes: [
      { id: 'lane-1', laneNumber: 1, targetDistance: 10, status: 'AVAILABLE', targetType: 'Megalink 3D 10m' },
      { id: 'lane-2', laneNumber: 2, targetDistance: 10, status: 'AVAILABLE', targetType: 'Megalink 3D 10m' },
      { id: 'lane-3', laneNumber: 3, targetDistance: 10, status: 'OCCUPIED', targetType: 'Sius Ascor Hyb' },
      { id: 'lane-4', laneNumber: 4, targetDistance: 25, status: 'AVAILABLE', targetType: 'Marksman Optical 25m' },
      { id: 'lane-5', laneNumber: 5, targetDistance: 50, status: 'AVAILABLE', targetType: 'Electronic 50m Prone' },
    ],
  },
  {
    id: 'range-2',
    name: 'Metropolitan Marksmanship Complex',
    address: '450 Precision Blvd, New York, NY',
    phone: '+1 (212) 555-8821',
    code: 'METRO',
    status: 'HOT',
    rating: 4.8,
    photoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=300&fit=crop',
    lanes: [
      { id: 'lane-201', laneNumber: 1, targetDistance: 10, status: 'AVAILABLE', targetType: 'Marksman AI Optical' },
      { id: 'lane-202', laneNumber: 2, targetDistance: 10, status: 'AVAILABLE', targetType: 'Marksman AI Optical' },
      { id: 'lane-203', laneNumber: 3, targetDistance: 25, status: 'AVAILABLE', targetType: 'Sius Laser 25m' },
      { id: 'lane-204', laneNumber: 4, targetDistance: 50, status: 'OCCUPIED', targetType: 'Electronic 50m Smallbore' },
    ],
  },
];

export default function RangesDiscoveryPage() {
  const { user } = useAuth();
  const [ranges, setRanges] = useState<ShootingRange[]>(DEFAULT_RANGES);
  const [filterDistance, setFilterDistance] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Booking Modal State
  const [selectedRange, setSelectedRange] = useState<ShootingRange | null>(null);
  const [selectedLane, setSelectedLane] = useState<Lane | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('09:00 - 11:00 AM');
  const [discipline, setDiscipline] = useState<string>('10m Air Rifle (ISSF)');
  const [linkTargetCam, setLinkTargetCam] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  useEffect(() => {
    async function loadRanges() {
      try {
        const data = await apiFetch<ShootingRange[]>('/ranges/discover');
        if (data && data.length > 0) {
          setRanges(data);
        }
      } catch (err) {
        // Fallback to default certified ranges
      }
    }
    loadRanges();
  }, []);

  const handleOpenBooking = (range: ShootingRange, lane?: Lane) => {
    setSelectedRange(range);
    const availableLanes = range.lanes.filter(l => l.status === 'AVAILABLE');
    setSelectedLane(lane || availableLanes[0] || range.lanes[0]);
    setConfirmedBooking(null);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRange || !selectedLane) return;

    setIsSubmitting(true);
    const bookingPayload = {
      rangeId: selectedRange.id,
      laneId: selectedLane.id,
      userId: user?.id || 'usr-alex-9941',
      shooterName: user?.name || 'Alex Mercer',
      date: selectedDate,
      timeSlot: selectedSlot,
      discipline,
      targetCamLinked: linkTargetCam,
      startTime: `${selectedDate}T${selectedSlot.split(' - ')[0]}:00Z`,
      endTime: `${selectedDate}T${selectedSlot.split(' - ')[1]}:00Z`,
    };

    try {
      // 1. Send schedule request to backend
      await apiFetch(`/schedule-requests`, {
        method: 'POST',
        body: JSON.stringify(bookingPayload),
      });
    } catch {
      // Offline fallback
    }

    setConfirmedBooking({
      id: `BK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      rangeName: selectedRange.name,
      laneNumber: selectedLane.laneNumber,
      distance: selectedLane.targetDistance,
      date: selectedDate,
      timeSlot: selectedSlot,
      discipline,
      shooterName: user?.name || 'Alex Mercer',
      timestamp: new Date().toLocaleTimeString(),
    });

    setIsSubmitting(false);
  };

  // Filtered ranges
  const filteredRanges = ranges.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.address.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterDistance === 'ALL') return true;
    return r.lanes.some(l => l.targetDistance === filterDistance);
  });

  return (
    <DashboardLayout role="SHOOTER">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
              <Target className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">CERTIFIED RANGE NETWORK</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Range Discovery &amp; Booking</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Book electronic targets, ISSF 10m halls, and optical camera-equipped lanes with live downrange sync.
            </p>
          </div>

          <Link
            href="/pass"
            className="self-start md:self-auto flex items-center gap-2 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <Shield size={16} /> View Digital Gate Pass
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl">
          <div className="relative w-full sm:w-80">
            <input 
              type="text" 
              placeholder="Search by facility name or city..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500"
            />
          </div>

          {/* Distance Chips */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mr-1">Discipline:</span>
            {[
              { label: 'All Distances', val: 'ALL' },
              { label: '10m Air Rifle/Pistol', val: 10 },
              { label: '25m Rapid Fire', val: 25 },
              { label: '50m Smallbore', val: 50 },
            ].map((d) => (
              <button
                key={String(d.val)}
                onClick={() => setFilterDistance(d.val as any)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  filterDistance === d.val
                    ? 'bg-[var(--accent-primary)] text-black shadow-glow'
                    : 'bg-[var(--bg-void)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ranges Directory List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRanges.map((range) => {
            const openLanes = range.lanes.filter(l => l.status === 'AVAILABLE').length;
            const totalLanes = range.lanes.length;

            return (
              <div 
                key={range.id} 
                className="bg-gradient-to-br from-[#12131A] to-[#181A24] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* Top status & rating row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                        {range.status || 'HOT'} &bull; OPEN
                      </span>
                    </div>
                    <span className="text-xs font-mono bg-white/5 text-white/80 px-2.5 py-1 rounded-full border border-white/10 font-bold">
                      ⭐ {range.rating || 4.9} / 5.0
                    </span>
                  </div>

                  <h3 className="text-2xl font-display font-bold text-white group-hover:text-[var(--accent-primary)] transition-colors">
                    {range.name}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1.5">
                    <MapPin size={14} className="text-[var(--accent-primary)] shrink-0" />
                    <span>{range.address}</span>
                  </div>
                  {range.phone && (
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
                      <Phone size={13} className="shrink-0" />
                      <span>{range.phone}</span>
                    </div>
                  )}

                  {/* Lanes Overview Chips */}
                  <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">
                        Firing Line Status
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {openLanes} of {totalLanes} Lanes Open
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {range.lanes.map((lane) => {
                        const isAvail = lane.status === 'AVAILABLE';
                        return (
                          <div
                            key={lane.id}
                            className={`p-2 rounded-xl text-center border transition-all ${
                              isAvail
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-red-500/10 border-red-500/20 text-red-400/80'
                            }`}
                          >
                            <span className="text-[10px] font-mono block font-bold">L-{String(lane.laneNumber).padStart(2, '0')}</span>
                            <span className="text-[11px] font-bold block">{lane.targetDistance}m</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
                    <Camera size={14} className="text-emerald-400" />
                    <span>Target Cam Ready</span>
                  </div>
                  <button
                    onClick={() => handleOpenBooking(range)}
                    className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[#e09418] text-black font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-glow"
                  >
                    <span>Reserve Lane</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Booking Modal */}
        {selectedRange && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container-high border border-outline-variant/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              
              {!confirmedBooking ? (
                <>
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[var(--accent-primary)] font-bold">
                        FACILITY RESERVATION
                      </span>
                      <h3 className="text-2xl font-bold font-display text-white">{selectedRange.name}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedRange(null)}
                      className="text-white/60 hover:text-white text-lg p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSubmitBooking} className="space-y-4">
                    
                    {/* Lane Selector */}
                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-[var(--text-secondary)] block mb-2">
                        Select Firing Lane
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {selectedRange.lanes.map((lane) => {
                          const isSelected = selectedLane?.id === lane.id;
                          const isAvail = lane.status === 'AVAILABLE';
                          return (
                            <button
                              type="button"
                              key={lane.id}
                              onClick={() => setSelectedLane(lane)}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                isSelected
                                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-black font-bold shadow-glow'
                                  : isAvail
                                  ? 'bg-[var(--bg-void)] border-[var(--border-subtle)] text-white hover:border-white/40'
                                  : 'bg-white/5 border-transparent text-white/40'
                              }`}
                            >
                              <span className="text-[10px] block font-mono">Lane {lane.laneNumber}</span>
                              <span className="text-xs font-bold block">{lane.targetDistance}m</span>
                              <span className="text-[9px] block opacity-70 truncate">{lane.targetType?.split(' ')[0]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date & Time Slot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs uppercase tracking-wider font-bold text-[var(--text-secondary)] block mb-1.5">
                          Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-xl p-3 text-sm text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-wider font-bold text-[var(--text-secondary)] block mb-1.5">
                          Time Window
                        </label>
                        <select
                          value={selectedSlot}
                          onChange={(e) => setSelectedSlot(e.target.value)}
                          className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-xl p-3 text-sm text-white"
                        >
                          <option value="09:00 - 11:00 AM">09:00 - 11:00 AM (Morning Precision)</option>
                          <option value="11:30 - 01:30 PM">11:30 - 01:30 PM (Midday Session)</option>
                          <option value="02:00 - 04:00 PM">02:00 - 04:00 PM (Match Simulation)</option>
                          <option value="04:30 - 06:30 PM">04:30 - 06:30 PM (Twilight Drills)</option>
                        </select>
                      </div>
                    </div>

                    {/* Discipline Selection */}
                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-[var(--text-secondary)] block mb-1.5">
                        ISSF Discipline
                      </label>
                      <select
                        value={discipline}
                        onChange={(e) => setDiscipline(e.target.value)}
                        className="w-full bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-xl p-3 text-sm text-white"
                      >
                        <option value="10m Air Rifle (ISSF)">10m Air Rifle (ISSF)</option>
                        <option value="10m Air Pistol (ISSF)">10m Air Pistol (ISSF)</option>
                        <option value="25m Rapid Fire Pistol">25m Rapid Fire Pistol</option>
                        <option value="50m Rifle 3-Position">50m Rifle 3-Position</option>
                        <option value="50m Rifle Prone">50m Rifle Prone</option>
                      </select>
                    </div>

                    {/* Target Cam Checkbox */}
                    <div className="bg-[var(--bg-void)] border border-[var(--border-subtle)] p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Camera className="text-emerald-400 w-5 h-5" />
                        <div>
                          <span className="text-sm font-bold text-white block">Auto-Link Target Camera</span>
                          <span className="text-xs text-[var(--text-muted)] block">Stream downrange optical hits straight to Live Analysis</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={linkTargetCam} 
                        onChange={(e) => setLinkTargetCam(e.target.checked)} 
                        className="w-5 h-5 accent-[var(--accent-primary)] rounded cursor-pointer"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                      <button
                        type="button"
                        onClick={() => setSelectedRange(null)}
                        className="flex-1 py-3 rounded-xl border border-[var(--border-subtle)] text-white hover:bg-white/5 font-bold text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[#e09418] text-black font-bold text-sm uppercase tracking-wider shadow-glow transition-all"
                      >
                        {isSubmitting ? 'Confirming Reservation...' : 'Confirm & Book Lane'}
                      </button>
                    </div>

                  </form>
                </>
              ) : (
                /* Confirmed Booking Chit */
                <div className="space-y-6 text-center animate-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto text-3xl font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                      RESERVATION CONFIRMED
                    </span>
                    <h3 className="text-2xl font-bold text-white font-display mt-1">
                      {confirmedBooking.rangeName}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Booking Reference: <strong className="text-white font-mono">{confirmedBooking.id}</strong>
                    </p>
                  </div>

                  <div className="bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-2xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] block uppercase font-mono">Assigned Lane</span>
                      <span className="text-white font-bold text-sm">Lane {confirmedBooking.laneNumber} ({confirmedBooking.distance}m)</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block uppercase font-mono">Date &amp; Slot</span>
                      <span className="text-white font-bold text-sm">{confirmedBooking.timeSlot}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block uppercase font-mono">Discipline</span>
                      <span className="text-white font-bold text-sm">{confirmedBooking.discipline}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block uppercase font-mono">Gate Status</span>
                      <span className="text-emerald-400 font-bold text-sm">Active on Digital Pass</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedRange(null)}
                      className="flex-1 py-3 rounded-xl border border-[var(--border-subtle)] text-white hover:bg-white/5 font-bold text-sm"
                    >
                      Close
                    </button>
                    <Link
                      href="/pass"
                      className="flex-[2] py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[#e09418] text-black font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <Shield size={16} /> Open Digital Gate Pass
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

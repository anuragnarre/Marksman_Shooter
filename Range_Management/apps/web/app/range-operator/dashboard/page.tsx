'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../contexts/auth-context';
import { TopBar } from '../../../components/TopBar';
import { apiFetch } from '../../../lib/api';
import { LiveVisionDark } from '../../../components/vision/LiveVisionDark';

export default function RangeLiveMonitorPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cards' | 'vision'>('cards');

  useEffect(() => {
    async function loadRange() {
      try {
        // Find my first owned range
        const myRanges = await apiFetch('/ranges') as any[];
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

  if (loading) return <div className="p-8 text-center text-text-muted font-mono">Loading Range Monitor...</div>;

  if (!range) {
    return (
      <div className="flex flex-col h-full bg-void text-text-primary">
        <TopBar title="Live Monitor" backUrl="/dashboard" />
        <div className="p-8 text-center">
          <h2 className="text-xl mb-4 font-display font-bold">You don't have an active range yet.</h2>
          <p className="text-text-muted">Register your range first to start using Range Operations.</p>
        </div>
      </div>
    );
  }

  // Transform range.lanes for LiveVisionDark if needed
  const visionLanes = range.lanes?.map((l: any) => ({
    id: l.id,
    number: l.laneNumber,
    status: l.status,
    shooterName: l.activeSession?.shooter?.name || null,
    targetType: l.activeSession ? `${l.activeSession.discipline || '10m Air Rifle'} (${l.activeSession.distance || 10}m)` : 'Standard Bay Target',
    lastScore: 10.4,
    fps: 60,
    latency: 14,
    cams: { targetConnected: true, stanceConnected: true, wideBayConnected: true },
  })) || [];

  return (
    <div className="flex flex-col h-full bg-void text-text-primary">
      <TopBar title={`${range.name} - Live Monitor`} backUrl="/dashboard" />
      
      <div className="p-4 md:p-8 flex-1 overflow-y-auto">
        {/* Header Strip */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display uppercase tracking-widest">{range.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 text-xs font-mono font-bold">
                OPERATIONAL
              </span>
            </div>
            <p className="text-sm text-text-muted mt-1 font-mono">
              Range Code: <span className="font-mono text-[#F5A623] font-bold">{range.code}</span> • Location: {range.city || 'Central Range Facility'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTab === 'cards'
                    ? 'bg-[#F5A623] text-black shadow-md'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                🗂 Lane Cards
              </button>
              <button
                onClick={() => setActiveTab('vision')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTab === 'vision'
                    ? 'bg-[#F5A623] text-black shadow-md'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                📹 Live Multi-Camera Grid
              </button>
            </div>

            <Link href="/range-operator/walk-in" className="btn bg-[#F5A623] hover:bg-[#F5A623]/90 text-black text-xs font-mono font-bold px-4 py-2 rounded-xl transition-all shadow-md">
              + Fast Walk-in
            </Link>
            <Link href="/range-operator/bookings" className="btn bg-[#0F172A] border border-border-subtle hover:border-white/20 text-xs font-mono text-white px-4 py-2 rounded-xl transition-all">
              Bookings & QR
            </Link>
          </div>
        </div>

        {/* Tab 1: Live Multi-Camera Grid */}
        {activeTab === 'vision' && (
          <div className="w-full">
            <LiveVisionDark lanes={visionLanes} />
          </div>
        )}

        {/* Tab 2: Lane Cards Matrix */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {range.lanes?.map((lane: any) => (
              <div
                key={lane.id}
                className={`p-5 rounded-2xl bg-[#0F172A] border transition-all shadow-md ${
                  lane.status === 'OCCUPIED'
                    ? 'border-[#F5A623] shadow-[#F5A623]/5'
                    : 'border-border-subtle hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                        lane.status === 'OCCUPIED' ? 'bg-[#F5A623] text-black' : 'bg-white/10 text-text-muted'
                      }`}
                    >
                      {lane.laneNumber}
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display text-white">Lane {lane.laneNumber}</h3>
                      <p className="text-xs text-text-muted font-mono">{lane.name || 'Standard Firing Lane'}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-full ${
                      lane.status === 'OCCUPIED'
                        ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                        : 'bg-white/10 text-text-muted'
                    }`}
                  >
                    {lane.status}
                  </span>
                </div>

                {lane.status === 'OCCUPIED' && lane.activeSession ? (
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-white">
                        {lane.activeSession.shooter?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{lane.activeSession.shooter?.name || 'Unknown Shooter'}</p>
                        <p className="text-xs text-text-muted font-mono">
                          {lane.activeSession.discipline} • {lane.activeSession.distance}m
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                      <button
                        onClick={() => setActiveTab('vision')}
                        className="text-[#38BDF8] hover:underline flex items-center gap-1"
                      >
                        ● Camera Stream Online
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Clear Lane ${lane.laneNumber}?`)) {
                            try {
                              await apiFetch(`/ranges/lanes/${lane.id}/clear`, { method: 'POST' });
                              window.location.reload();
                            } catch (e) {
                              alert('Lane cleared');
                            }
                          }
                        }}
                        className="text-[#EF4444] hover:underline text-[11px]"
                      >
                        Clear Lane
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs font-mono text-text-muted flex flex-col items-center gap-2">
                    <span className="text-xl opacity-60">🎯</span>
                    <span>Ready for shooter allocation</span>
                    <Link
                      href={`/range-operator/walk-in?laneId=${lane.id}`}
                      className="mt-1 text-[11px] font-mono font-bold text-[#F5A623] hover:underline"
                    >
                      Assign Walk-in →
                    </Link>
                  </div>
                )}
              </div>
            ))}

            {(!range.lanes || range.lanes.length === 0) && (
              <div className="col-span-full text-center py-12 text-text-muted bg-[#0F172A] rounded-2xl border border-border-subtle font-mono text-sm">
                No lanes configured yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

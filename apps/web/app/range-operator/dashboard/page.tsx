'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { TopBar } from '../../../components/TopBar';
import { apiFetch } from '../../../lib/api';

export default function RangeLiveMonitorPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRange() {
      try {
        // Find my first owned range
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

  if (loading) return <div className="p-8 text-center text-text-muted">Loading Range Monitor...</div>;

  if (!range) {
    return (
      <div className="flex flex-col h-full bg-void text-text-primary">
        <TopBar title="Live Monitor" backUrl="/dashboard" />
        <div className="p-8 text-center">
          <h2 className="text-xl mb-4">You don't have an active range yet.</h2>
          <p className="text-text-muted">Register your range first to start using Range Operations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-void text-text-primary">
      <TopBar title={`${range.name} - Live Monitor`} backUrl="/dashboard" />
      
      <div className="p-4 md:p-8 flex-1 overflow-y-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-display uppercase tracking-widest">{range.name}</h1>
            <p className="text-sm text-text-muted">Range Code: <span className="font-mono text-primary font-bold">{range.code}</span></p>
          </div>
          <div className="flex gap-2">
            <a href="/range-operator/walk-in" className="btn bg-primary text-black text-sm px-4 py-2">Fast Walk-in</a>
            <a href="/range-operator/bookings" className="btn bg-surface border border-border-subtle text-sm px-4 py-2">Bookings</a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {range.lanes?.map((lane: any) => (
            <div key={lane.id} className={`panel border ${lane.status === 'OCCUPIED' ? 'border-primary' : 'border-border-subtle'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">Lane {lane.laneNumber}</h3>
                  <p className="text-xs text-text-muted">{lane.name || 'Standard Lane'}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded ${
                  lane.status === 'OCCUPIED' ? 'bg-primary/20 text-primary' : 'bg-surface-elevated text-text-muted'
                }`}>
                  {lane.status}
                </span>
              </div>

              {lane.status === 'OCCUPIED' && lane.activeSession ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center">
                      {lane.activeSession.shooter?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{lane.activeSession.shooter?.name || 'Unknown Shooter'}</p>
                      <p className="text-xs text-text-muted">
                        {lane.activeSession.discipline} • {lane.activeSession.distance}m
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border-subtle flex justify-between">
                    <span className="text-xs text-text-muted">Camera: {lane.device ? 'Connected' : 'Offline'}</span>
                    <button className="text-xs text-danger hover:underline">Clear Lane</button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-text-muted">
                  Ready for shooter
                </div>
              )}
            </div>
          ))}
          {(!range.lanes || range.lanes.length === 0) && (
            <div className="col-span-full text-center py-12 text-text-muted panel">
              No lanes configured yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

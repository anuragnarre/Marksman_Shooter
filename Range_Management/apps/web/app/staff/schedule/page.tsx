"use client";

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { GlassCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, User, CheckCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api';

export default function StaffSchedulePage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [rangeId, setRangeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const ranges = await apiFetch('/ranges') as any[];
      if (ranges && ranges.length > 0) {
        const id = ranges[0].id;
        setRangeId(id);
        const fetchedShifts = await apiFetch<any[]>(`/range-operations/${id}/staff/shifts`);
        setShifts(fetchedShifts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCount = shifts.filter(s => s.status === 'ACTIVE').length;
  const scheduledCount = shifts.filter(s => s.status === 'SCHEDULED' && new Date(s.startTime).toDateString() === new Date().toDateString()).length;

  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="p-6 space-y-6 max-w-7xl mx-auto h-full overflow-y-auto">
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Staff Rostering</h1>
            <p className="text-zinc-400">Manage Range Safety Officers and staff schedules.</p>
          </div>
          <Button className="bg-[var(--accent-primary)] hover:bg-[#c98e21] text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Assign Shift
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
          <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">{scheduledCount}</h3>
            <p className="text-sm text-zinc-400 uppercase tracking-wider">Scheduled Today</p>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">{activeCount}</h3>
            <p className="text-sm text-zinc-400 uppercase tracking-wider">Clocked In</p>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-4xl font-bold text-white mb-1">1:4</h3>
            <p className="text-sm text-zinc-400 uppercase tracking-wider">Current RSO Ratio</p>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-zinc-400" />
              Today's Shifts
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 text-sm">
                  <th className="pb-3 font-medium">Staff Member</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                   <tr>
                     <td colSpan={5} className="py-8 text-center text-zinc-500">Loading shifts...</td>
                   </tr>
                ) : shifts.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="py-8 text-center text-zinc-500">No shifts scheduled.</td>
                   </tr>
                ) : shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 text-xs">
                        {shift.user?.name ? shift.user.name.charAt(0) : '?'}
                      </div>
                      {shift.user?.name || "Unknown"}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-zinc-900/50 border border-white/10 rounded-md text-xs font-semibold text-zinc-300">
                        {shift.role}
                      </span>
                    </td>
                    <td className="py-4 text-zinc-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      {format(new Date(shift.startTime), 'h:mm a')} - {format(new Date(shift.endTime), 'h:mm a')}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                        shift.status === 'ACTIVE' 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}>
                        {shift.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {shift.status === 'SCHEDULED' ? (
                        <Button size="sm" variant="outline" className="border-emerald-500/50 hover:bg-emerald-500/20 text-[var(--emerald-signal)] hover:text-emerald-300">
                          Clock In
                        </Button>
                      ) : shift.status === 'ACTIVE' ? (
                        <Button size="sm" variant="outline" className="border-red-500/50 hover:bg-red-500/20 text-[var(--signal-red)] hover:text-red-300">
                          Clock Out
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}

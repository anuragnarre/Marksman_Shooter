"use client";

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { GlassCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, User, CheckCircle, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/contexts/toast-context';

function buildSeedShifts() {
  const base = new Date();
  const makeDate = (h: number) => {
    const d = new Date(base);
    d.setHours(h, 0, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: 'shift-1',
      user: { name: 'Sgt. Miller' },
      role: 'LEAD_RSO',
      startTime: makeDate(8),
      endTime: makeDate(16),
      status: 'ACTIVE',
    },
    {
      id: 'shift-2',
      user: { name: 'Claire Vance' },
      role: 'FRONT_DESK',
      startTime: makeDate(9),
      endTime: makeDate(17),
      status: 'SCHEDULED',
    },
    {
      id: 'shift-3',
      user: { name: 'Marcus Reed' },
      role: 'RSO',
      startTime: makeDate(12),
      endTime: makeDate(20),
      status: 'SCHEDULED',
    },
  ];
}

export default function StaffSchedulePage() {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<any[]>(buildSeedShifts);
  const [rangeId, setRangeId] = useState<string>('range-demo-1');
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('RSO');
  const [newStartHour, setNewStartHour] = useState('10:00');
  const [newEndHour, setNewEndHour] = useState('18:00');

  const loadData = async () => {
    try {
      const ranges = await apiFetch('/ranges') as any[];
      if (ranges && ranges.length > 0) {
        const id = ranges[0].id;
        setRangeId(id);
        const fetchedShifts = await apiFetch<any[]>(`/range-operations/${id}/staff/shifts`);
        if (Array.isArray(fetchedShifts) && fetchedShifts.length > 0) {
          setShifts(fetchedShifts);
        }
      }
    } catch {
      // Seed shifts stay populated offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClockAction = async (shift: any, nextStatus: 'ACTIVE' | 'COMPLETED') => {
    setShifts((prev) => prev.map((s) => (s.id === shift.id ? { ...s, status: nextStatus } : s)));
    try {
      await apiFetch(`/range-operations/${rangeId}/staff/shifts/${shift.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // Offline optimistic state update
    }
    toast(
      `${shift.user?.name || 'Staff member'} ${nextStatus === 'ACTIVE' ? 'clocked in' : 'clocked out'}`,
      'success'
    );
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newStaffName.trim();
    if (!cleaned) {
      toast('Enter staff member name', 'warning');
      return;
    }
    const [sh, sm] = newStartHour.split(':').map(Number);
    const [eh, em] = newEndHour.split(':').map(Number);
    const start = new Date();
    start.setHours(sh || 10, sm || 0, 0, 0);
    const end = new Date();
    end.setHours(eh || 18, em || 0, 0, 0);

    const created = {
      id: `shift-${Date.now()}`,
      user: { name: cleaned },
      role: newStaffRole,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: 'SCHEDULED',
    };

    try {
      await apiFetch(`/range-operations/${rangeId}/staff/shifts`, {
        method: 'POST',
        body: JSON.stringify(created),
      });
    } catch {
      // Offline fallback append
    }

    setShifts((prev) => [created, ...prev]);
    setNewStaffName('');
    setAssignModalOpen(false);
    toast(`Assigned ${newStaffRole} shift for ${cleaned}`, 'success');
  };

  const activeCount = shifts.filter((s) => s.status === 'ACTIVE').length;
  const scheduledCount = shifts.filter(
    (s) => s.status === 'SCHEDULED' && new Date(s.startTime).toDateString() === new Date().toDateString()
  ).length;

  return (
    <DashboardLayout role="RANGE_ADMIN" showBack pageTitle="Staff Rostering">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-start sm:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface mb-1">Staff Rostering</h1>
            <p className="text-sm text-on-surface-variant">Manage Range Safety Officers and staff schedules.</p>
          </div>
          <Button
            onClick={() => setAssignModalOpen(true)}
            className="bg-[var(--accent-primary)] hover:bg-[#c98e21] text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Assign Shift
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 shrink-0">
          <GlassCard className="p-5 sm:p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-on-surface mb-1">{scheduledCount}</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant uppercase tracking-wider">Scheduled Today</p>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-on-surface mb-1">{activeCount}</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant uppercase tracking-wider">Clocked In</p>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-on-surface mb-1">1:4</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant uppercase tracking-wider">Current RSO Ratio</p>
          </GlassCard>
        </div>

        <GlassCard className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Shifts
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[540px]">
              <thead>
                <tr className="border-b border-outline-variant/20 text-on-surface-variant text-xs sm:text-sm">
                  <th className="pb-3 font-medium">Staff Member</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading && shifts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant">Loading shifts...</td>
                  </tr>
                ) : shifts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant">No shifts scheduled.</td>
                  </tr>
                ) : (
                  shifts.map((shift) => (
                    <tr key={shift.id} className="border-b border-outline-variant/10 hover:bg-white/5 transition-colors">
                      <td className="py-4 font-medium text-on-surface flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/30 text-xs font-bold">
                          {shift.user?.name ? shift.user.name.charAt(0) : '?'}
                        </div>
                        {shift.user?.name || 'Unknown'}
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-surface-container-high border border-outline-variant/20 rounded-md text-xs font-semibold text-on-surface-variant">
                          {shift.role}
                        </span>
                      </td>
                      <td className="py-4 text-on-surface-variant whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {format(new Date(shift.startTime), 'h:mm a')} - {format(new Date(shift.endTime), 'h:mm a')}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                            shift.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : shift.status === 'COMPLETED'
                              ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {shift.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {shift.status === 'SCHEDULED' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClockAction(shift, 'ACTIVE')}
                            className="border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-400"
                          >
                            Clock In
                          </Button>
                        ) : shift.status === 'ACTIVE' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClockAction(shift, 'COMPLETED')}
                            className="border-red-500/50 hover:bg-red-500/20 text-red-400"
                          >
                            Clock Out
                          </Button>
                        ) : (
                          <span className="text-xs font-mono text-on-surface-variant">Done</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Assign Shift Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAssignModalOpen(false)}>
          <form
            onSubmit={handleCreateShift}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-surface-container-high border border-outline-variant/40 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-lg font-display font-bold text-on-surface uppercase tracking-wide">Assign New Shift</h3>
              <button type="button" onClick={() => setAssignModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Staff Member Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Jordan Reyes"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="w-full rounded-xl bg-surface-container border border-outline-variant/40 px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Assigned Role</label>
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="w-full rounded-xl bg-surface-container border border-outline-variant/40 px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              >
                <option value="RSO">RSO (Range Safety Officer)</option>
                <option value="LEAD_RSO">LEAD_RSO</option>
                <option value="FRONT_DESK">FRONT_DESK</option>
                <option value="COACH">COACH</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={newStartHour}
                  onChange={(e) => setNewStartHour(e.target.value)}
                  className="w-full rounded-xl bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">End Time</label>
                <input
                  type="time"
                  value={newEndHour}
                  onChange={(e) => setNewEndHour(e.target.value)}
                  className="w-full rounded-xl bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[var(--accent-primary)] text-black font-bold">
                Assign Shift
              </Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}

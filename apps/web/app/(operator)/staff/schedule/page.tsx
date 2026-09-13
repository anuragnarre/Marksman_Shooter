'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function StaffSchedulePage() {
  const [shifts, setShifts] = useState([
    {
      id: '1',
      staffName: 'John Doe',
      role: 'RSO',
      startTime: new Date(new Date().setHours(8, 0, 0, 0)),
      endTime: new Date(new Date().setHours(16, 0, 0, 0)),
      status: 'ACTIVE',
      clockIn: new Date(new Date().setHours(7, 55, 0, 0)),
    },
    {
      id: '2',
      staffName: 'Jane Smith',
      role: 'FRONT_DESK',
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(17, 0, 0, 0)),
      status: 'SCHEDULED',
    },
    {
      id: '3',
      staffName: 'Mike Johnson',
      role: 'MANAGER',
      startTime: new Date(new Date().setHours(12, 0, 0, 0)),
      endTime: new Date(new Date().setHours(20, 0, 0, 0)),
      status: 'SCHEDULED',
    }
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Staff Rostering</h1>
          <p className="text-zinc-400">Manage Range Safety Officers and staff schedules.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Assign Shift
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
            <User className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-4xl font-bold text-white mb-1">3</h3>
          <p className="text-sm text-zinc-400 uppercase tracking-wider">Scheduled Today</p>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-4xl font-bold text-white mb-1">1</h3>
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
              {shifts.map((shift) => (
                <tr key={shift.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                      {shift.staffName.charAt(0)}
                    </div>
                    {shift.staffName}
                  </td>
                  <td className="py-4">
                    <Badge variant="outline" className="bg-zinc-900/50">
                      {shift.role}
                    </Badge>
                  </td>
                  <td className="py-4 text-zinc-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    {format(shift.startTime, 'h:mm a')} - {format(shift.endTime, 'h:mm a')}
                  </td>
                  <td className="py-4">
                    <Badge 
                      variant={shift.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={
                        shift.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-300'
                      }
                    >
                      {shift.status}
                    </Badge>
                  </td>
                  <td className="py-4 text-right">
                    {shift.status === 'SCHEDULED' ? (
                      <Button size="sm" variant="outline" className="border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-300">
                        Clock In
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="border-red-500/50 hover:bg-red-500/20 hover:text-red-300">
                        Clock Out
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

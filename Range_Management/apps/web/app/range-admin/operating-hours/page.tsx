'use client';
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { GlassCard } from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";
import { Clock, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function OperatingHoursManager() {
  const [rangeId, setRangeId] = useState<string | null>(null);
  const [hours, setHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const ranges = await apiFetch('/ranges') as any[];
        if (ranges && ranges.length > 0) {
          const rId = ranges[0].id;
          setRangeId(rId);
          // fetch current hours or mock
          const defaultHours = DAYS.map((day, i) => ({
            dayOfWeek: i + 1,
            openTime: '09:00',
            closeTime: '20:00',
            isClosed: false
          }));
          setHours(defaultHours);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!rangeId) return;
    try {
      await apiFetch(`/ranges/${rangeId}/operating-hours`, {
        method: 'POST',
        body: JSON.stringify({ hours })
      });
      alert('Operating hours updated successfully!');
    } catch (e) {
      alert('Failed to update hours');
    }
  };

  const updateDay = (dayIdx: number, field: string, val: any) => {
    const newHours = [...hours];
    newHours[dayIdx] = { ...newHours[dayIdx], [field]: val };
    setHours(newHours);
  };

  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display text-white">Operating Hours</h1>
            <p className="text-[var(--text-secondary)]">Manage the standard open and close times for the facility.</p>
          </div>
          <Button onClick={handleSave} className="bg-[var(--accent-primary)] text-black gap-2 hover:bg-[var(--accent-hover)] font-bold">
            <Save size={18} /> Save Changes
          </Button>
        </div>

        <GlassCard className="p-8 border-t-2 border-t-[var(--accent-primary)]">
          <div className="space-y-6">
            {hours.map((day, idx) => (
              <div key={idx} className="flex items-center gap-6 p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)]">
                <div className="w-32 flex items-center gap-3">
                  <Clock size={20} className={day.isClosed ? "text-[var(--text-muted)]" : "text-[var(--accent-primary)]"} />
                  <span className={`font-bold ${day.isClosed ? 'text-[var(--text-muted)]' : 'text-white'}`}>
                    {DAYS[day.dayOfWeek - 1]}
                  </span>
                </div>

                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                  <input type="checkbox" checked={day.isClosed} onChange={(e) => updateDay(idx, 'isClosed', e.target.checked)} className="accent-[var(--signal-red)]" />
                  Closed
                </label>

                {!day.isClosed && (
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">Open</span>
                      <input 
                        type="time" 
                        value={day.openTime} 
                        onChange={(e) => updateDay(idx, 'openTime', e.target.value)}
                        className="bg-black/50 border border-[var(--border-subtle)] p-2 rounded-lg text-white" 
                      />
                    </div>
                    <span className="text-[var(--text-muted)]">-</span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">Close</span>
                      <input 
                        type="time" 
                        value={day.closeTime} 
                        onChange={(e) => updateDay(idx, 'closeTime', e.target.value)}
                        className="bg-black/50 border border-[var(--border-subtle)] p-2 rounded-lg text-white" 
                      />
                    </div>
                  </div>
                )}
                {day.isClosed && (
                  <div className="flex-1 text-center py-2 text-[var(--text-muted)] italic">Facility closed on this day</div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="flex gap-4 p-4 rounded-xl bg-[var(--data-blue)]/10 border border-[var(--data-blue)]/20 text-[var(--data-blue)]">
          <AlertCircle size={24} className="shrink-0" />
          <p className="text-sm">These hours determine the default availability for booking blocks. Overrides for holidays must be created separately in the Exceptions manager.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

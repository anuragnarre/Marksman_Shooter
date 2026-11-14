'use client';
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { GlassCard } from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";
import { Clock, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/toast-context";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function buildDefaultHours() {
  return DAYS.map((_, i) => ({
    dayOfWeek: i + 1,
    openTime: i === 6 ? "10:00" : "09:00",
    closeTime: i === 6 ? "18:00" : "20:00",
    isClosed: false,
  }));
}

export default function OperatingHoursManager() {
  const { toast } = useToast();
  const [rangeId, setRangeId] = useState<string>("range-demo-1");
  const [hours, setHours] = useState<any[]>(buildDefaultHours);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("marksman_operating_hours") : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length === 7) setHours(parsed);
        }
        const ranges = await apiFetch("/ranges") as any[];
        if (ranges && ranges.length > 0) {
          setRangeId(ranges[0].id);
        }
      } catch {
        // Offline default hours remain populated
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("marksman_operating_hours", JSON.stringify(hours));
      }
      await apiFetch(`/ranges/${rangeId}/operating-hours`, {
        method: "POST",
        body: JSON.stringify({ hours }),
      });
      toast("Operating hours updated and synced!", "success");
    } catch {
      toast("Operating hours saved locally (offline cache updated)", "info");
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (dayIdx: number, field: string, val: any) => {
    setHours((prev) => prev.map((row, idx) => (idx === dayIdx ? { ...row, [field]: val } : row)));
  };

  return (
    <DashboardLayout role="RANGE_ADMIN" showBack pageTitle="Operating Hours">
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-wrap justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-on-surface">Operating Hours</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manage the standard open and close times for the facility.</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--accent-primary)] text-black gap-2 hover:bg-[var(--accent-hover)] font-bold"
          >
            <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <GlassCard className="p-4 sm:p-8 border-t-2 border-t-[var(--accent-primary)]">
          <div className="space-y-4 sm:space-y-5">
            {hours.map((day, idx) => (
              <div
                key={day.dayOfWeek}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between sm:w-44 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Clock size={18} className={day.isClosed ? "text-[var(--text-muted)]" : "text-[var(--accent-primary)]"} />
                    <span className={`font-bold ${day.isClosed ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
                      {DAYS[day.dayOfWeek - 1]}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-secondary)] cursor-pointer sm:ml-4">
                    <input
                      type="checkbox"
                      checked={day.isClosed}
                      onChange={(e) => updateDay(idx, "isClosed", e.target.checked)}
                      className="accent-[var(--signal-red)] w-4 h-4"
                    />
                    Closed
                  </label>
                </div>

                {!day.isClosed ? (
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Open</span>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => updateDay(idx, "openTime", e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 rounded-lg text-sm text-[var(--text-primary)]"
                      />
                    </div>
                    <span className="text-[var(--text-muted)] pt-4">-</span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Close</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => updateDay(idx, "closeTime", e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2 rounded-lg text-sm text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-center py-2 text-xs sm:text-sm text-[var(--text-muted)] italic">
                    Facility closed on this day
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="flex gap-3 p-4 rounded-xl bg-[var(--data-blue)]/10 border border-[var(--data-blue)]/20 text-[var(--data-blue)]">
          <AlertCircle size={22} className="shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm">
            These hours determine the default availability for booking blocks. Overrides for holidays can be scheduled in the Bookings manager.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

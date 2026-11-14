"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Users, Crosshair, TrendingUp, AlertTriangle, Settings, Calendar, DollarSign, Activity, Clock, X, Radio } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/toast-context";

export default function RangeAdminDashboard() {
  const { toast } = useToast();
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<"INFO" | "WARNING" | "CRITICAL">("WARNING");
  const [alertMessage, setAlertMessage] = useState("Line inspection in 15 minutes. Prepare chamber flags.");
  const [activeBroadcast, setActiveBroadcast] = useState<{ severity: string; message: string } | null>(null);

  const handleBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) return;
    setActiveBroadcast({ severity: alertSeverity, message: alertMessage.trim() });
    setAlertModalOpen(false);
    toast(
      `Facility alert broadcast (${alertSeverity}): ${alertMessage.trim()}`,
      alertSeverity === "CRITICAL" ? "error" : alertSeverity === "WARNING" ? "warning" : "info"
    );
  };

  return (
    <DashboardLayout role="RANGE_ADMIN" showBack pageTitle="Facility Admin">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
        <div className="flex flex-wrap justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-on-surface tracking-tight">Range Admin Dashboard</h1>
            <p className="text-on-surface-variant mt-1 sm:mt-2 text-sm sm:text-lg">Overview of facility operations, revenue, and active shooters.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/settings">
              <Button variant="outline" className="border-outline-variant text-on-surface hover:bg-surface-container-high rounded-xl font-bold">
                <Settings size={18} className="mr-2" /> Settings
              </Button>
            </Link>
            <Button
              onClick={() => setAlertModalOpen(true)}
              className="bg-primary text-on-primary hover:bg-primary/90 shadow-md rounded-xl font-bold"
            >
              <AlertTriangle size={18} className="mr-2" /> Broadcast Alert
            </Button>
          </div>
        </div>

        {activeBroadcast && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#F5A623]/15 border border-[#F5A623]/40 text-on-surface">
            <div className="flex items-center gap-2.5 min-w-0">
              <Radio size={18} className="text-[#F5A623] shrink-0 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold truncate">
                [{activeBroadcast.severity}] {activeBroadcast.message}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveBroadcast(null)}
              className="text-xs font-mono text-on-surface-variant hover:text-on-surface shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="bg-primary/10 p-2.5 sm:p-3 rounded-2xl">
                <Users size={22} className="text-primary" />
              </div>
              <span className="text-[11px] font-bold text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-0.5 rounded flex items-center">
                <TrendingUp size={12} className="mr-1" /> +12%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Active Members</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-on-surface">1,248</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="bg-tertiary/10 p-2.5 sm:p-3 rounded-2xl">
                <Crosshair size={22} className="text-tertiary" />
              </div>
              <span className="text-[11px] font-bold text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-0.5 rounded flex items-center">
                <TrendingUp size={12} className="mr-1" /> +5%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Lanes Occupied</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-on-surface">18 / 24</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="bg-[#FF9800]/10 p-2.5 sm:p-3 rounded-2xl">
                <DollarSign size={22} className="text-[#FF9800]" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Today's Revenue</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-on-surface">$4,520</p>
            </div>
          </div>
          <div className="bg-[#FF5252]/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#FF5252]/30 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="bg-[#FF5252]/20 p-2.5 sm:p-3 rounded-2xl animate-pulse">
                <Activity size={22} className="text-[#FF5252]" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#FF5252] uppercase tracking-wider mb-1">Active Incidents</p>
              <p className="text-2xl sm:text-4xl font-display font-bold text-[#FF5252]">0</p>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 bg-surface-container rounded-3xl p-5 sm:p-8 border border-outline-variant/30 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-on-surface mb-5 flex items-center gap-2">
              <Calendar size={20} className="text-primary" /> Today's Schedule
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {[
                { time: "09:00 AM", event: "State Qualifiers - 10m Air Rifle", lanes: "1-10", type: "COMPETITION" },
                { time: "11:00 AM", event: "Beginner Safety Course", lanes: "15-20", type: "COURSE" },
                { time: "02:00 PM", event: "Elite Squad Training", lanes: "5-10", type: "TRAINING" },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href="/bookings"
                  className="flex flex-wrap justify-between items-center gap-3 p-4 bg-surface-container-high rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="font-bold text-xs sm:text-sm text-on-surface-variant w-16 sm:w-20 shrink-0">{item.time}</span>
                    <div className="h-8 w-1 bg-primary/30 rounded-full shrink-0" />
                    <div>
                      <p className="font-bold text-on-surface text-sm sm:text-lg">{item.event}</p>
                      <p className="text-xs sm:text-sm text-on-surface-variant">Lanes {item.lanes}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase ${
                      item.type === "COMPETITION"
                        ? "bg-[#FF9800]/10 text-[#FF9800]"
                        : item.type === "COURSE"
                        ? "bg-tertiary/10 text-tertiary"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {item.type}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-surface-container rounded-3xl p-5 sm:p-8 border border-outline-variant/30 shadow-sm flex flex-col">
            <h3 className="text-lg sm:text-xl font-bold text-on-surface mb-5">Quick Actions</h3>
            <div className="space-y-3 flex-1">
              <Link href="/lanes" className="block">
                <Button variant="outline" className="w-full justify-start py-5 text-base font-semibold rounded-2xl border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5">
                  <Crosshair size={18} className="mr-3 text-primary" />
                  Lane Management
                </Button>
              </Link>
              <Link href="/staff/schedule" className="block">
                <Button variant="outline" className="w-full justify-start py-5 text-base font-semibold rounded-2xl border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5">
                  <Users size={18} className="mr-3 text-tertiary" />
                  Staff Roster
                </Button>
              </Link>
              <Link href="/range-admin/financials" className="block">
                <Button variant="outline" className="w-full justify-start py-5 text-base font-semibold rounded-2xl border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5">
                  <DollarSign size={18} className="mr-3 text-[#FF9800]" />
                  Financials &amp; Billing
                </Button>
              </Link>
              <Link href="/range-admin/operating-hours" className="block">
                <Button variant="outline" className="w-full justify-start py-5 text-base font-semibold rounded-2xl border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5">
                  <Clock size={18} className="mr-3 text-primary" />
                  Operating Hours
                </Button>
              </Link>
              <Link href="/safety" className="block">
                <Button variant="outline" className="w-full justify-start py-5 text-base font-semibold rounded-2xl border-outline-variant/50 hover:border-[#FF5252]/50 hover:bg-[#FF5252]/5">
                  <AlertTriangle size={18} className="mr-3 text-[#FF5252]" />
                  Incident Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Alert Modal */}
      {alertModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAlertModalOpen(false)}>
          <form
            onSubmit={handleBroadcastAlert}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-surface-container-high border border-outline-variant/40 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-on-surface uppercase tracking-wide">
                Broadcast Facility Alert
              </h3>
              <button type="button" onClick={() => setAlertModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Alert Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["INFO", "WARNING", "CRITICAL"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setAlertSeverity(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      alertSeverity === lvl
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container text-on-surface-variant border-outline-variant/30"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Announcement Message
              </label>
              <textarea
                rows={3}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="w-full rounded-xl bg-surface-container border border-outline-variant/40 p-3 text-sm text-on-surface outline-none focus:border-primary"
                placeholder="Enter broadcast message for all range bays and RSO tablets..."
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setAlertModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-on-primary font-bold">
                Send Broadcast
              </Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}

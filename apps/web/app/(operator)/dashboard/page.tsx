"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { GlassCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Users, Target, CalendarCheck, TrendingUp, AlertTriangle, 
  ShieldAlert, Activity, Crosshair, ChevronRight, CheckCircle2, User, Clock
} from "lucide-react";
import { WeatherWidget } from "@/components/ui/WeatherWidget";

export default function OperatorDashboard() {
  const [rangeStatus, setRangeStatus] = useState<"HOT" | "COLD">("HOT");

  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="flex flex-col gap-8">
        
        {/* Header Section */}
        <section className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-[var(--border-subtle)] pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white">Range Command Center</h1>
            <p className="text-[var(--text-secondary)] mt-1">Real-time telemetry and operational control</p>
          </div>
          <div className="flex gap-4 items-center">
            <WeatherWidget />
            <Button 
              variant={rangeStatus === "HOT" ? "danger" : "default"} 
              size="lg" 
              className="gap-2 font-bold shadow-[0_0_20px_rgba(255,77,109,0.3)] transition-all hover:shadow-[0_0_30px_rgba(255,77,109,0.5)]"
              onClick={() => setRangeStatus(rangeStatus === "HOT" ? "COLD" : "HOT")}
            >
              <AlertTriangle size={20} /> 
              {rangeStatus === "HOT" ? "CALL RANGE COLD" : "RESUME RANGE HOT"}
            </Button>
            <Button variant="default" size="lg" className="bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary-hover)]">
              + Quick Booking
            </Button>
          </div>
        </section>

        {/* Global Range Status Banner */}
        {rangeStatus === "COLD" && (
          <div className="w-full bg-[rgba(255,77,109,0.15)] border border-[var(--signal-red)] rounded-xl p-4 flex items-center justify-between animate-pulse-glow">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-[var(--signal-red)]" size={24} />
              <div>
                <h3 className="text-[var(--signal-red)] font-bold text-lg uppercase tracking-wider">Range is COLD</h3>
                <p className="text-sm text-[rgba(255,255,255,0.7)]">All firing has ceased. Awaiting RSO clearance.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[rgba(255,255,255,0.5)]">Initiated by: SYSTEM_ADMIN</p>
              <p className="text-xs text-[var(--signal-red)] font-mono mt-1">00:04:23 ELAPSED</p>
            </div>
          </div>
        )}

        {/* Live Operational KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6 border-t-4 border-t-[var(--accent-primary)] relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Lane Utilization</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold font-data text-white">82<span className="text-xl text-[var(--text-muted)]">%</span></h3>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-[rgba(245,166,35,0.1)] flex items-center justify-center border border-[rgba(245,166,35,0.2)]">
                <Target size={24} className="text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)] flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">14/17 Active Lanes</span>
              <span className="text-[var(--emerald-signal)] flex items-center gap-1">+12% <TrendingUp size={14}/></span>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-t-4 border-t-[var(--data-blue)] relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Waitlist Depth</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold font-data text-white">6</h3>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-[rgba(79,195,247,0.1)] flex items-center justify-center border border-[rgba(79,195,247,0.2)]">
                <Users size={24} className="text-[var(--data-blue)] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)] flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Est. wait: ~25 mins</span>
              <span className="text-white flex items-center gap-1 cursor-pointer hover:text-[var(--data-blue)]">View List <ChevronRight size={14}/></span>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-t-4 border-t-[var(--emerald-signal)] relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Daily Check-ins</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold font-data text-white">142</h3>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-[rgba(0,229,160,0.1)] flex items-center justify-center border border-[rgba(0,229,160,0.2)]">
                <CheckCircle2 size={24} className="text-[var(--emerald-signal)] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)] flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">48 Members / 94 Guests</span>
              <span className="text-white flex items-center gap-1 cursor-pointer hover:text-[var(--emerald-signal)]">Manage <ChevronRight size={14}/></span>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-t-4 border-t-[#B48EAD] relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">RSO Coverage</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold font-data text-white">3<span className="text-xl text-[var(--text-muted)]">/4</span></h3>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-[rgba(180,142,173,0.1)] flex items-center justify-center border border-[rgba(180,142,173,0.2)]">
                <ShieldAlert size={24} className="text-[#B48EAD] group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)] flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Shift change in 1h 45m</span>
              <span className="text-white flex items-center gap-1 cursor-pointer hover:text-[#B48EAD]">Duty Roster <ChevronRight size={14}/></span>
            </div>
          </GlassCard>
        </section>

        {/* Deep Operational Data */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Lane Matrix Overview */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Live Firing Line Overview</CardTitle>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Real-time status of all range lanes</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><span className="w-3 h-3 rounded-full bg-[var(--emerald-signal)]" /> Active</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><span className="w-3 h-3 rounded-full bg-[var(--bg-void)] border border-[var(--border-subtle)]" /> Available</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><span className="w-3 h-3 rounded-full bg-[var(--signal-red)]" /> Offline</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const lane = i + 1;
                    const isActive = lane % 4 !== 0 && lane !== 7;
                    const isOffline = lane === 7;
                    
                    return (
                      <div 
                        key={lane} 
                        className={`p-4 rounded-xl border transition-all duration-300 ${
                          isActive 
                            ? "bg-[rgba(0,229,160,0.05)] border-[rgba(0,229,160,0.2)] hover:border-[rgba(0,229,160,0.4)]" 
                            : isOffline
                            ? "bg-[rgba(255,77,109,0.05)] border-[rgba(255,77,109,0.2)]"
                            : "bg-[var(--bg-void)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-white font-display">L-{String(lane).padStart(2, '0')}</h4>
                          {isActive && <Activity size={16} className="text-[var(--emerald-signal)] animate-pulse" />}
                          {isOffline && <AlertTriangle size={16} className="text-[var(--signal-red)]" />}
                        </div>
                        
                        {isActive ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                              <span>Shooter:</span>
                              <span className="text-white">M. Rivera</span>
                            </div>
                            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                              <span>Elapsed:</span>
                              <span className="font-mono text-[var(--data-blue)]">45m</span>
                            </div>
                            <div className="w-full bg-[var(--bg-surface)] h-1.5 rounded-full overflow-hidden mt-2">
                              <div className="bg-[var(--emerald-signal)] h-full" style={{ width: '75%' }} />
                            </div>
                          </div>
                        ) : isOffline ? (
                          <div className="h-full flex items-center justify-center text-xs text-[var(--signal-red)] font-medium mt-2">
                            Target Malfunction
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)] mt-2">
                            Awaiting assignment
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed & Upcoming */}
          <div className="space-y-6 flex flex-col">
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                <CardTitle>Operational Log</CardTitle>
                <Button variant="ghost" size="sm" className="text-[var(--data-blue)] p-0 h-auto font-normal">View All</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--border-subtle)]">
                  {/* Log Items */}
                  <div className="p-4 flex gap-4 hover:bg-[var(--bg-surface)] transition-colors">
                    <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-[rgba(245,166,35,0.1)] flex items-center justify-center border border-[rgba(245,166,35,0.2)]">
                      <Crosshair size={14} className="text-[var(--accent-primary)]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">VIP Booking Arrived</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Tactical Response Team (6 shooters) checked in for Bay A.</p>
                      <div className="flex items-center gap-2 mt-2 text-xs font-mono text-[var(--text-muted)]">
                        <Clock size={12} /> 2 mins ago
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex gap-4 hover:bg-[var(--bg-surface)] transition-colors">
                    <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-[rgba(255,77,109,0.1)] flex items-center justify-center border border-[rgba(255,77,109,0.2)]">
                      <AlertTriangle size={14} className="text-[var(--signal-red)]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--signal-red)] font-medium">Safety Incident Logged</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Minor rule violation (Handling behind line) recorded by RSO Smith.</p>
                      <div className="flex items-center gap-2 mt-2 text-xs font-mono text-[var(--text-muted)]">
                        <Clock size={12} /> 18 mins ago
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 flex gap-4 hover:bg-[var(--bg-surface)] transition-colors">
                    <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-[rgba(0,229,160,0.1)] flex items-center justify-center border border-[rgba(0,229,160,0.2)]">
                      <User size={14} className="text-[var(--emerald-signal)]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">New Membership Sold</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Annual 'Marksman Elite' tier purchased at Front Desk.</p>
                      <div className="flex items-center gap-2 mt-2 text-xs font-mono text-[var(--text-muted)]">
                        <Clock size={12} /> 42 mins ago
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </section>
      </div>
    </DashboardLayout>
  );
}

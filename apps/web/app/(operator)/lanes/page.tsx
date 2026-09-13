"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Target, Users, Search, Clock, Zap, Settings2, GripVertical, UserPlus, ShieldAlert } from "lucide-react";

interface WaitlistShooter {
  id: string;
  name: string;
  type: string;
  waitTime: string;
}

interface Lane {
  id: number;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  shooter?: WaitlistShooter | null;
  timeRemaining?: string | null;
  sessionType?: string | null;
}

export default function LanesPage() {
  const [waitlist, setWaitlist] = useState<WaitlistShooter[]>([
    { id: "s1", name: "John Doe", type: "Member", waitTime: "12m" },
    { id: "s2", name: "Jane Smith", type: "Guest", waitTime: "24m" },
    { id: "s3", name: "Mike Johnson", type: "VIP", waitTime: "5m" },
    { id: "s4", name: "Sarah Connor", type: "Member", waitTime: "30m" },
  ]);

  const [lanes, setLanes] = useState<Lane[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      status: i % 5 === 0 && i !== 0 ? "MAINTENANCE" : (i % 2 === 0 ? "OCCUPIED" : "AVAILABLE"),
      shooter: i % 2 === 0 && (i % 5 !== 0 || i === 0) ? { id: `active_${i}`, name: `Active Shooter ${i}`, type: "Member", waitTime: "0m" } : null,
      timeRemaining: i % 2 === 0 && (i % 5 !== 0 || i === 0) ? `${Math.floor(Math.random() * 45) + 5}m` : null,
      sessionType: i % 2 === 0 && (i % 5 !== 0 || i === 0) ? "25m Pistol" : null,
    }))
  );

  const [draggedShooter, setDraggedShooter] = useState<WaitlistShooter | null>(null);

  const handleDragStart = (e: React.DragEvent, shooter: WaitlistShooter) => {
    setDraggedShooter(shooter);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, lane: Lane) => {
    e.preventDefault();
    if (lane.status === "AVAILABLE") {
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDrop = (e: React.DragEvent, targetLane: Lane) => {
    e.preventDefault();
    if (targetLane.status === "AVAILABLE" && draggedShooter) {
      // Remove from waitlist
      setWaitlist(waitlist.filter(s => s.id !== draggedShooter.id));
      
      // Assign to lane
      setLanes(lanes.map(l => {
        if (l.id === targetLane.id) {
          return {
            ...l,
            status: "OCCUPIED",
            shooter: draggedShooter,
            timeRemaining: "60m",
            sessionType: "Standard Practice"
          };
        }
        return l;
      }));
      setDraggedShooter(null);
    }
  };

  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white">Lane Management</h1>
            <p className="text-[var(--text-secondary)] mt-1">Drag and drop waitlist members to available lanes.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <Input placeholder="Search shooter or lane..." className="pl-10 bg-[var(--bg-void)] border-[var(--border-subtle)]" />
            </div>
            <Button variant="default" className="shrink-0 gap-2 bg-[var(--data-blue)] hover:bg-[#3db0e0] text-black font-semibold">
              <UserPlus size={16} /> Walk-in
            </Button>
          </div>
        </section>

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Waitlist Sidebar */}
          <Card className="w-80 flex flex-col shrink-0 border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xl">
            <CardHeader className="border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users size={18} className="text-[var(--accent-primary)]" />
                  Waitlist
                </CardTitle>
                <span className="bg-[var(--accent-glow)] text-[var(--accent-primary)] text-xs font-bold px-2 py-1 rounded-full">
                  {waitlist.length} Waiting
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto space-y-3">
              {waitlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
                  <Target size={32} className="mb-2 opacity-20" />
                  <p>Waitlist is empty</p>
                </div>
              ) : (
                waitlist.map((shooter) => (
                  <div
                    key={shooter.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, shooter)}
                    className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-void)] flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-[var(--accent-primary)]/50 transition-colors shadow-sm"
                  >
                    <GripVertical size={16} className="text-[var(--text-muted)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate text-sm">{shooter.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                          shooter.type === "VIP" ? "bg-[#B48EAD]/20 text-[#B48EAD]" :
                          shooter.type === "Member" ? "bg-[var(--emerald-signal)]/20 text-[var(--emerald-signal)]" :
                          "bg-[var(--text-muted)]/20 text-[var(--text-secondary)]"
                        }`}>
                          {shooter.type}
                        </span>
                        <span className="text-xs flex items-center gap-1 text-[var(--warning)] font-mono">
                          <Clock size={10} /> {shooter.waitTime}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Lane Grid Workspace */}
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {lanes.map((lane) => (
                <GlassCard 
                  key={lane.id}
                  onDragOver={(e) => handleDragOver(e, lane)}
                  onDrop={(e) => handleDrop(e, lane)}
                  className={`relative p-5 border transition-all duration-300 ${
                    lane.status === "AVAILABLE" ? "border-[var(--emerald-signal)]/30 hover:border-[var(--emerald-signal)] bg-[rgba(0,229,160,0.02)]" : 
                    lane.status === "MAINTENANCE" ? "border-[var(--signal-red)]/30 bg-[rgba(255,77,109,0.02)]" : 
                    "border-[var(--accent-primary)]/30 bg-[rgba(245,166,35,0.05)] shadow-[0_0_15px_rgba(245,166,35,0.05)]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-display font-bold text-white tracking-tighter">L-{String(lane.id).padStart(2, '0')}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        lane.status === "AVAILABLE" ? "bg-[var(--emerald-signal)]/10 text-[var(--emerald-signal)] border-[var(--emerald-signal)]/20" : 
                        lane.status === "MAINTENANCE" ? "bg-[var(--signal-red)]/10 text-[var(--signal-red)] border-[var(--signal-red)]/20" : 
                        "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20"
                      }`}>
                        {lane.status}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-muted)] hover:text-white">
                      <Settings2 size={16} />
                    </Button>
                  </div>

                  {lane.status === "OCCUPIED" && lane.shooter ? (
                    <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-void)] border border-[var(--border-subtle)]">
                        <div className="h-10 w-10 rounded-full bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.3)] flex items-center justify-center shrink-0">
                          <Users size={18} className="text-[var(--accent-primary)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-semibold truncate text-sm">{lane.shooter.name}</p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{lane.sessionType}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-[var(--text-secondary)] font-bold tracking-wider mb-1">Time Remaining</span>
                          <div className="flex items-center gap-1.5 text-[var(--warning)]">
                            <Clock size={14} />
                            <span className="text-lg font-data font-bold leading-none">{lane.timeRemaining}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase text-[var(--text-secondary)] font-bold tracking-wider mb-1">Telemetry</span>
                          <div className="flex items-center gap-1.5 text-[var(--emerald-signal)] px-2 py-1 rounded bg-[rgba(0,229,160,0.1)] border border-[rgba(0,229,160,0.2)]">
                            <Zap size={12} className="animate-pulse" />
                            <span className="text-xs font-bold font-mono uppercase tracking-wider">Live</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : lane.status === "AVAILABLE" ? (
                    <div className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--emerald-signal)]/30 rounded-lg bg-[rgba(0,229,160,0.02)] transition-colors group-hover:bg-[rgba(0,229,160,0.05)]">
                      <Target size={28} className="text-[var(--emerald-signal)]/50" />
                      <p className="text-sm font-medium text-[var(--emerald-signal)]/70 uppercase tracking-widest">Drop to Assign</p>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--signal-red)]/20 rounded-lg bg-[rgba(255,77,109,0.05)]">
                      <ShieldAlert size={28} className="text-[var(--signal-red)]/60" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-[var(--signal-red)]">OUT OF SERVICE</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Target Retrieval Error</p>
                      </div>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { GlassCard, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Users, Search, ScanLine, UserCheck, CreditCard, ChevronRight, CheckCircle2, FileWarning } from "lucide-react";

export default function StaffCheckInKiosk() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [foundMember, setFoundMember] = useState<any>(null);

  // Mock scan simulation
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        setFoundMember({
          name: "Michael Rivera",
          memberId: "MK-7741-99",
          type: "ELITE ANNUAL",
          status: "ACTIVE",
          waiverSigned: true,
          lastVisit: "2 days ago",
          photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
        });
        setIsScanning(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsScanning(true);
    }
  };

  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="flex flex-col h-[calc(100vh-100px)] items-center justify-center max-w-4xl mx-auto w-full gap-8">
        
        <div className="text-center space-y-2 mb-4">
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Express Check-in</h1>
          <p className="text-[var(--text-secondary)] text-lg">Scan member card, ID, or search by name</p>
        </div>

        <GlassCard className="w-full p-8 border-t-4 border-t-[var(--accent-primary)] shadow-[0_0_50px_rgba(245,166,35,0.05)] relative overflow-hidden">
          {/* Ambient scan line animation if scanning */}
          {isScanning && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent-primary)]/10 to-transparent h-[200%] animate-[scan_2s_linear_infinite]" />
          )}

          {!foundMember ? (
            <div className="flex flex-col gap-8 relative z-10">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-8 h-8" />
                <Input 
                  placeholder="Scan Barcode or Search Name / Phone..." 
                  className="pl-20 py-8 text-2xl bg-[var(--bg-void)] border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-2xl w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </form>

              <div className="flex gap-4">
                <Button 
                  size="xl" 
                  className="flex-1 h-24 text-xl gap-3 bg-[rgba(245,166,35,0.1)] text-[var(--accent-primary)] hover:bg-[rgba(245,166,35,0.2)] border border-[rgba(245,166,35,0.3)] rounded-2xl font-bold"
                  onClick={() => setIsScanning(true)}
                >
                  <ScanLine size={32} /> Trigger Scanner
                </Button>
                <Button 
                  size="xl" 
                  variant="outline"
                  className="flex-1 h-24 text-xl gap-3 rounded-2xl border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-white font-bold"
                >
                  <UserCheck size={32} className="text-[var(--text-muted)]" /> Walk-in Guest
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 animate-in fade-in zoom-in duration-300">
              <div className="flex items-start gap-8">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-[var(--bg-void)] border-2 border-[var(--accent-primary)] shrink-0">
                  <img src={foundMember.photoUrl} alt="Member" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold text-white font-display">{foundMember.name}</h2>
                      <span className="px-3 py-1 rounded-full bg-[var(--emerald-signal)]/10 text-[var(--emerald-signal)] border border-[var(--emerald-signal)]/20 font-bold uppercase tracking-wider text-sm">
                        {foundMember.status}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] mt-1 text-lg">{foundMember.type} • {foundMember.memberId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)] flex items-center gap-3">
                      {foundMember.waiverSigned ? (
                        <CheckCircle2 className="text-[var(--emerald-signal)] w-8 h-8 shrink-0" />
                      ) : (
                        <FileWarning className="text-[var(--signal-red)] w-8 h-8 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm text-[var(--text-secondary)] uppercase tracking-wider font-bold">Waiver Status</p>
                        <p className="text-white font-medium">{foundMember.waiverSigned ? "Signed & Valid" : "Action Required"}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-subtle)] flex items-center gap-3">
                      <CreditCard className="text-[var(--data-blue)] w-8 h-8 shrink-0" />
                      <div>
                        <p className="text-sm text-[var(--text-secondary)] uppercase tracking-wider font-bold">Card on File</p>
                        <p className="text-white font-medium">Ending in 4242</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-[var(--border-subtle)] flex gap-4">
                <Button 
                  size="xl" 
                  variant="outline"
                  className="flex-1 h-16 rounded-xl border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-white"
                  onClick={() => {
                    setFoundMember(null);
                    setSearchQuery("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="xl" 
                  className="flex-[2] h-16 rounded-xl gap-2 font-bold bg-[var(--emerald-signal)] text-black hover:bg-[#00c98d] shadow-[0_0_20px_rgba(0,229,160,0.3)] transition-all hover:shadow-[0_0_30px_rgba(0,229,160,0.5)]"
                  onClick={() => {
                    setFoundMember(null);
                    setSearchQuery("");
                    // In real app, route to assign lane or complete check-in
                  }}
                >
                  Complete Check-in & Assign Lane <ChevronRight size={20} />
                </Button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-6 w-full opacity-60">
          <div className="text-center p-4 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-void)]/50">
            <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-wider mb-1">Today's Total</p>
            <p className="text-2xl font-data font-bold text-white">142</p>
          </div>
          <div className="text-center p-4 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-void)]/50">
            <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-wider mb-1">Active Now</p>
            <p className="text-2xl font-data font-bold text-[var(--emerald-signal)]">34</p>
          </div>
          <div className="text-center p-4 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-void)]/50">
            <p className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-wider mb-1">Avg Process Time</p>
            <p className="text-2xl font-data font-bold text-white">18s</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

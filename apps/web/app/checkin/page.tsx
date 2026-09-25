"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, ScanLine, UserCheck, CreditCard, ChevronRight, CheckCircle2, FileWarning } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function StaffCheckInKiosk() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [foundMember, setFoundMember] = useState<any>(null);
  const [rangeId, setRangeId] = useState<string | null>(null);
  const [activeRso, setActiveRso] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ranges = await apiFetch('/ranges') as any[];
        if (ranges && ranges.length > 0) {
          const rId = ranges[0].id;
          setRangeId(rId);
          
          setTimeout(() => {
            setActiveRso("John Miller (RSO-1)");
          }, 500);
        }
      } catch (err) {
        console.error("Failed to load range", err);
      }
    };
    loadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeId || !searchQuery.trim()) return;
    
    setIsScanning(true);
    try {
      const results = await apiFetch<any[]>(`/range-operations/${rangeId}/members/search?q=${encodeURIComponent(searchQuery)}`);
      if (results && results.length > 0) {
        setFoundMember(results[0]);
      } else {
        alert("Member not found");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCheckIn = async () => {
    if (!rangeId || !foundMember) return;
    try {
      const res = await apiFetch<any>(`/range-operations/${rangeId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({ userId: foundMember.id, partySize: 1 })
      });
      alert(`Status: ${res.status}.\n${res.laneNumber ? `Assigned Lane: L-${String(res.laneNumber).padStart(2, '0')}` : `Waitlist Position: ${res.position}`}`);
      setFoundMember(null);
      setSearchQuery("");
    } catch (err) {
      console.error(err);
      alert("Failed to check in");
    }
  };

  return (
    <DashboardLayout role="RANGE_ADMIN">
      <div className="flex flex-col h-[calc(100vh-100px)] items-center justify-center max-w-4xl mx-auto w-full gap-8">
        
        <div className="text-center space-y-2 mb-4 relative w-full">
          {activeRso && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-[rgba(245,166,35,0.1)] border border-[var(--accent-primary)]/30 rounded-xl px-4 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
              <div className="w-2 h-2 rounded-full bg-[var(--emerald-signal)] animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider text-[var(--accent-primary)] font-bold">Active RSO on Duty</span>
                <span className="text-sm font-medium text-white">{activeRso}</span>
              </div>
            </div>
          )}
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
                  placeholder="Scan Barcode or Search Name / Email..." 
                  className="pl-20 py-8 text-2xl bg-[var(--bg-void)] border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-2xl w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </form>

              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="flex-1 h-24 text-xl gap-3 bg-[rgba(245,166,35,0.1)] text-[var(--accent-primary)] hover:bg-[rgba(245,166,35,0.2)] border border-[rgba(245,166,35,0.3)] rounded-2xl font-bold"
                  onClick={() => setIsScanning(true)}
                  disabled={isScanning}
                >
                  <ScanLine size={32} /> Trigger Scanner
                </Button>
                <Button 
                  size="lg" 
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
                        <p className="text-white font-medium">Valid</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-[var(--border-subtle)] flex gap-4">
                <Button 
                  size="lg" 
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
                  size="lg" 
                  className="flex-[2] h-16 rounded-xl gap-2 font-bold bg-[var(--emerald-signal)] text-black hover:bg-[#00c98d] shadow-[0_0_20px_rgba(0,229,160,0.3)] transition-all hover:shadow-[0_0_30px_rgba(0,229,160,0.5)]"
                  onClick={handleCheckIn}
                >
                  Complete Check-in & Assign Lane <ChevronRight size={20} />
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}

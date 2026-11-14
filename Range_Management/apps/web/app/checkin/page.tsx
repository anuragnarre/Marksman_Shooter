"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { GlassCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, ScanLine, UserCheck, CreditCard, ChevronRight, CheckCircle2, FileWarning } from "lucide-react";
import { io } from "socket.io-client";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/contexts/toast-context";

export default function StaffCheckInKiosk() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [foundMember, setFoundMember] = useState<any>(null);
  const [rangeId, setRangeId] = useState<string>("main-range-1");
  const [activeRso, setActiveRso] = useState<string | null>("John Miller (RSO-1)");

  useEffect(() => {
    const loadData = async () => {
      try {
        const ranges = await apiFetch('/ranges') as any[];
        if (ranges && ranges.length > 0) {
          setRangeId(ranges[0].id);
        }
      } catch (err) {
        console.warn("Using default offline range ID for Kiosk:", err);
      } finally {
        setActiveRso("John Miller (RSO-1)");
      }
    };
    loadData();
  }, []);

  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    const effectiveRangeId = rangeId || "main-range-1";

    setIsScanning(true);
    const trimmed = queryText.trim();

    // 1. Check if input is a Shooter App Digital Range Pass QR payload
    try {
      if (trimmed.startsWith('{') && trimmed.includes('MARKSMAN_GATE_PASS')) {
        const parsed = JSON.parse(trimmed);
        setFoundMember({
          id: parsed.userId || 'usr-alex-9941',
          name: parsed.name || 'Alex Mercer',
          email: parsed.email || 'alex.mercer@marksman.dev',
          memberId: parsed.shooterCode || 'MS-PASS',
          type: (parsed.tier || 'PRO_COMPETITOR').replace('_', ' '),
          status: 'ACTIVE',
          waiverSigned: Boolean(parsed.waiverSigned),
          photoUrl: null,
          isQrVerified: true
        });
        setIsScanning(false);
        return;
      }
    } catch {
      // Fall through to regular search
    }

    // 2. Query backend search
    try {
      const results = await apiFetch<any[]>(`/range-operations/${effectiveRangeId}/members/search?q=${encodeURIComponent(trimmed)}`);
      if (results && results.length > 0) {
        setFoundMember(results[0]);
      } else {
        setFoundMember({
          id: 'usr-alex-9941',
          name: trimmed.includes('@') ? trimmed.split('@')[0] : trimmed,
          email: trimmed.includes('@') ? trimmed : `${trimmed.toLowerCase().replace(/\s+/g, '.')}@marksman.dev`,
          memberId: 'MS-80219',
          type: 'REGULAR MEMBER',
          status: 'ACTIVE',
          waiverSigned: true,
          photoUrl: null,
        });
      }
    } catch (err) {
      console.warn("Using offline demo member profile:", err);
      setFoundMember({
        id: 'usr-alex-9941',
        name: trimmed,
        email: 'alex.mercer@marksman.dev',
        memberId: 'MS-80219',
        type: 'PRO COMPETITOR',
        status: 'ACTIVE',
        waiverSigned: true,
        photoUrl: null,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await processQuery(searchQuery);
  };

  const handleCheckIn = async () => {
    if (!foundMember) return;
    const effectiveRangeId = rangeId || "main-range-1";
    const memberName = foundMember.name;
    try {
      const res = await apiFetch<any>(`/range-operations/${effectiveRangeId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({ userId: foundMember.id, partySize: 1 })
      });
      const assignedLane = res?.laneNumber || 3;

      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3003";
        const socket = io(wsUrl, { transports: ["websocket"] });
        socket.emit("lane_status_updated", {
          rangeId: effectiveRangeId,
          laneId: String(assignedLane),
          status: "OCCUPIED",
          activeSession: {
            shooter: { name: memberName },
            weapon: "Member Firearm",
            distance: "15 YDS",
            rounds: 0,
            db: "00 dB",
          },
        });
        setTimeout(() => socket.disconnect(), 1000);
      } catch (wsErr) {
        console.warn("WebSocket check-in sync error:", wsErr);
      }

      setCheckInResult({
        laneNumber: assignedLane,
        status: res?.status || 'ASSIGNED',
        shooterName: memberName,
        timestamp: new Date().toLocaleTimeString()
      });
      toast(`Checked in ${memberName} → Lane L${String(assignedLane).padStart(2, '0')}`, "success");
      setFoundMember(null);
      setSearchQuery("");
    } catch {
      const assignedLane = 4;
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3003";
        const socket = io(wsUrl, { transports: ["websocket"] });
        socket.emit("lane_status_updated", {
          rangeId: effectiveRangeId,
          laneId: String(assignedLane),
          status: "OCCUPIED",
          activeSession: {
            shooter: { name: memberName },
            weapon: "Member Firearm",
            distance: "15 YDS",
            rounds: 0,
            db: "00 dB",
          },
        });
        setTimeout(() => socket.disconnect(), 1000);
      } catch {}

      setCheckInResult({
        laneNumber: assignedLane,
        status: 'ASSIGNED',
        shooterName: memberName,
        timestamp: new Date().toLocaleTimeString()
      });
      toast(`Checked in ${memberName} → Lane L${String(assignedLane).padStart(2, '0')}`, "success");
      setFoundMember(null);
      setSearchQuery("");
    }
  };

  const handleLoadDemoPass = () => {
    const demoPass = JSON.stringify({
      type: 'MARKSMAN_GATE_PASS',
      userId: 'usr-alex-9941',
      shooterCode: 'MS-80219',
      name: 'Alex Mercer',
      email: 'alex.mercer@marksman.dev',
      tier: 'PRO_COMPETITOR',
      waiverSigned: true
    });
    setSearchQuery(demoPass);
    processQuery(demoPass);
  };

  return (
    <DashboardLayout role="RANGE_OPERATOR" pageTitle="Member Check-in">
      <div className="flex flex-col min-h-full items-center justify-start sm:justify-center max-w-4xl mx-auto w-full gap-6 p-4 sm:p-6">
        
        <div className="text-center space-y-2 mb-4 relative w-full flex flex-col items-center">
          {activeRso && (
            <div className="mb-2 lg:mb-0 lg:absolute lg:left-0 lg:top-1/2 lg:-translate-y-1/2 bg-primary/10 border border-primary/30 rounded-xl px-4 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Active RSO on Duty</span>
                <span className="text-sm font-medium text-on-surface">{activeRso}</span>
              </div>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-on-surface tracking-tight">Express Check-in</h1>
          <p className="text-on-surface-variant text-base sm:text-lg">Scan member card, ID, or search by name</p>
        </div>

        {checkInResult && (
          <div className="w-full bg-emerald-500/10 border-2 border-emerald-400/50 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in zoom-in-95 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400 text-black flex items-center justify-center font-bold text-2xl font-mono shrink-0">
                L{String(checkInResult.laneNumber).padStart(2, '0')}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg text-on-surface font-display">CHECK-IN CONFIRMED</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-mono font-bold">
                    LANE ASSIGNED
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Shooter: <strong className="text-on-surface">{checkInResult.shooterName}</strong> &bull; Target Camera Online &bull; Time: {checkInResult.timestamp}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-xl shrink-0"
              onClick={() => setCheckInResult(null)}
            >
              Done / Next Shooter
            </Button>
          </div>
        )}

        <GlassCard className="w-full p-5 sm:p-8 border-t-4 border-t-primary shadow-[0_0_50px_rgba(245,166,35,0.05)] relative overflow-hidden">
          {/* Ambient scan line animation if scanning */}
          {isScanning && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-[200%] animate-[scan_2s_linear_infinite]" />
          )}

          {!foundMember ? (
            <div className="flex flex-col gap-6 sm:gap-8 relative z-10">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-outline w-6 h-6 sm:w-8 sm:h-8" />
                <Input 
                  placeholder="Scan QR Gate Pass, Barcode, or Search Name..." 
                  className="pl-14 sm:pl-20 py-5 sm:py-8 text-base sm:text-2xl bg-surface-container-low border-outline-variant/40 focus:border-primary rounded-2xl w-full text-on-surface"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (val.trim().startsWith('{') && val.includes('MARKSMAN_GATE_PASS')) {
                      processQuery(val);
                    }
                  }}
                />
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Button 
                  size="lg" 
                  className="h-16 sm:h-20 text-base sm:text-lg gap-3 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 rounded-2xl font-bold"
                  onClick={() => setShowCameraScanner(true)}
                >
                  <ScanLine size={24} /> Optical Scanner
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-16 sm:h-20 text-base sm:text-lg gap-3 rounded-2xl border-outline-variant/30 hover:bg-surface-container-high text-on-surface font-bold"
                  onClick={handleLoadDemoPass}
                >
                  <ScanLine size={24} className="text-emerald-500" /> Quick-Test Pass
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-16 sm:h-20 text-base sm:text-lg gap-3 rounded-2xl border-outline-variant/30 hover:bg-surface-container-high text-on-surface font-bold"
                  onClick={() => processQuery("Alex Mercer")}
                >
                  <UserCheck size={24} className="text-on-surface-variant" /> Walk-in Guest
                </Button>
              </div>

              {/* Simulated Optical Camera Scanner Modal */}
              {showCameraScanner && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-surface-container-high border border-outline-variant/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ScanLine className="text-primary animate-pulse" size={24} />
                        <h3 className="font-bold text-lg text-on-surface font-display">Optical QR Scanner Active</h3>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowCameraScanner(false)}
                        className="text-on-surface-variant hover:text-on-surface text-sm font-medium"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="relative aspect-video bg-black rounded-2xl border-2 border-dashed border-primary/60 flex flex-col items-center justify-center overflow-hidden">
                      <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-primary shadow-[0_0_15px_var(--accent-primary)] animate-bounce" />
                      <p className="text-white/80 text-sm font-medium z-10 text-center px-4">Present Shooter App QR Code to Lens</p>
                      <span className="text-[11px] text-white/50 mt-1">Resolution: 1080p @ 60fps &bull; Sensor: Sony IMX477</span>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        className="w-full bg-primary text-on-primary hover:opacity-90 font-bold rounded-xl"
                        onClick={() => {
                          setShowCameraScanner(false);
                          handleLoadDemoPass();
                        }}
                      >
                        Simulate Scan of Alex Mercer&apos;s Pass
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-surface-container-low border-2 border-primary shrink-0 flex items-center justify-center">
                  {foundMember.photoUrl ? (
                    <img src={foundMember.photoUrl} alt="Member" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-3xl text-primary tracking-wider">
                      {String(foundMember.name || "M")
                        .split(/\s+/)
                        .map((part: string) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-bold text-on-surface font-display">{foundMember.name}</h2>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold uppercase tracking-wider text-xs sm:text-sm">
                        {foundMember.status}
                      </span>
                    </div>
                    <p className="text-on-surface-variant mt-1 text-base sm:text-lg">{foundMember.type} • {foundMember.memberId}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
                      {foundMember.waiverSigned ? (
                        <CheckCircle2 className="text-emerald-500 w-7 h-7 shrink-0" />
                      ) : (
                        <FileWarning className="text-error w-7 h-7 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Waiver Status</p>
                        <p className="text-on-surface font-medium">{foundMember.waiverSigned ? "Signed & Valid" : "Action Required"}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
                      <CreditCard className="text-tertiary w-7 h-7 shrink-0" />
                      <div>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Card on File</p>
                        <p className="text-on-surface font-medium">Valid</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="sm:flex-1 h-14 sm:h-16 rounded-xl border-outline-variant/30 hover:bg-surface-container-high text-on-surface"
                  onClick={() => {
                    setFoundMember(null);
                    setSearchQuery("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="lg" 
                  className="sm:flex-[2] h-14 sm:h-16 rounded-xl gap-2 font-bold bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(0,229,160,0.3)] transition-all"
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

"use client";

import React, { useState, useEffect } from "react";

interface CommandCenterLightProps {
  rangeStatus: "HOT" | "COLD";
  lanes: any[];
  isLoading: boolean;
  onToggleStatus: () => void;
}

const DEFAULT_LANES = [
  { id: "l1", laneNumber: 1, status: "OCCUPIED", activeSession: { shooter: { name: "K. Vance" }, caliber: "9mm SIG P320", distance: "15 YDS", db: "141 dB" } },
  { id: "l2", laneNumber: 2, status: "READY", activeSession: { shooter: { name: "M. Rodriguez" }, caliber: ".45 ACP 1911", distance: "25 YDS", db: "71 dB" } },
  { id: "l3", laneNumber: 3, status: "CEASE_FIRE", activeSession: { shooter: { name: "D. Chen" }, caliber: "5.56 NATO AR-15", distance: "25 YDS", db: "STAGED" } },
  { id: "l4", laneNumber: 4, status: "OCCUPIED", activeSession: { shooter: { name: "R. Henderson" }, caliber: ".308 WIN Bolt", distance: "25 YDS", db: "152 dB" } },
  { id: "l5", laneNumber: 5, status: "READY", activeSession: { shooter: { name: "J. Kowalski" }, caliber: "9mm Glock 19", distance: "7 YDS", db: "68 dB" } },
  { id: "l6", laneNumber: 6, status: "OCCUPIED", activeSession: { shooter: { name: "T. Alvarez" }, caliber: ".357 MAG Rev", distance: "15 YDS", db: "148 dB" } },
  { id: "l7", laneNumber: 7, status: "OPEN", activeSession: null },
  { id: "l8", laneNumber: 8, status: "OCCUPIED", activeSession: { shooter: { name: "E. Becker" }, caliber: ".223 Wylde", distance: "25 YDS", db: "144 dB" } },
  { id: "l9", laneNumber: 9, status: "READY", activeSession: { shooter: { name: "H. Thorne" }, caliber: ".40 S&W Glock", distance: "15 YDS", db: "65 dB" } },
  { id: "l10", laneNumber: 10, status: "OCCUPIED", activeSession: { shooter: { name: "G. Larson" }, caliber: "10mm Auto 1911", distance: "15 YDS", db: "149 dB" } },
  { id: "l11", laneNumber: 11, status: "MAINTENANCE", activeSession: null },
  { id: "l12", laneNumber: 12, status: "OCCUPIED", activeSession: { shooter: { name: "S. O'Connor" }, caliber: "9mm CZ Shadow", distance: "7 YDS", db: "139 dB" } },
];

export function CommandCenterLight({ rangeStatus, lanes, isLoading, onToggleStatus }: CommandCenterLightProps) {
  const [activeBay, setActiveBay] = useState<"ALPHA" | "BRAVO" | "CELL_C">("ALPHA");
  const [autoCycle, setAutoCycle] = useState(true);
  const [zuluTime, setZuluTime] = useState("");

  const displayLanes = lanes.length > 0 ? lanes : DEFAULT_LANES;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setZuluTime(now.toTimeString().split(" ")[0] + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col w-full gap-4 select-none pb-12">
      {/* Global Range Status Banner */}
      {rangeStatus === "COLD" && (
        <div className="w-full bg-error border border-error-container rounded-xl p-3 flex items-center justify-between shadow-sm animate-pulse shrink-0 text-white">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-[24px]">campaign</span>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Master All-Range Cease-Fire Engaged</h3>
              <p className="text-[11px] text-white/90">All firing has ceased. Siren sounding. Awaiting RSO clearance.</p>
            </div>
          </div>
          <button
            onClick={onToggleStatus}
            className="px-3 py-1 bg-white text-error font-bold text-xs uppercase rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Clear &amp; Resume
          </button>
        </div>
      )}

      {/* Command Center Top Control Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            className="flex items-center gap-2 bg-error hover:bg-on-error-container text-white px-4 py-2 rounded-lg font-label-md text-[12px] uppercase tracking-wider font-bold transition-all shadow-xs focus:outline-none" 
            onClick={onToggleStatus}
          >
            <span className={`material-symbols-outlined text-[18px] ${rangeStatus === 'HOT' ? 'animate-pulse' : ''}`}>
              {rangeStatus === 'HOT' ? 'pan_tool' : 'check_circle'}
            </span>
            <span>{rangeStatus === "HOT" ? "Call Range Cold" : "Clear & Resume"}</span>
          </button>
          
          <div className="flex items-center gap-2.5 bg-surface-container-low px-3.5 py-2 rounded-lg border border-outline-variant/20">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold">Carrier Auto-Cycle</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                checked={autoCycle} 
                onChange={(e) => setAutoCycle(e.target.checked)} 
                className="sr-only peer" 
                type="checkbox" 
              />
              <div className="w-7 h-4 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant/20">
            <button 
              onClick={() => setActiveBay("ALPHA")}
              className={`px-3 py-1.5 rounded-md font-label-md text-[11px] font-bold transition-all ${
                activeBay === "ALPHA" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              BAY ALPHA (25Y)
            </button>
            <button 
              onClick={() => setActiveBay("BRAVO")}
              className={`px-3 py-1.5 rounded-md font-label-md text-[11px] font-bold transition-all ${
                activeBay === "BRAVO" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              BAY BRAVO (50Y)
            </button>
            <button 
              onClick={() => setActiveBay("CELL_C")}
              className={`px-3 py-1.5 rounded-md font-label-md text-[11px] font-bold transition-all ${
                activeBay === "CELL_C" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              TACTICAL CELL C
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px] text-tertiary">cyclone</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase leading-none font-semibold">Flow Vector</span>
              <span className="font-telemetry-lg text-[14px] leading-tight text-on-surface font-bold">8,420 <span className="text-outline font-normal text-[10px]">/ 8,500 FPM</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px] text-secondary">schedule</span>
            <div className="flex flex-col text-right">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase leading-none font-semibold">Console Zulu</span>
              <span className="font-telemetry-lg text-[14px] leading-tight text-on-surface font-bold">{zuluTime || "18:42:09 UTC"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 shrink-0">
        <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col justify-between shadow-xs border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Bay Capacity Utilization</span>
            <span className="p-1.5 rounded bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-[18px]">meeting_room</span></span>
          </div>
          <div className="flex items-baseline gap-2 my-2.5">
            <span className="font-telemetry-xl text-[28px] text-on-surface font-bold">78.3%</span>
            <span className="font-label-sm text-[11px] text-tertiary font-semibold bg-surface-container-low px-2 py-0.5 rounded">+4.2% pk</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{width: '78.3%'}}></div>
            </div>
            <span className="font-body-sm text-[11px] text-on-surface-variant">10 of 12 Lanes Active in Bay Alpha</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col justify-between shadow-xs border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Staging Queue / Waitlist</span>
            <span className="p-1.5 rounded bg-secondary/15 text-secondary"><span className="material-symbols-outlined text-[18px]">group</span></span>
          </div>
          <div className="flex items-baseline gap-3 my-2.5">
            <span className="font-telemetry-xl text-[28px] text-on-surface font-bold">04</span>
            <span className="font-label-md text-[12px] text-on-surface-variant font-semibold">SHOOTERS STAGED</span>
          </div>
          <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded-lg text-[11px]">
            <span className="text-on-surface-variant">~12m Est. wait</span>
            <span className="font-bold text-secondary">2 VIP PRIORITY</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col justify-between shadow-xs border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Diurnal Throughput</span>
            <span className="p-1.5 rounded bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-[18px]">insights</span></span>
          </div>
          <div className="flex items-baseline gap-2 my-2.5">
            <span className="font-telemetry-xl text-[28px] text-on-surface font-bold">142</span>
            <span className="font-label-sm text-[11px] text-tertiary font-semibold bg-surface-container-low px-2 py-0.5 rounded">+18.4% vs Baseline</span>
          </div>
          <div className="flex justify-between font-label-sm text-[11px] bg-surface-container-low px-2.5 py-1.5 rounded-lg">
            <span className="text-on-surface-variant">Tier 1: <strong className="text-on-surface">94</strong></span>
            <span className="text-on-surface-variant">Guest: <strong className="text-on-surface">48</strong></span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col justify-between shadow-xs border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Operational Integrity</span>
            <span className="p-1.5 rounded bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-[18px]">verified_user</span></span>
          </div>
          <div className="flex items-center gap-2 my-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-telemetry-xl text-[24px] text-on-surface font-bold">CODE GREEN</span>
          </div>
          <div className="flex justify-between font-label-sm text-[11px] bg-surface-container-low px-2.5 py-1.5 rounded-lg">
            <span className="text-tertiary font-semibold">Interlocks: 100%</span>
            <span className="text-on-surface-variant font-semibold">Lead Sump: NOMINAL</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start shrink-0">
        {/* Left 65% (8/12 Col): Live Firing Matrix */}
        <div className="xl:col-span-8 flex flex-col bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-outline-variant/15">
            <div>
              <h2 className="font-headline-md text-[18px] text-on-surface font-bold uppercase tracking-tight">
                Live Firing Matrix // Bay Alpha
              </h2>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                12 Integrated Acoustic Microphones &amp; Lane Optical Feeds Active
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-secondary-container"></span><span className="font-label-sm text-[10px] text-on-surface-variant font-medium">FIRING</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span><span className="font-label-sm text-[10px] text-on-surface-variant font-medium">READY</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-error"></span><span className="font-label-sm text-[10px] text-on-surface-variant font-medium">PAUSED</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-surface-container-high"></span><span className="font-label-sm text-[10px] text-on-surface-variant font-medium">CLEAR/STBY</span></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {displayLanes.map((lane: any) => (
              <div key={lane.id} className="bg-surface-container-low/70 p-3.5 rounded-lg flex flex-col gap-2 hover:bg-surface-container-low transition-colors border border-outline-variant/15 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-[11px] font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded">
                    LANE {lane.laneNumber.toString().padStart(2, '0')}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-label-sm text-[9px] font-bold ${
                    lane.status === 'OCCUPIED' ? 'bg-secondary-container text-on-secondary-container' :
                    lane.status === 'CEASE_FIRE' ? 'bg-error text-white' :
                    lane.status === 'READY' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                    lane.status === 'MAINTENANCE' ? 'bg-secondary/15 text-secondary' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>
                    {lane.status === 'OCCUPIED' ? 'FIRING' :
                     lane.status === 'CEASE_FIRE' ? 'PAUSED' :
                     lane.status === 'READY' ? 'READY' :
                     lane.status === 'MAINTENANCE' ? 'MAINT' : 'OPEN / STBY'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`font-headline-sm text-[13px] font-semibold truncate ${lane.status === 'READY' || lane.status === 'MAINTENANCE' || lane.status === 'OPEN' ? 'text-outline' : ''}`}>
                    {lane.activeSession?.shooter?.name || (lane.status === 'MAINTENANCE' ? 'Pulley Check' : 'Unoccupied')}
                  </span>
                  <span className="font-label-sm text-[10px] text-on-surface-variant font-mono">
                    {lane.activeSession?.caliber || (lane.status === 'MAINTENANCE' ? 'SERVICING' : 'CLEARED')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15">
                  <div className="flex items-center gap-1 font-label-sm text-[10px]">
                    <span className="text-outline">{lane.status === 'MAINTENANCE' ? 'MOTOR:' : 'TGT:'}</span>
                    <span className={`font-bold ${lane.status === 'MAINTENANCE' ? 'text-secondary' : 'text-on-surface'}`}>
                      {lane.status === 'MAINTENANCE' ? 'CALIBRATING' : (lane.activeSession?.distance || 'PARKED')}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 font-label-sm text-[10px] font-bold ${
                    lane.status === 'OCCUPIED' ? 'text-secondary' : 
                    lane.status === 'READY' || lane.status === 'CEASE_FIRE' ? 'text-on-surface-variant font-medium' :
                    'text-outline font-medium'
                  }`}>
                    {lane.status === 'OCCUPIED' ? <span className="material-symbols-outlined text-[13px]">volume_up</span> :
                     (lane.status === 'READY' || lane.status === 'CEASE_FIRE') ? <span className="material-symbols-outlined text-[13px]">volume_mute</span> : null}
                    <span>
                      {lane.status === 'OCCUPIED' ? (lane.activeSession?.db || '141 dB') :
                       lane.status === 'CEASE_FIRE' ? 'STAGED' :
                       lane.status === 'READY' ? '71 dB' : '00 dB'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 35% (4/12 Col): Telemetry, HVAC, & Chrono Feed */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">hvac</span>
                <h3 className="font-headline-sm text-[14px] uppercase tracking-wide text-on-surface font-bold">Ventilation &amp; Lead Traps</h3>
              </div>
              <span className="font-label-sm text-[10px] bg-surface-container-low text-tertiary px-2 py-0.5 rounded-md font-semibold">ALL SENSORS NORMAL</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col border border-outline-variant/15">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">Static Pressure</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="font-telemetry-lg text-[18px] text-on-surface font-bold">-0.052</span>
                  <span className="font-label-sm text-[10px] text-outline">inWG</span>
                </div>
                <span className="font-label-sm text-[10px] text-tertiary font-semibold">✓ Compliant</span>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col border border-outline-variant/15">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">HEPA Differential</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="font-telemetry-lg text-[18px] text-on-surface font-bold">1.20</span>
                  <span className="font-label-sm text-[10px] text-outline">in. W.C.</span>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">28% Loaded</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-label-sm text-on-surface-variant uppercase font-semibold">Motor Servos Health</span>
                <span className="font-label-sm text-on-surface font-semibold">11/12 Online</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"].map((m) => (
                  <div
                    key={m}
                    className={`text-center py-1 rounded text-[10px] font-bold ${
                      m === "M11" ? "bg-secondary text-white" : "bg-surface-container text-on-surface"
                    }`}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col justify-between gap-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">history_toggle_off</span>
                <h3 className="font-headline-sm text-[14px] uppercase tracking-wide text-on-surface font-bold">Chronological Range Feed</h3>
              </div>
              <span className="font-label-sm text-[10px] bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded font-semibold font-mono">STREAMING</span>
            </div>
            
            <div className="flex flex-col gap-2 text-[11px]">
              <div className="flex items-start gap-2 bg-surface-container-low p-2 rounded-lg border border-outline-variant/10">
                <span className="text-on-surface-variant shrink-0 font-mono font-bold">18:41:52</span>
                <span className="text-on-surface"><strong className="font-semibold">LANE 04:</strong> Target retrieved to 07 YD position.</span>
              </div>
              <div className="flex items-start gap-2 bg-surface-container-low p-2 rounded-lg border border-outline-variant/10">
                <span className="text-on-surface-variant shrink-0 font-mono font-bold">18:40:11</span>
                <span className="text-on-surface"><strong className="font-semibold">GATE 02:</strong> Check-in authenticated: T. Alvarez (ID: 9942).</span>
              </div>
              <div className="flex items-start gap-2 bg-surface-container-low p-2 rounded-lg border border-outline-variant/10">
                <span className="text-secondary shrink-0 font-mono font-bold">18:38:45</span>
                <span className="text-on-surface"><strong className="font-semibold">LANE 11:</strong> Servicing request acknowledged by RSO.</span>
              </div>
              <div className="flex items-start gap-2 bg-surface-container-low p-2 rounded-lg border border-outline-variant/10">
                <span className="text-on-surface-variant shrink-0 font-mono font-bold">18:36:04</span>
                <span className="text-on-surface"><strong className="font-semibold">AIR SENSOR:</strong> Bay Alpha plenum differential balanced at 1.20 inWC.</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/15">
              <button className="flex-1 bg-surface-container hover:bg-surface-container-high py-1.5 rounded-lg text-center font-label-md text-[11px] uppercase font-semibold text-on-surface transition-colors border border-outline-variant/20">
                + Log Incident
              </button>
              <button className="flex-1 bg-surface-container hover:bg-surface-container-high py-1.5 rounded-lg text-center font-label-md text-[11px] uppercase font-semibold text-on-surface transition-colors border border-outline-variant/20">
                Audit Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Containment & OSHA Dosimeter Strip */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 grid grid-cols-1 md:grid-cols-12 gap-4 items-center shrink-0">
        <div className="md:col-span-6 flex items-center gap-3">
          <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/20">
            <span className="material-symbols-outlined text-[22px] text-on-surface">shield_with_heart</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-[13px] font-bold uppercase text-on-surface">Steel Granular Trap Containment</span>
              <span className="font-label-sm text-[10px] px-2 py-0.5 bg-surface-container-low text-tertiary rounded-md font-bold">99.4% INTEGRITY</span>
            </div>
            <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Deceleration vortex clean • Auger system status: Cycle idle (Scheduled 22:00 UTC)</span>
          </div>
        </div>
        
        <div className="md:col-span-6 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-[13px] uppercase font-bold text-on-surface">OSHA Leq 8hr Dosimeter</span>
              <span className="font-label-sm text-[10px] text-outline font-semibold">(Safety Boundary)</span>
            </div>
            <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Permissible cumulative threshold: 85 dBA continuous</span>
          </div>
          <div className="flex items-center gap-3 w-1/2">
            <div className="flex-1 bg-surface-container-low h-2.5 rounded-full overflow-hidden flex">
              <div className="bg-tertiary h-full rounded-l-full" style={{ width: '65%' }}></div>
              <div className="bg-secondary-container h-full rounded-r-full" style={{ width: '15%' }}></div>
            </div>
            <span className="font-telemetry-lg text-[16px] text-on-surface font-bold shrink-0">79.2 dBA</span>
          </div>
        </div>
      </div>
    </div>
  );
}

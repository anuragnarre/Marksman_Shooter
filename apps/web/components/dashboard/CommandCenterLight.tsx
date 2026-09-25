"use client";

import React from "react";

interface CommandCenterLightProps {
  rangeStatus: "HOT" | "COLD";
  lanes: any[];
  isLoading: boolean;
  onToggleStatus: () => void;
}

export function CommandCenterLight({ rangeStatus, lanes, isLoading, onToggleStatus }: CommandCenterLightProps) {
  return (
    <div className="flex flex-col w-full p-space-md gap-space-md select-none h-full overflow-y-auto">
      
      {/* Global Range Status Banner */}
      {rangeStatus === "COLD" && (
        <div className="w-full bg-error border border-error-container rounded p-space-sm flex items-center justify-between shadow-sm animate-pulse shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-[20px]">campaign</span>
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Master All-Range Cease-Fire Engaged</h3>
              <p className="text-[11px] text-white/90">All firing has ceased. Siren sounding. Awaiting RSO clearance.</p>
            </div>
          </div>
        </div>
      )}

      {/* Command Center Top Control Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-5 bg-surface-container-lowest px-4 rounded shadow-sm mb-2 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            className="flex items-center gap-2 bg-error hover:bg-on-error-container text-on-error px-4 py-2 rounded font-label-md text-label-md uppercase tracking-wider font-bold transition-colors focus:outline-none" 
            onClick={onToggleStatus}
          >
            <span className={`material-symbols-outlined text-[18px] ${rangeStatus === 'HOT' ? 'animate-pulse' : ''}`}>
              {rangeStatus === 'HOT' ? 'pan_tool' : 'check_circle'}
            </span>
            <span>{rangeStatus === "HOT" ? "Call Range Cold" : "Clear & Resume"}</span>
          </button>
          
          <div className="flex items-center gap-2.5 bg-surface-container-low px-3.5 py-2 rounded">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Carrier Auto-Cycle</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input defaultChecked className="sr-only peer" type="checkbox" />
              <div className="w-7 h-4 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container"></div>
            </label>
          </div>
          
          <div className="flex items-center bg-surface-container-low p-1 rounded">
            <button className="px-3 py-1.5 rounded font-label-md text-label-md bg-primary text-on-primary font-semibold transition-all">BAY ALPHA (25Y)</button>
            <button className="px-3 py-1.5 rounded font-label-md text-label-md text-on-surface-variant hover:text-on-surface font-semibold transition-all">BAY BRAVO (50Y)</button>
            <button className="px-3 py-1.5 rounded font-label-md text-label-md text-on-surface-variant hover:text-on-surface font-semibold transition-all">TACTICAL CELL C</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded">
            <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">cyclone</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase leading-none font-semibold">Flow Vector</span>
              <span className="font-telemetry-lg text-telemetry-lg leading-tight text-on-surface font-bold">8,420 <span className="text-outline font-normal text-label-sm">/ 8,500 FPM</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded">
            <span className="material-symbols-outlined text-[18px] text-secondary">schedule</span>
            <div className="flex flex-col text-right">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase leading-none font-semibold">Console Zulu</span>
              <span className="font-telemetry-lg text-telemetry-lg leading-tight text-on-surface font-bold">18:42:09 UTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-2 shrink-0">
        <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Bay Capacity Utilization</span>
            <span className="p-1.5 rounded bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-[18px]">meeting_room</span></span>
          </div>
          <div className="flex items-baseline gap-2 my-3">
            <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">78.3%</span>
            <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded">+4.2% pk</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="w-full bg-surface-container-low h-2 rounded overflow-hidden">
              <div className="bg-on-tertiary-container h-full rounded" style={{width: '78.3%'}}></div>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">10 of 12 Lanes Active in Bay Alpha</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Staging Queue / Waitlist</span>
            <span className="p-1.5 rounded bg-secondary-fixed text-on-secondary-fixed"><span className="material-symbols-outlined text-[18px]">group</span></span>
          </div>
          <div className="flex items-baseline gap-3 my-3">
            <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">04</span>
            <span className="font-label-md text-label-md text-on-surface-variant font-semibold">SHOOTERS STAGED</span>
          </div>
          <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded">
            <span className="font-label-sm text-label-sm text-on-surface-variant">~12m Est. wait</span>
            <span className="font-label-sm text-label-sm font-bold text-secondary">2 VIP PRIORITY</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Diurnal Throughput</span>
            <span className="p-1.5 rounded bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-[18px]">insights</span></span>
          </div>
          <div className="flex items-baseline gap-2 my-3">
            <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">142</span>
            <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded">+18.4% vs Baseline</span>
          </div>
          <div className="flex justify-between font-label-sm text-label-sm bg-surface-container-low px-2.5 py-1.5 rounded">
            <span className="text-on-surface-variant">Tier 1: <strong className="text-on-surface">94</strong></span>
            <span className="text-on-surface-variant">Guest: <strong className="text-on-surface">48</strong></span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Operational Integrity</span>
            <span className="p-1.5 rounded bg-surface-container-low text-on-surface"><span className="material-symbols-outlined text-[18px]">verified_user</span></span>
          </div>
          <div className="flex items-center gap-2 my-3">
            <span className="w-3 h-3 rounded-full bg-on-tertiary-container animate-pulse"></span>
            <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">CODE GREEN</span>
          </div>
          <div className="flex justify-between font-label-sm text-label-sm bg-surface-container-low px-2.5 py-1.5 rounded">
            <span className="text-on-tertiary-container font-semibold">Interlocks: 100%</span>
            <span className="text-on-surface-variant font-semibold">Lead Sump: NOMINAL</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start shrink-0">
        
        {/* Left 65% (8/12 Col): Live Firing Matrix */}
        <div className="xl:col-span-8 flex flex-col bg-surface-container-lowest rounded p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 gap-4">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold uppercase tracking-tight">Live Firing Matrix // Bay Alpha</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">12 Integrated Acoustic Microphones &amp; Lane Optical Feeds Active</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-secondary-container"></span><span className="font-label-sm text-label-sm text-on-surface-variant font-medium">FIRING</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-on-tertiary-container"></span><span className="font-label-sm text-label-sm text-on-surface-variant font-medium">READY</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-error"></span><span className="font-label-sm text-label-sm text-on-surface-variant font-medium">PAUSED</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-surface-container"></span><span className="font-label-sm text-label-sm text-on-surface-variant font-medium">CLEAR/STBY</span></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center p-8 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
              </div>
            ) : lanes.length === 0 ? (
              <div className="col-span-full flex items-center justify-center p-8 text-on-surface-variant bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">videocam_off</span>
                  <span>No lanes found or API offline.</span>
                </div>
              </div>
            ) : (
              lanes.map((lane) => (
                <div key={lane.id} className="bg-surface-container-low/60 p-4 rounded flex flex-col gap-2 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded">
                      LANE {lane.laneNumber.toString().padStart(2, '0')}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-bold ${
                      lane.status === 'OCCUPIED' ? 'bg-secondary-container text-on-secondary-container' :
                      lane.status === 'CEASE_FIRE' ? 'bg-error-container text-on-error-container' :
                      lane.status === 'READY' ? 'bg-tertiary-container/10 text-on-tertiary-container' :
                      lane.status === 'MAINTENANCE' ? 'bg-secondary-fixed text-on-secondary-fixed' :
                      'bg-surface-container text-on-surface-variant'
                    }`}>
                      {lane.status === 'OCCUPIED' ? 'FIRING' :
                       lane.status === 'CEASE_FIRE' ? 'PAUSED' :
                       lane.status === 'READY' ? 'READY' :
                       lane.status === 'MAINTENANCE' ? 'MAINT' : 'OPEN / STBY'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-headline-sm text-headline-sm font-semibold truncate ${lane.status === 'READY' || lane.status === 'MAINTENANCE' ? 'text-outline' : ''}`}>
                      {lane.activeSession?.shooter?.name || (lane.status === 'MAINTENANCE' ? 'Pulley Check' : 'Unoccupied')}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                      {lane.activeSession ? '9mm SIG P320' : (lane.status === 'MAINTENANCE' ? 'SERVICING' : 'CLEARED')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-surface-container-high/60">
                    <div className="flex items-center gap-1 font-label-sm text-label-sm">
                      <span className="text-outline">{lane.status === 'MAINTENANCE' ? 'MOTOR:' : 'TGT:'}</span>
                      <span className={`font-bold ${lane.status === 'MAINTENANCE' ? 'text-secondary' : 'text-on-surface'}`}>
                        {lane.status === 'MAINTENANCE' ? 'CALIBRATING' : (lane.activeSession ? '15 YDS' : 'PARKED')}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 font-label-sm text-label-sm font-bold ${
                      lane.status === 'OCCUPIED' ? 'text-secondary' : 
                      lane.status === 'READY' || lane.status === 'CEASE_FIRE' ? 'text-on-surface-variant font-medium' :
                      'text-outline font-medium'
                    }`}>
                      {lane.status === 'OCCUPIED' ? <span className="material-symbols-outlined text-[14px]">volume_up</span> :
                       (lane.status === 'READY' || lane.status === 'CEASE_FIRE') ? <span className="material-symbols-outlined text-[14px]">volume_mute</span> : null}
                      <span>
                        {lane.status === 'OCCUPIED' ? '141 dB' :
                         lane.status === 'CEASE_FIRE' ? 'STAGED' :
                         lane.status === 'READY' ? '71 dB' : '00 dB'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 35% (4/12 Col): Telemetry, HVAC, & Chrono Feed */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          <div className="bg-surface-container-lowest p-6 rounded shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">hvac</span>
                <h3 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">Ventilation &amp; Lead Traps</h3>
              </div>
              <span className="font-label-sm text-label-sm bg-surface-container-low text-on-tertiary-container px-2 py-1 rounded font-semibold">ALL SENSORS NORMAL</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low p-3 rounded flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Static Pressure</span>
                <div className="flex items-baseline gap-1.5 my-1.5">
                  <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">-0.052</span>
                  <span className="font-label-sm text-label-sm text-outline">inWG</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">✓ Compliant</span>
              </div>
              <div className="bg-surface-container-low p-3 rounded flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">HEPA Differential</span>
                <div className="flex items-baseline gap-1.5 my-1.5">
                  <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">1.20</span>
                  <span className="font-label-sm text-label-sm text-outline">in. W.C.</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">28% Loaded</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex justify-between items-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Motor Servos Health</span>
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">11/12 Online</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`${i === 10 ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-on-surface'} text-center py-1.5 rounded font-label-sm text-label-sm font-bold`}>
                    M{i+1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded shadow-sm flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">history_toggle_off</span>
                <h3 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">Chronological Range Feed</h3>
              </div>
              <span className="font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant px-2 py-1 rounded font-semibold font-mono">STREAMING</span>
            </div>
            <div className="flex flex-col gap-2.5 text-body-sm">
              <div className="flex items-start gap-2 bg-surface-container-low p-2 rounded">
                <span className="text-on-surface-variant shrink-0 font-mono font-bold text-label-sm">18:41:52</span>
                <span className="text-on-surface"><strong className="text-on-surface font-semibold">LANE 04:</strong> Target retrieved to 07 YD position.</span>
              </div>
              <div className="flex items-start gap-2 bg-surface-container-low p-2 rounded">
                <span className="text-on-surface-variant shrink-0 font-mono font-bold text-label-sm">18:40:11</span>
                <span className="text-on-surface"><strong className="text-on-surface font-semibold">GATE 02:</strong> Check-in authenticated: T. Alvarez (ID: 9942).</span>
              </div>
              <div className="flex items-start gap-2 bg-surface-container-low p-2 rounded">
                <span className="text-secondary shrink-0 font-mono font-bold text-label-sm">18:38:45</span>
                <span className="text-on-surface"><strong className="text-on-surface font-semibold">LANE 11:</strong> Servicing request acknowledged by RSO.</span>
              </div>
              <div className="flex items-start gap-2 bg-surface-container-low p-2 rounded">
                <span className="text-on-surface-variant shrink-0 font-mono font-bold text-label-sm">18:36:04</span>
                <span className="text-on-surface"><strong className="text-on-surface font-semibold">AIR SENSOR:</strong> Bay Alpha plenum differential balanced at 1.20 inWC.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-surface-container-high">
              <button className="flex-1 bg-surface-container hover:bg-surface-container-high py-2 rounded text-center font-label-md text-label-md uppercase font-semibold text-on-surface transition-colors">+ Log Incident</button>
              <button className="flex-1 bg-surface-container hover:bg-surface-container-high py-2 rounded text-center font-label-md text-label-md uppercase font-semibold text-on-surface transition-colors">Audit Export</button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Containment & OSHA Dosimeter Strip */}
      <div className="mt-6 bg-surface-container-lowest p-6 rounded shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center shrink-0 mb-6">
        <div className="md:col-span-6 flex items-center gap-4">
          <div className="p-3 bg-surface-container-low rounded">
            <span className="material-symbols-outlined text-[24px] text-on-surface">shield_with_heart</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm font-bold uppercase text-on-surface">Steel Granular Trap Containment</span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 bg-surface-container-low text-on-tertiary-container rounded font-bold">99.4% INTEGRITY</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Deceleration vortex clean • Auger system status: Cycle idle (Scheduled 22:00 UTC)</span>
          </div>
        </div>
        <div className="md:col-span-6 flex items-center justify-between gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-headline-sm uppercase font-bold text-on-surface">OSHA Leq 8hr Dosimeter</span>
              <span className="font-label-sm text-label-sm text-outline font-semibold">(Safety Boundary)</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Permissible cumulative threshold: 85 dBA continuous</span>
          </div>
          <div className="flex items-center gap-3 w-1/2">
            <div className="flex-1 bg-surface-container-low h-2.5 rounded overflow-hidden flex">
              <div className="bg-on-tertiary-container h-full rounded-l" style={{width: '65%'}}></div>
              <div className="bg-secondary-container h-full rounded-r" style={{width: '15%'}}></div>
            </div>
            <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold shrink-0">79.2 dBA</span>
          </div>
        </div>
      </div>
    </div>
  );
}

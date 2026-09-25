"use client";

import React, { useState } from "react";

interface RightPanelProps {
  rangeStatus: "HOT" | "COLD";
  onToggleStatus: () => void;
  isLoading: boolean;
}

export function RightPanel({ rangeStatus, onToggleStatus, isLoading }: RightPanelProps) {
  const [logs, setLogs] = useState([
    { id: 1, type: "info", time: "14:18:04", title: "VIP Bay 02: Target recalled & renewed", desc: "Target swapped to Steel Plate (50 rds)", icon: "verified" },
    { id: 2, type: "error", time: "14:16:30", title: "Bay 07 Hold: RSO Miller dispatched", desc: "Unflagged firearm casing review", icon: "error" },
    { id: 3, type: "primary", time: "14:14:12", title: "Kiosk: Party of 2 assigned to Bay 09", desc: "Gold Member: #M-9024 [Waiver Signed]", icon: "badge" },
    { id: 4, type: "default", time: "14:09:50", title: "Supply: Bay 08 & 12 Target roll stocked", desc: "Dispenser reel sensor reset to 100%", icon: "inventory_2" }
  ]);

  return (
    <div className="col-span-4 flex flex-col gap-space-sm h-[500px] xl:h-auto">
      {/* Action Panel: Call Range Cold & Quick Check-in */}
      <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps uppercase text-outline tracking-wider">Tactical Override</span>
          <span className="font-telemetry-sm text-[10px] text-tertiary">Direct SCADA Interlock</span>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          {/* Emergency Button */}
          <button 
            disabled={isLoading}
            className={`rounded-lg p-space-sm flex flex-col items-center justify-center gap-1 text-center transition-transform active:scale-95 shadow-lg group ${
              rangeStatus === 'HOT' 
                ? 'bg-secondary-container hover:opacity-95 text-on-secondary-container'
                : 'bg-surface-container-highest hover:bg-surface-bright text-on-surface'
            }`}
            onClick={onToggleStatus}
          >
            <div className="flex items-center gap-1.5">
              {rangeStatus === 'HOT' ? (
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
              ) : (
                <span className="material-symbols-outlined text-[14px]">lock_open</span>
              )}
              <span className={`font-label-caps text-label-caps uppercase font-bold tracking-widest ${rangeStatus === 'HOT' ? 'text-secondary' : 'text-on-surface-variant'}`}>
                {rangeStatus === 'HOT' ? 'EMERGENCY' : 'SECURE'}
              </span>
            </div>
            <span className={`font-headline-md text-[16px] uppercase font-bold tracking-tight leading-none ${rangeStatus === 'HOT' ? 'text-white' : 'text-on-surface'}`}>
              {rangeStatus === 'HOT' ? 'CALL RANGE COLD' : 'RESUME RANGE HOT'}
            </span>
          </button>
          
          {/* Quick Check-in Button */}
          <button className="bg-primary hover:bg-primary-container text-on-primary-container rounded-lg p-space-sm flex flex-col items-center justify-center gap-1 text-center transition-transform active:scale-95 shadow-md">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-on-primary-container text-[16px]">person_add</span>
              <span className="font-label-caps text-label-caps uppercase font-bold tracking-widest text-on-primary-container">Kiosk Intake</span>
            </div>
            <span className="font-headline-md text-[16px] font-bold tracking-tight text-on-primary leading-none">+ Quick Check-In</span>
            <span className="font-telemetry-sm text-[10px] text-on-primary font-medium">Scan Waiver / ID Card</span>
          </button>
        </div>
      </div>
      
      {/* Live Environmental Barometer & Decibel Telemetry Chart */}
      <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-xs shrink-0">
        <div className="flex items-center justify-between pb-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-tertiary text-[18px]">graphic_eq</span>
            <span className="font-headline-md text-headline-md text-on-surface">Acoustic &amp; Airflow Telemetry</span>
          </div>
          <span className="font-telemetry-sm text-telemetry-sm text-tertiary">Real-time RT-60</span>
        </div>
        {/* Telemetry Meters */}
        <div className="grid grid-cols-2 gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
          <div>
            <div className="flex items-center justify-between font-label-caps text-[10px] text-outline uppercase">
              <span>Peak Impulse dB</span>
              <span className="text-primary font-telemetry-sm font-bold">141.2 dB</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-primary h-full rounded-full" style={{ width: '74%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between font-label-caps text-[10px] text-outline uppercase">
              <span>Vent Flow CFM</span>
              <span className="text-tertiary font-telemetry-sm font-bold">18,450 CFM</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-tertiary h-full rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
        </div>
        {/* Compact Live SVG Waveform & Pressure Sparklines */}
        <div className="relative w-full h-16 bg-surface-container-lowest rounded-lg p-space-xs flex flex-col justify-end overflow-hidden mt-2">
          <div className="absolute top-1 left-2 flex items-center gap-space-md text-[9px] font-telemetry-sm text-outline z-10">
            <span className="flex items-center gap-1"><span className="w-2 h-[2px] bg-tertiary inline-block"></span> Lead Extraction CFM</span>
            <span className="flex items-center gap-1"><span className="w-2 h-[2px] bg-primary inline-block"></span> Firing Impulse Sound</span>
          </div>
          <svg className="w-full h-10" fill="none" preserveAspectRatio="none" viewBox="0 0 320 60">
            <path className="text-tertiary" d="M0,45 Q20,43 40,46 T80,44 T120,45 T160,42 T200,44 T240,41 T280,43 T320,42" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
            <path className="text-primary" d="M0,55 L25,55 L30,22 L35,55 L70,55 L75,10 L80,55 L130,55 L134,28 L138,55 L190,55 L195,14 L200,48 L205,18 L210,55 L260,55 L265,30 L270,55 L320,55" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
            <line className="text-surface-container-highest" stroke="currentColor" strokeDasharray="2 4" strokeWidth="0.5" x1="0" x2="320" y1="15" y2="15" />
            <line className="text-surface-container-highest" stroke="currentColor" strokeDasharray="2 4" strokeWidth="0.5" x1="0" x2="320" y1="35" y2="35" />
          </svg>
        </div>
      </div>
      
      {/* Event Stream */}
      <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-xs flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between pb-space-xs shrink-0">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-outline text-[18px]">receipt_long</span>
            <span className="font-headline-md text-headline-md text-on-surface">Real-Time Event Stream</span>
          </div>
          <button className="font-telemetry-sm text-[10px] text-outline hover:text-on-surface transition-colors" onClick={() => setLogs([])}>Clear</button>
        </div>
        <div className="flex flex-col gap-space-xs overflow-y-auto pr-1 h-full">
          {logs.map(log => (
            <div key={log.id} className="p-space-xs rounded bg-surface-container flex items-start justify-between gap-space-xs">
              <div className="flex items-start gap-space-xs min-w-0">
                <span className={`material-symbols-outlined text-[15px] mt-[1px] ${
                  log.type === 'error' ? 'text-secondary' : 
                  log.type === 'primary' ? 'text-tertiary' : 
                  log.type === 'info' ? 'text-primary' : 'text-outline'
                }`}>
                  {log.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className={`font-body-md text-body-sm font-medium truncate ${
                    log.type === 'error' ? 'text-secondary' : 'text-on-surface'
                  }`}>{log.title}</span>
                  <span className="font-telemetry-sm text-[10px] text-outline">{log.desc}</span>
                </div>
              </div>
              <span className="font-telemetry-sm text-[10px] text-outline shrink-0">{log.time}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-space-xs text-center text-outline font-telemetry-sm text-[10px]">
              Log cleared. Monitoring active telemetry...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

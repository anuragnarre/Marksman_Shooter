import React from 'react';
import { useLiveVision } from '@/hooks/useLiveVision';

export function LiveVisionDark() {
  const { lanes, isLoading, selectedLaneId, setSelectedLaneId, wsStatus } = useLiveVision("1");
  const selectedLane = lanes.find(l => l.id === selectedLaneId) || lanes[0];
  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-10">
      {/* The original padding from main was pb-10 / py-space-lg */}
      <div className="flex flex-col w-full gap-space-lg">
{/* TOP SECTION: Tactical Lane Selector & Line Management */}
<div className="w-full bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-wrap items-center justify-between gap-space-md">
<div className="flex items-center gap-space-sm overflow-x-auto pb-1 sm:pb-0">

          {isLoading ? (
            <div className="flex items-center px-4 py-2 text-on-surface-variant font-label-caps">Loading lanes...</div>
          ) : lanes.length === 0 ? (
            <div className="flex items-center px-4 py-2 text-on-surface-variant font-label-caps">No active lanes</div>
          ) : (
            lanes.map((lane: any) => {
              const isActive = lane.id === selectedLaneId;
              return (
                <button key={lane.id} onClick={() => setSelectedLaneId(lane.id)} className={`flex items-center gap-space-md px-space-lg py-space-sm rounded-lg transition-all ${isActive ? 'bg-surface-container-high shadow-md hover:bg-surface-bright' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`} type="button">
                  {isActive ? (
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-space-sm">
                        <span className="font-telemetry-sm text-telemetry-sm font-bold text-primary">{lane.name}</span>
                        {lane.status === 'ACTIVE' && <span className="px-1.5 py-0.2 bg-primary/20 text-primary font-label-caps text-label-caps rounded">ACTIVE</span>}
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{lane.shooterName || 'No Shooter'}</span>
                    </div>
                  ) : (
                    <>
                      <div className={`w-2 h-2 rounded-full ${lane.status === 'IDLE' ? 'bg-outline' : lane.status === 'MAINTENANCE' ? 'bg-secondary-container' : 'bg-tertiary'}`} />
                      <div className="flex flex-col text-left">
                        <span className="font-telemetry-sm text-telemetry-sm font-bold text-on-surface">{lane.name}</span>
                        <span className="font-body-sm text-body-sm text-outline">{lane.shooterName || 'No Shooter'}</span>
                      </div>
                    </>
                  )}
                  {lane.status === 'ACTIVE' ? (
                    <span className={`font-telemetry-sm text-telemetry-sm ml-space-sm font-semibold ${isActive ? 'text-tertiary' : 'text-outline'}`}>
                      {lane.lastShotScore ? lane.lastShotScore.toFixed(1) : 'LIVE'}
                    </span>
                  ) : (
                    <span className={`font-telemetry-sm text-telemetry-sm ml-space-sm font-semibold text-outline`}>
                      {lane.status}
                    </span>
                  )}
                </button>
              );
            })
          )}
{/* Add Lane Action */}
<button className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-tertiary transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">add_circle</span>
<span className="font-label-caps text-label-caps uppercase tracking-wider">Add Bay</span>
</button>
</div>
{/* Quick Lane Level Actions */}
<div className="flex items-center gap-space-md">
<div className="hidden xl:flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-lowest rounded-lg">
<span className="material-symbols-outlined text-primary text-[18px]">center_focus_strong</span>
<span className="font-label-caps text-label-caps text-outline">CV CONFIDENCE:</span>
<span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">99.84%</span>
</div>
<button className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-secondary-container hover:bg-error-container text-on-secondary-container shadow-md transition-colors" type="button">
<span className="material-symbols-outlined text-[20px] animate-pulse">pan_tool</span>
<span className="font-label-caps text-label-caps uppercase font-bold tracking-wide">Lane Ceasefire</span>
</button>
</div>
</div>
{/* MAIN OPERATIONAL COCKPIT: 60/40 Split */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
{/* LEFT 60%: Optical Computer Vision Target Canvas & Stream Telemetry */}
<div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-space-md">
{/* Video Frame & Target Canvas Container */}
<div className="relative w-full bg-surface-container-lowest rounded-xl overflow-hidden shadow-xl flex flex-col">
{/* Stream Metadata HUD Header */}
<div className="flex items-center justify-between px-space-lg py-space-sm bg-surface-container-low/90 backdrop-blur-sm z-10">
<div className="flex items-center gap-space-md">
<span className="flex h-2.5 w-2.5 relative">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary" />
</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold">CAM-{selectedLane?.id || 'L01'} // 120 FPS HIGH-SPEED USB SENSOR</span>
</div>
<div className="flex items-center gap-space-lg font-telemetry-sm text-body-sm text-outline">
<span className="text-tertiary font-bold">RTSP: 1080p@120Hz</span>
<span className="hidden sm:inline">EXPOSURE: 1/8000s</span>
<span className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary font-label-caps text-label-caps">NIGHT OPTICS: ON</span>
</div>
</div>
{/* Target Visualization Screen */}
<div className="relative w-full aspect-square max-h-[620px] bg-[#070b14] flex items-center justify-center p-space-md select-none overflow-hidden group">
{/* Subtle Camera Sensor Noise & Grid Overlay */}
<div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
{/* Camera Reticle Crosshair Sub-lines */}
<div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
<div className="w-full h-[1px] bg-tertiary/40" />
</div>
<div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
<div className="h-full w-[1px] bg-tertiary/40" />
</div>
{/* CV Target Graphic (Scaled ISSF 10m Air Rifle standard representation) */}
<div className="relative w-[480px] h-[480px] max-w-full max-h-full rounded-full bg-[#05080f] shadow-2xl flex items-center justify-center">
{/* Outer Paper Ring 1 (45.5mm equivalent) */}
<div className="absolute w-[94%] h-[94%] rounded-full bg-surface-container-low flex items-center justify-center text-outline/50 font-telemetry-sm text-body-sm">
<span className="absolute top-2">1</span>
<span className="absolute bottom-2">1</span>
<span className="absolute left-2">1</span>
<span className="absolute right-2">1</span>
{/* Ring 2 */}
<div className="w-[88%] h-[88%] rounded-full bg-surface-container-high flex items-center justify-center">
<span className="absolute top-6">2</span>
{/* Ring 3 */}
<div className="w-[86%] h-[86%] rounded-full bg-surface-container flex items-center justify-center">
<span className="absolute top-10">3</span>
{/* Black Aiming Mark boundary (Rings 4 to 10.9) */}
<div className="w-[78%] h-[78%] rounded-full bg-[#03060c] flex items-center justify-center shadow-inner relative">
{/* White Ring Labeling in Black Zone */}
<span className="absolute top-4 text-on-surface-variant/40 font-telemetry-sm text-body-sm">4</span>
<span className="absolute top-10 text-on-surface-variant/40 font-telemetry-sm text-body-sm">5</span>
<span className="absolute top-16 text-on-surface-variant/50 font-telemetry-sm text-body-sm">6</span>
{/* Ring 7 */}
<div className="w-[66%] h-[66%] rounded-full bg-surface-container-lowest flex items-center justify-center">
<span className="absolute top-2 text-on-surface-variant/60 font-telemetry-sm text-body-sm">7</span>
{/* Ring 8 */}
<div className="w-[68%] h-[68%] rounded-full bg-[#020408] flex items-center justify-center">
<span className="absolute top-2 text-on-surface-variant/70 font-telemetry-sm text-body-sm">8</span>
{/* Ring 9 */}
<div className="w-[66%] h-[66%] rounded-full bg-[#000000] flex items-center justify-center">
<span className="absolute top-1 text-on-surface font-telemetry-sm text-body-sm">9</span>
{/* Ring 10 (0.5mm center point) */}
<div className="relative w-[34%] h-[34%] rounded-full bg-surface-container-lowest flex items-center justify-center">
{/* 10.9 White Sub-millimeter Dot (ISSF Standard Dot) */}
<div className="w-3 h-3 rounded-full bg-on-surface shadow-[0_0_8px_#ffffff] flex items-center justify-center">
<div className="w-1 h-1 rounded-full bg-surface-container-lowest" />
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
{/* Optical Dispersion Ellipse (Shot Grouping Extreme Spread) */}
<svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 480 480">
{/* Extreme Spread Ellipse (Amber/Cyan Glow) */}
<ellipse className="text-tertiary" cx="242" cy="238" fill="rgba(84, 221, 252, 0.06)" rx="28" ry="24" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1.2" transform="rotate(-15 242 238)" />
{/* Center of Impact Crosshair */}
<line className="text-tertiary" stroke="currentColor" strokeWidth="1.5" x1="237" x2="247" y1="238" y2="238" />
<line className="text-tertiary" stroke="currentColor" strokeWidth="1.5" x1="242" x2="242" y1="233" y2="243" />
<text className="font-label-caps text-[9px] uppercase tracking-wider" fill="#54ddfc" x="250" y="226">MPI Δ +0.2mm</text>
</svg>
{/* DETECTED PELLET IMPACT OVERLAYS (10 Hits, .177 Caliber / 4.5mm Scaled Circles) */}
{/* Hit 1: 10.7 (Near center) */}
<div className="absolute left-[242px] top-[232px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/20 backdrop-blur-xs flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
<div className="w-3.5 h-3.5 rounded-full bg-primary/80" />
<span className="absolute -top-4 font-telemetry-sm text-[10px] text-primary font-bold">1</span>
</div>
{/* Hit 2: 10.5 */}
<div className="absolute left-[236px] top-[248px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer">
<div className="w-3.5 h-3.5 rounded-full bg-primary/80" />
<span className="absolute -top-4 font-telemetry-sm text-[10px] text-primary font-bold">2</span>
</div>
{/* Hit 3: 10.9 (Bulls-Eye dead center) */}
<div className="absolute left-[240px] top-[240px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-tertiary/30 animate-pulse flex items-center justify-center shadow-[0_0_12px_#54ddfc] cursor-pointer">
<div className="w-3 h-3 rounded-full bg-tertiary" />
<span className="absolute -top-4 font-telemetry-sm text-[10px] text-tertiary font-bold">3★</span>
</div>
{/* Hit 4: 10.2 */}
<div className="absolute left-[254px] top-[244px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer">
<div className="w-3.5 h-3.5 rounded-full bg-primary/70" />
<span className="absolute -top-4 font-telemetry-sm text-[10px] text-primary font-bold">4</span>
</div>
{/* Hit 5: 9.9 (Just outside ring 10 line) */}
<div className="absolute left-[222px] top-[230px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary-container/40 flex items-center justify-center cursor-pointer">
<div className="w-3.5 h-3.5 rounded-full bg-secondary" />
<span className="absolute -top-4 font-telemetry-sm text-[10px] text-secondary font-bold">5</span>
</div>
{/* Hit 6: 10.8 */}
<div className="absolute left-[244px] top-[236px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer">
<div className="w-3.5 h-3.5 rounded-full bg-primary/80" />
<span className="absolute -top-4 font-telemetry-sm text-[10px] text-primary font-bold">6</span>
</div>
{/* Hit 7: 10.6 */}
<div className="absolute left-[235px] top-[234px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer">
<div className="w-3.5 h-3.5 rounded-full bg-primary/80" />
<span className="absolute -top-4 font-telemetry-sm text-[10px] text-primary font-bold">7</span>
</div>
{/* Hit 8: 10.4 */}
<div className="absolute left-[249px] top-[249px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer">
<div className="w-3.5 h-3.5 rounded-full bg-primary/70" />
<span className="absolute -top-4 font-telemetry-sm text-[10px] text-primary font-bold">8</span>
</div>
{/* Hit 9: 10.3 */}
<div className="absolute left-[231px] top-[244px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer">
<div className="w-3.5 h-3.5 rounded-full bg-primary/70" />
<span className="absolute -top-4 font-telemetry-sm text-[10px] text-primary font-bold">9</span>
</div>
{/* Hit 10: 10.4 (Latest Shot - highlighted with telemetry box) */}
<div className="absolute left-[247px] top-[233px] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-tertiary-container/30 flex items-center justify-center cursor-pointer">
<div className="w-4 h-4 rounded-full bg-tertiary shadow-[0_0_10px_#54ddfc]" />
<div className="absolute top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-surface-container-high rounded text-tertiary font-telemetry-sm text-body-sm shadow whitespace-nowrap">
                #10: 10.4
              </div>
</div>
</div>
{/* Bottom Floating Telemetry Overlay inside video */}
<div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
<div className="flex items-center gap-space-md px-space-md py-space-xs rounded-lg bg-surface-container-lowest/80 backdrop-blur-md">
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-outline">EXTREME SPREAD</span>
<span className="font-telemetry-sm text-telemetry-sm font-bold text-tertiary">4.21 mm</span>
</div>
<div className="w-[1px] h-6 bg-surface-variant" />
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-outline">MEAN RADIUS</span>
<span className="font-telemetry-sm text-telemetry-sm font-bold text-on-surface">1.84 mm</span>
</div>
<div className="w-[1px] h-6 bg-surface-variant" />
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-outline">CALIBER EST.</span>
<span className="font-telemetry-sm text-telemetry-sm text-primary">4.498 mm (.177)</span>
</div>
</div>
<div className="px-space-md py-space-xs rounded-lg bg-surface-container-lowest/80 backdrop-blur-md text-right">
<span className="font-label-caps text-label-caps text-outline">LATENCY:</span>
<span className="font-telemetry-sm text-telemetry-sm text-tertiary font-bold ml-1">14.2 ms</span>
</div>
</div>
</div>
{/* Video & Optical Sensor Controls Toolbar */}
<div className="flex flex-wrap items-center justify-between px-space-lg py-space-md bg-surface-container-low gap-space-md">
<div className="flex items-center gap-space-sm">
{/* Illumination Toggle */}
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors" title="Toggle Target LED Lumens" type="button">
<span className="material-symbols-outlined text-primary text-[18px]">wb_incandescent</span>
<span className="font-label-caps text-label-caps uppercase">Target LED: 95%</span>
</button>
{/* Optical Zoom */}
<div className="flex items-center bg-surface-container rounded p-0.5">
<button className="px-space-md py-0.5 rounded bg-primary text-on-primary font-telemetry-sm text-body-sm font-bold" type="button">1X</button>
<button className="px-space-md py-0.5 rounded hover:bg-surface-container-high text-on-surface-variant font-telemetry-sm text-body-sm" type="button">2X</button>
<button className="px-space-md py-0.5 rounded hover:bg-surface-container-high text-on-surface-variant font-telemetry-sm text-body-sm" type="button">4X</button>
</div>
</div>
<div className="flex items-center gap-space-sm">
{/* Advance Paper Band */}
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px] text-tertiary">autorenew</span>
<span className="font-label-caps text-label-caps uppercase">Advance Paper Roll</span>
</button>
{/* Reset String Session */}
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-error transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">restart_alt</span>
<span className="font-label-caps text-label-caps uppercase">Reset String</span>
</button>
</div>
</div>
</div>
{/* Quick Motorized Carrier Telemetry Strip */}
<div className="grid grid-cols-3 gap-space-md bg-surface-container-low p-space-md rounded-xl">
<div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-lg">
<span className="material-symbols-outlined text-primary text-[24px]">straighten</span>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-outline uppercase">Carrier Distance</span>
<span className="font-telemetry-lg text-telemetry-sm font-bold text-on-surface">10.00 m</span>
</div>
</div>
<div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-lg">
<span className="material-symbols-outlined text-tertiary text-[24px]">speed</span>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-outline uppercase">Carrier Speed</span>
<span className="font-telemetry-lg text-telemetry-sm font-bold text-tertiary">0.0 m/s (LOCKED)</span>
</div>
</div>
<div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-lg">
<span className="material-symbols-outlined text-secondary-fixed-dim text-[24px]">sensors</span>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-outline uppercase">Acoustic Triangulation</span>
<span className="font-telemetry-lg text-telemetry-sm font-bold text-on-surface">SYNCED (0.01ms)</span>
</div>
</div>
</div>
</div>
{/* RIGHT 40%: Live Match Scorecard, Telemetry Table, Shooter Dossier & Motor Control */}
<div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-space-md">
{/* Shooter Profile & Match Context Card */}
<div className="bg-surface-container-low rounded-xl p-space-lg shadow-md flex flex-col gap-space-md">
<div className="flex items-start justify-between">
<div className="flex items-center gap-space-md">
<div className="relative w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden shadow-inner flex items-center justify-center text-primary font-bold font-headline-md text-headline-md">
              ER
            </div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-headline-md text-headline-md text-on-surface font-bold">{selectedLane?.shooterName || 'N/A'}</span>
<span className="px-1.5 py-0.2 bg-tertiary-container/30 text-tertiary font-label-caps text-label-caps rounded">ISSF PRO</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Bib #402 // National Target Squad</span>
</div>
</div>
<span className="px-2.5 py-1 bg-primary text-on-primary font-telemetry-sm text-telemetry-sm font-bold rounded">POS #1</span>
</div>
{/* Hardware & Match Config */}
<div className="grid grid-cols-2 gap-space-sm pt-space-xs border-t border-surface-container-high">
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-outline uppercase">Match Format</span>
<span className="font-body-md text-body-md text-on-surface font-medium">10m Air Rifle 60 Shots</span>
</div>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-outline uppercase">Equip / Pellet</span>
<span className="font-body-md text-body-md text-on-surface font-medium truncate">Walther LG400 / .177 R10</span>
</div>
</div>
</div>
{/* Live Match Scoreboard Aggregate Counter */}
<div className="bg-surface-container-low rounded-xl p-space-lg shadow-md flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-outline uppercase">Current String 1 / 6</span>
<div className="flex items-baseline gap-space-xs">
<span className="font-telemetry-lg text-[2.5rem] leading-none text-primary font-extrabold tracking-tight">{selectedLane?.totalScore?.toFixed(1) || '0.0'}</span>
<span className="font-telemetry-sm text-telemetry-sm text-outline">/ 109.0 MAX</span>
</div>
</div>
<div className="flex flex-col items-end">
<span className="font-label-caps text-label-caps text-outline uppercase">Average Decimal</span>
<span className="font-telemetry-lg text-telemetry-lg text-tertiary font-bold">10.58</span>
</div>
</div>
{/* Progress to 10 Shots Completion */}
<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between text-body-sm font-label-caps">
<span className="text-outline uppercase">String Progress</span>
<span className="text-on-surface font-bold">10 / 10 COMPLETED</span>
</div>
<div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden flex gap-0.5">
<div className="h-full bg-primary flex-1" />
<div className="h-full bg-primary flex-1" />
<div className="h-full bg-tertiary flex-1" />
<div className="h-full bg-primary flex-1" />
<div className="h-full bg-secondary flex-1" />
<div className="h-full bg-primary flex-1" />
<div className="h-full bg-primary flex-1" />
<div className="h-full bg-primary flex-1" />
<div className="h-full bg-primary flex-1" />
<div className="h-full bg-tertiary flex-1" />
</div>
</div>
</div>
{/* Shot-by-Shot Telemetry Data List Table */}
<div className="bg-surface-container-low rounded-xl shadow-md flex flex-col overflow-hidden">
<div className="px-space-lg py-space-sm bg-surface-container-lowest flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface uppercase font-bold tracking-wider">Shot Telemetry Audit</span>
<span className="font-label-caps text-label-caps text-primary">PRECISION SENSOR STREAM</span>
</div>
<div className="max-h-[260px] overflow-y-auto">
<table className="w-full text-left text-body-sm font-telemetry-sm">
<thead className="bg-surface-container-high text-outline font-label-caps text-label-caps uppercase sticky top-0 z-10">
<tr>
<th className="px-space-md py-space-xs">#</th>
<th className="px-space-md py-space-xs text-right">Score</th>
<th className="px-space-md py-space-xs">Clock</th>
<th className="px-space-md py-space-xs text-right">FPS</th>
<th className="px-space-md py-space-xs text-right">Split</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container-high/40">
<tr className="hover:bg-surface-container transition-colors">
<td className="px-space-md py-space-xs text-on-surface font-bold">10</td>
<td className="px-space-md py-space-xs text-right font-bold text-tertiary">10.4</td>
<td className="px-space-md py-space-xs text-on-surface-variant">02:15</td>
<td className="px-space-md py-space-xs text-right text-on-surface">584</td>
<td className="px-space-md py-space-xs text-right text-outline">18.4s</td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-space-md py-space-xs text-on-surface font-bold">09</td>
<td className="px-space-md py-space-xs text-right font-bold text-primary">10.3</td>
<td className="px-space-md py-space-xs text-on-surface-variant">08:45</td>
<td className="px-space-md py-space-xs text-right text-on-surface">582</td>
<td className="px-space-md py-space-xs text-right text-outline">21.1s</td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-space-md py-space-xs text-on-surface font-bold">08</td>
<td className="px-space-md py-space-xs text-right font-bold text-primary">10.4</td>
<td className="px-space-md py-space-xs text-on-surface-variant">04:30</td>
<td className="px-space-md py-space-xs text-right text-on-surface">581</td>
<td className="px-space-md py-space-xs text-right text-outline">19.8s</td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-space-md py-space-xs text-on-surface font-bold">07</td>
<td className="px-space-md py-space-xs text-right font-bold text-primary">10.6</td>
<td className="px-space-md py-space-xs text-on-surface-variant">10:00</td>
<td className="px-space-md py-space-xs text-right text-on-surface">585</td>
<td className="px-space-md py-space-xs text-right text-outline">22.3s</td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-space-md py-space-xs text-on-surface font-bold">06</td>
<td className="px-space-md py-space-xs text-right font-bold text-primary">10.8</td>
<td className="px-space-md py-space-xs text-on-surface-variant">01:00</td>
<td className="px-space-md py-space-xs text-right text-on-surface">583</td>
<td className="px-space-md py-space-xs text-right text-outline">17.2s</td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-space-md py-space-xs text-on-surface font-bold">05</td>
<td className="px-space-md py-space-xs text-right font-bold text-secondary">9.9</td>
<td className="px-space-md py-space-xs text-on-surface-variant">09:10</td>
<td className="px-space-md py-space-xs text-right text-on-surface">579</td>
<td className="px-space-md py-space-xs text-right text-outline">25.0s</td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-space-md py-space-xs text-on-surface font-bold">04</td>
<td className="px-space-md py-space-xs text-right font-bold text-primary">10.2</td>
<td className="px-space-md py-space-xs text-on-surface-variant">03:30</td>
<td className="px-space-md py-space-xs text-right text-on-surface">584</td>
<td className="px-space-md py-space-xs text-right text-outline">20.4s</td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-space-md py-space-xs text-on-surface font-bold">03</td>
<td className="px-space-md py-space-xs text-right font-bold text-tertiary">10.9 ★</td>
<td className="px-space-md py-space-xs text-on-surface-variant">12:00</td>
<td className="px-space-md py-space-xs text-right text-on-surface">582</td>
<td className="px-space-md py-space-xs text-right text-outline">16.8s</td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-space-md py-space-xs text-on-surface font-bold">02</td>
<td className="px-space-md py-space-xs text-right font-bold text-primary">10.5</td>
<td className="px-space-md py-space-xs text-on-surface-variant">06:00</td>
<td className="px-space-md py-space-xs text-right text-on-surface">583</td>
<td className="px-space-md py-space-xs text-right text-outline">18.9s</td>
</tr>
<tr className="hover:bg-surface-container transition-colors">
<td className="px-space-md py-space-xs text-on-surface font-bold">01</td>
<td className="px-space-md py-space-xs text-right font-bold text-primary">10.7</td>
<td className="px-space-md py-space-xs text-on-surface-variant">11:30</td>
<td className="px-space-md py-space-xs text-right text-on-surface">586</td>
<td className="px-space-md py-space-xs text-right text-outline">--</td>
</tr>
</tbody>
</table>
</div>
</div>
{/* Target Carrier Motor Direct Triggers */}
<div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
<span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Target Trolley Motor Comm</span>
<div className="grid grid-cols-3 gap-space-sm">
<button className="flex flex-col items-center justify-center p-space-sm rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-primary text-[20px]">keyboard_double_arrow_left</span>
<span className="font-label-caps text-label-caps uppercase mt-1">Baffle (0m)</span>
</button>
<button className="flex flex-col items-center justify-center p-space-sm rounded-lg bg-primary-container text-on-primary-container font-bold shadow transition-colors" type="button">
<span className="material-symbols-outlined text-[20px]">my_location</span>
<span className="font-label-caps text-label-caps uppercase mt-1">Set 10m (Active)</span>
</button>
<button className="flex flex-col items-center justify-center p-space-sm rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_right</span>
<span className="font-label-caps text-label-caps uppercase mt-1">Send 25m</span>
</button>
</div>
</div>
{/* Match Administrative Action Buttons */}
<div className="flex items-center gap-space-sm pt-space-xs">
<button className="flex-1 flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px] text-outline">edit_note</span>
<span className="font-label-caps text-label-caps uppercase">Manual Rescore</span>
</button>
<button className="flex-1 flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-tertiary-container text-on-tertiary-container font-semibold transition-colors shadow" type="button">
<span className="material-symbols-outlined text-[18px]">verified</span>
<span className="font-label-caps text-label-caps uppercase">Confirm String</span>
</button>
<button className="flex items-center justify-center p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors" title="Export ISSF PDF" type="button">
<span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
</button>
</div>
</div>
</div>
</div>
    </div>
  );
}

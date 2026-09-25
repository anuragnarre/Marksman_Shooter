import React from 'react';
import { useLiveVision } from '@/hooks/useLiveVision';

export function LiveVisionLight() {
  const { lanes, isLoading, selectedLaneId, setSelectedLaneId, wsStatus } = useLiveVision("1");
  const selectedLane = lanes.find(l => l.id === selectedLaneId) || lanes[0];

  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-10">
      <div className="flex flex-col w-full pb-10">
{/* TOP STATUS & LANE SELECTOR STRIP */}
<div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-2 border-b border-surface-container"><div className="flex flex-col gap-1"><div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-bold uppercase tracking-wider">FACILITY SYS // REV 4.2</span><span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" /> BALLISTICS TELEMETRY SYNCED</span></div><h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">Live Vision Scoring &amp; Optical Ballistics</h1></div><div className="flex items-center gap-2"><button className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg font-label-md text-label-md font-semibold border border-surface-container shadow-sm transition-colors" type="button"><span className="material-symbols-outlined text-[18px]">tune</span><span className="">CALIBRATE OPTICS</span></button>
          {isLoading ? (
            <div className="flex items-center px-4 py-2 text-on-surface-variant font-label-caps">Loading lanes...</div>
          ) : lanes.length === 0 ? (
            <div className="flex items-center px-4 py-2 text-on-surface-variant font-label-caps">No active lanes</div>
          ) : (
            lanes.map((lane: any) => {
              const isActive = lane.id === selectedLaneId;
              return (
                <button key={lane.id} onClick={() => setSelectedLaneId(lane.id)} className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors ${isActive ? 'bg-surface-container-high border-b-2 border-primary' : 'bg-surface-container hover:bg-surface-container-high'}`} type="button">
                  <div className="flex flex-col text-left">
                    <span className={`font-label-lg text-label-lg tracking-wider ${isActive ? 'font-bold text-primary' : 'text-on-surface'}`}>{lane.name}</span>
                    <span className={`font-label-sm text-label-sm ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>{lane.shooterName || 'No Shooter'}</span>
                  </div>
                  {lane.status === 'ACTIVE' ? (
                    <span className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-bold ${isActive ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                      {lane.lastShotScore ? lane.lastShotScore.toFixed(1) : 'LIVE'}
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-bold ${lane.status === 'IDLE' ? 'bg-surface-variant text-on-surface-variant' : 'bg-error/10 text-error'}`}>
                      {lane.status}
                    </span>
                  )}
                </button>
              );
            })
          )}
{/* Quick Add Lane */}
<button className="flex items-center gap-1.5 px-3 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface-variant rounded-lg transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">add</span>
<span className="font-label-md text-label-md uppercase">Add Lane</span>
</button>
</div>
{/* Emergency Operational Ceasefire & Quick Modes */}
<div className="flex items-center gap-3 shrink-0">
<div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-lg">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Scoring Mode:</span>
<span className="font-label-md text-label-md text-on-surface font-semibold">ISSF ELECTRONIC DECIMAL</span>
</div>
<button className="flex items-center gap-2 px-4 py-2.5 bg-error hover:bg-error/90 text-on-error rounded-lg transition-transform active:scale-95 shadow-md" id="ceasefireBtn" type="button">
<span className="material-symbols-outlined text-[20px]">report_problem</span>
<span className="font-label-lg text-label-lg font-bold tracking-wider">LANE CEASEFIRE</span>
</button>
</div>
</div>
</div>
{/* MAIN OPERATIONAL SCORING GRID */}
<div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
{/* LEFT PANEL: 60% (7/12) COMPUTER VISION TARGET CANVAS */}
<div className="xl:col-span-7 flex flex-col gap-4">
{/* Video Target Feed Card */}
<div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 flex flex-col gap-4">
{/* Header Info Bar */}
<div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-4 py-2.5 rounded-lg">
<div className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-[20px]">videocam</span>
<div className="flex flex-col">
<span className="font-label-lg text-label-lg text-on-surface font-semibold">CAM-{selectedLane?.id || 'L01'}: High-FPS USB Sensor</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">STREAM: RTSP 1080p @ 120FPS // {wsStatus === "CONNECTED" ? "LIVE WS" : "MOCKED WS"}</span>
</div>
</div>
<div className="flex items-center gap-2">
<div className="flex items-center gap-1.5 px-2 py-1 bg-surface-container rounded font-label-sm text-label-sm text-on-surface-variant">
<span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
<span className="">LIVE CV 120 FPS</span>
</div>
<div className="px-2 py-1 bg-surface-container rounded font-label-sm text-label-sm text-on-surface-variant">
              LATENCY: <strong className="text-on-surface">14ms</strong>
</div>
</div>
</div>
{/* Simulated Computer Vision Feed Target Canvas */}
<div className="relative w-full aspect-square max-h-[580px] bg-surface-container-low rounded-xl flex items-center justify-center overflow-hidden group select-none">
{/* Background Grid Coordinate Pattern */}
<div className="absolute inset-0 bg-[radial-gradient(#c6c6cd_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
{/* Video Camera HUD Overlay Corners */}
<div className="absolute top-4 left-4 flex flex-col gap-0.5 pointer-events-none">
<div className="flex items-center gap-2">
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold tracking-widest">[RECOGNITION: ACTIVE]</span>
<span className="text-on-tertiary-container font-label-sm text-label-sm">● TRACKING 10/10</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">EXPOSURE: 1/8000s | APERTURE: f/2.8</span>
</div>
<div className="absolute top-4 right-4 flex flex-col items-end gap-0.5 pointer-events-none">
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold">CALIBRE: .177 (4.50mm)</span>
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">ZERO LOCK: ΔX +0.02mm / ΔY -0.01mm</span>
</div>
{/* Crosshair Center Reference Reticle */}
<div className="absolute inset-x-0 top-1/2 h-[1px] bg-primary/20 pointer-events-none" />
<div className="absolute inset-y-0 left-1/2 w-[1px] bg-primary/20 pointer-events-none" />
{/* Target Concentric Rings SVG ISSF Spec */}
<div className="relative w-[90%] max-w-[500px] aspect-square flex items-center justify-center">
<svg className="w-full h-full drop-shadow-md" viewBox="0 0 500 500">
{/* Ring 1 (45.5mm target card outer) */}
<circle cx="250" cy="250" fill="#f8f9ff" r="230" stroke="#76777d" strokeWidth="1.2" />
{/* Ring 2 */}
<circle cx="250" cy="250" fill="#f8f9ff" r="205" stroke="#76777d" strokeWidth="1.2" />
{/* Ring 3 */}
<circle cx="250" cy="250" fill="#eff4ff" r="180" stroke="#76777d" strokeWidth="1.2" />
{/* Ring 4: Black bullseye begins at Ring 4/4.5 for 10m ISSF rifle */}
<circle cx="250" cy="250" fill="#131b2e" r="154" stroke="#131b2e" strokeWidth="1" />
{/* Ring 5 inside black */}
<circle cx="250" cy="250" fill="none" r="128" stroke="#7c839b" strokeDasharray="3 2" strokeWidth="0.8" />
{/* Ring 6 inside black */}
<circle cx="250" cy="250" fill="none" r="102" stroke="#7c839b" strokeWidth="0.8" />
{/* Ring 7 inside black */}
<circle cx="250" cy="250" fill="none" r="76" stroke="#7c839b" strokeWidth="0.8" />
{/* Ring 8 inside black */}
<circle cx="250" cy="250" fill="none" r="50" stroke="#7c839b" strokeWidth="0.8" />
{/* Ring 9 inside black */}
<circle cx="250" cy="250" fill="none" r="28" stroke="#7c839b" strokeWidth="0.8" />
{/* Ring 10 Center White Dot ring (0.5mm ISSF 10-dot) */}
<circle cx="250" cy="250" fill="#ffffff" r="9" />
{/* Inner Ten center point */}
<circle cx="250" cy="250" fill="#000000" r="2.2" />
{/* Number Labels Ring 1 - 8 (White & Dark labels) */}
<text fill="#45464d" fontFamily="JetBrains Mono" fontSize="11" textAnchor="middle" x="250" y="32">1</text>
<text fill="#45464d" fontFamily="JetBrains Mono" fontSize="11" textAnchor="middle" x="250" y="58">2</text>
<text fill="#45464d" fontFamily="JetBrains Mono" fontSize="11" textAnchor="middle" x="250" y="82">3</text>
<text fill="#bec6e0" fontFamily="JetBrains Mono" fontSize="11" textAnchor="middle" x="250" y="112">4</text>
<text fill="#bec6e0" fontFamily="JetBrains Mono" fontSize="11" textAnchor="middle" x="250" y="137">5</text>
<text fill="#bec6e0" fontFamily="JetBrains Mono" fontSize="11" textAnchor="middle" x="250" y="162">6</text>
<text fill="#bec6e0" fontFamily="JetBrains Mono" fontSize="11" textAnchor="middle" x="250" y="188">7</text>
<text fill="#bec6e0" fontFamily="JetBrains Mono" fontSize="11" textAnchor="middle" x="250" y="213">8</text>
{/* Dispersion Ellipse (Shot Grouping Algorithm Overlaid) */}
<ellipse cx="251" cy="248" fill="none" opacity="0.85" rx="22" ry="19" stroke="#fe932c" strokeDasharray="4 3" strokeWidth="1.5" />
{/* Detected Pellet Strikes (4.50mm / .177 scaled relative circles) with CV identification tags */}
{/* Shot #1: 10.7 (X: +2.1, Y: -1.2) */}
<g className="shot-point cursor-pointer group/shot" data-shot="1" data-val="10.7">
<circle cx="255" cy="247" fill="#dce9ff" fillOpacity="0.3" r="8" stroke="#069669" strokeWidth="1.5" />
<circle cx="255" cy="247" fill="#069669" r="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" x="265" y="244">#1 10.7</text>
</g>
{/* Shot #2: 10.5 (X: -3.8, Y: +2.5) */}
<g className="shot-point cursor-pointer group/shot" data-shot="2" data-val="10.5">
<circle cx="242" cy="256" fill="#dce9ff" fillOpacity="0.3" r="8" stroke="#069669" strokeWidth="1.5" />
<circle cx="242" cy="256" fill="#069669" r="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" x="220" y="267">#2 10.5</text>
</g>
{/* Shot #3: 10.9 (Dead center X: 0, Y: -0.4) */}
<g className="shot-point cursor-pointer group/shot" data-shot="3" data-val="10.9">
<circle cx="250" cy="249" fill="#85f8c4" fillOpacity="0.35" r="8" stroke="#069669" strokeWidth="2" />
<circle cx="250" cy="249" fill="#000000" r="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" x="238" y="238">#3 10.9★</text>
</g>
{/* Shot #4: 10.2 (X: +8.2, Y: +4.0) */}
<g className="shot-point cursor-pointer group/shot" data-shot="4" data-val="10.2">
<circle cx="268" cy="259" fill="#dce9ff" fillOpacity="0.3" r="8" stroke="#069669" strokeWidth="1.5" />
<circle cx="268" cy="259" fill="#069669" r="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" x="278" y="262">#4 10.2</text>
</g>
{/* Shot #5: 9.9 (X: -16.0, Y: -11.0) - High left flier */}
<g className="shot-point cursor-pointer group/shot" data-shot="5" data-val="9.9">
<circle cx="218" cy="228" fill="#ffdad6" fillOpacity="0.4" r="8" stroke="#ba1a1a" strokeWidth="1.5" />
<circle cx="218" cy="228" fill="#ba1a1a" r="1.5" />
<text fill="#ba1a1a" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" x="190" y="224">#5 9.9</text>
</g>
{/* Shot #6: 10.8 (X: -1.5, Y: -2.1) */}
<g className="shot-point cursor-pointer group/shot" data-shot="6" data-val="10.8">
<circle cx="247" cy="245" fill="#dce9ff" fillOpacity="0.3" r="8" stroke="#069669" strokeWidth="1.5" />
<circle cx="247" cy="245" fill="#069669" r="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" x="227" y="247">#6 10.8</text>
</g>
{/* Shot #7: 10.6 (X: +4.0, Y: -5.0) */}
<g className="shot-point cursor-pointer group/shot" data-shot="7" data-val="10.6">
<circle cx="258" cy="240" fill="#dce9ff" fillOpacity="0.3" r="8" stroke="#069669" strokeWidth="1.5" />
<circle cx="258" cy="240" fill="#069669" r="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" x="268" y="236">#7 10.6</text>
</g>
{/* Shot #8: 10.4 (X: -7.0, Y: -1.0) */}
<g className="shot-point cursor-pointer group/shot" data-shot="8" data-val="10.4">
<circle cx="236" cy="248" fill="#dce9ff" fillOpacity="0.3" r="8" stroke="#069669" strokeWidth="1.5" />
<circle cx="236" cy="248" fill="#069669" r="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" x="206" y="250">#8 10.4</text>
</g>
{/* Shot #9: 10.8 (X: +2.0, Y: +1.0) */}
<g className="shot-point cursor-pointer group/shot" data-shot="9" data-val="10.8">
<circle cx="254" cy="252" fill="#dce9ff" fillOpacity="0.3" r="8" stroke="#069669" strokeWidth="1.5" />
<circle cx="254" cy="252" fill="#069669" r="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" x="264" y="256">#9 10.8</text>
</g>
{/* Shot #10: 10.9 (Center Inner Ten X: -0.2, Y: +0.6) */}
<g className="shot-point cursor-pointer group/shot" data-shot="10" data-val="10.9">
<circle cx="249" cy="251" fill="#85f8c4" fillOpacity="0.4" r="8" stroke="#069669" strokeWidth="2" />
<circle cx="249" cy="251" fill="#000000" r="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="9" fontWeight="bold" textAnchor="middle" x="249" y="272">#10 10.9★ (LATEST)</text>
</g>
</svg>
</div>
{/* Bottom Floating HUD Quick Legend & Group Metrics */}
<div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
<div className="flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm">
<span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
<span className="font-label-sm text-label-sm text-on-surface font-semibold">GROUPING: 4.2mm EXTREME SPREAD</span>
<span className="text-on-surface-variant font-label-sm text-label-sm ml-2">MEAN RAD: 1.8mm</span>
</div>
<div className="flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm">
<span className="font-label-sm text-label-sm text-on-tertiary-container font-bold">10/10 SHOTS CONFIRMED</span>
</div>
</div>
</div>
{/* Video Sensor Bottom Control Bar */}
<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
{/* Left: Optical Tools */}
<div className="flex items-center gap-2">
{/* Zoom Segmented Buttons */}
<div className="inline-flex bg-surface-container-low rounded-lg p-1">
<button className="px-3 py-1 text-on-primary bg-primary rounded font-label-md text-label-md font-bold transition-colors" type="button">1X</button>
<button className="px-3 py-1 text-on-surface-variant hover:text-on-surface rounded font-label-md text-label-md transition-colors" type="button">2X</button>
<button className="px-3 py-1 text-on-surface-variant hover:text-on-surface rounded font-label-md text-label-md transition-colors" type="button">4X</button>
</div>
{/* Illumination Toggle */}
<button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container rounded-lg text-on-surface font-label-md text-label-md transition-colors" id="lightToggleBtn" type="button">
<span className="material-symbols-outlined text-[16px] text-secondary">wb_sunny</span>
<span className="">LIGHT: 100%</span>
</button>
{/* Contrast Enhancer */}
<button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container rounded-lg text-on-surface font-label-md text-label-md transition-colors" type="button">
<span className="material-symbols-outlined text-[16px] text-on-surface-variant">contrast</span>
<span className="">FILTER: EDGE-DET</span>
</button>
</div>
{/* Right: Roll Paper & Target Reset */}
<div className="flex items-center gap-2">
<button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg font-label-md text-label-md transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">receipt</span>
<span className="">ADVANCE PAPER ROLL (12cm)</span>
</button>
<button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-error rounded-lg font-label-md text-label-md transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">restart_alt</span>
<span className="">RESET STRING</span>
</button>
</div>
</div>
</div>
{/* Live Environmental Crosswind & Ballistic Chronograph Bar */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
<div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col gap-1">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Target Plane Temp</span>
<div className="flex items-baseline justify-between">
<span className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface">21.8°C</span>
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">STABLE</span>
</div>
<div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1">
<div className="bg-on-tertiary-container h-full w-[65%]" />
</div>
</div>
<div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col gap-1">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Downrange Lux</span>
<div className="flex items-baseline justify-between">
<span className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface">1,840 LX</span>
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">OPTIMAL</span>
</div>
<div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1">
<div className="bg-secondary-container h-full w-[82%]" />
</div>
</div>
<div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col gap-1">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Avg Chronograph</span>
<div className="flex items-baseline justify-between">
<span className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface">582.4 FPS</span>
<span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">177.5 m/s</span>
</div>
<div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1">
<div className="bg-primary h-full w-[94%]" />
</div>
</div>
<div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col gap-1">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Standard Dev (SD)</span>
<div className="flex items-baseline justify-between">
<span className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface">1.2 FPS</span>
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">SUB-MOA</span>
</div>
<div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1">
<div className="bg-on-tertiary-container h-full w-[30%]" />
</div>
</div>
</div>
</div>
{/* RIGHT PANEL: 40% (5/12) TELEMETRY & SCORECARD */}
<div className="xl:col-span-5 flex flex-col gap-4">
{/* Current Shooter & Match Overview Card */}
<div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 flex flex-col gap-4">
<div className="flex items-start justify-between">
<div className="flex items-center gap-3">
<div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary font-headline-md text-headline-md font-bold">
              ER
            </div>
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-bold">{selectedLane?.shooterName || 'N/A'}</span>
<span className="px-1.5 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded font-label-sm text-label-sm font-bold">#402</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">ISSF 10m Air Rifle · Senior Championship</span>
</div>
</div>
<div className="flex flex-col items-end">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Rank</span>
<span className="font-telemetry-lg text-telemetry-lg font-bold text-secondary">1st Place</span>
</div>
</div>
{/* Hardware & Session Parameters Grid */}
<div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-lg">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Rifle Model</span>
<span className="font-label-md text-label-md text-on-surface font-semibold">Walther LG400 Anatomic</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Pellet Spec</span>
<span className="font-label-md text-label-md text-on-surface font-semibold">RWS R10 Match 4.49mm</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Series Progress</span>
<span className="font-label-md text-label-md text-on-surface font-semibold">String 1 / 6 (10 of 60)</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Remaining Clock</span>
<span className="font-label-md text-label-md text-on-surface font-bold">54:18 MIN</span>
</div>
</div>
{/* Total String Score Large Callout */}
<div className="bg-primary text-on-primary rounded-xl p-4 flex items-center justify-between shadow-sm">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-primary-fixed-dim tracking-wider">String 01 Decimal Score</span>
<div className="flex items-baseline gap-2">
<span className="font-telemetry-xl text-telemetry-xl font-bold tracking-tight">{selectedLane?.totalScore?.toFixed(1) || '0.0'}</span>
<span className="font-label-md text-label-md text-primary-fixed-dim">/ 109.0 MAX</span>
</div>
</div>
<div className="flex flex-col items-end border-l border-on-primary-fixed-variant pl-4">
<span className="font-label-sm text-label-sm uppercase text-primary-fixed-dim">Shot Mean</span>
<span className="font-telemetry-lg text-telemetry-lg font-bold text-on-tertiary-fixed">10.58</span>
<span className="font-label-sm text-label-sm text-tertiary-fixed-dim">7 Inner Tens (★)</span>
</div>
</div>
</div>
{/* Shot-by-Shot Telemetry Table Card */}
<div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Live String Telemetry</span>
<span className="px-2 py-0.5 bg-surface-container rounded-full font-label-sm text-label-sm font-semibold text-on-surface-variant">10 Shots</span>
</div>
<div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-on-tertiary-container" /> ≥10.5</span>
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary-container" /> 10.0-10.4</span>
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error" /> &lt;10.0</span>
</div>
</div>
{/* Scrollable Shot Details Table */}
<div className="overflow-x-auto">
<table className="w-full text-left text-on-surface">
<thead>
<tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
<th className="py-2 px-3 rounded-l">Shot #</th>
<th className="py-2 px-3">Decimal</th>
<th className="py-2 px-3">Ring</th>
<th className="py-2 px-3">Clock / Vector</th>
<th className="py-2 px-3">Chrono</th>
<th className="py-2 px-3 rounded-r text-right">Split</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container font-label-md text-label-md">
<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-2 px-3 font-bold text-on-surface-variant">#01</td>
<td className="py-2 px-3 font-bold text-on-tertiary-container">10.7 ★</td>
<td className="py-2 px-3">Ring 10</td>
<td className="py-2 px-3 text-on-surface-variant">01:30 (NE)</td>
<td className="py-2 px-3">583 FPS</td>
<td className="py-2 px-3 text-right text-on-surface-variant">--</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-2 px-3 font-bold text-on-surface-variant">#02</td>
<td className="py-2 px-3 font-bold text-on-tertiary-container">10.5 ★</td>
<td className="py-2 px-3">Ring 10</td>
<td className="py-2 px-3 text-on-surface-variant">07:45 (SW)</td>
<td className="py-2 px-3">581 FPS</td>
<td className="py-2 px-3 text-right text-on-surface-variant">16.4s</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-2 px-3 font-bold text-on-surface-variant">#03</td>
<td className="py-2 px-3 font-bold text-on-tertiary-container">10.9 ★</td>
<td className="py-2 px-3 font-semibold">Center X</td>
<td className="py-2 px-3 text-on-surface-variant">12:00 (N)</td>
<td className="py-2 px-3">584 FPS</td>
<td className="py-2 px-3 text-right text-on-surface-variant">14.1s</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-2 px-3 font-bold text-on-surface-variant">#04</td>
<td className="py-2 px-3 font-bold text-secondary">10.2</td>
<td className="py-2 px-3">Ring 10</td>
<td className="py-2 px-3 text-on-surface-variant">04:15 (SE)</td>
<td className="py-2 px-3">582 FPS</td>
<td className="py-2 px-3 text-right text-on-surface-variant">18.0s</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors bg-error-container/20">
<td className="py-2 px-3 font-bold text-error">#05</td>
<td className="py-2 px-3 font-bold text-error">9.9</td>
<td className="py-2 px-3 text-error">Ring 9</td>
<td className="py-2 px-3 text-error font-medium">10:45 (NW)</td>
<td className="py-2 px-3">579 FPS</td>
<td className="py-2 px-3 text-right text-on-surface-variant">21.3s</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-2 px-3 font-bold text-on-surface-variant">#06</td>
<td className="py-2 px-3 font-bold text-on-tertiary-container">10.8 ★</td>
<td className="py-2 px-3">Ring 10</td>
<td className="py-2 px-3 text-on-surface-variant">11:15 (NW)</td>
<td className="py-2 px-3">583 FPS</td>
<td className="py-2 px-3 text-right text-on-surface-variant">13.8s</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-2 px-3 font-bold text-on-surface-variant">#07</td>
<td className="py-2 px-3 font-bold text-on-tertiary-container">10.6 ★</td>
<td className="py-2 px-3">Ring 10</td>
<td className="py-2 px-3 text-on-surface-variant">02:30 (NE)</td>
<td className="py-2 px-3">582 FPS</td>
<td className="py-2 px-3 text-right text-on-surface-variant">15.2s</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-2 px-3 font-bold text-on-surface-variant">#08</td>
<td className="py-2 px-3 font-bold text-secondary">10.4</td>
<td className="py-2 px-3">Ring 10</td>
<td className="py-2 px-3 text-on-surface-variant">09:00 (W)</td>
<td className="py-2 px-3">583 FPS</td>
<td className="py-2 px-3 text-right text-on-surface-variant">17.7s</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-2 px-3 font-bold text-on-surface-variant">#09</td>
<td className="py-2 px-3 font-bold text-on-tertiary-container">10.8 ★</td>
<td className="py-2 px-3">Ring 10</td>
<td className="py-2 px-3 text-on-surface-variant">03:00 (E)</td>
<td className="py-2 px-3">585 FPS</td>
<td className="py-2 px-3 text-right text-on-surface-variant">12.5s</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors bg-surface-container-low">
<td className="py-2 px-3 font-bold text-on-surface-variant">#10</td>
<td className="py-2 px-3 font-bold text-on-tertiary-container">10.9 ★</td>
<td className="py-2 px-3 font-semibold">Center X</td>
<td className="py-2 px-3 text-on-surface-variant">06:00 (S)</td>
<td className="py-2 px-3">582 FPS</td>
<td className="py-2 px-3 text-right text-on-surface-variant">14.2s</td>
</tr>
</tbody>
</table>
</div>
</div>
{/* Target Carrier Transport & Hardware Controls */}
<div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 flex flex-col gap-4">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Target Carrier Hardware</span>
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" /> TROLLEY ONLINE (10.00m)
          </span>
</div>
<div className="grid grid-cols-3 gap-2">
<button className="flex flex-col items-center justify-center p-3 bg-surface-container-low hover:bg-surface-container rounded-lg text-on-surface transition-colors gap-1 text-center" type="button">
<span className="material-symbols-outlined text-[20px] text-primary">replay</span>
<span className="font-label-md text-label-md font-semibold">RECALL</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">To Baffle (0m)</span>
</button>
<button className="flex flex-col items-center justify-center p-3 bg-primary-container text-on-primary rounded-lg transition-colors gap-1 text-center" type="button">
<span className="material-symbols-outlined text-[20px] text-on-primary-container">arrow_forward</span>
<span className="font-label-md text-label-md font-semibold">SEND 10m</span>
<span className="font-label-sm text-label-sm text-primary-fixed-dim">Olympic Spec</span>
</button>
<button className="flex flex-col items-center justify-center p-3 bg-surface-container-low hover:bg-surface-container rounded-lg text-on-surface transition-colors gap-1 text-center" type="button">
<span className="material-symbols-outlined text-[20px] text-on-surface-variant">double_arrow</span>
<span className="font-label-md text-label-md font-semibold">SEND 25m</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Benchrest</span>
</button>
</div>
{/* Manual Score Correction & Official Export Footer Actions */}
<div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-container">
<button className="flex-1 min-w-[120px] px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">edit_note</span>
<span className="">MANUAL RESCORE</span>
</button>
<button className="flex-1 min-w-[120px] px-3 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm" type="button">
<span className="material-symbols-outlined text-[16px]">check_circle</span>
<span className="">CONFIRM STRING</span>
</button>
<button className="p-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg transition-colors" title="Export ISSF Certified PDF Score Record" type="button">
<span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
</button>
</div>
</div>
</div>
</div>
</div>
  );
}

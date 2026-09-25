import React, { useState } from 'react';
import { useLiveVision } from '@/hooks/useLiveVision';

export function CameraConfigDark() {
  const { lanes, isLoading, selectedLaneId, setSelectedLaneId } = useLiveVision("1");
  const selectedLane = lanes.find(l => l.id === selectedLaneId) || lanes[0];

  const [glareThreshold, setGlareThreshold] = useState(68);
  const [contrast, setContrast] = useState(82);
  const [edgeSensitivity, setEdgeSensitivity] = useState(15); // 0.15mm as 15
  const [diameter, setDiameter] = useState(45); // 4.5mm as 45
  const [showSimulatedStrike, setShowSimulatedStrike] = useState(false);

  const getDiameterLabel = (val: number) => {
    if (val === 45) return ".177 (4.50 mm)";
    if (val === 55) return ".22 (5.50 mm)";
    if (val === 63) return ".25 (6.35 mm)";
    return `${(val / 10).toFixed(2)} mm`;
  };
  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-10">
      <div className="flex flex-col w-full gap-space-lg text-on-surface">
{/* Header Bar */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-low shadow-sm">
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-space-xs text-primary font-label-caps text-label-caps tracking-widest uppercase">
<span className="material-symbols-outlined text-[16px]">tune</span>
<span>Hardware &amp; Optic Matrix</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight truncate">
        Lane Architecture &amp; Computer Vision Camera Pairing
      </h1>
<p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
        Manage range physical lanes, assign camera sources (USB, Webcams, Android IP Stream), and calibrate target detection matrices.
      </p>
</div>
<div className="flex items-center gap-space-md flex-shrink-0">
<button className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors shadow-sm font-label-caps text-label-caps uppercase" type="button">
<span className="material-symbols-outlined text-[18px] text-tertiary">science</span>
<span>Run Global Calibration Test</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container transition-colors shadow-sm font-label-caps text-label-caps uppercase font-bold" type="button">
<span className="material-symbols-outlined text-[18px]">add_box</span>
<span>+ Add New Lane</span>
</button>
</div>
</div>
{/* Main Split Layout (45% / 55%) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
{/* Left Column: Configured Lanes Management (45% -> 5.4 cols -> 5 cols lg) */}
<div className="lg:col-span-5 flex flex-col gap-space-lg min-w-0">
{/* Lane Selection Card Stack */}
<div className="flex flex-col rounded-xl bg-surface-container-low p-space-md gap-space-md shadow-sm">
<div className="flex items-center justify-between px-space-xs">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-[20px]">grid_view</span>
<span className="font-headline-md text-headline-md text-on-surface">Registered Range Bays</span>
</div>
<span className="font-telemetry-sm text-telemetry-sm text-outline">4 CONFIGURED</span>
</div>
<div className="flex flex-col gap-space-sm" id="lane-list-container">

          {isLoading ? (
            <div className="px-4 py-3 text-on-surface-variant font-label-caps">Loading lanes...</div>
          ) : lanes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px] mb-2 opacity-40">videocam_off</span>
              <span className="font-label-caps text-label-caps">No lanes configured yet.</span>
            </div>
          ) : (
            lanes.map((lane: any) => {
              const isActive = lane.id === selectedLaneId;
              return (
                <div
                  key={lane.id}
                  onClick={() => setSelectedLaneId(lane.id)}
                  className={`relative group flex flex-col gap-space-xs p-space-md rounded-lg transition-colors cursor-pointer ${isActive ? 'bg-surface-container-high shadow-md' : 'bg-surface-container hover:bg-surface-container-high'}`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm pl-space-sm">
                      <span className={`font-telemetry-sm text-telemetry-sm font-bold ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                        {lane.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-label-caps text-label-caps font-bold uppercase text-[0.65rem] ${
                        lane.status === 'ACTIVE' ? 'bg-primary/20 text-primary' :
                        lane.status === 'MAINTENANCE' ? 'bg-error/20 text-error' :
                        'bg-surface-container-highest text-outline'
                      }`}>
                        {lane.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded bg-surface-container-highest hover:text-primary text-on-surface-variant flex items-center" title="Edit Lane" type="button">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm pl-space-sm">
                    <span className="material-symbols-outlined text-outline text-[16px]">videocam</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {lane.cameraId ? `CAM: ${lane.cameraId}` : 'No camera assigned'}
                    </span>
                    {lane.status === 'ACTIVE' && (
                      <span className="ml-auto flex items-center gap-1 font-label-caps text-label-caps text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

</div>
</div>
</div>{/* Right Column: Live Camera Stream Calibration Studio (55% -> 7 cols lg) */}
<div className="lg:col-span-7 flex flex-col gap-space-lg min-w-0">
{/* Studio Card Container */}
<div className="flex flex-col rounded-xl bg-surface-container-low p-space-md gap-space-md shadow-sm">
{/* Viewport Top Status Bar */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
<div className="flex items-center gap-space-sm min-w-0">
<span className="w-3 h-3 rounded-full bg-primary animate-ping" />
<div className="flex flex-col min-w-0">
<span className="font-headline-md text-headline-md text-on-surface truncate">{selectedLane?.name || 'Lane'} - Android Stream</span>
<span className="font-label-caps text-label-caps text-outline truncate">GALAXY S21 COMPANION APP // 1080P60 RTSP LIVE</span>
</div>
</div>
<div className="flex items-center gap-space-sm flex-shrink-0">
<span className="px-space-sm py-0.5 rounded bg-surface-container-high font-telemetry-sm text-telemetry-sm text-tertiary">LATENCY: 18ms</span>
<span className="px-space-sm py-0.5 rounded bg-surface-container-high font-telemetry-sm text-telemetry-sm text-primary">HOMOGRAPHY: 99.8%</span>
</div>
</div>
{/* Vision Calibration Viewport */}
<div className="relative w-full aspect-video rounded-lg bg-surface-container-lowest overflow-hidden flex items-center justify-center select-none group">
{/* Background Target Canvas Representation */}
<div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest via-surface-container-low to-surface-container-lowest opacity-90" />
{/* ISSF 10m Air Rifle Target Simulation with concentric scoring rings */}
<div className="relative w-72 h-72 rounded-full bg-surface-container-high flex items-center justify-center shadow-2xl">
<div className="w-60 h-60 rounded-full bg-surface-container flex items-center justify-center">
<div className="w-48 h-48 rounded-full bg-surface-dim flex items-center justify-center">
<div className="w-36 h-36 rounded-full bg-surface-container-lowest flex items-center justify-center">
{/* Bullseye (Ring 10 to 10.9) */}
<div className="w-16 h-16 rounded-full bg-on-surface-variant flex items-center justify-center relative">
<span className="w-2 h-2 rounded-full bg-on-background" />
{/* 10.9 Crosshair Centering */}
<div className="absolute w-24 h-0.5 bg-primary/70" />
<div className="absolute h-24 w-0.5 bg-primary/70" />
</div>
</div>
</div>
</div>
{/* Concentric Ring Score Labels */}
<span className="absolute top-2 font-telemetry-sm text-[10px] text-outline">4</span>
<span className="absolute bottom-2 font-telemetry-sm text-[10px] text-outline">4</span>
<span className="absolute left-3 font-telemetry-sm text-[10px] text-outline">4</span>
<span className="absolute right-3 font-telemetry-sm text-[10px] text-outline">4</span>
</div>
{/* Active Keystone Homography Mesh Overlay (P1, P2, P3, P4) */}
<svg className="absolute inset-0 w-full h-full pointer-events-none stroke-tertiary stroke-1 fill-tertiary/10" preserveaspectratio="none" viewBox="0 0 100 100">
<polygon points="18,12 82,15 88,86 12,82" />
<line className="stroke-tertiary/40" strokeDasharray="2,2" x1="18" x2="88" y1="12" y2="86" />
<line className="stroke-tertiary/40" strokeDasharray="2,2" x1="82" x2="12" y1="15" y2="82" />
</svg>
{/* Simulated Shot Impact Points */}
<div className={`absolute top-[46%] left-[52%] w-3 h-3 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-on-primary shadow-sm transition-opacity duration-300 ${showSimulatedStrike ? 'opacity-100' : 'opacity-0'}`} title="Shot 1: 10.4">
            1
          </div>
<div className={`absolute top-[49%] left-[49.5%] w-3 h-3 rounded-full bg-tertiary flex items-center justify-center text-[8px] font-bold text-on-tertiary shadow-sm transition-opacity duration-300 ${showSimulatedStrike ? 'opacity-100' : 'opacity-0'}`} title="Shot 2: 10.9">
            2
          </div>
{/* Draggable Corner Anchor Nodes */}
<div className="absolute top-[10%] left-[16%] flex flex-col items-center cursor-move">
<span className="w-4 h-4 rounded-full bg-tertiary-container shadow-md flex items-center justify-center ring-2 ring-surface-dim">
<span className="w-1.5 h-1.5 rounded-full bg-on-tertiary" />
</span>
<span className="font-telemetry-sm text-[9px] text-tertiary font-bold bg-surface-container-lowest/80 px-1 rounded mt-0.5">P1 (X: 180, Y: 120)</span>
</div>
<div className="absolute top-[13%] right-[16%] flex flex-col items-center cursor-move">
<span className="w-4 h-4 rounded-full bg-tertiary-container shadow-md flex items-center justify-center ring-2 ring-surface-dim">
<span className="w-1.5 h-1.5 rounded-full bg-on-tertiary" />
</span>
<span className="font-telemetry-sm text-[9px] text-tertiary font-bold bg-surface-container-lowest/80 px-1 rounded mt-0.5">P2 (X: 820, Y: 150)</span>
</div>
<div className="absolute bottom-[12%] right-[10%] flex flex-col items-center cursor-move">
<span className="w-4 h-4 rounded-full bg-tertiary-container shadow-md flex items-center justify-center ring-2 ring-surface-dim">
<span className="w-1.5 h-1.5 rounded-full bg-on-tertiary" />
</span>
<span className="font-telemetry-sm text-[9px] text-tertiary font-bold bg-surface-container-lowest/80 px-1 rounded mt-0.5">P3 (X: 880, Y: 860)</span>
</div>
<div className="absolute bottom-[16%] left-[10%] flex flex-col items-center cursor-move">
<span className="w-4 h-4 rounded-full bg-tertiary-container shadow-md flex items-center justify-center ring-2 ring-surface-dim">
<span className="w-1.5 h-1.5 rounded-full bg-on-tertiary" />
</span>
<span className="font-telemetry-sm text-[9px] text-tertiary font-bold bg-surface-container-lowest/80 px-1 rounded mt-0.5">P4 (X: 120, Y: 820)</span>
</div>
{/* Viewport HUD Overlay Details */}
<div className="absolute bottom-2 left-2 flex items-center gap-space-xs bg-surface-container-lowest/90 backdrop-blur-md px-space-sm py-1 rounded text-outline font-telemetry-sm text-[11px]">
<span className="material-symbols-outlined text-[14px] text-tertiary">filter_tilt_shift</span>
<span>HOMOGRAPHY MATRIX INV [3x3 OK]</span>
</div>
<div className="absolute bottom-2 right-2 flex items-center gap-space-xs bg-surface-container-lowest/90 backdrop-blur-md px-space-sm py-1 rounded text-outline font-telemetry-sm text-[11px]">
<span>WARP CORRECTION: ON</span>
</div>
</div>
{/* Optical Tuning Sliders Matrix */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
{/* Glare Threshold */}
<div className="flex flex-col gap-space-xs p-space-sm rounded bg-surface-container">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps uppercase text-outline">Lighting &amp; Glare Threshold</span>
<span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">{glareThreshold}%</span>
</div>
<input className="w-full accent-primary bg-surface-container-high h-1.5 rounded cursor-pointer" max="100" min="0" type="range" value={glareThreshold} onChange={(e) => setGlareThreshold(Number(e.target.value))}/>
<span className="font-body-sm text-[11px] text-on-surface-variant">Rejects high-intensity downlight reflection on target face.</span>
</div>
{/* Paper Substrate Contrast */}
<div className="flex flex-col gap-space-xs p-space-sm rounded bg-surface-container">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps uppercase text-outline">Paper Substrate Contrast</span>
<span className="font-telemetry-sm text-telemetry-sm text-tertiary font-bold">{contrast}%</span>
</div>
<input className="w-full accent-tertiary bg-surface-container-high h-1.5 rounded cursor-pointer" max="100" min="0" type="range" value={contrast} onChange={(e) => setContrast(Number(e.target.value))}/>
<span className="font-body-sm text-[11px] text-on-surface-variant">Separates black target ink from beige fiber backing.</span>
</div>
{/* Hole Edge Sensitivity */}
<div className="flex flex-col gap-space-xs p-space-sm rounded bg-surface-container">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps uppercase text-outline">Hole Edge Sensitivity</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold">{(edgeSensitivity / 100).toFixed(2)} mm</span>
</div>
<input className="w-full accent-primary-fixed-dim bg-surface-container-high h-1.5 rounded cursor-pointer" max="100" min="5" type="range" value={edgeSensitivity} onChange={(e) => setEdgeSensitivity(Number(e.target.value))}/>
<span className="font-body-sm text-[11px] text-on-surface-variant">Sub-pixel Canny edge operator radius for clean cuts.</span>
</div>
{/* Pellet Diameter Filter */}
<div className="flex flex-col gap-space-xs p-space-sm rounded bg-surface-container">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps uppercase text-outline">Pellet Diameter Filter</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold">{getDiameterLabel(diameter)}</span>
</div>
<input className="w-full accent-tertiary-container bg-surface-container-high h-1.5 rounded cursor-pointer" max="65" min="40" type="range" value={diameter} onChange={(e) => setDiameter(Number(e.target.value))}/>
<span className="font-body-sm text-[11px] text-on-surface-variant">Ignores paper tear chips smaller than pellet standard caliber.</span>
</div>
</div>
{/* Testing & Apply Actions */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-xs">
<button 
  onClick={() => setShowSimulatedStrike(true)}
  className="w-full sm:w-auto flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-caps text-label-caps uppercase transition-colors" type="button">
<span className="material-symbols-outlined text-[18px] text-primary">flare</span>
            Simulate Pellet Strike
          </button>
<div className="w-full sm:w-auto flex items-center gap-space-sm">
<button 
  onClick={() => {
    setGlareThreshold(68);
    setContrast(82);
    setEdgeSensitivity(15);
    setDiameter(45);
    setShowSimulatedStrike(false);
  }}
  className="w-full sm:w-auto flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-label-caps text-label-caps uppercase transition-colors" type="button">
              Reset Anchors
            </button>
<button className="w-full sm:w-auto flex items-center justify-center gap-space-xs px-space-xl py-space-sm rounded bg-primary text-on-primary font-headline-md text-body-md font-bold shadow-md hover:bg-primary-fixed-dim transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">check_circle</span>
              Save &amp; Apply Calibration
            </button>
</div>
</div>
</div>
{/* Quick Companion Pairing Drawer */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-low shadow-sm">
<div className="flex items-center gap-space-md">
{/* Stylized QR Code Matrix Placeholder in pure SVG */}
<div className="w-20 h-20 bg-surface-container-lowest p-1.5 rounded flex-shrink-0 flex items-center justify-center">
<svg className="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 24 24">
<path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm12 2h2v4h-2v-4zm-2-2h2v2h-2v-2zm6 0h2v6h-2v-6zm-4 4h2v2h-2v-2zm4-6h2v2h-2v-2zm-6-2h4v2h-4v-2z" />
</svg>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-space-xs">
<span className="font-label-caps text-label-caps uppercase text-tertiary font-bold">Marksman Companion Node</span>
<span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
</div>
<span className="font-headline-md text-body-md text-on-surface">Scan to Pair Android / iOS Sensor Cam</span>
<span className="font-telemetry-sm text-body-sm text-outline truncate">rtsp://range-core.local:8080/live/lane_02_stream</span>
</div>
</div>
<div className="flex items-center gap-space-xs w-full sm:w-auto justify-end">
<button className="px-space-md py-space-sm rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-caps text-label-caps uppercase transition-colors" type="button">
            Copy RTSP URL
          </button>
<button className="px-space-md py-space-sm rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-caps text-label-caps uppercase transition-colors flex items-center gap-space-xs" type="button">
<span className="material-symbols-outlined text-[16px]">refresh</span>
            New Token
          </button>
</div>
</div>
</div>
</div>
</div>

    </div>
  );
}

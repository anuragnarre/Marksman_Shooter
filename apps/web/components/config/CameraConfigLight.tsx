import React, { useState } from 'react';
import { useLiveVision } from '@/hooks/useLiveVision';

export function CameraConfigLight() {
  const { lanes, isLoading, selectedLaneId, setSelectedLaneId } = useLiveVision("1");
  const selectedLane = lanes.find(l => l.id === selectedLaneId) || lanes[0];

  const [glareThreshold, setGlareThreshold] = useState(68);
  const [contrast, setContrast] = useState(82);
  const [edgeSensitivity, setEdgeSensitivity] = useState(0.15);
  const [diameter, setDiameter] = useState(1);
  const [showSimulatedStrike, setShowSimulatedStrike] = useState(false);

  const getDiameterLabel = (val: number) => {
    switch(val) {
      case 1: return ".177 / 4.5mm";
      case 2: return ".22 / 5.5mm";
      case 3: return ".25 / 6.35mm";
      default: return ".177 / 4.5mm";
    }
  };
  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-10">
      <div className="flex flex-col w-full pb-16">
{/* Operational Header Bar */}
<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 py-6 bg-surface-container-lowest px-8 rounded-lg shadow-sm">
<div className="flex flex-col gap-1 min-w-0">
<div className="flex items-center gap-3">
<span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold uppercase tracking-widest">FACILITY SYS // REV 4.2</span>
<span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
<span className="font-label-md text-label-md text-on-tertiary-container uppercase font-semibold tracking-wider">OPTICAL BUS SYNCHRONIZED</span>
</div>
<h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">Lane Architecture &amp; Computer Vision Camera Pairing</h1>
<p className="font-body-md text-body-md text-on-surface-variant">
        Manage range physical lanes, assign camera sources (USB, Webcams, Android IP Stream), and calibrate target detection matrices.
      </p>
</div>
<div className="flex items-center gap-3 shrink-0">
<button className="flex items-center gap-2 px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all" id="btn-global-test">
<span className="material-symbols-outlined text-[18px]">play_circle</span>
<span className="">RUN GLOBAL CALIBRATION TEST</span>
</button>
<button className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:opacity-90 transition-all" id="btn-add-lane">
<span className="material-symbols-outlined text-[18px]">add</span>
<span className="">+ ADD NEW LANE</span>
</button>
</div>
</div>
{/* Main Split Architecture */}
<div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
{/* Left Column: Configured Lanes Management (45% ~ 5/12 or 5.4 col) */}
<div className="xl:col-span-5 flex flex-col gap-5">
{/* List Controls & Filter Tiers */}
<div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-lg shadow-sm">
<div className="flex items-center gap-2">
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Configured Range Bays</span>
<span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">4 Active</span>
</div>
<div className="flex items-center gap-1 bg-surface-container p-1 rounded">
<button className="px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm font-medium shadow-sm">ALL (4)</button>
<button className="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm font-medium">10M</button>
<button className="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm font-medium">25M</button>
<button className="px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm font-medium">50M</button>
</div>
</div>
{/* Lane Cards Stack */}

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
                  className={`lane-card rounded-lg p-5 shadow-sm transition-all cursor-pointer relative ${isActive ? 'bg-gradient-to-r from-surface-container-lowest to-surface-container-low shadow-md' : 'bg-surface-container-lowest hover:bg-surface-container-low'}`}
                  data-lane={lane.laneNumber}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-container rounded-l-lg" />}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-secondary-container' : 'bg-surface-container'}`}>
                        <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-on-secondary-container' : 'text-on-surface-variant'}`}>videocam</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-lg text-label-lg text-on-surface font-bold">{lane.name}</span>
                          <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded font-bold uppercase ${
                            lane.status === 'ACTIVE' ? 'bg-primary/10 text-primary' :
                            lane.status === 'MAINTENANCE' ? 'bg-error/10 text-error' :
                            'bg-surface-container text-on-surface-variant'
                          }`}>
                            {lane.status}
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {lane.cameraId ? `Camera: ${lane.cameraId}` : 'No camera assigned'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lane.status === 'ACTIVE' && (
                        <span className="flex items-center gap-1 font-label-sm text-label-sm text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />LIVE
                        </span>
                      )}
                      <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface" type="button">
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

</div>
</div>
</div>{/* Right Column: Live Camera Stream Calibration & Alignment Studio (55% ~ 7/12) */}
<div className="xl:col-span-7 flex flex-col gap-6">
{/* Studio Header & Stream Status */}
<div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col gap-5">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 bg-surface-container-low -mx-6 -mt-6 p-6 rounded-t-lg">
<div className="flex items-center gap-3">
<div className="w-3 h-3 rounded-full bg-secondary-container animate-ping" />
<div>
<div className="flex items-center gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-bold">Calibration Studio: {selectedLane?.name || 'Lane'}</span>
<span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">LIVE FEED</span>
</div>
<span className="font-label-md text-label-md text-on-surface-variant font-mono">Galaxy S21 Companion Cam // RTSP: 192.168.1.104:8080/live</span>
</div>
</div>
<div className="flex items-center gap-2">
<span className="px-3 py-1.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">1080p @ 60.1 FPS</span>
<span className="px-3 py-1.5 rounded bg-tertiary-container/10 text-on-tertiary-container font-label-sm text-label-sm font-bold">KEYSTONE LOCKED</span>
</div>
</div>
{/* Interactive Target Alignment Viewport with Keystoning Overlay */}
<div className="relative w-full aspect-[4/3] bg-surface-container-highest rounded-lg overflow-hidden flex items-center justify-center select-none shadow-inner group" id="target-viewport">
{/* Background Target Canvas Simulation */}
<svg className="absolute inset-0 w-full h-full text-on-surface-variant/30" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
{/* Subtle Target Background Grid */}
<defs>
<pattern height="40" id="feed-grid" patternUnits="userSpaceOnUse" width="40">
<path d="M 40 0 L 0 0 0 40" fill="none" opacity="0.4" stroke="currentColor" strokeWidth="0.5" />
</pattern>
</defs>
<rect fill="#e5eeff" height="100%" width="100%" />
<rect fill="url(#feed-grid)" height="100%" width="100%" />
{/* Paper Target Outline with Slight Perspective Distortion */}
<polygon fill="#ffffff" id="keystone-mesh" points="140,70 660,60 690,530 110,540" stroke="#c6c6cd" strokeWidth="2" />
{/* Target Concentric Rings (ISSF 10m Air Rifle representation) */}
<g transform="translate(400, 300) scale(1.05, 0.98)">
{/* Ring 1 to 3 (White zone) */}
<circle cx="0" cy="0" fill="#ffffff" r="230" stroke="#0b1c30" strokeWidth="1.5" />
<circle cx="0" cy="0" fill="none" r="190" stroke="#0b1c30" strokeWidth="1" />
<circle cx="0" cy="0" fill="none" r="150" stroke="#0b1c30" strokeWidth="1" />
{/* Black Bullseye Zone (Rings 4-10) */}
<circle cx="0" cy="0" fill="#131b2e" r="120" />
<circle cx="0" cy="0" fill="none" opacity="0.8" r="95" stroke="#ffffff" strokeWidth="0.75" />
<circle cx="0" cy="0" fill="none" opacity="0.8" r="70" stroke="#ffffff" strokeWidth="0.75" />
<circle cx="0" cy="0" fill="none" opacity="0.8" r="45" stroke="#ffffff" strokeWidth="0.75" />
<circle cx="0" cy="0" fill="none" opacity="0.8" r="25" stroke="#ffffff" strokeWidth="0.75" />
{/* 10.9 Inner Dot */}
<circle cx="0" cy="0" fill="#fe932c" r="4" />
</g>
{/* Computer Vision Corner Quad Detection Trajectory */}
<polygon fill="rgba(6, 150, 105, 0.05)" points="140,70 660,60 690,530 110,540" stroke="#069669" strokeDasharray="4 2" strokeWidth="1.5" />
{/* Detected Pellet Holes (Historic) */}
<circle cx="388" cy="292" fill="#000000" r="7" stroke="#069669" strokeWidth="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="11" fontWeight="bold" x="400" y="290">SHOT 1: 10.4</text>
<circle cx="414" cy="310" fill="#000000" r="7" stroke="#069669" strokeWidth="1.5" />
<text fill="#069669" fontFamily="JetBrains Mono" fontSize="11" fontWeight="bold" x="426" y="316">SHOT 2: 10.2</text>
{/* Dynamic Simulation Pellet Mark (Hidden initially or triggered) */}
<g className={`transition-opacity duration-300 ${showSimulatedStrike ? 'opacity-100' : 'opacity-0'}`} id="simulated-strike">
<circle cx="402" cy="299" fill="#ba1a1a" r="7.5" stroke="#ffffff" strokeWidth="2" />
<rect fill="#131b2e" height="24" rx="3" width="105" x="375" y="260" />
<text fill="#85f8c4" fontFamily="JetBrains Mono" fontSize="11" fontWeight="bold" x="382" y="276">HIT: 10.8 (X)</text>
<line stroke="#131b2e" strokeWidth="1.5" x1="402" x2="402" y1="284" y2="292" />
</g>
{/* Green Optical Center Reticle Crosshairs */}
<line stroke="#069669" strokeDasharray="2 4" strokeWidth="1" x1="400" x2="400" y1="50" y2="550" />
<line stroke="#069669" strokeDasharray="2 4" strokeWidth="1" x1="100" x2="700" y1="300" y2="300" />
{/* Crosshair center circle */}
<circle cx="400" cy="300" fill="none" r="30" stroke="#069669" strokeWidth="1.5" />
<circle cx="400" cy="300" fill="none" r="6" stroke="#069669" strokeWidth="1" />
</svg>
{/* Interactive Corner Pin Overlays (Absolute HTML handles) */}
{/* P1 Top-Left */}
<div className="corner-pin absolute top-[11.6%] left-[17.5%] w-7 h-7 -ml-3.5 -mt-3.5 rounded bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shadow-md cursor-move hover:scale-110 transition-transform">
            P1
          </div>
{/* P2 Top-Right */}
<div className="corner-pin absolute top-[10%] left-[82.5%] w-7 h-7 -ml-3.5 -mt-3.5 rounded bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shadow-md cursor-move hover:scale-110 transition-transform">
            P2
          </div>
{/* P3 Bottom-Right */}
<div className="corner-pin absolute top-[88.3%] left-[86.2%] w-7 h-7 -ml-3.5 -mt-3.5 rounded bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shadow-md cursor-move hover:scale-110 transition-transform">
            P3
          </div>
{/* P4 Bottom-Left */}
<div className="corner-pin absolute top-[90%] left-[13.7%] w-7 h-7 -ml-3.5 -mt-3.5 rounded bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shadow-md cursor-move hover:scale-110 transition-transform">
            P4
          </div>
{/* Real-Time Target Telemetry HUD Inset */}
<div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-2 rounded shadow flex items-center gap-4">
<div className="flex items-center gap-1.5 text-on-tertiary-container">
<span className="material-symbols-outlined text-[16px]">aspect_ratio</span>
<span className="font-label-sm text-label-sm font-bold">H-HOMOGRAPHY: 99.8%</span>
</div>
<div className="flex items-center gap-1.5 text-on-surface-variant">
<span className="material-symbols-outlined text-[16px]">rotate_90_degrees_ccw</span>
<span className="font-label-sm text-label-sm font-bold">SKEW: -0.42°</span>
</div>
</div>
{/* Reticle Mode Indicator Inset */}
<div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1.5 rounded shadow flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-on-tertiary-container" />
<span className="font-label-sm text-label-sm font-bold text-on-surface">RETICLE: ISSF 10M AUTO-LOCK</span>
</div>
</div>
{/* Calibration Parameter Sliders Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
{/* Slider 1: Lighting & Glare */}
<div className="flex flex-col gap-2 p-3 rounded bg-surface-container-low">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-semibold">Lighting &amp; Glare Threshold</span>
<span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold" id="val-glare">{glareThreshold}%</span>
</div>
<input className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer" max="100" min="0" type="range" value={glareThreshold} onChange={(e) => setGlareThreshold(Number(e.target.value))} />
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span className="">Dark Ambient</span>
<span className="">Direct Halogen</span>
</div>
</div>
{/* Slider 2: Paper Contrast */}
<div className="flex flex-col gap-2 p-3 rounded bg-surface-container-low">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-semibold">Paper Substrate Contrast</span>
<span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold" id="val-contrast">{contrast}%</span>
</div>
<input className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer" max="100" min="0" type="range" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span className="">Standard Pulped</span>
<span className="">High-Grade Card</span>
</div>
</div>
{/* Slider 3: Pellet Hole Edge Sensitivity */}
<div className="flex flex-col gap-2 p-3 rounded bg-surface-container-low">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-semibold">Hole Edge Sensitivity</span>
<span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold" id="val-edge">{edgeSensitivity}mm</span>
</div>
<input className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer" max="0.50" min="0.05" step="0.01" type="range" value={edgeSensitivity} onChange={(e) => setEdgeSensitivity(Number(e.target.value))} />
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span className="">0.05mm Sub-Pixel</span>
<span className="">0.50mm Loose</span>
</div>
</div>
{/* Slider 4: Pellet Diameter Filter */}
<div className="flex flex-col gap-2 p-3 rounded bg-surface-container-low">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-semibold">Pellet Diameter Filter</span>
<span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold" id="val-diameter">{getDiameterLabel(diameter)}</span>
</div>
<input className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer" max="3" min="1" step="1" type="range" value={diameter} onChange={(e) => setDiameter(Number(e.target.value))} />
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span className="">.177 (4.5)</span>
<span className="">.22 (5.5)</span>
<span className="">.25 (6.35)</span>
</div>
</div>
</div>
{/* Calibration Action Bar */}
<div className="flex flex-wrap items-center justify-between gap-4 pt-2">
<button 
  onClick={() => setShowSimulatedStrike(true)}
  className="flex items-center gap-2 px-5 py-2.5 rounded bg-secondary-container text-on-surface hover:opacity-90 font-label-md text-label-md font-bold shadow-sm transition-all" id="btn-simulate-strike">
<span className="material-symbols-outlined text-[18px]">adjust</span>
<span className="">SIMULATE PELLET STRIKE</span>
</button>
<div className="flex items-center gap-3">
<button 
  onClick={() => {
    setGlareThreshold(68);
    setContrast(82);
    setEdgeSensitivity(0.15);
    setDiameter(1);
    setShowSimulatedStrike(false);
  }}
  className="px-4 py-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all">
              RESET MATRIX
            </button>
<button className="flex items-center gap-2 px-5 py-2.5 rounded bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm hover:opacity-90 transition-all" id="btn-save-calibration">
<span className="material-symbols-outlined text-[18px]">check_circle</span>
<span className="">SAVE &amp; APPLY CALIBRATION</span>
</button>
</div>
</div>
</div>
{/* Quick Companion Pairing Station (Android / Mobile RTSP Stream) */}
<div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-6">
{/* Synthetic QR Code Graphic Container */}
<div className="w-32 h-32 shrink-0 bg-surface-container p-2 rounded flex flex-col items-center justify-center relative shadow-sm">
<svg className="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 100 100">
{/* QR Pattern Blocks */}
<path d="M0,0 h30 v30 h-30 z M6,6 h18 v18 h-18 z M10,10 h10 v10 h-10 z" />
<path d="M70,0 h30 v30 h-30 z M76,6 h18 v18 h-18 z M80,10 h10 v10 h-10 z" />
<path d="M0,70 h30 v30 h-30 z M6,76 h18 v18 h-18 z M10,80 h10 v10 h-10 z" />
<rect height="20" width="10" x="40" y="5" />
<rect height="15" width="8" x="55" y="10" />
<rect height="30" width="30" x="35" y="35" />
<rect height="10" width="15" x="75" y="45" />
<rect height="15" width="10" x="45" y="75" />
<rect height="10" width="25" x="65" y="70" />
<rect height="10" width="10" x="80" y="85" />
</svg>
<span className="absolute bottom-1 bg-surface-container-lowest px-1.5 py-0.2 rounded font-label-sm text-[8px] font-bold text-on-surface">MARKSMAN PAIR</span>
</div>
{/* Instructions & Manual Direct Pairing Connect Form */}
<div className="flex flex-col gap-2 w-full">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[20px] text-secondary">phonelink_ring</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Instant Companion Pairing (Android / iOS)</h3>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
            Scan QR code with the <strong className="text-on-surface">Marksman Field App</strong> on any Wi-Fi connected phone or manually feed a direct RTSP/HTTP camera address.
          </p>
<div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
<div className="flex items-center w-full bg-surface-container-low px-3 py-2 rounded">
<span className="font-label-sm text-label-sm text-on-surface-variant font-mono pr-2">rtsp://</span>
<input className="w-full bg-transparent font-label-md text-label-md text-on-surface font-mono focus:outline-none" placeholder="192.168.X.X:PORT" type="text" value="192.168.1.104:8080/live/ch0" />
</div>
<button className="w-full sm:w-auto shrink-0 px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all">
              PAIR STREAM
            </button>
</div>
</div>
</div>
</div>
    </div>
  );
}


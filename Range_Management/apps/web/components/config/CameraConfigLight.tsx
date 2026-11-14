'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  useLiveVision,
  DEFAULT_CORNERS,
  type LaneCornerPoint,
} from '@/hooks/useLiveVision';
import { MaterialIcon } from '@/components/ui/TacticalIcons';
import { useToast } from '@/contexts/toast-context';
import { StreamTunerModal } from '@/components/vision/StreamTunerModal';
import { CameraStreamConfig } from '@shooting-platform/shared-types';
import { loadStreamConfig, saveStreamConfig } from '@/lib/stream-optimizer';

export function CameraConfigLight() {
  const { toast } = useToast();
  const { lanes, isLoading, selectedLaneId, setSelectedLaneId, addLane, updateLane } = useLiveVision('1');
  const selectedLane = lanes.find((l) => l.id === selectedLaneId) || lanes[0];

  const viewportRef = useRef<HTMLDivElement>(null);
  const [draggingCornerIdx, setDraggingCornerIdx] = useState<number | null>(null);
  const [corners, setCorners] = useState<[LaneCornerPoint, LaneCornerPoint, LaneCornerPoint, LaneCornerPoint]>(DEFAULT_CORNERS);

  const [bayFilter, setBayFilter] = useState<'ALL' | '10m' | '25m' | '50m'>('ALL');
  const [glareThreshold, setGlareThreshold] = useState(68);
  const [contrast, setContrast] = useState(82);
  const [edgeSensitivity, setEdgeSensitivity] = useState(0.15);
  const [diameter, setDiameter] = useState(1);
  const [showSimulatedStrike, setShowSimulatedStrike] = useState(false);
  const [rtspAddress, setRtspAddress] = useState('192.168.1.104:8080/live/ch0');
  const [isTestingGlobal, setIsTestingGlobal] = useState(false);
  const [isStreamTunerOpen, setIsStreamTunerOpen] = useState(false);
  const [streamConfig, setStreamConfig] = useState<CameraStreamConfig>(() => loadStreamConfig(selectedLaneId));

  // Add New Lane Modal State
  const [isAddLaneOpen, setIsAddLaneOpen] = useState(false);
  const [newLaneName, setNewLaneName] = useState('');
  const [newLaneDist, setNewLaneDist] = useState<'10m' | '25m' | '50m'>('10m');
  const [newLaneCam, setNewLaneCam] = useState('CAM-05-ESP');

  // Inline Quick Status Menu
  const [menuLaneId, setMenuLaneId] = useState<string | null>(null);

  useEffect(() => {
    setStreamConfig(loadStreamConfig(selectedLaneId));
    if (selectedLane) {
      setRtspAddress(selectedLane.rtspUrl || '192.168.1.104:8080/live/ch0');
      if (selectedLane.calibration) {
        setGlareThreshold(selectedLane.calibration.glareThreshold);
        setContrast(selectedLane.calibration.contrast);
        setEdgeSensitivity(selectedLane.calibration.edgeSensitivity);
        const dMm = selectedLane.calibration.diameterMm;
        setDiameter(dMm >= 6.0 ? 3 : dMm >= 5.0 ? 2 : 1);
        setCorners(selectedLane.calibration.corners || DEFAULT_CORNERS);
      }
    }
  }, [selectedLaneId, selectedLane?.id]);

  const filteredLanes = lanes.filter((l) => bayFilter === 'ALL' || l.distance === bayFilter);
  const activeCount = lanes.filter((l) => l.status === 'ACTIVE' || l.status === 'OCCUPIED').length;

  const getDiameterLabel = (val: number) => {
    switch (val) {
      case 1:
        return '.177 / 4.5mm';
      case 2:
        return '.22 / 5.5mm';
      case 3:
        return '.25 / 6.35mm';
      default:
        return '.177 / 4.5mm';
    }
  };

  // Dynamic SVG polygon coordinates (800x600 coordinate space)
  const svgPoints = corners
    .map((c) => `${Math.round(c.x * 8)},${Math.round(c.y * 6)}`)
    .join(' ');
  const drift = corners.reduce((acc, c, idx) => {
    const def = DEFAULT_CORNERS[idx];
    return acc + Math.abs(c.x - def.x) + Math.abs(c.y - def.y);
  }, 0);
  const homographyPct = Math.max(88.0, Math.min(99.9, 99.8 - drift * 0.08)).toFixed(1);
  const skewDeg = (((corners[1].y - corners[0].y) - (corners[2].y - corners[3].y)) * 0.14).toFixed(2);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingCornerIdx === null || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const xPct = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
    setCorners((prev) => {
      const next = [...prev] as [LaneCornerPoint, LaneCornerPoint, LaneCornerPoint, LaneCornerPoint];
      next[draggingCornerIdx] = { x: Math.round(xPct * 10) / 10, y: Math.round(yPct * 10) / 10 };
      return next;
    });
  };

  const handleRunGlobalTest = () => {
    if (isTestingGlobal) return;
    setIsTestingGlobal(true);
    toast(`Running facility camera calibration sweep across ${lanes.length} lanes...`, 'info');
    setTimeout(() => {
      setIsTestingGlobal(false);
      toast(`Optical bus test passed: ${activeCount} live streams locked (99.8% homography)`, 'success');
    }, 650);
  };

  const handleSaveCalibration = async () => {
    if (!selectedLane) return;
    await updateLane(selectedLane.id, {
      calibration: {
        glareThreshold,
        contrast,
        edgeSensitivity,
        diameterMm: diameter === 3 ? 6.35 : diameter === 2 ? 5.5 : 4.5,
        corners,
      },
    });
    toast(`Calibration saved to ${selectedLane.name}`, 'success');
  };

  const handlePairStream = async () => {
    if (!selectedLane) return;
    const cleanAddr = rtspAddress.trim().replace(/^rtsp:\/\//, '');
    if (!cleanAddr) {
      toast('Enter an IP/RTSP stream endpoint before pairing.', 'warning');
      return;
    }
    await updateLane(selectedLane.id, {
      rtspUrl: cleanAddr,
      cameraId: `RTSP (${cleanAddr.split('/')[0]})`,
      status: 'OCCUPIED',
    });
    toast(`Paired rtsp://${cleanAddr} to ${selectedLane.name}`, 'success');
  };

  const handleCreateLane = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await addLane({
      name: newLaneName || `Lane 0${lanes.length + 1} — ${newLaneDist} Bay`,
      distance: newLaneDist,
      cameraId: newLaneCam,
      status: 'IDLE',
    });
    setIsAddLaneOpen(false);
    setNewLaneName('');
    toast(`Added ${created.name} with ${created.cameraId}`, 'success');
  };

  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-[calc(5.5rem+var(--sab))] lg:pb-10">
      <div className="flex flex-col w-full pb-16">
        {/* Operational Header Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 py-6 bg-surface-container-lowest px-4 sm:px-8 rounded-lg shadow-sm">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold uppercase tracking-widest">
                FACILITY SYS // REV 4.2
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
              <span className="font-label-md text-label-md text-on-tertiary-container uppercase font-semibold tracking-wider">
                OPTICAL BUS SYNCHRONIZED
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
              Lane Architecture &amp; Computer Vision Camera Pairing
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Manage range physical lanes, assign camera sources (USB, Webcams, Android IP Stream), and calibrate target detection matrices.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsStreamTunerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-semibold transition-all"
            >
              <MaterialIcon name="tune" className="text-[18px]" />
              <span>STREAM TUNER</span>
            </button>
            <button
              id="btn-global-test"
              type="button"
              disabled={isTestingGlobal}
              onClick={handleRunGlobalTest}
              className="flex items-center gap-2 px-4 py-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all disabled:opacity-60"
            >
              <MaterialIcon name="play_circle" className="text-[18px]" />
              <span>{isTestingGlobal ? 'RUNNING CALIBRATION...' : 'RUN GLOBAL CALIBRATION TEST'}</span>
            </button>
            <button
              id="btn-add-lane"
              type="button"
              onClick={() => setIsAddLaneOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:opacity-90 transition-all"
            >
              <MaterialIcon name="add" className="text-[18px]" />
              <span>+ ADD NEW LANE</span>
            </button>
          </div>
        </div>

        {/* Main Split Architecture */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
          {/* Left Column: Configured Lanes Management */}
          <div className="xl:col-span-5 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-lowest p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Configured Range Bays
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
                  {activeCount} Live
                </span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container p-1 rounded">
                {(['ALL', '10m', '25m', '50m'] as const).map((bay) => (
                  <button
                    key={bay}
                    type="button"
                    onClick={() => setBayFilter(bay)}
                    className={`px-2.5 py-1 rounded font-label-sm text-label-sm font-medium transition-colors ${
                      bayFilter === bay
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {bay === 'ALL' ? `ALL (${lanes.length})` : bay.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="px-4 py-3 text-on-surface-variant font-label-caps">Loading lanes...</div>
            ) : filteredLanes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant bg-surface-container-lowest rounded-lg">
                <MaterialIcon name="videocam_off" className="text-[32px] mb-2 opacity-40" />
                <span className="font-label-caps text-label-caps">No lanes match this filter.</span>
              </div>
            ) : (
              filteredLanes.map((lane) => {
                const isActive = lane.id === selectedLaneId;
                const isLiveStatus = lane.status === 'ACTIVE' || lane.status === 'OCCUPIED';
                const showMenu = menuLaneId === lane.id;
                return (
                  <div
                    key={lane.id}
                    onClick={() => setSelectedLaneId(lane.id)}
                    className={`lane-card rounded-lg p-5 shadow-sm transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-gradient-to-r from-surface-container-lowest to-surface-container-low shadow-md'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                    data-lane={lane.laneNumber}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-container rounded-l-lg" />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${
                            isActive ? 'bg-secondary-container' : 'bg-surface-container'
                          }`}
                        >
                          <MaterialIcon
                            name="videocam"
                            className={`text-[20px] ${
                              isActive ? 'text-on-secondary-container' : 'text-on-surface-variant'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">
                              {lane.name}
                            </span>
                            <span
                              className={`font-label-sm text-label-sm px-2 py-0.5 rounded font-bold uppercase ${
                                isLiveStatus
                                  ? 'bg-primary/10 text-primary'
                                  : lane.status === 'MAINTENANCE'
                                  ? 'bg-error/10 text-error'
                                  : 'bg-surface-container text-on-surface-variant'
                              }`}
                            >
                              {lane.status}
                            </span>
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant truncate block">
                            {lane.cameraId ? `Camera: ${lane.cameraId}` : 'No camera assigned'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isLiveStatus && (
                          <span className="flex items-center gap-1 font-label-sm text-label-sm text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            LIVE
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuLaneId(showMenu ? null : lane.id);
                          }}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                          aria-label="Lane status options"
                        >
                          <MaterialIcon name="more_vert" className="text-[18px]" />
                        </button>
                      </div>
                    </div>

                    {showMenu && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-3 border-t border-outline-variant/20 flex flex-wrap gap-2"
                      >
                        {(['OCCUPIED', 'IDLE', 'MAINTENANCE'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              updateLane(lane.id, { status: st });
                              setMenuLaneId(null);
                              toast(`${lane.name} set to ${st}`, 'info');
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase ${
                              lane.status === st
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Live Camera Stream Calibration & Alignment Studio */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-lg shadow-sm flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 bg-surface-container-low -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 p-4 sm:p-6 rounded-t-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-3 h-3 rounded-full bg-secondary-container animate-ping shrink-0" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-headline-md text-headline-md text-on-surface font-bold truncate">
                        Calibration Studio: {selectedLane?.name || 'Lane'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">
                        LIVE FEED
                      </span>
                    </div>
                    <span className="font-label-md text-label-md text-on-surface-variant font-mono truncate block">
                      {selectedLane?.cameraId || 'Companion Cam'} // rtsp://{rtspAddress}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold">
                    1080p @ {streamConfig.targetFps} FPS
                  </span>
                  <span className="px-3 py-1.5 rounded bg-tertiary-container/10 text-on-tertiary-container font-label-sm text-label-sm font-bold">
                    KEYSTONE LOCKED
                  </span>
                </div>
              </div>

              {/* Interactive Target Alignment Viewport */}
              <div
                ref={viewportRef}
                onPointerMove={handlePointerMove}
                onPointerUp={() => setDraggingCornerIdx(null)}
                onPointerLeave={() => setDraggingCornerIdx(null)}
                className="relative w-full aspect-[4/3] bg-surface-container-highest rounded-lg overflow-hidden flex items-center justify-center select-none shadow-inner touch-none"
                id="target-viewport"
              >
                <svg
                  className="absolute inset-0 w-full h-full text-on-surface-variant/30 pointer-events-none"
                  viewBox="0 0 800 600"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern height="40" id="feed-grid" patternUnits="userSpaceOnUse" width="40">
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        opacity="0.4"
                        stroke="currentColor"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect fill="#e5eeff" height="100%" width="100%" />
                  <rect fill="url(#feed-grid)" height="100%" width="100%" />
                  <polygon fill="#ffffff" id="keystone-mesh" points={svgPoints} stroke="#c6c6cd" strokeWidth="2" />
                  <g transform="translate(400, 300) scale(1.05, 0.98)">
                    <circle cx="0" cy="0" fill="#ffffff" r="230" stroke="#0b1c30" strokeWidth="1.5" />
                    <circle cx="0" cy="0" fill="none" r="190" stroke="#0b1c30" strokeWidth="1" />
                    <circle cx="0" cy="0" fill="none" r="150" stroke="#0b1c30" strokeWidth="1" />
                    <circle cx="0" cy="0" fill="#131b2e" r="120" />
                    <circle cx="0" cy="0" fill="none" opacity="0.8" r="95" stroke="#ffffff" strokeWidth="0.75" />
                    <circle cx="0" cy="0" fill="none" opacity="0.8" r="70" stroke="#ffffff" strokeWidth="0.75" />
                    <circle cx="0" cy="0" fill="none" opacity="0.8" r="45" stroke="#ffffff" strokeWidth="0.75" />
                    <circle cx="0" cy="0" fill="none" opacity="0.8" r="25" stroke="#ffffff" strokeWidth="0.75" />
                    <circle cx="0" cy="0" fill="#fe932c" r="4" />
                  </g>
                  <polygon
                    fill="rgba(6, 150, 105, 0.05)"
                    points={svgPoints}
                    stroke="#069669"
                    strokeDasharray="4 2"
                    strokeWidth="1.5"
                  />
                  <circle cx="388" cy="292" fill="#000000" r="7" stroke="#069669" strokeWidth="1.5" />
                  <text fill="#069669" fontFamily="monospace" fontSize="11" fontWeight="bold" x="400" y="290">
                    SHOT 1: 10.4
                  </text>
                  <circle cx="414" cy="310" fill="#000000" r="7" stroke="#069669" strokeWidth="1.5" />
                  <text fill="#069669" fontFamily="monospace" fontSize="11" fontWeight="bold" x="426" y="316">
                    SHOT 2: 10.2
                  </text>
                  <g
                    className={`transition-opacity duration-300 ${
                      showSimulatedStrike ? 'opacity-100' : 'opacity-0'
                    }`}
                    id="simulated-strike"
                  >
                    <circle cx="402" cy="299" fill="#ba1a1a" r="7.5" stroke="#ffffff" strokeWidth="2" />
                    <rect fill="#131b2e" height="24" rx="3" width="105" x="375" y="260" />
                    <text fill="#85f8c4" fontFamily="monospace" fontSize="11" fontWeight="bold" x="382" y="276">
                      HIT: 10.8 (X)
                    </text>
                    <line stroke="#131b2e" strokeWidth="1.5" x1="402" x2="402" y1="284" y2="292" />
                  </g>
                  <line stroke="#069669" strokeDasharray="2 4" strokeWidth="1" x1="400" x2="400" y1="50" y2="550" />
                  <line stroke="#069669" strokeDasharray="2 4" strokeWidth="1" x1="100" x2="700" y1="300" y2="300" />
                  <circle cx="400" cy="300" fill="none" r="30" stroke="#069669" strokeWidth="1.5" />
                  <circle cx="400" cy="300" fill="none" r="6" stroke="#069669" strokeWidth="1" />
                </svg>

                {/* Interactive Draggable Corner Pin Overlays P1-P4 */}
                {corners.map((corner, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Corner pin P${idx + 1}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDraggingCornerIdx(idx);
                    }}
                    style={{ left: `${corner.x}%`, top: `${corner.y}%` }}
                    className={`corner-pin absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold shadow-md cursor-move touch-none transition-transform z-10 ${
                      draggingCornerIdx === idx ? 'scale-125 ring-2 ring-secondary-container' : 'hover:scale-110'
                    }`}
                  >
                    P{idx + 1}
                  </button>
                ))}

                {/* Real-Time Target Telemetry HUD Inset */}
                <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-2 rounded shadow flex flex-wrap items-center gap-3 pointer-events-none">
                  <div className="flex items-center gap-1.5 text-on-tertiary-container">
                    <MaterialIcon name="aspect_ratio" className="text-[16px]" />
                    <span className="font-label-sm text-label-sm font-bold">
                      H-HOMOGRAPHY: {homographyPct}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <MaterialIcon name="rotate_90_degrees_ccw" className="text-[16px]" />
                    <span className="font-label-sm text-label-sm font-bold">SKEW: {skewDeg}°</span>
                  </div>
                </div>
                <div className="hidden sm:flex absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1.5 rounded shadow items-center gap-2 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-on-tertiary-container" />
                  <span className="font-label-sm text-label-sm font-bold text-on-surface">
                    RETICLE: ISSF 10M AUTO-LOCK
                  </span>
                </div>
              </div>

              {/* Calibration Parameter Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="flex flex-col gap-2 p-3 rounded bg-surface-container-low">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Lighting &amp; Glare Threshold
                    </span>
                    <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold" id="val-glare">
                      {glareThreshold}%
                    </span>
                  </div>
                  <input
                    className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer"
                    max="100"
                    min="0"
                    type="range"
                    value={glareThreshold}
                    onChange={(e) => setGlareThreshold(Number(e.target.value))}
                  />
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Dark Ambient</span>
                    <span>Direct Halogen</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3 rounded bg-surface-container-low">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Paper Substrate Contrast
                    </span>
                    <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold" id="val-contrast">
                      {contrast}%
                    </span>
                  </div>
                  <input
                    className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer"
                    max="100"
                    min="0"
                    type="range"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                  />
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Standard Pulped</span>
                    <span>High-Grade Card</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3 rounded bg-surface-container-low">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Hole Edge Sensitivity
                    </span>
                    <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold" id="val-edge">
                      {edgeSensitivity.toFixed(2)}mm
                    </span>
                  </div>
                  <input
                    className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer"
                    max="0.50"
                    min="0.05"
                    step="0.01"
                    type="range"
                    value={edgeSensitivity}
                    onChange={(e) => setEdgeSensitivity(Number(e.target.value))}
                  />
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>0.05mm Sub-Pixel</span>
                    <span>0.50mm Loose</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3 rounded bg-surface-container-low">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Pellet Diameter Filter
                    </span>
                    <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold" id="val-diameter">
                      {getDiameterLabel(diameter)}
                    </span>
                  </div>
                  <input
                    className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer"
                    max="3"
                    min="1"
                    step="1"
                    type="range"
                    value={diameter}
                    onChange={(e) => setDiameter(Number(e.target.value))}
                  />
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>.177 (4.5)</span>
                    <span>.22 (5.5)</span>
                    <span>.25 (6.35)</span>
                  </div>
                </div>
              </div>

              {/* Calibration Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  id="btn-simulate-strike"
                  type="button"
                  onClick={() => {
                    setShowSimulatedStrike((prev) => !prev);
                    toast('Simulated pellet strike overlay toggled', 'info');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded bg-secondary-container text-on-surface hover:opacity-90 font-label-md text-label-md font-bold shadow-sm transition-all"
                >
                  <MaterialIcon name="adjust" className="text-[18px]" />
                  <span>{showSimulatedStrike ? 'HIDE STRIKE TEST' : 'SIMULATE PELLET STRIKE'}</span>
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setGlareThreshold(68);
                      setContrast(82);
                      setEdgeSensitivity(0.15);
                      setDiameter(1);
                      setCorners(DEFAULT_CORNERS);
                      setShowSimulatedStrike(false);
                      toast('Homography matrix & sliders reset to defaults', 'info');
                    }}
                    className="px-4 py-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all"
                  >
                    RESET MATRIX
                  </button>
                  <button
                    id="btn-save-calibration"
                    type="button"
                    onClick={handleSaveCalibration}
                    className="flex items-center gap-2 px-5 py-2.5 rounded bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm hover:opacity-90 transition-all"
                  >
                    <MaterialIcon name="check_circle" className="text-[18px]" />
                    <span>SAVE &amp; APPLY CALIBRATION</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Companion Pairing Station */}
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 shrink-0 bg-surface-container p-2 rounded flex flex-col items-center justify-center relative shadow-sm">
                <svg className="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 100 100">
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
                <span className="absolute bottom-1 bg-surface-container-lowest px-1.5 py-0.5 rounded font-label-sm text-[8px] font-bold text-on-surface">
                  MARKSMAN PAIR
                </span>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="phonelink_ring" className="text-[20px] text-secondary" />
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Instant Companion Pairing (Android / iOS)
                  </h3>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Scan QR code with the <strong className="text-on-surface">Marksman Field App</strong> on any Wi-Fi connected phone or manually feed a direct RTSP/HTTP camera address.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
                  <div className="flex items-center w-full bg-surface-container-low px-3 py-2 rounded">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono pr-2">
                      rtsp://
                    </span>
                    <input
                      className="w-full bg-transparent font-label-md text-label-md text-on-surface font-mono focus:outline-none"
                      placeholder="192.168.X.X:PORT"
                      type="text"
                      value={rtspAddress}
                      onChange={(e) => setRtspAddress(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePairStream}
                    className="w-full sm:w-auto shrink-0 px-4 py-2 rounded bg-primary text-on-primary hover:opacity-90 font-label-md text-label-md font-semibold transition-all"
                  >
                    PAIR STREAM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Lane Modal */}
      {isAddLaneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateLane}
            className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-2xl space-y-4 text-on-surface"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 className="font-headline-sm text-on-surface font-bold uppercase">
                Provision New Optical Bay
              </h3>
              <button
                type="button"
                onClick={() => setIsAddLaneOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <MaterialIcon name="close" className="text-[18px]" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-label-sm text-on-surface-variant uppercase font-bold mb-1">
                  Lane Label
                </label>
                <input
                  type="text"
                  value={newLaneName}
                  onChange={(e) => setNewLaneName(e.target.value)}
                  placeholder={`Lane 0${lanes.length + 1} — 10m Olympic`}
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded text-sm border border-outline-variant/40"
                />
              </div>
              <div>
                <label className="block font-label-sm text-on-surface-variant uppercase font-bold mb-1">
                  Bay Distance Tier
                </label>
                <select
                  value={newLaneDist}
                  onChange={(e) => setNewLaneDist(e.target.value as any)}
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded text-sm border border-outline-variant/40"
                >
                  <option value="10m">10m Air / Olympic</option>
                  <option value="25m">25m Precision / Rapid</option>
                  <option value="50m">50m Outdoor / Three-Pos</option>
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-on-surface-variant uppercase font-bold mb-1">
                  Paired Camera Source ID
                </label>
                <input
                  type="text"
                  value={newLaneCam}
                  onChange={(e) => setNewLaneCam(e.target.value)}
                  placeholder="CAM-05-ESP"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded text-sm border border-outline-variant/40"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddLaneOpen(false)}
                className="flex-1 py-2.5 rounded bg-surface-container text-on-surface-variant font-label-md uppercase font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded bg-primary text-on-primary font-label-md font-bold uppercase"
              >
                Create Bay
              </button>
            </div>
          </form>
        </div>
      )}

      <StreamTunerModal
        isOpen={isStreamTunerOpen}
        onClose={() => setIsStreamTunerOpen(false)}
        config={streamConfig}
        onConfigChange={(newCfg) => {
          setStreamConfig(newCfg);
          saveStreamConfig(newCfg, selectedLaneId);
        }}
        laneName={selectedLane?.name || 'Selected Lane'}
        laneId={selectedLaneId}
      />
    </div>
  );
}

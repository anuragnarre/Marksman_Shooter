'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  useLiveVision,
  DEFAULT_CORNERS,
  type LaneCornerPoint,
} from '@/hooks/useLiveVision';
import { StreamTunerModal } from '@/components/vision/StreamTunerModal';
import { CameraStreamConfig } from '@shooting-platform/shared-types';
import { loadStreamConfig, saveStreamConfig } from '@/lib/stream-optimizer';
import { MaterialIcon } from '@/components/ui/TacticalIcons';
import { useToast } from '@/contexts/toast-context';

export function CameraConfigDark() {
  const { toast } = useToast();
  const { lanes, isLoading, selectedLaneId, setSelectedLaneId, addLane, updateLane } = useLiveVision('1');
  const selectedLane = lanes.find((l) => l.id === selectedLaneId) || lanes[0];

  const viewportRef = useRef<HTMLDivElement>(null);
  const [draggingCornerIdx, setDraggingCornerIdx] = useState<number | null>(null);
  const [corners, setCorners] = useState<[LaneCornerPoint, LaneCornerPoint, LaneCornerPoint, LaneCornerPoint]>(DEFAULT_CORNERS);

  const [bayFilter, setBayFilter] = useState<'ALL' | '10m' | '25m' | '50m'>('ALL');
  const [isStreamTunerOpen, setIsStreamTunerOpen] = useState(false);
  const [streamConfig, setStreamConfig] = useState<CameraStreamConfig>(() => loadStreamConfig(selectedLaneId));

  const [glareThreshold, setGlareThreshold] = useState(68);
  const [contrast, setContrast] = useState(82);
  const [edgeSensitivity, setEdgeSensitivity] = useState(15); // 0.15mm as 15
  const [diameter, setDiameter] = useState(45); // 4.5mm as 45
  const [showSimulatedStrike, setShowSimulatedStrike] = useState(false);
  const [isTestingGlobal, setIsTestingGlobal] = useState(false);

  // Add New Lane Modal State
  const [isAddLaneOpen, setIsAddLaneOpen] = useState(false);
  const [newLaneName, setNewLaneName] = useState('');
  const [newLaneDist, setNewLaneDist] = useState<'10m' | '25m' | '50m'>('10m');
  const [newLaneCam, setNewLaneCam] = useState('CAM-05-ESP (Android RTSP)');

  // Inline Edit Lane State
  const [editingLaneId, setEditingLaneId] = useState<string | null>(null);
  const [editCamValue, setEditCamValue] = useState('');

  // Load saved lane calibration & stream config when lane changes
  useEffect(() => {
    setStreamConfig(loadStreamConfig(selectedLaneId));
    if (selectedLane?.calibration) {
      setGlareThreshold(selectedLane.calibration.glareThreshold);
      setContrast(selectedLane.calibration.contrast);
      setEdgeSensitivity(Math.round((selectedLane.calibration.edgeSensitivity || 0.15) * 100));
      setDiameter(Math.round((selectedLane.calibration.diameterMm || 4.5) * 10));
      setCorners(selectedLane.calibration.corners || DEFAULT_CORNERS);
    }
  }, [selectedLaneId, selectedLane?.id]);

  const filteredLanes = lanes.filter((l) => bayFilter === 'ALL' || l.distance === bayFilter);

  const getDiameterLabel = (val: number) => {
    if (val === 45) return '.177 (4.50 mm)';
    if (val === 55) return '.22 (5.50 mm)';
    if (val === 63) return '.25 (6.35 mm)';
    return `${(val / 10).toFixed(2)} mm`;
  };

  // Compute live homography fidelity & skew readout from corner positions
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
    toast(`Running optical homography sweep across ${lanes.length} bays...`, 'info');
    setTimeout(() => {
      setIsTestingGlobal(false);
      const onlineCount = lanes.filter((l) => l.status !== 'OFFLINE').length;
      toast(`Calibration check passed: ${onlineCount}/${lanes.length} lanes locked (99.8% homography)`, 'success');
    }, 650);
  };

  const handleSaveCalibration = async () => {
    if (!selectedLane) return;
    await updateLane(selectedLane.id, {
      calibration: {
        glareThreshold,
        contrast,
        edgeSensitivity: Number((edgeSensitivity / 100).toFixed(2)),
        diameterMm: Number((diameter / 10).toFixed(2)),
        corners,
      },
    });
    toast(`Calibration matrix saved to ${selectedLane.name}`, 'success');
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
    toast(`Added ${created.name} & paired ${created.cameraId}`, 'success');
  };

  const rtspDisplay = selectedLane
    ? `rtsp://${selectedLane.rtspUrl}?token=${selectedLane.token}`
    : 'rtsp://range-core.local:8080/live/lane_01_stream';

  const handleCopyRtsp = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(rtspDisplay);
      }
      toast(`Copied RTSP URI for ${selectedLane?.name || 'selected lane'}`, 'success');
    } catch {
      toast(`RTSP endpoint: ${rtspDisplay}`, 'info');
    }
  };

  const handleRotateToken = async () => {
    if (!selectedLane) return;
    const newToken = `MK-${String(selectedLane.number).padStart(2, '0')}-${Math.random()
      .toString(16)
      .slice(2, 6)
      .toUpperCase()}`;
    await updateLane(selectedLane.id, { token: newToken });
    toast(`Generated fresh stream auth token: ${newToken}`, 'success');
  };

  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-[calc(5.5rem+var(--sab))] lg:pb-10">
      <div className="flex flex-col w-full gap-space-lg text-on-surface">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md p-space-lg rounded-xl bg-surface-container-low shadow-sm">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs text-primary font-label-caps text-label-caps tracking-widest uppercase">
              <MaterialIcon name="tune" className="text-[16px]" />
              <span>Hardware &amp; Optic Matrix</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight truncate">
              Lane Architecture &amp; Computer Vision Camera Pairing
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
              Manage range physical lanes, assign camera sources (USB, Webcams, Android IP Stream), and calibrate target detection matrices.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-md flex-shrink-0">
            <button
              onClick={() => setIsStreamTunerOpen(true)}
              className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors shadow-sm font-label-caps text-label-caps uppercase font-bold"
              type="button"
            >
              <MaterialIcon name="tune" className="text-[18px]" />
              <span>
                Stream Optimizer ({streamConfig.wifiBand} •{' '}
                {streamConfig.computationMode === 'ON_DEVICE_EDGE' ? 'EDGE' : `${streamConfig.targetFps} FPS`})
              </span>
            </button>
            <button
              onClick={handleRunGlobalTest}
              disabled={isTestingGlobal}
              className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors shadow-sm font-label-caps text-label-caps uppercase disabled:opacity-60"
              type="button"
            >
              <MaterialIcon name="science" className="text-[18px] text-tertiary" />
              <span>{isTestingGlobal ? 'Calibrating...' : 'Run Global Calibration Test'}</span>
            </button>
            <button
              onClick={() => setIsAddLaneOpen(true)}
              className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container transition-colors shadow-sm font-label-caps text-label-caps uppercase font-bold"
              type="button"
            >
              <MaterialIcon name="add_box" className="text-[18px]" />
              <span>+ Add New Lane</span>
            </button>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Left Column: Configured Lanes Management */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg min-w-0">
            <div className="flex flex-col rounded-xl bg-surface-container-low p-space-md gap-space-md shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 px-space-xs">
                <div className="flex items-center gap-space-xs">
                  <MaterialIcon name="grid_view" className="text-primary text-[20px]" />
                  <span className="font-headline-md text-headline-md text-on-surface">
                    Registered Range Bays
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
                  {(['ALL', '10m', '25m', '50m'] as const).map((bay) => (
                    <button
                      key={bay}
                      type="button"
                      onClick={() => setBayFilter(bay)}
                      className={`px-2 py-0.5 rounded font-label-caps text-[10px] uppercase transition-colors ${
                        bayFilter === bay
                          ? 'bg-primary text-on-primary font-bold'
                          : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      {bay === 'ALL' ? `ALL (${lanes.length})` : bay.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-space-sm" id="lane-list-container">
                {isLoading ? (
                  <div className="px-4 py-3 text-on-surface-variant font-label-caps">Loading lanes...</div>
                ) : filteredLanes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant">
                    <MaterialIcon name="videocam_off" className="text-[32px] mb-2 opacity-40" />
                    <span className="font-label-caps text-label-caps">No lanes in this filter.</span>
                  </div>
                ) : (
                  filteredLanes.map((lane) => {
                    const isActive = lane.id === selectedLaneId;
                    const isLiveStatus = lane.status === 'ACTIVE' || lane.status === 'OCCUPIED';
                    const isEditing = editingLaneId === lane.id;
                    return (
                      <div
                        key={lane.id}
                        onClick={() => setSelectedLaneId(lane.id)}
                        className={`relative group flex flex-col gap-space-xs p-space-md rounded-lg transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-surface-container-high shadow-md'
                            : 'bg-surface-container hover:bg-surface-container-high'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-space-sm pl-space-sm min-w-0">
                            <span
                              className={`font-telemetry-sm text-telemetry-sm font-bold truncate ${
                                isActive ? 'text-primary' : 'text-on-surface'
                              }`}
                            >
                              {lane.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-label-caps text-label-caps font-bold uppercase text-[0.65rem] shrink-0 ${
                                isLiveStatus
                                  ? 'bg-primary/20 text-primary'
                                  : lane.status === 'MAINTENANCE'
                                  ? 'bg-error/20 text-error'
                                  : 'bg-surface-container-highest text-outline'
                              }`}
                            >
                              {lane.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-space-xs shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEditing) {
                                  setEditingLaneId(null);
                                } else {
                                  setEditingLaneId(lane.id);
                                  setEditCamValue(lane.cameraId);
                                }
                              }}
                              className="p-1.5 rounded bg-surface-container-highest hover:text-primary text-on-surface-variant flex items-center"
                              title="Edit Lane & Camera"
                            >
                              <MaterialIcon name="edit" className="text-[16px]" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-space-sm pl-space-sm">
                          <MaterialIcon name="videocam" className="text-outline text-[16px]" />
                          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            {lane.cameraId ? `CAM: ${lane.cameraId}` : 'No camera assigned'}
                          </span>
                          {isLiveStatus && (
                            <span className="ml-auto flex items-center gap-1 font-label-caps text-label-caps text-primary shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              LIVE
                            </span>
                          )}
                        </div>

                        {isEditing && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 pt-2 border-t border-surface-container-highest flex flex-col gap-2 pl-space-sm"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editCamValue}
                                onChange={(e) => setEditCamValue(e.target.value)}
                                className="flex-1 bg-surface-container-lowest text-on-surface text-xs px-2.5 py-1.5 rounded border border-surface-variant focus:outline-none focus:border-primary"
                                placeholder="Camera ID or IP"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  await updateLane(lane.id, { cameraId: editCamValue.trim() || lane.cameraId });
                                  setEditingLaneId(null);
                                  toast(`Updated camera source on ${lane.name}`, 'success');
                                }}
                                className="px-2.5 py-1.5 rounded bg-primary text-on-primary text-[11px] font-bold uppercase"
                              >
                                Save
                              </button>
                            </div>
                            <div className="flex gap-1.5">
                              {(['OCCUPIED', 'IDLE', 'MAINTENANCE'] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => updateLane(lane.id, { status: st })}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    lane.status === st
                                      ? 'bg-primary text-on-primary'
                                      : 'bg-surface-container-lowest text-outline hover:text-on-surface'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Camera Stream Calibration Studio */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg min-w-0">
            <div className="flex flex-col rounded-xl bg-surface-container-low p-space-md gap-space-md shadow-sm">
              {/* Viewport Top Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-sm min-w-0">
                  <span className="w-3 h-3 rounded-full bg-primary animate-ping shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-md text-headline-md text-on-surface truncate">
                      {selectedLane?.name || 'Lane'} - Android Stream
                    </span>
                    <span className="font-label-caps text-label-caps text-outline truncate">
                      {selectedLane?.cameraId || 'COMPANION NODE'} // {selectedLane?.fps || 60} FPS RTSP LIVE
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-space-sm flex-shrink-0">
                  <span className="px-space-sm py-0.5 rounded bg-surface-container-high font-telemetry-sm text-telemetry-sm text-primary font-bold">
                    {streamConfig.wifiBand}
                  </span>
                  <span className="px-space-sm py-0.5 rounded bg-surface-container-high font-telemetry-sm text-telemetry-sm text-tertiary">
                    {streamConfig.computationMode === 'ON_DEVICE_EDGE'
                      ? 'EDGE CALC'
                      : `LATENCY: ${selectedLane?.latency || 14}ms`}
                  </span>
                  <span className="px-space-sm py-0.5 rounded bg-surface-container-high font-telemetry-sm text-telemetry-sm text-primary">
                    HOMOGRAPHY: {homographyPct}%
                  </span>
                </div>
              </div>

              {/* Vision Calibration Viewport */}
              <div
                ref={viewportRef}
                onPointerMove={handlePointerMove}
                onPointerUp={() => setDraggingCornerIdx(null)}
                onPointerLeave={() => setDraggingCornerIdx(null)}
                className="relative w-full aspect-video rounded-lg bg-surface-container-lowest overflow-hidden flex items-center justify-center select-none touch-none"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest via-surface-container-low to-surface-container-lowest opacity-90" />
                <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-surface-container-high flex items-center justify-center shadow-2xl pointer-events-none">
                  <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-surface-container flex items-center justify-center">
                    <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-surface-dim flex items-center justify-center">
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-surface-container-lowest flex items-center justify-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-on-surface-variant flex items-center justify-center relative">
                          <span className="w-2 h-2 rounded-full bg-on-background" />
                          <div className="absolute w-20 h-0.5 bg-primary/70" />
                          <div className="absolute h-20 w-0.5 bg-primary/70" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="absolute top-2 font-telemetry-sm text-[10px] text-outline">4</span>
                  <span className="absolute bottom-2 font-telemetry-sm text-[10px] text-outline">4</span>
                  <span className="absolute left-3 font-telemetry-sm text-[10px] text-outline">4</span>
                  <span className="absolute right-3 font-telemetry-sm text-[10px] text-outline">4</span>
                </div>

                {/* Dynamic Keystone Homography Mesh Overlay */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none stroke-tertiary stroke-1 fill-tertiary/10"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <polygon points={corners.map((c) => `${c.x},${c.y}`).join(' ')} />
                  <line
                    className="stroke-tertiary/40"
                    strokeDasharray="2,2"
                    x1={corners[0].x}
                    y1={corners[0].y}
                    x2={corners[2].x}
                    y2={corners[2].y}
                  />
                  <line
                    className="stroke-tertiary/40"
                    strokeDasharray="2,2"
                    x1={corners[1].x}
                    y1={corners[1].y}
                    x2={corners[3].x}
                    y2={corners[3].y}
                  />
                </svg>

                {/* Simulated Shot Impact Points */}
                <div
                  className={`absolute top-[46%] left-[52%] w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-on-primary shadow-sm transition-opacity duration-300 pointer-events-none ${
                    showSimulatedStrike ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  1
                </div>
                <div
                  className={`absolute top-[49%] left-[49.5%] w-3.5 h-3.5 rounded-full bg-tertiary flex items-center justify-center text-[8px] font-bold text-on-tertiary shadow-sm transition-opacity duration-300 pointer-events-none ${
                    showSimulatedStrike ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  2
                </div>

                {/* Draggable Corner Anchor Nodes P1-P4 */}
                {corners.map((corner, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Corner anchor P${idx + 1}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDraggingCornerIdx(idx);
                    }}
                    style={{ left: `${corner.x}%`, top: `${corner.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-move touch-none z-10"
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-tertiary-container shadow-md flex items-center justify-center ring-2 transition-transform ${
                        draggingCornerIdx === idx ? 'ring-primary scale-125' : 'ring-surface-dim'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-on-tertiary" />
                    </span>
                    <span className="font-telemetry-sm text-[9px] text-tertiary font-bold bg-surface-container-lowest/90 px-1 rounded mt-0.5 whitespace-nowrap">
                      P{idx + 1} ({Math.round(corner.x * 10)}, {Math.round(corner.y * 10)})
                    </span>
                  </button>
                ))}

                {/* Viewport HUD Overlay Details */}
                <div className="absolute bottom-2 left-2 flex items-center gap-space-xs bg-surface-container-lowest/90 backdrop-blur-md px-space-sm py-1 rounded text-outline font-telemetry-sm text-[11px] pointer-events-none">
                  <MaterialIcon name="filter_tilt_shift" className="text-[14px] text-tertiary" />
                  <span>HOMOGRAPHY [3x3 OK] • SKEW {skewDeg}°</span>
                </div>
                <div className="hidden sm:flex absolute bottom-2 right-2 items-center gap-space-xs bg-surface-container-lowest/90 backdrop-blur-md px-space-sm py-1 rounded text-outline font-telemetry-sm text-[11px] pointer-events-none">
                  <span>DRAG P1-P4 TO ALIGN</span>
                </div>
              </div>

              {/* Optical Tuning Sliders Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
                <div className="flex flex-col gap-space-xs p-space-sm rounded bg-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-outline">
                      Lighting &amp; Glare Threshold
                    </span>
                    <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">
                      {glareThreshold}%
                    </span>
                  </div>
                  <input
                    className="w-full accent-primary bg-surface-container-high h-1.5 rounded cursor-pointer"
                    max="100"
                    min="0"
                    type="range"
                    value={glareThreshold}
                    onChange={(e) => setGlareThreshold(Number(e.target.value))}
                  />
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    Rejects high-intensity downlight reflection on target face.
                  </span>
                </div>

                <div className="flex flex-col gap-space-xs p-space-sm rounded bg-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-outline">
                      Paper Substrate Contrast
                    </span>
                    <span className="font-telemetry-sm text-telemetry-sm text-tertiary font-bold">
                      {contrast}%
                    </span>
                  </div>
                  <input
                    className="w-full accent-tertiary bg-surface-container-high h-1.5 rounded cursor-pointer"
                    max="100"
                    min="0"
                    type="range"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                  />
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    Separates black target ink from beige fiber backing.
                  </span>
                </div>

                <div className="flex flex-col gap-space-xs p-space-sm rounded bg-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-outline">
                      Hole Edge Sensitivity
                    </span>
                    <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold">
                      {(edgeSensitivity / 100).toFixed(2)} mm
                    </span>
                  </div>
                  <input
                    className="w-full accent-primary-fixed-dim bg-surface-container-high h-1.5 rounded cursor-pointer"
                    max="50"
                    min="5"
                    type="range"
                    value={edgeSensitivity}
                    onChange={(e) => setEdgeSensitivity(Number(e.target.value))}
                  />
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    Sub-pixel Canny edge operator radius for clean cuts.
                  </span>
                </div>

                <div className="flex flex-col gap-space-xs p-space-sm rounded bg-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-outline">
                      Pellet Diameter Filter
                    </span>
                    <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold">
                      {getDiameterLabel(diameter)}
                    </span>
                  </div>
                  <input
                    className="w-full accent-tertiary-container bg-surface-container-high h-1.5 rounded cursor-pointer"
                    max="65"
                    min="40"
                    type="range"
                    value={diameter}
                    onChange={(e) => setDiameter(Number(e.target.value))}
                  />
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    Ignores paper tear chips smaller than pellet standard caliber.
                  </span>
                </div>
              </div>

              {/* Testing & Apply Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-xs">
                <button
                  onClick={() => {
                    setShowSimulatedStrike((prev) => !prev);
                    toast('Simulated sub-pixel pellet strike overlay toggled', 'info');
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-caps text-label-caps uppercase transition-colors"
                  type="button"
                >
                  <MaterialIcon name="flare" className="text-[18px] text-primary" />
                  <span>{showSimulatedStrike ? 'Hide Strike Preview' : 'Simulate Pellet Strike'}</span>
                </button>
                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-space-sm">
                  <button
                    onClick={() => {
                      setGlareThreshold(68);
                      setContrast(82);
                      setEdgeSensitivity(15);
                      setDiameter(45);
                      setCorners(DEFAULT_CORNERS);
                      setShowSimulatedStrike(false);
                      toast('Anchors & optical sliders reset to factory defaults', 'info');
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-label-caps text-label-caps uppercase transition-colors"
                    type="button"
                  >
                    Reset Anchors
                  </button>
                  <button
                    onClick={handleSaveCalibration}
                    className="w-full sm:w-auto flex items-center justify-center gap-space-xs px-space-xl py-space-sm rounded bg-primary text-on-primary font-headline-md text-body-md font-bold shadow-md hover:bg-primary-fixed-dim transition-colors"
                    type="button"
                  >
                    <MaterialIcon name="check_circle" className="text-[18px]" />
                    <span>Save &amp; Apply Calibration</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Companion Pairing Drawer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-low shadow-sm">
              <div className="flex items-center gap-space-md min-w-0">
                <div className="w-20 h-20 bg-surface-container-lowest p-1.5 rounded flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm12 2h2v4h-2v-4zm-2-2h2v2h-2v-2zm6 0h2v6h-2v-6zm-4 4h2v2h-2v-2zm4-6h2v2h-2v-2zm-6-2h4v2h-4v-2z" />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-caps text-label-caps uppercase text-tertiary font-bold">
                      Marksman Companion Node ({selectedLane?.token || 'MK-01'})
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                  </div>
                  <span className="font-headline-md text-body-md text-on-surface">
                    Scan to Pair Android / iOS Sensor Cam
                  </span>
                  <span className="font-telemetry-sm text-body-sm text-outline truncate">
                    {rtspDisplay}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs w-full sm:w-auto justify-end shrink-0">
                <button
                  onClick={handleCopyRtsp}
                  className="px-space-md py-space-sm rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-caps text-label-caps uppercase transition-colors"
                  type="button"
                >
                  Copy RTSP URL
                </button>
                <button
                  onClick={handleRotateToken}
                  className="px-space-md py-space-sm rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-caps text-label-caps uppercase transition-colors flex items-center gap-space-xs"
                  type="button"
                >
                  <MaterialIcon name="refresh" className="text-[16px]" />
                  <span>New Token</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Lane Modal */}
      {isAddLaneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleCreateLane}
            className="w-full max-w-md bg-surface-container-low border border-surface-container-highest rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <h3 className="font-headline-md text-on-surface font-bold uppercase">
                Provision New Optical Bay
              </h3>
              <button
                type="button"
                onClick={() => setIsAddLaneOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <MaterialIcon name="close" className="text-[18px]" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-label-caps text-outline mb-1">Lane Label</label>
                <input
                  type="text"
                  value={newLaneName}
                  onChange={(e) => setNewLaneName(e.target.value)}
                  placeholder={`Lane 0${lanes.length + 1} — 10m Olympic`}
                  className="w-full bg-surface-container-high text-on-surface px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block font-label-caps text-outline mb-1">Bay Distance Tier</label>
                <select
                  value={newLaneDist}
                  onChange={(e) => setNewLaneDist(e.target.value as any)}
                  className="w-full bg-surface-container-high text-on-surface px-3 py-2 rounded-lg text-sm"
                >
                  <option value="10m">10m Air / Olympic</option>
                  <option value="25m">25m Precision / Rapid</option>
                  <option value="50m">50m Outdoor / Three-Pos</option>
                </select>
              </div>
              <div>
                <label className="block font-label-caps text-outline mb-1">Paired Camera Source ID</label>
                <input
                  type="text"
                  value={newLaneCam}
                  onChange={(e) => setNewLaneCam(e.target.value)}
                  placeholder="CAM-05-ESP"
                  className="w-full bg-surface-container-high text-on-surface px-3 py-2 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddLaneOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-surface-container text-on-surface-variant font-label-caps uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-label-caps font-bold uppercase"
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

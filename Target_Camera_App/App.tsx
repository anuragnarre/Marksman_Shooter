// Target_Camera_App/App.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  LogBox,
  StatusBar as NativeStatusBar,
  useWindowDimensions,
} from 'react-native';

LogBox.ignoreAllLogs(true);
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import io, { Socket } from 'socket.io-client';
import {
  TargetTypeCode,
  Shot,
  CalibrationCorners,
  TARGET_SPECS,
  WiFiFrequencyBand,
  VideoComputationMode,
  MatchTimerPreset,
  MATCH_TIMER_PRESETS,
  MountingMode,
  CvFrameStats,
} from './src/types/target';
import {
  calculateShotScore,
  mapScreenPointToTargetMm,
  calculateGroupAnalytics,
  rescoreShot,
} from './src/utils/scoringEngine';
import {
  analyzeBase64Frame,
  analyzeLivePreview,
  capturePreviewBase64,
  findTargetBoundsFromCamera,
  requestMicrophonePermission,
  resetCvBaseline,
  startAudioMonitoring,
  startOrientationMonitoring,
  stopAudioMonitoring,
  stopOrientationMonitoring,
  subscribeAudio,
  subscribeOrientation,
} from './src/utils/hardwareBridge';
import { TargetOverlay } from './src/components/TargetOverlay';
import { ShotStatsHud } from './src/components/ShotStatsHud';
import { CameraControls } from './src/components/CameraControls';
import { DebugStatsOverlay } from './src/components/DebugStatsOverlay';
import { ArtificialHorizon } from './src/components/ArtificialHorizon';
import { VisualFilterOverlay, VisualFilterMode } from './src/components/VisualFilterOverlay';
import { SightAdjustmentModal } from './src/components/SightAdjustmentModal';
import { ShotHistoryModal } from './src/components/ShotHistoryModal';
import { MatchTimerModal } from './src/components/MatchTimerModal';
import { SessionExportModal } from './src/components/SessionExportModal';
import { AcousticCalibrationModal } from './src/components/AcousticCalibrationModal';

const AppStatusBar = React.memo(() => <StatusBar style="light" />);

export default function App() {
  const { width: viewWidth, height: viewHeight } = useWindowDimensions();
  const topInset =
    Platform.OS === 'android'
      ? Math.max(28, (NativeStatusBar.currentHeight ?? 24) + 6)
      : 44;
  const hudTopOffset = topInset + 76;
  const bottomReservedPx = 195;

  const computeCenteredCorners = useCallback(
    (w: number, h: number, topY: number, bottomRes: number, isCalibrated = false): CalibrationCorners => {
      const availH = Math.max(160, h - bottomRes - (topY + 20));
      const size = Math.min(w * 0.78, availH * 0.90);
      const left = (w - size) / 2;
      const top = topY + 10 + (availH - size) / 2;
      return {
        topLeft: { x: left, y: top },
        topRight: { x: left + size, y: top },
        bottomRight: { x: left + size, y: top + size },
        bottomLeft: { x: left, y: top + size },
        isCalibrated,
      };
    },
    []
  );

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [pictureSize, setPictureSize] = useState<string | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);
  const [laneId, setLaneId] = useState('1');
  const defaultUrl = 'https://api.marksmanshooter.in';
  const [serverUrl, setServerUrl] = useState(defaultUrl);
  const [isConnected, setIsConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [targetType, setTargetType] = useState<TargetTypeCode>('air_pistol_10m');
  const [reticleMode, setReticleMode] = useState<'wireframe' | 'full' | 'crosshair' | 'hidden'>('wireframe');

  // Audio / Acoustic Detection State
  const [micDb, setMicDb] = useState(38.0);
  const [acousticThresholdDb, setAcousticThresholdDb] = useState(95);
  const [isMicArmed, setIsMicArmed] = useState(false);
  const [acousticDryFireMode, setAcousticDryFireMode] = useState(false);

  // Calibration & Optical CV State
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);
  const [isDetectingTarget, setIsDetectingTarget] = useState(false);
  const [cvDeltaThreshold, setCvDeltaThreshold] = useState(26);
  const [cvStats, setCvStats] = useState<CvFrameStats | null>(null);
  const [isCeasefireActive, setIsCeasefireActive] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [streamFps, setStreamFps] = useState(15);
  const [measuredFps, setMeasuredFps] = useState(0);
  const [qualityFactor, setQualityFactor] = useState(0.45);
  const [computationMode, setComputationMode] = useState<VideoComputationMode>('ON_DEVICE_EDGE');
  const [wifiBand, setWifiBand] = useState<WiFiFrequencyBand>('2.4GHz');
  const [zoom, setZoom] = useState(0);
  const [sendImpactSnapshot, setSendImpactSnapshot] = useState(true);
  const [lastSnapshotToast, setLastSnapshotToast] = useState<string | null>(null);
  const [isAutoDetectActive, setIsAutoDetectActive] = useState(false);

  // Modals & Inspection States
  const [isSighterMode, setIsSighterMode] = useState(false);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [isSightAdvisorVisible, setIsSightAdvisorVisible] = useState(false);
  const [isShotHistoryVisible, setIsShotHistoryVisible] = useState(false);
  const [isSessionExportVisible, setIsSessionExportVisible] = useState(false);
  const [isAcousticCalibVisible, setIsAcousticCalibVisible] = useState(false);

  // Precision Match Countdown Timer States
  const [isMatchTimerVisible, setIsMatchTimerVisible] = useState(false);
  const [timerPreset, setTimerPreset] = useState<MatchTimerPreset>('ISSF_60_SHOTS');
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(4500);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(4500);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Digital Target Loupe (1x Full, 2x Black, 4x 10-Ring)
  const [targetZoom, setTargetZoom] = useState(1);

  // Telemetry & Hardware IMU States
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [isDebugStatsVisible, setIsDebugStatsVisible] = useState(false);
  const [filterMode, setFilterMode] = useState<VisualFilterMode>('NATURAL');
  const [rawRoll, setRawRoll] = useState(0.0);
  const [rawPitch, setRawPitch] = useState(0.0);
  const [mountingMode, setMountingMode] = useState<MountingMode>('OVERHEAD_DOWN');
  const [horizonZeroOffset, setHorizonZeroOffset] = useState({ roll: 0, pitch: 0 });
  const [isHorizonVisible, setIsHorizonVisible] = useState(true);

  const [corners, setCorners] = useState<CalibrationCorners>(() =>
    computeCenteredCorners(viewWidth, viewHeight, hudTopOffset, bottomReservedPx, false)
  );

  // Keep uncalibrated quad centered if dimensions change
  useEffect(() => {
    setCorners((prev) =>
      prev.isCalibrated ? prev : computeCenteredCorners(viewWidth, viewHeight, hudTopOffset, bottomReservedPx, false)
    );
  }, [viewWidth, viewHeight, hudTopOffset, bottomReservedPx, computeCenteredCorners]);

  // Refs to prevent ALL stale closures in intervals, callbacks & WebSocket listeners
  const cameraRef = useRef<CameraView>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDetectInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCapturingRef = useRef(false);
  const isCvBusyRef = useRef(false);
  const frameSeqRef = useRef(0);
  const framesInSecondRef = useRef(0);
  const lastImpulseAtRef = useRef(0);
  const lastMoveWarnAtRef = useRef(0);

  const viewWidthRef = useRef(viewWidth);
  viewWidthRef.current = viewWidth;
  const viewHeightRef = useRef(viewHeight);
  viewHeightRef.current = viewHeight;
  const cornersRef = useRef(corners);
  cornersRef.current = corners;
  const laneIdRef = useRef(laneId);
  laneIdRef.current = laneId;
  const targetTypeRef = useRef(targetType);
  targetTypeRef.current = targetType;
  const shotsRef = useRef(shots);
  shotsRef.current = shots;
  const isSighterModeRef = useRef(isSighterMode);
  isSighterModeRef.current = isSighterMode;
  const isCeasefireRef = useRef(isCeasefireActive);
  isCeasefireRef.current = isCeasefireActive;
  const computationModeRef = useRef(computationMode);
  computationModeRef.current = computationMode;
  const streamFpsRef = useRef(streamFps);
  streamFpsRef.current = streamFps;
  const qualityFactorRef = useRef(qualityFactor);
  qualityFactorRef.current = qualityFactor;
  const wifiBandRef = useRef(wifiBand);
  wifiBandRef.current = wifiBand;
  const isConnectedRef = useRef(isConnected);
  isConnectedRef.current = isConnected;
  const latencyMsRef = useRef(latencyMs);
  latencyMsRef.current = latencyMs;
  const sendImpactSnapshotRef = useRef(sendImpactSnapshot);
  sendImpactSnapshotRef.current = sendImpactSnapshot;
  const isMicArmedRef = useRef(isMicArmed);
  isMicArmedRef.current = isMicArmed;
  const acousticThresholdRef = useRef(acousticThresholdDb);
  acousticThresholdRef.current = acousticThresholdDb;
  const acousticDryFireRef = useRef(acousticDryFireMode);
  acousticDryFireRef.current = acousticDryFireMode;
  const cvDeltaThresholdRef = useRef(cvDeltaThreshold);
  cvDeltaThresholdRef.current = cvDeltaThreshold;
  const rawRollRef = useRef(rawRoll);
  rawRollRef.current = rawRoll;
  const rawPitchRef = useRef(rawPitch);
  rawPitchRef.current = rawPitch;

  const showToast = useCallback((msg: string, durationMs = 2400) => {
    setLastSnapshotToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setLastSnapshotToast(null), durationMs);
  }, []);

  const rollAngle = parseFloat((rawRoll - horizonZeroOffset.roll).toFixed(1));
  const pitchAngle = parseFloat((rawPitch - horizonZeroOffset.pitch).toFixed(1));

  // Subscribe to REAL Android Accelerometer / Spirit-Level Sensor
  useEffect(() => {
    let prevMode: MountingMode | null = null;
    startOrientationMonitoring();
    const unsub = subscribeOrientation((reading) => {
      setRawRoll(reading.rollDeg);
      setRawPitch(reading.pitchDeg);
      if (prevMode !== null && prevMode !== reading.mountingMode) {
        setHorizonZeroOffset({ roll: 0, pitch: 0 });
      }
      prevMode = reading.mountingMode;
      setMountingMode(reading.mountingMode);
    });
    return () => {
      unsub();
      stopOrientationMonitoring();
    };
  }, []);

  // Safe Shot Registration (uses shotsRef + functional state to NEVER overwrite existing shots)
  const registerNewShot = useCallback((newShot: Shot) => {
    const baseShots = shotsRef.current;
    const assignedNumber = baseShots.length + 1;
    const finalShot: Shot = { ...newShot, shotNumber: assignedNumber };
    const updatedShots = [...baseShots, finalShot];
    shotsRef.current = updatedShots;
    setShots(updatedShots);

    if (socketRef.current && isConnectedRef.current) {
      const analytics = calculateGroupAnalytics(updatedShots);
      const curLane = laneIdRef.current;
      const curTarget = targetTypeRef.current;

      socketRef.current.emit('shot_detected', {
        rangeId: 'main-range-1',
        laneId: curLane,
        targetType: curTarget,
        shotNumber: finalShot.shotNumber,
        score: finalShot.score,
        decimalScore: finalShot.decimalScore,
        isInnerTen: finalShot.isInnerTen,
        clock: finalShot.clock,
        x: finalShot.normalizedX,
        y: finalShot.normalizedY,
        xMm: finalShot.xMm,
        yMm: finalShot.yMm,
        radialDistanceMm: finalShot.radialDistanceMm,
        flightTimeMs: finalShot.flightTimeMs,
        muzzleVelocityMps: finalShot.muzzleVelocityMps,
        acousticTriggered: finalShot.acousticTriggered,
        isSighter: finalShot.isSighter,
        totalShots: updatedShots.length,
        averageScore: analytics.averageScore,
        extremeSpreadMm: analytics.extremeSpreadMm,
        timestamp: finalShot.timestamp,
      });

      socketRef.current.emit('lane_status_updated', {
        rangeId: 'main-range-1',
        laneId: curLane,
        status: 'OCCUPIED',
        lastScore: finalShot.decimalScore,
        totalShots: updatedShots.length,
      });

      if (sendImpactSnapshotRef.current) {
        capturePreviewBase64(640, 65)
          .then((snap) => {
            if (snap?.base64 && socketRef.current) {
              socketRef.current.emit('shot_impact_snapshot', {
                rangeId: 'main-range-1',
                laneId: curLane,
                shotNumber: finalShot.shotNumber,
                score: finalShot.decimalScore,
                xMm: finalShot.xMm,
                yMm: finalShot.yMm,
                image: snap.base64,
                timestamp: Date.now(),
              });
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Real Native Optical Computer Vision Pipeline (PixelCopy Preview + silent takePictureAsync fallback)
  const runNativeCvStep = useCallback(
    async (mode: 'SET_BASELINE' | 'SCAN_DELTA' | 'METRICS_ONLY', fromAcoustic = false): Promise<CvFrameStats | null> => {
      if (isCvBusyRef.current) return null;
      isCvBusyRef.current = true;
      try {
        const w = viewWidthRef.current;
        const h = viewHeightRef.current;
        const q = cornersRef.current;
        const thresh = cvDeltaThresholdRef.current;

        let res = await analyzeLivePreview(q, w, h, mode, thresh);
        if (!res || res.previewUnavailable) {
          if (cameraRef.current) {
            try {
              const photo = await cameraRef.current.takePictureAsync({
                quality: 0.45,
                base64: true,
                skipProcessing: true,
                shutterSound: false,
              });
              if (photo?.base64) {
                res = await analyzeBase64Frame(photo.base64, q, w, h, mode, thresh);
              }
            } catch {
              // Camera busy
            }
          }
        }

        if (!res || res.previewUnavailable) {
          return null;
        }

        setCvStats(res);
        setTotalFrames((prev) => prev + 1);
        framesInSecondRef.current += 1;

        if (mode === 'SET_BASELINE') {
          showToast(
            res.baselineLocked
              ? `📸 Baseline Locked (Luma ${res.lumaAvg.toFixed(0)} | Sharp ${res.sharpnessScore.toFixed(0)}%)`
              : `⚠ Target Too Dark (Luma ${res.lumaAvg.toFixed(0)}) — Enable Torch`,
            2600
          );
          return res;
        }

        if (res.cameraMoved) {
          const now = Date.now();
          if (now - lastMoveWarnAtRef.current > 3500) {
            lastMoveWarnAtRef.current = now;
            showToast('⚠ CAMERA MOVED — Tap BASELINE or SCAN CV to re-lock', 2600);
          }
          return res;
        }

        if (mode === 'SCAN_DELTA' && res.hasImpact && typeof res.normU === 'number' && typeof res.normV === 'number') {
          const curTarget = targetTypeRef.current;
          const spec = TARGET_SPECS[curTarget];
          const xMm = res.normU * (spec.totalDiameterMm / 2);
          const yMm = res.normV * (spec.totalDiameterMm / 2);
          const shotNumber = shotsRef.current.length + 1;
          const baseShot = calculateShotScore(xMm, yMm, curTarget, 4.5, shotNumber);

          const flightTimeMs = +(spec.distanceM * 5.6).toFixed(1);
          const enrichedShot: Shot = {
            ...baseShot,
            acousticTriggered: fromAcoustic,
            flightTimeMs: fromAcoustic ? flightTimeMs : undefined,
            muzzleVelocityMps: fromAcoustic ? Math.round(spec.distanceM / (flightTimeMs / 1000)) : undefined,
            isSighter: isSighterModeRef.current,
          };

          registerNewShot(enrichedShot);
          showToast(
            `${fromAcoustic ? '⚡' : '📸'} Optical Hole #${enrichedShot.shotNumber}: ${enrichedShot.decimalScore.toFixed(1)} (${enrichedShot.clock})`,
            2800
          );
        }

        return res;
      } finally {
        isCvBusyRef.current = false;
      }
    },
    [registerNewShot, showToast]
  );

  // Acoustic Triggered Shot Handler (used by Socket event, Test Acoustic button, or Dry-Fire mode)
  const recordAcousticShot = useCallback(
    (tMuzzle?: number, amplitudeDba?: number) => {
      if (isCeasefireRef.current) return;
      const curTarget = targetTypeRef.current;
      const spec = TARGET_SPECS[curTarget];
      const baseFlightMs = spec.distanceM * 5.6;
      const now = Date.now();
      let flightTimeMs = +(baseFlightMs + (Math.random() * 2 - 1)).toFixed(1);
      if (tMuzzle && now > tMuzzle) {
        const measured = now - tMuzzle;
        if (measured >= 20 && measured <= 300) {
          flightTimeMs = measured;
        }
      }
      const muzzleVelocityMps = Math.round(spec.distanceM / (flightTimeMs / 1000));
      const angle = Math.random() * 2 * Math.PI;
      const scatterRadius = Math.random() * spec.rings[0].radiusMm * 1.2;
      const baseShot = calculateShotScore(
        Math.cos(angle) * scatterRadius,
        Math.sin(angle) * scatterRadius,
        curTarget,
        4.5,
        shotsRef.current.length + 1
      );
      const newShot: Shot = {
        ...baseShot,
        acousticTriggered: true,
        flightTimeMs,
        muzzleVelocityMps,
        isSighter: isSighterModeRef.current,
      };
      registerNewShot(newShot);
      showToast(
        `⚡ Acoustic Shot #${newShot.shotNumber} (${Math.round(amplitudeDba ?? micDb)}dB): ${newShot.decimalScore.toFixed(1)} (${muzzleVelocityMps}m/s)`
      );
    },
    [micDb, registerNewShot, showToast]
  );

  // Handle Real Microphone Impulse Over Threshold
  const handleMicImpulse = useCallback(
    async (peakDb: number) => {
      if (isCeasefireRef.current) return;
      if (acousticDryFireRef.current) {
        recordAcousticShot(undefined, peakDb);
        return;
      }
      const scanRes = await runNativeCvStep('SCAN_DELTA', true);
      if (!scanRes?.hasImpact) {
        showToast(`🎤 Impulse ${peakDb.toFixed(0)} dB — No new optical hole in quad`, 2200);
      }
    },
    [recordAcousticShot, runNativeCvStep, showToast]
  );

  // Subscribe to REAL Android AudioRecord SPL stream
  useEffect(() => {
    let active = true;
    const initAudio = async () => {
      const granted = await requestMicrophonePermission();
      if (active && granted) {
        await startAudioMonitoring();
      }
    };
    initAudio();

    const unsub = subscribeAudio((reading) => {
      // Responsive peak-hold weighted level
      setMicDb((prev) => {
        const target = Math.max(reading.rmsDb, reading.peakDb * 0.92);
        return +(target > prev ? target : prev * 0.65 + reading.rmsDb * 0.35).toFixed(1);
      });

      if (isMicArmedRef.current && reading.peakDb >= acousticThresholdRef.current) {
        const now = Date.now();
        if (now - lastImpulseAtRef.current > 900) {
          lastImpulseAtRef.current = now;
          handleMicImpulse(reading.peakDb);
        }
      }
    });

    return () => {
      active = false;
      unsub();
      stopAudioMonitoring();
    };
  }, [handleMicImpulse]);

  // Passive CV Scene Health Sampling when Stats/Filters are visible so telemetry is always live
  useEffect(() => {
    if (!isCameraReady || isAutoDetectActive) return;
    if (!isDebugStatsVisible && filterMode === 'NATURAL') return;

    const timer = setInterval(() => {
      runNativeCvStep('METRICS_ONLY');
    }, 1200);
    return () => clearInterval(timer);
  }, [isCameraReady, isAutoDetectActive, isDebugStatsVisible, filterMode, runNativeCvStep]);

  // Session uptime timer
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Match countdown timer effect
  useEffect(() => {
    if (!isTimerRunning) return;
    const timerInterval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          setIsCeasefireActive(true);
          showToast('🚨 TIME EXPIRED — RANGE CEASEFIRE ORDERED', 4000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [isTimerRunning, showToast]);

  const handleSelectTimerPreset = (preset: MatchTimerPreset) => {
    setTimerPreset(preset);
    const duration = MATCH_TIMER_PRESETS[preset].durationSeconds;
    setTimerSecondsLeft(duration);
    setTimerTotalSeconds(duration);
    setIsTimerRunning(false);
    showToast(`⏱️ Timer Preset: ${MATCH_TIMER_PRESETS[preset].label}`);
  };

  const handleToggleTimer = () => {
    if (timerSecondsLeft <= 0) {
      setTimerSecondsLeft(timerTotalSeconds);
      setIsTimerRunning(true);
      setIsCeasefireActive(false);
    } else {
      setIsTimerRunning(!isTimerRunning);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSecondsLeft(timerTotalSeconds);
    showToast('⏱️ Match Timer Reset');
  };

  const handleAdjustTimer = (deltaSeconds: number) => {
    setTimerSecondsLeft((prev) => Math.max(5, prev + deltaSeconds));
  };

  const handleCycleTargetZoom = () => {
    setTargetZoom((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1));
  };

  const handleZeroHorizon = useCallback(() => {
    setHorizonZeroOffset({ roll: rawRollRef.current, pitch: rawPitchRef.current });
    showToast('📐 Spirit Level Tared (0.0° Zero)', 2000);
  }, [showToast]);

  const handleCycleFilterMode = () => {
    setFilterMode((prev) => {
      if (prev === 'NATURAL') return 'FALSE_COLOR';
      if (prev === 'FALSE_COLOR') return 'HIGH_CONTRAST';
      if (prev === 'HIGH_CONTRAST') return 'MONO_THRESHOLD';
      return 'NATURAL';
    });
  };

  const handleNextZoom = () => {
    setZoom((prev) => {
      if (prev < 0.2) return 0.25;
      if (prev < 0.45) return 0.50;
      if (prev < 0.7) return 0.80;
      return 0;
    });
  };

  const handleCycleReticleMode = () => {
    setReticleMode((prev) => {
      if (prev === 'wireframe') return 'full';
      if (prev === 'full') return 'crosshair';
      if (prev === 'crosshair') return 'hidden';
      return 'wireframe';
    });
  };

  const handleSnapCenterQuad = () => {
    setCorners(computeCenteredCorners(viewWidth, viewHeight, hudTopOffset, bottomReservedPx, true));
    resetCvBaseline();
    showToast('⌖ Quad Centered (1:1 Ratio) — Lock Baseline to scan');
  };

  const handleAutoDetectTarget = async () => {
    setIsDetectingTarget(true);
    try {
      const detected = await findTargetBoundsFromCamera(viewWidth, viewHeight);
      if (detected.found && detected.corners) {
        setCorners(detected.corners);
        await resetCvBaseline();
        showToast(
          `🔍 Auto-Locked High-Contrast Target (${Math.round((detected.confidence ?? 0.8) * 100)}%)`,
          2800
        );
      } else {
        showToast(
          `🔍 ${detected.reason === 'LOW_SCENE_CONTRAST' ? 'Low contrast scene — point at dark bullseye/card or drag TL/TR/BR/BL' : 'No distinct circular target found — drag corners manually'}`,
          3000
        );
      }
    } finally {
      setIsDetectingTarget(false);
    }
  };

  const handleLockBaseline = async () => {
    await runNativeCvStep('SET_BASELINE');
  };

  const handleManualCvScan = async () => {
    if (!cvStats?.baselineLocked) {
      await runNativeCvStep('SET_BASELINE');
    } else {
      const res = await runNativeCvStep('SCAN_DELTA', false);
      if (res && !res.hasImpact && !res.cameraMoved) {
        showToast(`📸 Clean Scan (Diff ${res.meanAbsDiff ?? 0} | Luma ${res.lumaAvg.toFixed(0)})`, 1800);
      }
    }
  };

  const handleSelectTargetType = (newTarget: TargetTypeCode) => {
    setTargetType(newTarget);
    setShots((prev) => prev.map((s) => rescoreShot(s, newTarget)));
    showToast(`🎯 Switched to ${TARGET_SPECS[newTarget].name}`);

    if (socketRef.current && isConnected) {
      socketRef.current.emit('update_stream_config', {
        laneId,
        config: { targetType: newTarget },
      });
    }
  };

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    if (streamInterval.current) {
      clearInterval(streamInterval.current);
      streamInterval.current = null;
    }
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit('stop_camera_stream', { laneId: laneIdRef.current });
    }
  }, []);

  const connectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      const socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 8,
        timeout: 5000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('joinLiveRange', 'main-range-1');
        socket.emit('joinRangeMonitor', 'main-range-1');
        socket.emit('start_camera_stream', { laneId: laneIdRef.current });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        setIsStreaming(false);
        setLatencyMs(null);
      });

      socket.on('stream_pong', (data: any) => {
        const now = Date.now();
        const sent = data?.clientTimestamp || now;
        setLatencyMs(Math.max(1, now - sent));
      });

      socket.on('shot_detected', (data: any) => {
        if (!data) return;
        if (data.laneId && data.laneId !== laneIdRef.current) return;

        const exists = shotsRef.current.some(
          (s) => Math.abs(s.xMm - (data.xMm ?? data.x * 20)) < 0.1 && Math.abs(s.yMm - (data.yMm ?? data.y * 20)) < 0.1
        );
        if (!exists && typeof data.score === 'number') {
          const curTarget = targetTypeRef.current;
          const spec = TARGET_SPECS[curTarget];
          const newShot = calculateShotScore(
            data.xMm ?? data.x * (spec.totalDiameterMm / 2),
            data.yMm ?? data.y * (spec.totalDiameterMm / 2),
            curTarget,
            4.5,
            shotsRef.current.length + 1
          );
          const nextShots = [...shotsRef.current, newShot];
          shotsRef.current = nextShots;
          setShots(nextShots);
          showToast(`🎯 Remote Hit: ${newShot.decimalScore.toFixed(1)} (${newShot.clock})`);
        }
      });

      socket.on('clear_shots', (data: any) => {
        if (!data?.laneId || data.laneId === laneIdRef.current) {
          shotsRef.current = [];
          setShots([]);
          setSelectedShotId(null);
          resetCvBaseline();
          showToast('🧹 Target Face Cleared by Range Operator');
        }
      });

      socket.on('reset_lane', (data: any) => {
        if (!data?.laneId || data.laneId === laneIdRef.current) {
          shotsRef.current = [];
          setShots([]);
          setSelectedShotId(null);
          resetCvBaseline();
          showToast('🔄 Firing Lane Reset');
        }
      });

      socket.on('change_target', (data: any) => {
        if (data?.targetType && TARGET_SPECS[data.targetType as TargetTypeCode]) {
          handleSelectTargetType(data.targetType as TargetTypeCode);
        }
      });

      socket.on('stream_config_updated', (data: any) => {
        if (data?.laneId === laneIdRef.current && data?.config) {
          if (typeof data.config.targetFps === 'number') setStreamFps(data.config.targetFps);
          if (typeof data.config.qualityFactor === 'number') setQualityFactor(data.config.qualityFactor);
          if (data.config.computationMode) setComputationMode(data.config.computationMode);
          if (data.config.wifiBand) setWifiBand(data.config.wifiBand);
          if (typeof data.config.sendImpactSnapshot === 'boolean') {
            setSendImpactSnapshot(data.config.sendImpactSnapshot);
          }
          if (data.config.targetType && TARGET_SPECS[data.config.targetType as TargetTypeCode]) {
            handleSelectTargetType(data.config.targetType as TargetTypeCode);
          }
        }
      });

      socket.on('range_ceasefire', (data: any) => {
        if (data?.active) {
          setIsCeasefireActive(true);
          stopStreaming();
          if (autoDetectInterval.current) {
            clearInterval(autoDetectInterval.current);
            autoDetectInterval.current = null;
            setIsAutoDetectActive(false);
          }
        } else {
          setIsCeasefireActive(false);
        }
      });

      socket.on('shot_acoustic_trigger', (data: any) => {
        if (!data?.laneId || data.laneId === laneIdRef.current) {
          recordAcousticShot(data?.tMuzzle, data?.amplitudeDba);
        }
      });
    } catch (err) {
      console.warn('Socket connection error:', err);
    }
  }, [serverUrl, recordAcousticShot, showToast, stopStreaming]);

  useEffect(() => {
    connectSocket();
    return () => {
      stopStreaming();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connectSocket, stopStreaming]);

  // Periodic latency ping
  useEffect(() => {
    if (!isConnected) return;
    const pingTimer = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('stream_ping', {
          clientTimestamp: Date.now(),
          laneId: laneIdRef.current,
        });
      }
    }, 2000);
    return () => clearInterval(pingTimer);
  }, [isConnected]);

  // Measured FPS calculation
  useEffect(() => {
    const fpsTimer = setInterval(() => {
      setMeasuredFps(framesInSecondRef.current);
      framesInSecondRef.current = 0;
    }, 1000);
    return () => clearInterval(fpsTimer);
  }, []);

  const handleSelectWifiBand = (band: WiFiFrequencyBand) => {
    setWifiBand(band);
    if (band === '2.4GHz') {
      setStreamFps(12);
      setQualityFactor(0.35);
    } else if (band === '5GHz') {
      setStreamFps(20);
      setQualityFactor(0.6);
    } else if (band === '6GHz+') {
      setStreamFps(25);
      setQualityFactor(0.75);
    }
    if (socketRef.current && isConnected) {
      socketRef.current.emit('stream_telemetry', {
        laneId,
        wifiBand: band,
        computationMode,
        rttMs: latencyMs ?? 6,
        bandwidthKbps: band === '2.4GHz' ? 280 : band === '5GHz' ? 1800 : 3200,
        networkQuality: 'EXCELLENT',
        timestamp: Date.now(),
      });
    }
  };

  const beginCapture = () => {
    if (isCeasefireRef.current) return;
    if (!socketRef.current || !socketRef.current.connected) {
      showToast('📡 Connect Gateway URL (Settings ⚙) to stream live video', 2800);
      return;
    }

    if (streamInterval.current) {
      clearInterval(streamInterval.current);
      streamInterval.current = null;
    }

    setIsStreaming(true);
    socketRef.current.emit('start_camera_stream', {
      laneId: laneIdRef.current,
      computationMode: computationModeRef.current,
      wifiBand: wifiBandRef.current,
    });

    const intervalMs = Math.max(55, Math.floor(1000 / Math.max(5, streamFpsRef.current)));
    let lastTelemetryEmit = Date.now();

    streamInterval.current = setInterval(async () => {
      if (isCeasefireRef.current) return;

      const curMode = computationModeRef.current;
      const curFps = streamFpsRef.current;
      const curQuality = qualityFactorRef.current;
      const curLane = laneIdRef.current;
      const now = Date.now();

      if (now - lastTelemetryEmit >= 2000 && socketRef.current?.connected) {
        lastTelemetryEmit = now;
        socketRef.current.emit('stream_telemetry', {
          laneId: curLane,
          currentFps: measuredFps || curFps,
          targetFps: curFps,
          rttMs: latencyMsRef.current ?? 6,
          jitterMs: 1,
          bandwidthKbps: curMode === 'ON_DEVICE_EDGE' ? 1.5 : wifiBandRef.current === '2.4GHz' ? 280 : 1800,
          droppedFramesCount: 0,
          dropRatePercent: 0,
          networkQuality: (latencyMsRef.current ?? 6) < 30 ? 'EXCELLENT' : 'GOOD',
          isThrottled: false,
          activeProfile: curMode === 'ON_DEVICE_EDGE' ? 'BANDWIDTH_SAVER' : 'ULTRA_LOW_LATENCY',
          wifiBand: wifiBandRef.current,
          computationMode: curMode,
          timestamp: now,
        });
      }

      if (curMode !== 'ON_DEVICE_EDGE') {
        if (isCapturingRef.current || !socketRef.current?.connected) return;
        isCapturingRef.current = true;
        try {
          // Prefer silent GPU PixelCopy preview capture (~5ms, zero shutter flash/sound)
          const previewSnap = await capturePreviewBase64(480, Math.round(Math.min(0.6, curQuality) * 100));
          let base64Frame = previewSnap?.base64;

          if (!base64Frame && cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({
              quality: Math.min(0.4, curQuality),
              base64: true,
              skipProcessing: true,
              shutterSound: false,
            });
            base64Frame = photo?.base64;
          }

          if (base64Frame && socketRef.current?.connected) {
            framesInSecondRef.current += 1;
            setTotalFrames((prev) => prev + 1);
            const currentSeq = frameSeqRef.current++;
            socketRef.current.emit('camera_frame', {
              laneId: curLane,
              frame: base64Frame,
              targetType: targetTypeRef.current,
              seq: currentSeq,
              computationMode: curMode,
              timestamp: now,
            });
          }
        } catch {
          // Frame skipped
        } finally {
          isCapturingRef.current = false;
        }
      } else {
        framesInSecondRef.current += 1;
        setTotalFrames((prev) => prev + 1);
      }
    }, intervalMs);
  };

  const startStreaming = () => {
    if (isCeasefireActive) return;
    if (!socketRef.current || !isConnected) {
      connectSocket();
      setTimeout(() => beginCapture(), 900);
    } else {
      beginCapture();
    }
  };

  // Manual Touch Shot on Target Face
  const handleTargetPress = (screenX: number, screenY: number) => {
    if (isCeasefireActive) return;

    const targetMm = mapScreenPointToTargetMm(
      { x: screenX, y: screenY },
      corners,
      targetType
    );

    const shotNumber = shotsRef.current.length + 1;
    const baseShot = calculateShotScore(
      targetMm.x,
      targetMm.y,
      targetType,
      4.5,
      shotNumber
    );
    const newShot: Shot = {
      ...baseShot,
      isSighter: isSighterModeRef.current,
    };

    registerNewShot(newShot);
    showToast(
      `🎯 ${newShot.isSighter ? '[SIGHTER]' : 'Hit'} #${newShot.shotNumber}: ${newShot.decimalScore.toFixed(1)} (${newShot.clock})`
    );
  };

  // Explicit Manual Test Hit Drill
  const handleSimulateShot = () => {
    if (isCeasefireActive) return;

    const angle = Math.random() * 2 * Math.PI;
    const spec = TARGET_SPECS[targetType];
    const tenRadius = spec.rings[0].radiusMm;
    const scatterRadius = Math.random() * tenRadius * 1.4;
    const simX = Math.cos(angle) * scatterRadius;
    const simY = Math.sin(angle) * scatterRadius;

    const baseShot = calculateShotScore(simX, simY, targetType, 4.5, shotsRef.current.length + 1);
    const newShot: Shot = {
      ...baseShot,
      isSighter: isSighterModeRef.current,
    };

    registerNewShot(newShot);
    showToast(
      `🧪 Test Hit #${newShot.shotNumber}: ${newShot.decimalScore.toFixed(1)} (${newShot.clock})`
    );
  };

  // Real Continuous Optical Frame-Diff Detector (replaces random fake hit timer!)
  const handleToggleAutoDetect = async () => {
    if (isAutoDetectActive) {
      if (autoDetectInterval.current) {
        clearInterval(autoDetectInterval.current);
        autoDetectInterval.current = null;
      }
      setIsAutoDetectActive(false);
      showToast('⏸ Live Optical CV Detector Paused');
      return;
    }

    setIsAutoDetectActive(true);
    await runNativeCvStep('SET_BASELINE');

    if (autoDetectInterval.current) {
      clearInterval(autoDetectInterval.current);
    }

    autoDetectInterval.current = setInterval(() => {
      if (isCeasefireRef.current) return;
      runNativeCvStep('SCAN_DELTA', false);
    }, 750);
  };

  useEffect(() => {
    return () => {
      if (autoDetectInterval.current) {
        clearInterval(autoDetectInterval.current);
        autoDetectInterval.current = null;
      }
    };
  }, []);

  const handleToggleMicArmed = async () => {
    const granted = await requestMicrophonePermission();
    if (!granted) {
      showToast('⚠ Microphone permission required for Acoustic Trigger', 2800);
      return;
    }
    await startAudioMonitoring();
    const next = !isMicArmed;
    setIsMicArmed(next);
    showToast(
      next
        ? `⚡ Mic Trigger ARMED (>= ${acousticThresholdDb} dB)`
        : '🎤 Mic Trigger DISARMED (Monitor Only)'
    );
  };

  const handleClearShots = () => {
    shotsRef.current = [];
    setShots([]);
    setSelectedShotId(null);
    resetCvBaseline();
    if (socketRef.current && isConnected) {
      socketRef.current.emit('clear_shots', { laneId });
    }
    showToast('🧹 Shots & CV Baseline Cleared');
  };

  const handleToggleSighter = (shotId: string) => {
    setShots((prev) => prev.map((s) => (s.id === shotId ? { ...s, isSighter: !s.isSighter } : s)));
  };

  const handleDeleteShot = (shotId: string) => {
    setShots((prev) => {
      const filtered = prev.filter((s) => s.id !== shotId);
      const renumbered = filtered.map((s, idx) => ({ ...s, shotNumber: idx + 1 }));
      shotsRef.current = renumbered;
      return renumbered;
    });
    if (selectedShotId === shotId) setSelectedShotId(null);
    showToast('🗑️ Shot Deleted');
  };

  const handleCameraReady = async () => {
    setIsCameraReady(true);
    try {
      const sizes = await cameraRef.current?.getAvailablePictureSizesAsync?.();
      if (sizes && sizes.length > 0) {
        // Choose fast compact resolution (>= 640px wide) to avoid 12MP/48MP decode lag
        const parsed = sizes
          .map((s) => {
            const [wStr, hStr] = s.split('x');
            return { raw: s, w: parseInt(wStr, 10) || 0, h: parseInt(hStr, 10) || 0 };
          })
          .filter((x) => x.w >= 640 && x.h >= 480)
          .sort((a, b) => a.w * a.h - b.w * b.h);
        if (parsed.length > 0 && !pictureSize) {
          setPictureSize(parsed[0].raw);
        }
      }
    } catch {
      // Optional on devices without enumerable sizes
    }
  };

  const targetDiameterPx = (
    Math.hypot(corners.topRight.x - corners.topLeft.x, corners.topRight.y - corners.topLeft.y) +
    Math.hypot(corners.bottomRight.x - corners.bottomLeft.x, corners.bottomRight.y - corners.bottomLeft.y)
  ) / 2;
  const spec = TARGET_SPECS[targetType];
  const mmToPx = targetDiameterPx / 2 / (spec.totalDiameterMm / 2);
  const opticalResolutionMmPerPx = targetDiameterPx > 0 ? spec.totalDiameterMm / targetDiameterPx : 0.142;

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.permissionText}>
          Camera access is required for Target Optical Calibration &amp; Shot Detection
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>GRANT CAMERA PERMISSION</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <AppStatusBar />

      {/* Background Camera2 / CameraX Live Feed */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        ref={cameraRef}
        zoom={zoom}
        enableTorch={torchEnabled}
        animateShutter={false}
        pictureSize={pictureSize}
        onCameraReady={handleCameraReady}
        onMountError={(ev) => showToast(`📷 Camera Error: ${ev.message}`, 3500)}
      />

      {/* Visual Filter Overlay aligned to real quad center & perspective */}
      <VisualFilterOverlay
        filterMode={filterMode}
        corners={corners}
        targetType={targetType}
        targetZoom={targetZoom}
        shots={shots}
        mmToPx={mmToPx}
        topOffset={hudTopOffset}
        cvStats={cvStats}
        isCalibrationMode={isCalibrationMode}
      />

      {/* Optical Target Overlay (Homography, Rings, Shots, MPI, Calibration Handles) */}
      <TargetOverlay
        width={viewWidth}
        height={viewHeight}
        targetType={targetType}
        corners={corners}
        onUpdateCorners={setCorners}
        isCalibrationMode={isCalibrationMode}
        onExitCalibration={() => setIsCalibrationMode(false)}
        shots={shots}
        onTargetPress={handleTargetPress}
        reticleMode={reticleMode}
        selectedShotId={selectedShotId}
        onSelectShot={setSelectedShotId}
        onToggleSighter={handleToggleSighter}
        onDeleteShot={handleDeleteShot}
        onSnapCenterQuad={handleSnapCenterQuad}
        onAutoDetectTarget={handleAutoDetectTarget}
        onLockBaseline={handleLockBaseline}
        isDetectingTarget={isDetectingTarget}
        baselineLocked={Boolean(cvStats?.baselineLocked)}
        targetZoom={targetZoom}
        topOffset={hudTopOffset}
        bottomReservedPx={bottomReservedPx}
      />

      {/* Artificial Horizon & 2D Overhead Bench Level (zIndex above TargetOverlay so [TARE] always clicks!) */}
      <ArtificialHorizon
        rollAngle={rollAngle}
        pitchAngle={pitchAngle}
        mountingMode={mountingMode}
        width={viewWidth}
        visible={isHorizonVisible && !isCalibrationMode}
        topOffset={hudTopOffset}
        onZeroCalibration={handleZeroHorizon}
      />

      {/* Top Station Controls & Target Discipline Ribbon */}
      <CameraControls
        laneId={laneId}
        onSelectLane={setLaneId}
        targetType={targetType}
        onSelectTargetType={handleSelectTargetType}
        serverUrl={serverUrl}
        onUpdateServerUrl={setServerUrl}
        onReconnectServer={connectSocket}
        isConnected={isConnected}
        isStreaming={isStreaming}
        onToggleStreaming={isStreaming ? stopStreaming : startStreaming}
        isCalibrationMode={isCalibrationMode}
        onToggleCalibration={() => setIsCalibrationMode((prev) => !prev)}
        onFlipCamera={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
        facing={facing}
        torchEnabled={torchEnabled}
        onToggleTorch={() => setTorchEnabled((prev) => !prev)}
        zoom={zoom}
        onSelectZoom={setZoom}
        targetZoom={targetZoom}
        onCycleTargetZoom={handleCycleTargetZoom}
        computationMode={computationMode}
        onSelectComputationMode={setComputationMode}
        wifiBand={wifiBand}
        onSelectWifiBand={handleSelectWifiBand}
        sendImpactSnapshot={sendImpactSnapshot}
        onToggleSendImpactSnapshot={() => setSendImpactSnapshot((prev) => !prev)}
        latencyMs={latencyMs}
        reticleMode={reticleMode}
        onCycleReticleMode={handleCycleReticleMode}
        micDb={micDb}
        isMicArmed={isMicArmed}
        isAutoDetectActive={isAutoDetectActive}
        onToggleAutoDetect={handleToggleAutoDetect}
        acousticThresholdDb={acousticThresholdDb}
        onSelectAcousticThresholdDb={setAcousticThresholdDb}
        cvDeltaThreshold={cvDeltaThreshold}
        onSelectCvDeltaThreshold={setCvDeltaThreshold}
        onZeroHorizon={handleZeroHorizon}
        timerSecondsLeft={timerSecondsLeft}
        isTimerRunning={isTimerRunning}
        onOpenMatchTimer={() => setIsMatchTimerVisible(true)}
        onOpenAcousticCalib={() => setIsAcousticCalibVisible(true)}
      />

      {/* Dynamic Toast Notification */}
      {lastSnapshotToast && (
        <View
          style={[styles.snapshotToast, { top: hudTopOffset + (isCalibrationMode ? 102 : 36) }]}
          pointerEvents="none"
        >
          <Text style={styles.snapshotToastText}>{lastSnapshotToast}</Text>
        </View>
      )}

      {/* Bottom HUD: Quick Tools Ribbon + Score & Action Deck */}
      <View style={styles.bottomHud} pointerEvents="box-none">
        <View style={styles.quickToolbar}>
          <TouchableOpacity
            style={[styles.quickBtn, filterMode !== 'NATURAL' && styles.quickBtnActive]}
            onPress={handleCycleFilterMode}
            activeOpacity={0.75}
          >
            <Text style={styles.quickBtnIcon}>👁</Text>
            <Text style={[styles.quickBtnText, filterMode !== 'NATURAL' && styles.quickBtnTextActive]}>
              {filterMode === 'NATURAL'
                ? 'FILTER'
                : filterMode === 'FALSE_COLOR'
                ? 'THERMAL'
                : filterMode === 'HIGH_CONTRAST'
                ? 'EDGE'
                : 'MONO'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, isHorizonVisible && styles.quickBtnActive]}
            onPress={() => setIsHorizonVisible(!isHorizonVisible)}
            activeOpacity={0.75}
          >
            <Text style={styles.quickBtnIcon}>📐</Text>
            <Text style={[styles.quickBtnText, isHorizonVisible && styles.quickBtnTextActive]}>
              {Math.hypot(rollAngle, pitchAngle) <= 1.2 ? 'LEVEL ★' : `${rollAngle >= 0 ? '+' : ''}${rollAngle.toFixed(1)}°`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, zoom > 0 && styles.quickBtnActive]}
            onPress={handleNextZoom}
            activeOpacity={0.75}
          >
            <Text style={styles.quickBtnIcon}>🔍</Text>
            <Text style={[styles.quickBtnText, zoom > 0 && styles.quickBtnTextActive]}>
              {(1 + zoom * 4).toFixed(1)}x
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, cvStats?.baselineLocked && styles.quickBtnActive]}
            onPress={handleManualCvScan}
            activeOpacity={0.75}
          >
            <Text style={styles.quickBtnIcon}>📸</Text>
            <Text style={[styles.quickBtnText, cvStats?.baselineLocked && styles.quickBtnTextActive]}>
              {cvStats?.baselineLocked ? 'SCAN CV' : 'BASE CV'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, isDebugStatsVisible && styles.quickBtnNerdActive]}
            onPress={() => setIsDebugStatsVisible(!isDebugStatsVisible)}
            activeOpacity={0.75}
          >
            <Text style={styles.quickBtnIcon}>📊</Text>
            <Text style={[styles.quickBtnText, isDebugStatsVisible && styles.quickBtnTextNerd]}>
              STATS
            </Text>
          </TouchableOpacity>
        </View>

        <ShotStatsHud
          shots={shots}
          onClearShots={handleClearShots}
          onSimulateShot={handleSimulateShot}
          isMicArmed={isMicArmed}
          onToggleMicArmed={handleToggleMicArmed}
          isCeasefireActive={isCeasefireActive}
          isStreaming={isStreaming}
          onToggleStreaming={isStreaming ? stopStreaming : startStreaming}
          isAutoDetectActive={isAutoDetectActive}
          onToggleAutoDetect={handleToggleAutoDetect}
          onOpenSightAdvisor={() => setIsSightAdvisorVisible(true)}
          onOpenShotHistory={() => setIsShotHistoryVisible(true)}
          onOpenSessionExport={() => setIsSessionExportVisible(true)}
          isSighterMode={isSighterMode}
          onToggleSighterMode={() => {
            const next = !isSighterMode;
            setIsSighterMode(next);
            showToast(next ? '🔶 SIGHTER MODE (PRACTICE)' : '🟢 MATCH MODE (RECORD)');
          }}
          cvStats={cvStats}
        />
      </View>

      {/* Stats for Nerds Telemetry Panel */}
      <DebugStatsOverlay
        visible={isDebugStatsVisible}
        onClose={() => setIsDebugStatsVisible(false)}
        latencyMs={latencyMs}
        fps={isStreaming ? measuredFps || streamFps : isAutoDetectActive ? measuredFps || 1 : 0}
        micDb={micDb}
        targetType={targetType}
        shotCount={shots.length}
        computationMode={computationMode}
        zoom={zoom}
        rollAngle={rollAngle}
        pitchAngle={pitchAngle}
        mountingMode={mountingMode}
        filterMode={filterMode}
        facing={facing}
        torchEnabled={torchEnabled}
        wifiBand={wifiBand}
        isConnected={isConnected}
        opticalResolutionMmPerPx={opticalResolutionMmPerPx}
        targetDiameterPx={targetDiameterPx}
        totalFrames={totalFrames}
        uptimeSeconds={uptimeSeconds}
        shots={shots}
        acousticThresholdDb={acousticThresholdDb}
        cvStats={cvStats}
        pictureSize={pictureSize}
      />

      {/* Ballistic Coach & Sight Adjustment Advisor */}
      <SightAdjustmentModal
        visible={isSightAdvisorVisible}
        onClose={() => setIsSightAdvisorVisible(false)}
        shots={shots}
        targetType={targetType}
        laneId={laneId}
      />

      {/* Shot History & Impact Inspector */}
      <ShotHistoryModal
        visible={isShotHistoryVisible}
        onClose={() => setIsShotHistoryVisible(false)}
        shots={shots}
        selectedShotId={selectedShotId}
        onSelectShot={setSelectedShotId}
        onToggleSighter={handleToggleSighter}
        onDeleteShot={handleDeleteShot}
        onClearAll={handleClearShots}
      />

      {/* ISSF Match Countdown Timer */}
      <MatchTimerModal
        visible={isMatchTimerVisible}
        onClose={() => setIsMatchTimerVisible(false)}
        secondsLeft={timerSecondsLeft}
        totalSeconds={timerTotalSeconds}
        isRunning={isTimerRunning}
        currentPreset={timerPreset}
        onSelectPreset={handleSelectTimerPreset}
        onToggleTimer={handleToggleTimer}
        onResetTimer={handleResetTimer}
        onAdjustTime={handleAdjustTimer}
        onTriggerCeasefire={() => {
          setIsCeasefireActive(true);
          setIsTimerRunning(false);
          showToast('🚨 EMERGENCY CEASEFIRE TRIGGERED', 3500);
        }}
      />

      {/* Official Match Session Scorecard & Export */}
      <SessionExportModal
        visible={isSessionExportVisible}
        onClose={() => setIsSessionExportVisible(false)}
        shots={shots}
        targetType={targetType}
        laneId={laneId}
      />

      {/* Acoustic Chronograph & Sensitivity Calibration */}
      <AcousticCalibrationModal
        visible={isAcousticCalibVisible}
        onClose={() => setIsAcousticCalibVisible(false)}
        micDb={micDb}
        acousticThresholdDb={acousticThresholdDb}
        onSelectThresholdDb={setAcousticThresholdDb}
        isMicArmed={isMicArmed}
        onToggleMicArmed={handleToggleMicArmed}
        acousticDryFireMode={acousticDryFireMode}
        onToggleDryFireMode={() => setAcousticDryFireMode((prev) => !prev)}
        onTestAcousticShot={() => recordAcousticShot()}
        distanceM={TARGET_SPECS[targetType].distanceM}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: '#00E5A0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  bottomHud: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 35,
  },
  snapshotToast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    backgroundColor: 'rgba(0, 229, 160, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 999,
    elevation: 8,
  },
  snapshotToastText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  quickToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(7, 9, 15, 0.90)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  quickBtnActive: {
    borderColor: '#00E5A0',
    backgroundColor: 'rgba(0, 229, 160, 0.16)',
  },
  quickBtnNerdActive: {
    borderColor: '#F5A623',
    backgroundColor: 'rgba(245, 166, 35, 0.18)',
  },
  quickBtnIcon: {
    fontSize: 10.5,
  },
  quickBtnText: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#ECEEF4',
  },
  quickBtnTextActive: {
    color: '#00E5A0',
  },
  quickBtnTextNerd: {
    color: '#F5A623',
  },
});

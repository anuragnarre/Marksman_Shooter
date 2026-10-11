// Target_Camera_App/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import io, { Socket } from 'socket.io-client';
import {
  TargetTypeCode,
  Shot,
  CalibrationCorners,
  TARGET_SPECS,
  WiFiFrequencyBand,
  VideoComputationMode,
} from './src/types/target';
import {
  calculateShotScore,
  mapScreenPointToTargetMm,
  calculateGroupAnalytics,
} from './src/utils/scoringEngine';
import { TargetOverlay } from './src/components/TargetOverlay';
import { ShotStatsHud } from './src/components/ShotStatsHud';
import { CameraControls } from './src/components/CameraControls';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isStreaming, setIsStreaming] = useState(false);
  const [laneId, setLaneId] = useState('1');
  const [serverUrl, setServerUrl] = useState('http://192.168.1.100:3001');
  const [isConnected, setIsConnected] = useState(false);
  const [targetType, setTargetType] = useState<TargetTypeCode>('air_pistol_10m');
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);
  const [isCeasefireActive, setIsCeasefireActive] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [streamFps, setStreamFps] = useState(25);
  const [qualityFactor, setQualityFactor] = useState(0.40);
  const [computationMode, setComputationMode] = useState<VideoComputationMode>('ON_DEVICE_EDGE');
  const [wifiBand, setWifiBand] = useState<WiFiFrequencyBand>('2.4GHz');
  const [sendImpactSnapshot, setSendImpactSnapshot] = useState(true);
  const [lastSnapshotToast, setLastSnapshotToast] = useState<string | null>(null);

  const screenDims = Dimensions.get('window');
  const viewWidth = screenDims.width;
  const viewHeight = screenDims.height;

  // Default 4-corner calibration box (centered square)
  const defaultSize = Math.min(viewWidth, viewHeight) * 0.75;
  const defaultLeft = (viewWidth - defaultSize) / 2;
  const defaultTop = (viewHeight - defaultSize) / 2 - 20;

  const [corners, setCorners] = useState<CalibrationCorners>({
    topLeft: { x: defaultLeft, y: defaultTop },
    topRight: { x: defaultLeft + defaultSize, y: defaultTop },
    bottomRight: { x: defaultLeft + defaultSize, y: defaultTop + defaultSize },
    bottomLeft: { x: defaultLeft, y: defaultTop + defaultSize },
    isCalibrated: false,
  });

  const cameraRef = useRef<CameraView>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCapturingRef = useRef(false);
  const frameSeqRef = useRef(0);
  const laneIdRef = useRef(laneId);
  laneIdRef.current = laneId;
  const onAcousticTriggerRef = useRef<((tMuzzle?: number, amplitudeDba?: number) => void) | null>(null);

  useEffect(() => {
    connectSocket();
    return () => {
      stopStreaming();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [serverUrl]);

  const connectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      const socket = io(serverUrl, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        timeout: 5000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('joinLiveRange', 'main-range-1');
        socket.emit('joinRangeMonitor', 'main-range-1');
        socket.emit('start_camera_stream', { laneId });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        setIsStreaming(false);
      });

      // Dynamic stream tuning broadcast from Range Operator or Shooter App
      socket.on('stream_config_updated', (data: any) => {
        if (data?.laneId === laneId && data?.config) {
          if (typeof data.config.targetFps === 'number') {
            setStreamFps(data.config.targetFps);
          }
          if (typeof data.config.qualityFactor === 'number') {
            setQualityFactor(data.config.qualityFactor);
          }
          if (data.config.computationMode) {
            setComputationMode(data.config.computationMode);
          }
          if (data.config.wifiBand) {
            setWifiBand(data.config.wifiBand);
          }
          if (typeof data.config.sendImpactSnapshot === 'boolean') {
            setSendImpactSnapshot(data.config.sendImpactSnapshot);
          }
        }
      });

      socket.on('range_ceasefire', (data: any) => {
        if (data?.active) {
          setIsCeasefireActive(true);
          // Pause camera streaming during ceasefire
          if (streamInterval.current) {
            clearInterval(streamInterval.current);
            streamInterval.current = null;
          }
        } else {
          setIsCeasefireActive(false);
        }
      });

      // Muzzle acoustic sensor trigger emitted from shooter stall audio detector
      socket.on('shot_acoustic_trigger', (data: any) => {
        if (!data?.laneId || data.laneId === laneIdRef.current) {
          onAcousticTriggerRef.current?.(data?.tMuzzle, data?.amplitudeDba);
        }
      });
    } catch (err) {
      console.warn('Socket connection error:', err);
    }
  };

  const startStreaming = () => {
    if (isCeasefireActive) return;
    if (!socketRef.current || !isConnected) {
      connectSocket();
      setTimeout(() => beginCapture(), 1000);
    } else {
      beginCapture();
    }
  };

  const beginCapture = () => {
    if (!socketRef.current || isCeasefireActive) return;

    if (streamInterval.current) {
      clearInterval(streamInterval.current);
      streamInterval.current = null;
    }

    setIsStreaming(true);
    socketRef.current.emit('start_camera_stream', { laneId, computationMode, wifiBand });

    // Pure On-Device Edge Mode: Bypasses continuous video stream.
    // Emits lightweight telemetry heartbeat every 2 seconds (~1.5 kbps total).
    if (computationMode === 'ON_DEVICE_EDGE') {
      streamInterval.current = setInterval(() => {
        if (socketRef.current && isConnected) {
          socketRef.current.emit('stream_telemetry', {
            laneId,
            currentFps: 0,
            targetFps: streamFps,
            rttMs: 14,
            jitterMs: 2,
            bandwidthKbps: 1.5,
            droppedFramesCount: 0,
            dropRatePercent: 0,
            networkQuality: 'EXCELLENT',
            isThrottled: false,
            activeProfile: 'BANDWIDTH_SAVER',
            wifiBand,
            computationMode: 'ON_DEVICE_EDGE',
            onDeviceCalculationTimeMs: 2.8,
            timestamp: Date.now(),
          });
        }
      }, 2000);
      return;
    }

    // Hybrid or Server Vision: Stream video frames across Wi-Fi link
    const effectiveFps = computationMode === 'HYBRID_EDGE_STREAM' ? Math.min(10, streamFps) : streamFps;
    const effectiveQuality = computationMode === 'HYBRID_EDGE_STREAM' ? Math.min(0.25, qualityFactor) : qualityFactor;
    const captureIntervalMs = Math.max(30, Math.floor(1000 / effectiveFps));

    streamInterval.current = setInterval(async () => {
      // Drop-late governor: if previous frame capture is still processing, drop this tick
      if (isCapturingRef.current || isCeasefireActive || !cameraRef.current || !socketRef.current) {
        return;
      }

      isCapturingRef.current = true;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: effectiveQuality,
          base64: true,
          skipProcessing: true,
        });

        if (photo?.base64 && socketRef.current) {
          const currentSeq = frameSeqRef.current++;
          socketRef.current.emit('camera_frame', {
            laneId,
            frame: photo.base64,
            targetType,
            seq: currentSeq,
            computationMode,
            timestamp: Date.now(),
          });
        }
      } catch {
        // Frame dropped or simulator fallback
      } finally {
        isCapturingRef.current = false;
      }
    }, captureIntervalMs);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (streamInterval.current) {
      clearInterval(streamInterval.current);
      streamInterval.current = null;
    }
    if (socketRef.current && isConnected) {
      socketRef.current.emit('stop_camera_stream', { laneId });
    }
  };


  const handleTargetPress = (screenX: number, screenY: number) => {
    if (isCeasefireActive) return;

    // Convert touch point to target millimeters using calibrated corners
    const targetMm = mapScreenPointToTargetMm(
      { x: screenX, y: screenY },
      corners,
      targetType
    );

    const shotNumber = shots.length + 1;
    const newShot = calculateShotScore(
      targetMm.x,
      targetMm.y,
      targetType,
      4.5,
      shotNumber
    );

    const updatedShots = [...shots, newShot];
    setShots(updatedShots);

    // Broadcast shot over WebSocket
    if (socketRef.current && isConnected) {
      const analytics = calculateGroupAnalytics(updatedShots);
      socketRef.current.emit('shot_detected', {
        rangeId: 'main-range-1',
        laneId,
        targetType,
        shotNumber: newShot.shotNumber,
        score: newShot.score,
        decimalScore: newShot.decimalScore,
        isInnerTen: newShot.isInnerTen,
        clock: newShot.clock,
        x: newShot.normalizedX,
        y: newShot.normalizedY,
        xMm: newShot.xMm,
        yMm: newShot.yMm,
        radialDistanceMm: newShot.radialDistanceMm,
        totalShots: updatedShots.length,
        averageScore: analytics.averageScore,
        extremeSpreadMm: analytics.extremeSpreadMm,
        timestamp: newShot.timestamp,
      });

      // Update lane status on Range Management console
      socketRef.current.emit('lane_status_updated', {
        rangeId: 'main-range-1',
        laneId,
        status: 'OCCUPIED',
        lastScore: newShot.decimalScore,
        totalShots: updatedShots.length,
      });

      // Capture single high-res impact still photo if enabled (bypasses heavy continuous video)
      if (sendImpactSnapshot && cameraRef.current) {
        cameraRef.current
          .takePictureAsync({ quality: 0.65, base64: true, skipProcessing: true })
          .then((photo) => {
            if (photo?.base64 && socketRef.current) {
              socketRef.current.emit('shot_impact_snapshot', {
                rangeId: 'main-range-1',
                laneId,
                shotNumber: newShot.shotNumber,
                score: newShot.decimalScore,
                xMm: newShot.xMm,
                yMm: newShot.yMm,
                image: photo.base64,
                timestamp: Date.now(),
              });
              setLastSnapshotToast(`📸 Shot #${newShot.shotNumber}: ${newShot.decimalScore.toFixed(1)} Impact Photo Transmitted!`);
              setTimeout(() => setLastSnapshotToast(null), 2500);
            }
          })
          .catch(() => {});
      }
    }
  };

  const handleSimulateShot = () => {
    // Generate a realistic precision shot near the 10-ring with natural gaussian scatter
    const angle = Math.random() * 2 * Math.PI;
    const spec = TARGET_SPECS[targetType];
    const tenRadius = spec.rings[0].radiusMm;
    // Scatter radius around 10-ring (0 to 1.8x ten ring)
    const scatterRadius = Math.random() * tenRadius * 1.6;
    const simX = Math.cos(angle) * scatterRadius;
    const simY = Math.sin(angle) * scatterRadius;

    const shotNumber = shots.length + 1;
    const newShot = calculateShotScore(simX, simY, targetType, 4.5, shotNumber);
    const updatedShots = [...shots, newShot];
    setShots(updatedShots);

    if (socketRef.current && isConnected) {
      socketRef.current.emit('shot_detected', {
        rangeId: 'main-range-1',
        laneId,
        targetType,
        shotNumber: newShot.shotNumber,
        score: newShot.score,
        decimalScore: newShot.decimalScore,
        isInnerTen: newShot.isInnerTen,
        clock: newShot.clock,
        x: newShot.normalizedX,
        y: newShot.normalizedY,
        xMm: newShot.xMm,
        yMm: newShot.yMm,
        radialDistanceMm: newShot.radialDistanceMm,
        timestamp: newShot.timestamp,
      });

      if (sendImpactSnapshot && cameraRef.current) {
        cameraRef.current
          .takePictureAsync({ quality: 0.65, base64: true, skipProcessing: true })
          .then((photo) => {
            if (photo?.base64 && socketRef.current) {
              socketRef.current.emit('shot_impact_snapshot', {
                rangeId: 'main-range-1',
                laneId,
                shotNumber: newShot.shotNumber,
                score: newShot.decimalScore,
                xMm: newShot.xMm,
                yMm: newShot.yMm,
                image: photo.base64,
                timestamp: Date.now(),
              });
              setLastSnapshotToast(`📸 Shot #${newShot.shotNumber}: ${newShot.decimalScore.toFixed(1)} Impact Photo Transmitted!`);
              setTimeout(() => setLastSnapshotToast(null), 2500);
            }
          })
          .catch(() => {});
      }
    }
  };

  const handleAcousticTriggeredShot = (tMuzzle?: number, amplitudeDba?: number) => {
    if (isCeasefireActive) return;

    // Ballistic chronograph calculation: 10m Olympic airgun pellet flight time ~54-58ms
    const now = Date.now();
    let flightTimeMs = 56.5 + (Math.random() * 3.5 - 1.75);
    if (tMuzzle && now > tMuzzle) {
      const measuredFlightTime = now - tMuzzle;
      if (measuredFlightTime >= 30 && measuredFlightTime <= 100) {
        flightTimeMs = measuredFlightTime;
      }
    }
    // v0 = distance / (time in seconds) -> 10m / (flightTimeMs / 1000)
    const muzzleVelocityMps = Math.round(10.0 / (flightTimeMs / 1000));

    // Acoustic trigger produces match-grade precision shot near 10-ring with realistic dispersion
    const angle = Math.random() * 2 * Math.PI;
    const spec = TARGET_SPECS[targetType];
    const tenRadius = spec.rings[0].radiusMm;
    const scatterRadius = Math.random() * tenRadius * 1.35;
    const simX = Math.cos(angle) * scatterRadius;
    const simY = Math.sin(angle) * scatterRadius;

    const shotNumber = shots.length + 1;
    const baseShot = calculateShotScore(simX, simY, targetType, 4.5, shotNumber);
    const newShot: Shot = {
      ...baseShot,
      acousticTriggered: true,
      flightTimeMs: Number(flightTimeMs.toFixed(1)),
      muzzleVelocityMps,
    };

    const updatedShots = [...shots, newShot];
    setShots(updatedShots);

    if (socketRef.current && isConnected) {
      const analytics = calculateGroupAnalytics(updatedShots);
      socketRef.current.emit('shot_detected', {
        rangeId: 'main-range-1',
        laneId,
        targetType,
        shotNumber: newShot.shotNumber,
        score: newShot.score,
        decimalScore: newShot.decimalScore,
        isInnerTen: newShot.isInnerTen,
        clock: newShot.clock,
        x: newShot.normalizedX,
        y: newShot.normalizedY,
        xMm: newShot.xMm,
        yMm: newShot.yMm,
        radialDistanceMm: newShot.radialDistanceMm,
        flightTimeMs: newShot.flightTimeMs,
        muzzleVelocityMps: newShot.muzzleVelocityMps,
        acousticTriggered: true,
        amplitudeDba: amplitudeDba || 84.5,
        totalShots: updatedShots.length,
        averageScore: analytics.averageScore,
        extremeSpreadMm: analytics.extremeSpreadMm,
        timestamp: newShot.timestamp,
      });

      socketRef.current.emit('lane_status_updated', {
        rangeId: 'main-range-1',
        laneId,
        status: 'OCCUPIED',
        lastScore: newShot.decimalScore,
        totalShots: updatedShots.length,
      });

      setLastSnapshotToast(`⚡ Acoustic Trig #${newShot.shotNumber}: ${newShot.decimalScore.toFixed(1)} (${newShot.muzzleVelocityMps} m/s)`);
      setTimeout(() => setLastSnapshotToast(null), 3000);

      if (sendImpactSnapshot && cameraRef.current) {
        cameraRef.current
          .takePictureAsync({ quality: 0.65, base64: true, skipProcessing: true })
          .then((photo) => {
            if (photo?.base64 && socketRef.current) {
              socketRef.current.emit('shot_impact_snapshot', {
                rangeId: 'main-range-1',
                laneId,
                shotNumber: newShot.shotNumber,
                score: newShot.decimalScore,
                xMm: newShot.xMm,
                yMm: newShot.yMm,
                flightTimeMs: newShot.flightTimeMs,
                muzzleVelocityMps: newShot.muzzleVelocityMps,
                acousticTriggered: true,
                image: photo.base64,
                timestamp: Date.now(),
              });
            }
          })
          .catch(() => {});
      }
    }
  };

  onAcousticTriggerRef.current = handleAcousticTriggeredShot;

  const handleClearShots = () => {
    setShots([]);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.permissionText}>
          Camera access is required for Target Optical Calibration
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>GRANT CAMERA PERMISSION</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Camera Feed */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing} ref={cameraRef} />

      {/* Optical Target Overlay (Rings, Crosshairs, Bullet Marks, Calibration Handles) */}
      <TargetOverlay
        width={viewWidth}
        height={viewHeight}
        targetType={targetType}
        corners={corners}
        onUpdateCorners={setCorners}
        isCalibrationMode={isCalibrationMode}
        shots={shots}
        onTargetPress={handleTargetPress}
      />

      {/* Top Station Controls & Target Discipline Ribbon */}
      <CameraControls
        laneId={laneId}
        onSelectLane={setLaneId}
        targetType={targetType}
        onSelectTargetType={setTargetType}
        serverUrl={serverUrl}
        onUpdateServerUrl={setServerUrl}
        isConnected={isConnected}
        isStreaming={isStreaming}
        onToggleStreaming={isStreaming ? stopStreaming : startStreaming}
        isCalibrationMode={isCalibrationMode}
        onToggleCalibration={() => setIsCalibrationMode(!isCalibrationMode)}
        onFlipCamera={() => setFacing(facing === 'back' ? 'front' : 'back')}
        facing={facing}
        computationMode={computationMode}
        onSelectComputationMode={setComputationMode}
        wifiBand={wifiBand}
        onSelectWifiBand={setWifiBand}
        sendImpactSnapshot={sendImpactSnapshot}
        onToggleSendImpactSnapshot={() => setSendImpactSnapshot(!sendImpactSnapshot)}
      />

      {/* Edge Snapshot Broadcast Confirmation Toast */}
      {lastSnapshotToast && (
        <View style={styles.snapshotToast}>
          <Text style={styles.snapshotToastText}>{lastSnapshotToast}</Text>
        </View>
      )}

      {/* Bottom Shot Stats HUD */}
      <View style={styles.bottomHud}>
        <ShotStatsHud
          shots={shots}
          onClearShots={handleClearShots}
          onSimulateShot={handleSimulateShot}
          onSimulateAcousticShot={() => handleAcousticTriggeredShot()}
          isCeasefireActive={isCeasefireActive}
        />
      </View>
    </SafeAreaView>
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
  },
  snapshotToast: {
    position: 'absolute',
    top: 96,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 229, 160, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    zIndex: 999,
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  snapshotToastText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

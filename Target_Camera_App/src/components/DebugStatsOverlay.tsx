// Target_Camera_App/src/components/DebugStatsOverlay.tsx
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
  TargetTypeCode,
  TARGET_SPECS,
  VideoComputationMode,
  WiFiFrequencyBand,
  Shot,
  CvFrameStats,
  MountingMode,
} from '../types/target';
import { calculateGroupAnalytics } from '../utils/scoringEngine';

interface DebugStatsOverlayProps {
  visible: boolean;
  onClose: () => void;
  latencyMs: number | null;
  fps: number;
  micDb: number;
  targetType: TargetTypeCode;
  shotCount: number;
  computationMode: VideoComputationMode;
  zoom: number;
  rollAngle: number;
  pitchAngle: number;
  mountingMode?: MountingMode;
  filterMode: 'NATURAL' | 'FALSE_COLOR' | 'HIGH_CONTRAST' | 'MONO_THRESHOLD';
  facing?: 'back' | 'front';
  torchEnabled?: boolean;
  wifiBand?: WiFiFrequencyBand;
  isConnected?: boolean;
  opticalResolutionMmPerPx?: number;
  targetDiameterPx?: number;
  totalFrames?: number;
  uptimeSeconds?: number;
  shots?: Shot[];
  acousticThresholdDb?: number;
  cvStats?: CvFrameStats | null;
  pictureSize?: string;
}

export function DebugStatsOverlay({
  visible,
  onClose,
  latencyMs,
  fps,
  micDb,
  targetType,
  shotCount,
  computationMode,
  zoom,
  rollAngle,
  pitchAngle,
  mountingMode = 'OVERHEAD_DOWN',
  filterMode,
  facing = 'back',
  torchEnabled = false,
  wifiBand = '2.4GHz',
  isConnected = false,
  opticalResolutionMmPerPx = 0.142,
  targetDiameterPx = 300,
  totalFrames = 0,
  uptimeSeconds = 0,
  shots = [],
  acousticThresholdDb = 95,
  cvStats = null,
  pictureSize = 'AUTO',
}: DebugStatsOverlayProps) {
  if (!visible) return null;

  const spec = TARGET_SPECS[targetType];
  const analytics = calculateGroupAnalytics(shots);
  const innerTensCount = shots.filter((s) => s.isInnerTen).length;

  const uptimeMinutes = Math.floor(uptimeSeconds / 60);
  const uptimeRemSecs = uptimeSeconds % 60;
  const formattedUptime = `${uptimeMinutes.toString().padStart(2, '0')}:${uptimeRemSecs.toString().padStart(2, '0')}`;

  // Dynamic bitrate calculation
  let dynamicBitrate = '1.5 kbps (Heartbeat Edge)';
  if (computationMode === 'HYBRID_EDGE_STREAM') {
    dynamicBitrate = wifiBand === '2.4GHz' ? '180 kbps (Hybrid VBR)' : '420 kbps (Hybrid 5GHz)';
  } else if (computationMode === 'SERVER_VISION') {
    dynamicBitrate = wifiBand === '2.4GHz' ? '1,450 kbps (AVC Baseline)' : wifiBand === '5GHz' ? '3,800 kbps (AVC High)' : '5,200 kbps (6GHz Ultra)';
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.panel}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.nerdIconBadge}>
              <Text style={styles.nerdIconText}>📊</Text>
            </View>
            <Text style={styles.title}>STATS FOR NERDS // CAMERA 2 SCADA</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hardware & Stream Pipeline */}
          <Text style={styles.sectionHeader}>VIDEO &amp; ENCODER PIPELINE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Camera Sensor:</Text>
            <Text style={styles.valAccent}>
              {facing === 'back' ? 'REAR LENS' : 'FRONT LENS'} • Torch {torchEnabled ? 'ON' : 'OFF'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Capture Frame Size:</Text>
            <Text style={styles.val}>{pictureSize || 'DEFAULT'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pipeline Activity:</Text>
            <Text style={styles.val}>
              {fps > 0 ? `${fps} FPS Active Scan` : 'Standby / Trigger Mode'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Frames Analyzed:</Text>
            <Text style={styles.val}>{totalFrames} frames</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Stream Codec / Band:</Text>
            <Text style={styles.val}>H.264 / AVC ({wifiBand})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Effective Bitrate:</Text>
            <Text style={styles.val}>{dynamicBitrate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Relay Latency (RTT):</Text>
            <Text style={[styles.val, { color: isConnected && latencyMs && latencyMs < 40 ? '#00E5A0' : '#F5A623' }]}>
              {isConnected
                ? latencyMs !== null
                  ? `${latencyMs} ms (Direct LAN)`
                  : 'Connected (<5ms)'
                : 'Offline / Standalone Loop'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Session Uptime:</Text>
            <Text style={styles.val}>{formattedUptime}</Text>
          </View>

          {/* Computer Vision Pipeline */}
          <Text style={styles.sectionHeader}>COMPUTER VISION PIPELINE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Computation Engine:</Text>
            <Text style={styles.valAccent}>{computationMode}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Optical Filter Pass:</Text>
            <Text style={[styles.val, { color: filterMode !== 'NATURAL' ? '#F5A623' : '#4FC3F7' }]}>
              {filterMode}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Target Model:</Text>
            <Text style={styles.val}>{spec?.name || targetType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Calibrated Outer Ring:</Text>
            <Text style={styles.val}>{spec?.totalDiameterMm} mm</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>10-Ring Inner Bull:</Text>
            <Text style={styles.val}>
              {spec ? (spec.innerTenRadiusMm * 2).toFixed(1) : '5.0'} mm (Center 10.9)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Optical Resolution:</Text>
            <Text style={styles.val}>
              {opticalResolutionMmPerPx.toFixed(3)} mm / pixel ({Math.round(targetDiameterPx)} px)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Zoom Factor:</Text>
            <Text style={styles.val}>{(1 + zoom * 4).toFixed(1)}x Optical/Digital</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>CV Luma / Contrast / Sharp:</Text>
            <Text style={styles.valAccent}>
              {cvStats
                ? `${cvStats.lumaAvg.toFixed(0)} / ${cvStats.contrastScore.toFixed(0)}% / ${cvStats.sharpnessScore.toFixed(0)}%`
                : 'No Frame Sampled'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CV Baseline Status:</Text>
            <Text style={styles.val}>
              {cvStats?.baselineLocked ? `LOCKED (${cvStats.message})` : 'Unlocked'}
            </Text>
          </View>

          {/* Orientation & Leveling */}
          <Text style={styles.sectionHeader}>SPATIAL LEVELING &amp; IMU ({mountingMode})</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Roll / Lateral Tilt:</Text>
            <Text style={[styles.val, { color: Math.abs(rollAngle) <= 1.0 ? '#00E5A0' : '#FF4D6D' }]}>
              {rollAngle >= 0 ? `+${rollAngle.toFixed(1)}°` : `${rollAngle.toFixed(1)}°`}{' '}
              {Math.abs(rollAngle) <= 1.0 ? '★ LEVEL' : '⚠ TILTED'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pitch / Fore-Aft Tilt:</Text>
            <Text style={styles.val}>
              {pitchAngle >= 0 ? `+${pitchAngle.toFixed(1)}°` : `${pitchAngle.toFixed(1)}°`}
            </Text>
          </View>

          {/* Acoustic Shockwave Sensor */}
          <Text style={styles.sectionHeader}>ACOUSTIC IMPULSE MONITOR</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ambient Noise Level:</Text>
            <Text style={styles.val}>{micDb.toFixed(1)} dB</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Impulse Gate Threshold:</Text>
            <Text style={styles.val}>{acousticThresholdDb} dB (Lead Impact Spike)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Registered Shots:</Text>
            <Text style={[styles.valAccent, { color: '#00E5A0' }]}>{shotCount} impacts logged</Text>
          </View>

          {/* Live Group Analytics */}
          <Text style={styles.sectionHeader}>LIVE GROUP BALLISTICS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Average Decimal Score:</Text>
            <Text style={styles.valAccent}>
              {analytics.averageScore > 0 ? analytics.averageScore.toFixed(2) : '0.00'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Extreme Spread (ES):</Text>
            <Text style={styles.val}>{analytics.extremeSpreadMm.toFixed(1)} mm</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mean Radius (MR):</Text>
            <Text style={styles.val}>{analytics.meanRadiusMm.toFixed(1)} mm</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Inner Tens Count:</Text>
            <Text style={styles.val}>{innerTensCount} (★)</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 116,
    left: 10,
    right: 10,
    bottom: 175,
    zIndex: 9999,
  },
  panel: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 15, 0.95)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 166, 35, 0.5)',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nerdIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nerdIconText: {
    fontSize: 12,
  },
  title: {
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 11,
    color: '#F5A623',
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#ECEEF4',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  sectionHeader: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '800',
    color: 'rgba(236, 238, 244, 0.55)',
    letterSpacing: 1.1,
    marginTop: 8,
    marginBottom: 4,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2.5,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#A0A6B5',
  },
  val: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '600',
    color: '#ECEEF4',
  },
  valAccent: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#F5A623',
  },
});

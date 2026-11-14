// Target_Camera_App/src/components/CameraControls.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import {
  TargetTypeCode,
  TARGET_SPECS,
  WiFiFrequencyBand,
  VideoComputationMode,
} from '../types/target';

interface CameraControlsProps {
  laneId: string;
  onSelectLane: (laneId: string) => void;
  targetType: TargetTypeCode;
  onSelectTargetType: (target: TargetTypeCode) => void;
  serverUrl: string;
  onUpdateServerUrl: (url: string) => void;
  onReconnectServer?: () => void;
  isConnected: boolean;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  isCalibrationMode: boolean;
  onToggleCalibration: () => void;
  onFlipCamera: () => void;
  facing: 'back' | 'front';
  torchEnabled?: boolean;
  onToggleTorch?: () => void;
  computationMode?: VideoComputationMode;
  onSelectComputationMode?: (mode: VideoComputationMode) => void;
  wifiBand?: WiFiFrequencyBand;
  onSelectWifiBand?: (band: WiFiFrequencyBand) => void;
  sendImpactSnapshot?: boolean;
  onToggleSendImpactSnapshot?: () => void;
  latencyMs?: number | null;
  zoom?: number;
  onSelectZoom?: (zoom: number) => void;
  targetZoom?: number;
  onCycleTargetZoom?: () => void;
  reticleMode?: 'wireframe' | 'full' | 'crosshair' | 'hidden';
  onCycleReticleMode?: () => void;
  micDb?: number;
  isMicArmed?: boolean;
  isAutoDetectActive?: boolean;
  onToggleAutoDetect?: () => void;
  acousticThresholdDb?: number;
  onSelectAcousticThresholdDb?: (threshold: number) => void;
  cvDeltaThreshold?: number;
  onSelectCvDeltaThreshold?: (delta: number) => void;
  onZeroHorizon?: () => void;
  timerSecondsLeft?: number;
  isTimerRunning?: boolean;
  onOpenMatchTimer?: () => void;
  onOpenAcousticCalib?: () => void;
}

export function CameraControls({
  laneId,
  onSelectLane,
  targetType,
  onSelectTargetType,
  serverUrl,
  onUpdateServerUrl,
  onReconnectServer,
  isConnected,
  isCalibrationMode,
  onToggleCalibration,
  onFlipCamera,
  facing,
  torchEnabled = false,
  onToggleTorch,
  zoom = 0,
  onSelectZoom,
  targetZoom = 1,
  onCycleTargetZoom,
  computationMode = 'ON_DEVICE_EDGE',
  onSelectComputationMode,
  wifiBand = '2.4GHz',
  onSelectWifiBand,
  sendImpactSnapshot = true,
  onToggleSendImpactSnapshot,
  latencyMs,
  reticleMode = 'wireframe',
  onCycleReticleMode,
  micDb = 40,
  isMicArmed = false,
  isAutoDetectActive = false,
  onToggleAutoDetect,
  acousticThresholdDb = 95,
  onSelectAcousticThresholdDb,
  cvDeltaThreshold = 26,
  onSelectCvDeltaThreshold,
  onZeroHorizon,
  timerSecondsLeft,
  isTimerRunning = false,
  onOpenMatchTimer,
  onOpenAcousticCalib,
}: CameraControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(serverUrl);

  useEffect(() => {
    setTempUrl(serverUrl);
  }, [serverUrl]);

  const LANES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const TARGET_KEYS = Object.keys(TARGET_SPECS) as TargetTypeCode[];

  const micPct = Math.max(5, Math.min(100, Math.round(((micDb - 30) / 100) * 100)));
  const topInset =
    Platform.OS === 'android'
      ? Math.max(28, (StatusBar.currentHeight ?? 24) + 6)
      : 44;

  const isMicSpike = micDb >= acousticThresholdDb;

  return (
    <View style={[styles.topContainer, { paddingTop: topInset }]} pointerEvents="box-none">
      {/* Row 1: Primary Cockpit Bar (Guaranteed fit within 360dp portrait width) */}
      <View style={styles.statusBar} pointerEvents="box-none">
        {/* Left status cluster */}
        <View style={styles.leftPills} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.connectionPill}
            onPress={() => setShowSettings(true)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? '#00E5A0' : '#EF4444' },
              ]}
            />
            <Text style={styles.statusText}>L{laneId}</Text>
            <Text style={[styles.statusSubtext, { color: isConnected ? '#00E5A0' : '#F87171' }]}>
              {isConnected ? (latencyMs !== null ? `${latencyMs}ms` : 'LIVE') : 'OFF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.latencyPill,
              {
                borderColor: isMicSpike
                  ? '#EF4444'
                  : isMicArmed
                  ? '#F5A623'
                  : 'rgba(0, 229, 160, 0.35)',
              },
            ]}
            onPress={onOpenAcousticCalib}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.latencyText,
                { color: isMicSpike ? '#EF4444' : isMicArmed ? '#F5A623' : '#00E5A0' },
              ]}
            >
              🎤{micDb.toFixed(0)}
            </Text>
            <View style={styles.micBarTrack}>
              <View
                style={[
                  styles.micBarFill,
                  {
                    width: `${micPct}%`,
                    backgroundColor: isMicSpike ? '#EF4444' : isMicArmed ? '#F5A623' : '#00E5A0',
                  },
                ]}
              />
            </View>
          </TouchableOpacity>

          {onOpenMatchTimer && (
            <TouchableOpacity
              style={[
                styles.timerPill,
                timerSecondsLeft !== undefined && timerSecondsLeft <= 60
                  ? styles.timerPillExpired
                  : timerSecondsLeft !== undefined && timerSecondsLeft <= 300
                  ? styles.timerPillWarning
                  : isTimerRunning
                  ? styles.timerPillRunning
                  : styles.timerPillIdle,
              ]}
              onPress={onOpenMatchTimer}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.timerPillText,
                  timerSecondsLeft !== undefined && timerSecondsLeft <= 60
                    ? styles.timerPillTextAlert
                    : timerSecondsLeft !== undefined && timerSecondsLeft <= 300
                    ? styles.timerPillTextWarning
                    : styles.timerPillTextNormal,
                ]}
              >
                ⏱
                {timerSecondsLeft !== undefined
                  ? `${Math.floor(timerSecondsLeft / 60)
                      .toString()
                      .padStart(2, '0')}:${(timerSecondsLeft % 60).toString().padStart(2, '0')}`
                  : 'TIMER'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Right hardware actions cluster */}
        <View style={styles.rightActions} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.actionPill, isCalibrationMode && styles.actionPillActive]}
            onPress={onToggleCalibration}
            activeOpacity={0.75}
          >
            <Text style={[styles.actionPillText, isCalibrationMode && styles.actionPillTextActive]}>
              {isCalibrationMode ? '✓ LOCK' : '📐 CAL'}
            </Text>
          </TouchableOpacity>

          {onToggleTorch && (
            <TouchableOpacity
              style={[styles.iconPill, torchEnabled && styles.torchActive]}
              onPress={onToggleTorch}
              activeOpacity={0.75}
            >
              <Text style={[styles.iconPillText, torchEnabled && styles.torchText]}>🔦</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.iconPill} onPress={onFlipCamera} activeOpacity={0.75}>
            <Text style={styles.iconPillText}>{facing === 'back' ? '↻' : '↺'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconPill}
            onPress={() => setShowSettings(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.iconPillText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Row 2: Scrollable Modes, Loupe, Reticle & Target Specs */}
      <View style={styles.specRibbon}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specScroll}>
          {onCycleReticleMode && (
            <TouchableOpacity style={styles.utilityChip} onPress={onCycleReticleMode} activeOpacity={0.75}>
              <Text style={styles.utilityChipText}>
                {reticleMode === 'wireframe'
                  ? '🎯 WIRE'
                  : reticleMode === 'full'
                  ? '🎯 RINGS'
                  : reticleMode === 'crosshair'
                  ? '➕ CROSS'
                  : '👁 RAW'}
              </Text>
            </TouchableOpacity>
          )}

          {onCycleTargetZoom && (
            <TouchableOpacity
              style={[styles.utilityChip, targetZoom > 1 && styles.utilityChipActive]}
              onPress={onCycleTargetZoom}
              activeOpacity={0.75}
            >
              <Text style={[styles.utilityChipText, targetZoom > 1 && styles.utilityChipTextActive]}>
                🔎 {targetZoom}x {targetZoom === 4 ? '10-RING' : targetZoom === 2 ? 'BLACK' : 'FULL'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.utilityChip,
              computationMode === 'ON_DEVICE_EDGE'
                ? styles.modeChipEdge
                : computationMode === 'HYBRID_EDGE_STREAM'
                ? styles.modeChipHybrid
                : styles.modeChipStream,
            ]}
            onPress={() => setShowSettings(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.utilityChipText}>
              {computationMode === 'ON_DEVICE_EDGE'
                ? '📱 EDGE'
                : computationMode === 'HYBRID_EDGE_STREAM'
                ? '⚡ HYBRID'
                : '📹 STREAM'}
            </Text>
          </TouchableOpacity>

          {isAutoDetectActive && (
            <TouchableOpacity style={styles.autoDetectPill} onPress={onToggleAutoDetect} activeOpacity={0.75}>
              <View style={styles.pulsingDot} />
              <Text style={styles.autoDetectText}>CV ACTIVE</Text>
            </TouchableOpacity>
          )}

          <View style={styles.ribbonDivider} />

          {TARGET_KEYS.map((key) => {
            const spec = TARGET_SPECS[key];
            const isSelected = targetType === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.specChip, isSelected && styles.specChipActive]}
                onPress={() => onSelectTargetType(key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.specChipText, isSelected && styles.specChipTextActive]}>
                  {spec.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Settings & Hardware Rig Configuration Modal */}
      {showSettings && (
        <Modal
          visible
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>CAMERA RIG &amp; SENSOR ENGINE</Text>
                <Text style={styles.modalSubtitle}>
                  Status: {isConnected ? `🟢 Connected (${latencyMs ?? 0}ms)` : '🔴 Offline'} • Lane {laneId}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>TARGET VISION COMPUTATION ENGINE</Text>
              <View style={styles.btnRow}>
                {[
                  { key: 'ON_DEVICE_EDGE' as VideoComputationMode, label: '📱 EDGE CALC' },
                  { key: 'HYBRID_EDGE_STREAM' as VideoComputationMode, label: '⚡ HYBRID' },
                  { key: 'SERVER_VISION' as VideoComputationMode, label: '📹 SERVER CV' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.segmentBtn, computationMode === opt.key && styles.segmentBtnActive]}
                    onPress={() => onSelectComputationMode?.(opt.key)}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        computationMode === opt.key && styles.segmentBtnTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>OPTICAL HOLE DELTA SENSITIVITY</Text>
              <View style={styles.btnRow}>
                {[
                  { label: 'High (Δ18)', val: 18 },
                  { label: 'Balanced (Δ26)', val: 26 },
                  { label: 'Strict (Δ36)', val: 36 },
                ].map((sens) => (
                  <TouchableOpacity
                    key={sens.label}
                    style={[styles.bandChip, cvDeltaThreshold === sens.val && styles.bandChipActive]}
                    onPress={() => onSelectCvDeltaThreshold?.(sens.val)}
                  >
                    <Text
                      style={[
                        styles.bandChipText,
                        cvDeltaThreshold === sens.val && styles.bandChipTextActive,
                      ]}
                    >
                      {sens.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {onToggleAutoDetect && (
                <View style={styles.settingRowContainer}>
                  <Text style={styles.inputLabel}>AUTOMATED OPTICAL SHOT DETECTOR</Text>
                  <TouchableOpacity
                    style={[styles.toggleOptionBtn, isAutoDetectActive && styles.toggleOptionBtnActive]}
                    onPress={onToggleAutoDetect}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        isAutoDetectActive && styles.toggleOptionTextActive,
                      ]}
                    >
                      {isAutoDetectActive
                        ? '🎯 LIVE OPTICAL CV ACTIVE (FRAME DIFF)'
                        : '⏸ LIVE CV PAUSED (MANUAL / SINGLE SCAN)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.inputLabel}>CAMERA LENS, LED TORCH &amp; ZOOM</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.segmentBtn, facing === 'back' && styles.segmentBtnActive]}
                  onPress={() => facing !== 'back' && onFlipCamera()}
                >
                  <Text style={[styles.segmentBtnText, facing === 'back' && styles.segmentBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>
                    📷 REAR
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentBtn, facing === 'front' && styles.segmentBtnActive]}
                  onPress={() => facing !== 'front' && onFlipCamera()}
                >
                  <Text style={[styles.segmentBtnText, facing === 'front' && styles.segmentBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>
                    🤳 FRONT
                  </Text>
                </TouchableOpacity>
                {onToggleTorch && (
                  <TouchableOpacity
                    style={[styles.segmentBtn, torchEnabled && styles.segmentBtnActive]}
                    onPress={onToggleTorch}
                  >
                    <Text style={[styles.segmentBtnText, torchEnabled && styles.segmentBtnTextActive]} numberOfLines={1} adjustsFontSizeToFit>
                      {torchEnabled ? '🔦 ON' : '🔦 OFF'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.btnRow, { marginTop: 6 }]}>
                {[
                  { label: '1x Wide', value: 0 },
                  { label: '2x Tele', value: 0.25 },
                  { label: '3x Zoom', value: 0.5 },
                  { label: '5x Lock', value: 0.8 },
                ].map((z) => (
                  <TouchableOpacity
                    key={z.label}
                    style={[styles.bandChip, (zoom ?? 0) === z.value && styles.bandChipActive]}
                    onPress={() => onSelectZoom?.(z.value)}
                  >
                    <Text style={[styles.bandChipText, (zoom ?? 0) === z.value && styles.bandChipTextActive]} numberOfLines={1} adjustsFontSizeToFit>
                      {z.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>ACOUSTIC IMPULSE THRESHOLD</Text>
              <View style={styles.btnRow}>
                {[
                  { label: '75 dB (Clap)', val: 75 },
                  { label: '95 dB (Std)', val: 95 },
                  { label: '112 dB (Loud)', val: 112 },
                ].map((thresh) => (
                  <TouchableOpacity
                    key={thresh.label}
                    style={[styles.bandChip, acousticThresholdDb === thresh.val && styles.bandChipActive]}
                    onPress={() => onSelectAcousticThresholdDb?.(thresh.val)}
                  >
                    <Text
                      style={[
                        styles.bandChipText,
                        acousticThresholdDb === thresh.val && styles.bandChipTextActive,
                      ]}
                    >
                      {thresh.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {onZeroHorizon && (
                <TouchableOpacity style={styles.zeroHorizonBtn} onPress={onZeroHorizon}>
                  <Text style={styles.zeroHorizonBtnText}>📐 TARE / ZERO SPIRIT LEVEL</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.inputLabel}>WI-FI RADIO SPECTRUM OPTIMIZATION</Text>
              <View style={styles.btnRow}>
                {(['2.4GHz', '5GHz', '6GHz+', 'AUTO_DETECT'] as WiFiFrequencyBand[]).map((band) => (
                  <TouchableOpacity
                    key={band}
                    style={[styles.bandChip, wifiBand === band && styles.bandChipActive]}
                    onPress={() => onSelectWifiBand?.(band)}
                  >
                    <Text style={[styles.bandChipText, wifiBand === band && styles.bandChipTextActive]} numberOfLines={1} adjustsFontSizeToFit>
                      {band === 'AUTO_DETECT' ? 'AUTO' : band}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.snapshotToggle, sendImpactSnapshot && styles.snapshotToggleActive]}
                onPress={onToggleSendImpactSnapshot}
              >
                <Text style={styles.snapshotToggleText}>
                  📸 IMPACT PHOTO ON HIT: {sendImpactSnapshot ? 'ENABLED' : 'DISABLED'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>MARKSMAN GATEWAY / API URL</Text>
              <View style={styles.presetRow}>
                {[
                  { label: 'USB ADB', url: 'http://localhost:3001' },
                  { label: 'EMULATOR', url: 'http://10.0.2.2:3001' },
                  { label: 'LAN HOST', url: 'http://10.21.243.23:3001' },
                  { label: 'WIFI LAN', url: 'http://192.168.1.100:3001' },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[styles.presetBtn, tempUrl === preset.url && styles.presetBtnActive]}
                    onPress={() => setTempUrl(preset.url)}
                  >
                    <Text style={[styles.presetBtnText, tempUrl === preset.url && styles.presetBtnTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.textInput}
                value={tempUrl}
                onChangeText={setTempUrl}
                placeholder="http://localhost:3001"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>ASSIGNED FIRING LANE (1-12)</Text>
              <View style={styles.laneGrid}>
                {LANES.map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.laneGridItem, laneId === l && styles.laneGridItemActive]}
                    onPress={() => onSelectLane(l)}
                  >
                    <Text style={[styles.laneGridText, laneId === l && styles.laneGridTextActive]}>
                      L{l}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              {onReconnectServer && (
                <TouchableOpacity
                  style={styles.reconnectBtn}
                  onPress={() => {
                    onUpdateServerUrl(tempUrl.trim());
                    onReconnectServer();
                  }}
                >
                  <Text style={styles.reconnectBtnText}>↻ TEST / CONNECT</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  onUpdateServerUrl(tempUrl.trim());
                  setShowSettings(false);
                }}
              >
                <Text style={styles.saveBtnText}>APPLY &amp; CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(7, 9, 15, 0.78)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 6,
    zIndex: 100,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  leftPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  statusSubtext: {
    fontSize: 8.5,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  latencyPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  latencyText: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  micBarTrack: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 1,
    marginTop: 2,
    overflow: 'hidden',
  },
  micBarFill: {
    height: '100%',
    borderRadius: 1,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  timerPillIdle: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerPillRunning: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
    borderColor: '#00E5A0',
  },
  timerPillWarning: {
    backgroundColor: 'rgba(255, 183, 3, 0.2)',
    borderColor: '#FFB703',
  },
  timerPillExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  timerPillText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
  },
  timerPillTextNormal: {
    color: '#00E5A0',
  },
  timerPillTextWarning: {
    color: '#FFB703',
  },
  timerPillTextAlert: {
    color: '#EF4444',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionPillActive: {
    backgroundColor: '#00E5A0',
    borderColor: '#00E5A0',
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  actionPillTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  iconPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 28,
    alignItems: 'center',
  },
  iconPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  torchActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.25)',
    borderColor: '#FACC15',
  },
  torchText: {
    color: '#FACC15',
  },
  specRibbon: {
    marginTop: 6,
    paddingHorizontal: 8,
  },
  specScroll: {
    gap: 5,
    alignItems: 'center',
    paddingRight: 16,
  },
  utilityChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  utilityChipActive: {
    borderColor: '#00E5A0',
    backgroundColor: 'rgba(0, 229, 160, 0.18)',
  },
  utilityChipText: {
    color: '#E2E8F0',
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  utilityChipTextActive: {
    color: '#00E5A0',
  },
  modeChipEdge: {
    borderColor: '#00E5A0',
    backgroundColor: 'rgba(0, 229, 160, 0.12)',
  },
  modeChipHybrid: {
    borderColor: '#FFB703',
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
  },
  modeChipStream: {
    borderColor: '#00B4D8',
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
  },
  autoDetectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 160, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00E5A0',
  },
  pulsingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00E5A0',
  },
  autoDetectText: {
    color: '#00E5A0',
    fontSize: 8,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  ribbonDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginHorizontal: 2,
  },
  specChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  specChipActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.2)',
    borderColor: '#00E5A0',
  },
  specChipText: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600',
  },
  specChipTextActive: {
    color: '#00E5A0',
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 5, 12, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    backgroundColor: '#0A0F1E',
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  modalSubtitle: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalScroll: {
    flexGrow: 0,
  },
  inputLabel: {
    color: '#9CA3AF',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  segmentBtn: {
    flex: 1,
    minWidth: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
    borderColor: '#00E5A0',
  },
  segmentBtnText: {
    color: '#9CA3AF',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  segmentBtnTextActive: {
    color: '#00E5A0',
  },
  settingRowContainer: {
    marginTop: 6,
  },
  toggleOptionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  toggleOptionBtnActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.18)',
    borderColor: '#00E5A0',
  },
  toggleOptionText: {
    color: '#9CA3AF',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  toggleOptionTextActive: {
    color: '#00E5A0',
  },
  bandChip: {
    flex: 1,
    minWidth: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  bandChipActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
    borderColor: '#00E5A0',
  },
  bandChipText: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600',
  },
  bandChipTextActive: {
    color: '#00E5A0',
    fontWeight: 'bold',
  },
  zeroHorizonBtn: {
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderWidth: 1,
    borderColor: '#F5A623',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  zeroHorizonBtnText: {
    color: '#F5A623',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  snapshotToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginTop: 10,
  },
  snapshotToggleActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
    borderColor: '#00E5A0',
  },
  snapshotToggleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 6,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
    borderColor: '#00E5A0',
  },
  presetBtnText: {
    color: '#9CA3AF',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  presetBtnTextActive: {
    color: '#00E5A0',
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  laneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  laneGridItem: {
    width: '14.5%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  laneGridItemActive: {
    backgroundColor: '#00E5A0',
    borderColor: '#00E5A0',
  },
  laneGridText: {
    color: '#9CA3AF',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  laneGridTextActive: {
    color: '#000000',
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  reconnectBtn: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  reconnectBtnText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '900',
  },
  saveBtn: {
    flex: 1.3,
    backgroundColor: '#00E5A0',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

// Target_Camera_App/src/components/AcousticCalibrationModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface AcousticCalibrationModalProps {
  visible: boolean;
  onClose: () => void;
  micDb: number;
  acousticThresholdDb: number;
  onSelectThresholdDb: (threshold: number) => void;
  isMicArmed?: boolean;
  onToggleMicArmed?: () => void;
  acousticDryFireMode?: boolean;
  onToggleDryFireMode?: () => void;
  onTestAcousticShot: () => void;
  distanceM?: number;
}

export function AcousticCalibrationModal({
  visible,
  onClose,
  micDb,
  acousticThresholdDb,
  onSelectThresholdDb,
  isMicArmed = false,
  onToggleMicArmed,
  acousticDryFireMode = false,
  onToggleDryFireMode,
  onTestAcousticShot,
  distanceM = 10,
}: AcousticCalibrationModalProps) {
  const [isCalibratingNoise, setIsCalibratingNoise] = useState(false);
  const [calibratedFloorDb, setCalibratedFloorDb] = useState<number | null>(null);
  const samplesRef = useRef<number[]>([]);

  useEffect(() => {
    if (isCalibratingNoise) {
      samplesRef.current.push(micDb);
    }
  }, [micDb, isCalibratingNoise]);

  const micPct = Math.max(0, Math.min(100, ((micDb - 30) / 100) * 100));
  const thresholdPct = Math.max(0, Math.min(100, ((acousticThresholdDb - 30) / 100) * 100));

  const isTriggered = micDb >= acousticThresholdDb;

  const speedOfSoundDelayMs = Math.round((distanceM / 343) * 1000);
  const typicalPelletFlightTimeMs = Math.round(distanceM * 5.6);

  const handleSampleNoiseFloor = () => {
    samplesRef.current = [micDb];
    setIsCalibratingNoise(true);
    setTimeout(() => {
      const collected = samplesRef.current;
      const avgFloor =
        collected.length > 0
          ? collected.reduce((a, b) => a + b, 0) / collected.length
          : micDb;
      const rounded = Math.round(avgFloor);
      setCalibratedFloorDb(rounded);
      const recommendedThreshold = Math.max(68, Math.min(118, rounded + 24));
      onSelectThresholdDb(recommendedThreshold);
      setIsCalibratingNoise(false);
    }, 1800);
  };

  const THRESHOLD_PRESETS = [72, 82, 92, 102, 112];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
                🎤 ACOUSTIC CHRONOGRAPH &amp; SENSOR
              </Text>
              <Text style={styles.subtitle}>
                Impulse Detection • Muzzle Crack &amp; Lead Impact Timing
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Live dB Audio Visualizer */}
            <View style={[styles.visualizerCard, isTriggered && styles.visualizerTriggered]}>
              <View style={styles.gaugeHeader}>
                <Text style={styles.gaugeLabel}>LIVE MICROPHONE LEVEL</Text>
                <Text
                  style={[
                    styles.gaugeDbValue,
                    { color: isTriggered ? '#EF4444' : micDb > 70 ? '#FFB703' : '#00E5A0' },
                  ]}
                >
                  {micDb.toFixed(1)} dB
                </Text>
              </View>

              {/* Progress Track with Threshold Marker */}
              <View style={styles.meterTrack}>
                <View
                  style={[
                    styles.meterFill,
                    {
                      width: `${micPct}%`,
                      backgroundColor: isTriggered ? '#EF4444' : micDb > 70 ? '#FFB703' : '#00E5A0',
                    },
                  ]}
                />
                {/* Threshold Marker Pin */}
                <View style={[styles.thresholdMarker, { left: `${thresholdPct}%` }]}>
                  <View style={styles.thresholdMarkerPin} />
                  <Text style={styles.thresholdMarkerText}>{acousticThresholdDb}dB</Text>
                </View>
              </View>

              <View style={styles.meterFooter}>
                <Text style={styles.meterScaleText}>30 dB (Quiet)</Text>
                <Text style={styles.meterScaleText}>80 dB (Normal)</Text>
                <Text style={styles.meterScaleText}>130 dB (Crack)</Text>
              </View>

              {/* Trigger Status Pill */}
              <View
                style={[
                  styles.triggerStatusPill,
                  {
                    backgroundColor: isTriggered
                      ? 'rgba(239, 68, 68, 0.25)'
                      : 'rgba(0, 229, 160, 0.15)',
                    borderColor: isTriggered ? '#EF4444' : '#00E5A0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.triggerStatusText,
                    { color: isTriggered ? '#EF4444' : '#00E5A0' },
                  ]}
                >
                  {isTriggered ? '⚡ IMPULSE TRIGGERED' : '● SENSING AMBIENT SOUND'}
                </Text>
              </View>
            </View>

            {/* Threshold Adjustment Presets */}
            <Text style={styles.sectionHeader}>TRIGGER SENSITIVITY THRESHOLD</Text>
            <View style={styles.presetsRow}>
              {THRESHOLD_PRESETS.map((val) => {
                const isSelected = acousticThresholdDb === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.presetBtn, isSelected && styles.presetBtnActive]}
                    onPress={() => onSelectThresholdDb(val)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetBtnText, isSelected && styles.presetBtnTextActive]}>
                      {val} dB
                    </Text>
                    <Text style={styles.presetBtnSubtext}>
                      {val <= 80 ? 'Low Noise' : val <= 95 ? 'Standard' : 'Loud Range'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Fine Step Adjusters */}
            <View style={styles.fineAdjustRow}>
              <TouchableOpacity
                style={styles.fineBtn}
                onPress={() => onSelectThresholdDb(Math.max(50, acousticThresholdDb - 5))}
                activeOpacity={0.7}
              >
                <Text style={styles.fineBtnText}>-5 dB</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fineBtn}
                onPress={() => onSelectThresholdDb(Math.max(50, acousticThresholdDb - 1))}
                activeOpacity={0.7}
              >
                <Text style={styles.fineBtnText}>-1 dB</Text>
              </TouchableOpacity>
              <View style={styles.currentThresholdDisplay}>
                <Text style={styles.currentThresholdVal}>{acousticThresholdDb}</Text>
                <Text style={styles.currentThresholdUnit}>dB SPL</Text>
              </View>
              <TouchableOpacity
                style={styles.fineBtn}
                onPress={() => onSelectThresholdDb(Math.min(130, acousticThresholdDb + 1))}
                activeOpacity={0.7}
              >
                <Text style={styles.fineBtnText}>+1 dB</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fineBtn}
                onPress={() => onSelectThresholdDb(Math.min(130, acousticThresholdDb + 5))}
                activeOpacity={0.7}
              >
                <Text style={styles.fineBtnText}>+5 dB</Text>
              </TouchableOpacity>
            </View>

            {/* Ambient Noise Floor Calibration */}
            <View style={styles.ambientCard}>
              <View style={styles.ambientHeader}>
                <Text style={styles.ambientTitle}>AMBIENT NOISE FLOOR CALIBRATION</Text>
                {calibratedFloorDb !== null && (
                  <Text style={styles.ambientResult}>Sampled: {calibratedFloorDb} dB</Text>
                )}
              </View>
              <Text style={styles.ambientDesc}>
                Samples background range noise for 2 seconds and automatically calculates the optimum
                gunshot detection threshold.
              </Text>
              <TouchableOpacity
                style={[styles.sampleBtn, isCalibratingNoise && styles.sampleBtnActive]}
                onPress={handleSampleNoiseFloor}
                disabled={isCalibratingNoise}
                activeOpacity={0.8}
              >
                <Text style={styles.sampleBtnText}>
                  {isCalibratingNoise ? '🎙️ SAMPLING ROOM ACOUSTICS (2s)...' : '🎙️ AUTO-CALIBRATE NOISE FLOOR'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ballistic Chronograph Physics Info */}
            <View style={styles.physicsCard}>
              <Text style={styles.physicsTitle}>RANGE BALLISTIC ACOUSTICS ({distanceM}m)</Text>
              <View style={styles.physicsRow}>
                <Text style={styles.physicsLabel}>Speed of Sound Delay (343 m/s):</Text>
                <Text style={styles.physicsVal}>~{speedOfSoundDelayMs} ms</Text>
              </View>
              <View style={styles.physicsRow}>
                <Text style={styles.physicsLabel}>Est. Pellet Flight Duration:</Text>
                <Text style={styles.physicsVal}>~{typicalPelletFlightTimeMs} ms</Text>
              </View>
            </View>

            {/* Live Mic Trigger Arm & Dry-Fire Switches */}
            {onToggleMicArmed && (
              <TouchableOpacity
                style={[styles.sampleBtn, isMicArmed && styles.sampleBtnActive, { marginBottom: 10 }]}
                onPress={onToggleMicArmed}
                activeOpacity={0.8}
              >
                <Text style={[styles.sampleBtnText, isMicArmed && { color: '#F5A623' }]}>
                  {isMicArmed
                    ? '⚡ LIVE MIC TRIGGER ARMED (TAP OR CLAP > THRESHOLD)'
                    : '🎤 ARM LIVE MICROPHONE IMPULSE TRIGGER'}
                </Text>
              </TouchableOpacity>
            )}

            {onToggleDryFireMode && (
              <TouchableOpacity
                style={[styles.sampleBtn, acousticDryFireMode && styles.sampleBtnActive, { marginBottom: 12 }]}
                onPress={onToggleDryFireMode}
                activeOpacity={0.8}
              >
                <Text style={[styles.sampleBtnText, acousticDryFireMode && { color: '#F5A623' }]}>
                  {acousticDryFireMode
                    ? '🔊 DRY-FIRE ACOUSTIC DRILL: ON (CLAP LOGS TIMED IMPULSE)'
                    : '📸 OPTICAL+MIC FUSION: CLAP SCANS CAMERA FOR HOLE'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Test Acoustic Shot Button */}
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => {
                onTestAcousticShot();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.testBtnText}>⚡ SIMULATE TEST ACOUSTIC SHOT</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>APPLY & CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  title: {
    color: '#00E5A0',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  closeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  body: {
    padding: 16,
  },
  visualizerCard: {
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 16,
  },
  visualizerTriggered: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gaugeLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  gaugeDbValue: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '900',
  },
  meterTrack: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 7,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  meterFill: {
    height: '100%',
    borderRadius: 7,
  },
  thresholdMarker: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    width: 2,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    zIndex: 10,
  },
  thresholdMarkerPin: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: -4,
  },
  thresholdMarkerText: {
    position: 'absolute',
    bottom: -16,
    color: '#EF4444',
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  meterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  meterScaleText: {
    color: '#64748B',
    fontSize: 8,
    fontFamily: 'monospace',
  },
  triggerStatusPill: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  triggerStatusText: {
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
    borderColor: '#00E5A0',
  },
  presetBtnText: {
    color: '#CBD5E1',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  presetBtnTextActive: {
    color: '#00E5A0',
  },
  presetBtnSubtext: {
    color: '#64748B',
    fontSize: 7.5,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  fineAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  fineBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fineBtnText: {
    color: '#E2E8F0',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  currentThresholdDisplay: {
    flex: 1.5,
    alignItems: 'center',
    backgroundColor: '#020617',
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00E5A0',
  },
  currentThresholdVal: {
    color: '#00E5A0',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '900',
  },
  currentThresholdUnit: {
    color: '#64748B',
    fontSize: 7.5,
    fontFamily: 'monospace',
  },
  ambientCard: {
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  ambientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ambientTitle: {
    color: '#CBD5E1',
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  ambientResult: {
    color: '#00E5A0',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  ambientDesc: {
    color: '#94A3B8',
    fontSize: 8.5,
    lineHeight: 12,
    marginBottom: 10,
  },
  sampleBtn: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
    borderWidth: 1,
    borderColor: '#00E5A0',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  sampleBtnActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.25)',
    borderColor: '#F5A623',
  },
  sampleBtnText: {
    color: '#00E5A0',
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  physicsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  physicsTitle: {
    color: '#64748B',
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  physicsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  physicsLabel: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontFamily: 'monospace',
  },
  physicsVal: {
    color: '#CBD5E1',
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  testBtn: {
    backgroundColor: 'rgba(245, 166, 35, 0.18)',
    borderWidth: 1,
    borderColor: '#F5A623',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  testBtnText: {
    color: '#F5A623',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  doneBtn: {
    backgroundColor: '#00E5A0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#000000',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});


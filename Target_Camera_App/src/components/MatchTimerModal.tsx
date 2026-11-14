// Target_Camera_App/src/components/MatchTimerModal.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  MatchTimerPreset,
  MATCH_TIMER_PRESETS,
} from '../types/target';

interface MatchTimerModalProps {
  visible: boolean;
  onClose: () => void;
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  currentPreset: MatchTimerPreset;
  onSelectPreset: (preset: MatchTimerPreset) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onAdjustTime: (deltaSeconds: number) => void;
  onTriggerCeasefire?: () => void;
}

export function MatchTimerModal({
  visible,
  onClose,
  secondsLeft,
  totalSeconds,
  isRunning,
  currentPreset,
  onSelectPreset,
  onToggleTimer,
  onResetTimer,
  onAdjustTime,
  onTriggerCeasefire,
}: MatchTimerModalProps) {
  const [autoCeasefire, setAutoCeasefire] = useState(true);

  // Time format calculations
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime =
    secondsLeft <= 10 && currentPreset.startsWith('RAPID_FIRE')
      ? `${secondsLeft}s`
      : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progressPercent = totalSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100)) : 0;

  // Visual urgency styling
  const isExpired = secondsLeft <= 0;
  const isUrgent = secondsLeft > 0 && secondsLeft <= 60; // < 1 min
  const isWarning = secondsLeft > 60 && secondsLeft <= 300; // < 5 mins

  const timerColor = isExpired
    ? '#EF4444'
    : isUrgent
    ? '#EF4444'
    : isWarning
    ? '#FFB703'
    : '#00E5A0';

  const PRESET_KEYS = Object.keys(MATCH_TIMER_PRESETS) as MatchTimerPreset[];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>⏱️ ISSF MATCH COUNTDOWN TIMER</Text>
              <Text style={styles.subtitle}>
                Precision Discipline Clock • ISSF & NRA Certified Cadence
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Discipline Preset Selector Ribbon */}
            <Text style={styles.sectionHeader}>MATCH DISCIPLINE PRESET</Text>
            <View style={styles.presetsGrid}>
              {PRESET_KEYS.map((key) => {
                const conf = MATCH_TIMER_PRESETS[key];
                const isSelected = currentPreset === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => onSelectPreset(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetChipLabel, isSelected && styles.presetChipLabelActive]}>
                      {conf.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Large Digital LED Chronometer Display */}
            <View style={[styles.ledDisplayCard, { borderColor: timerColor }]}>
              {/* Status Header */}
              <View style={styles.ledStatusRow}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isExpired
                        ? 'rgba(239, 68, 68, 0.2)'
                        : isRunning
                        ? 'rgba(0, 229, 160, 0.2)'
                        : 'rgba(245, 166, 35, 0.2)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.pulsingDot,
                      {
                        backgroundColor: timerColor,
                      },
                    ]}
                  />
                  <Text style={[styles.statusPillText, { color: timerColor }]}>
                    {isExpired
                      ? '🚨 TIME EXPIRED / CEASEFIRE'
                      : isRunning
                      ? '● RUNNING'
                      : '⏸ PAUSED'}
                  </Text>
                </View>
                <Text style={styles.presetDetail}>
                  {MATCH_TIMER_PRESETS[currentPreset].description}
                </Text>
              </View>

              {/* Digital Numbers */}
              <View style={styles.numbersWrapper}>
                <Text style={[styles.timerDigits, { color: timerColor }]}>
                  {formattedTime}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: timerColor,
                    },
                  ]}
                />
              </View>

              <View style={styles.progressFooter}>
                <Text style={styles.progressText}>
                  REMAINING: {Math.round(progressPercent)}%
                </Text>
                <Text style={styles.progressText}>
                  TOTAL: {Math.floor(totalSeconds / 60)}m {totalSeconds % 60}s
                </Text>
              </View>
            </View>

            {/* Quick Adjustment Buttons */}
            <View style={styles.adjustRow}>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => onAdjustTime(-60)}
                disabled={secondsLeft <= 60}
                activeOpacity={0.7}
              >
                <Text style={styles.adjustBtnText}>-1 MIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => onAdjustTime(-10)}
                disabled={secondsLeft <= 10}
                activeOpacity={0.7}
              >
                <Text style={styles.adjustBtnText}>-10 SEC</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => onAdjustTime(10)}
                activeOpacity={0.7}
              >
                <Text style={styles.adjustBtnText}>+10 SEC</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => onAdjustTime(60)}
                activeOpacity={0.7}
              >
                <Text style={styles.adjustBtnText}>+1 MIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => onAdjustTime(300)}
                activeOpacity={0.7}
              >
                <Text style={styles.adjustBtnText}>+5 MIN</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Action Controls */}
            <View style={styles.mainControlsRow}>
              <TouchableOpacity
                style={[styles.mainBtn, isRunning ? styles.pauseBtn : styles.startBtn]}
                onPress={onToggleTimer}
                activeOpacity={0.8}
              >
                <Text style={styles.mainBtnText}>
                  {isRunning ? '⏸ PAUSE MATCH' : isExpired ? '▶ RESTART' : '▶ START MATCH'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mainBtn, styles.resetBtn]}
                onPress={onResetTimer}
                activeOpacity={0.8}
              >
                <Text style={styles.resetBtnText}>🔄 RESET</Text>
              </TouchableOpacity>
            </View>

            {/* Emergency Ceasefire Trigger */}
            {onTriggerCeasefire && (
              <TouchableOpacity
                style={styles.ceasefireBtn}
                onPress={() => {
                  onTriggerCeasefire();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.ceasefireBtnText}>
                  🚨 EMERGENCY RANGE CEASEFIRE (HALT ALL SHOOTING)
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
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
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  presetChipActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.2)',
    borderColor: '#00E5A0',
  },
  presetChipLabel: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  presetChipLabelActive: {
    color: '#00E5A0',
    fontWeight: 'bold',
  },
  ledDisplayCard: {
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  ledStatusRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  presetDetail: {
    color: '#64748B',
    fontSize: 8.5,
    fontFamily: 'monospace',
    maxWidth: '55%',
    textAlign: 'right',
  },
  numbersWrapper: {
    paddingVertical: 8,
  },
  timerDigits: {
    fontFamily: 'monospace',
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: '#64748B',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  adjustBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  adjustBtnText: {
    color: '#E2E8F0',
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  mainControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  mainBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    backgroundColor: '#00E5A0',
  },
  pauseBtn: {
    backgroundColor: '#F5A623',
  },
  mainBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 11,
  },
  ceasefireBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  ceasefireBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});


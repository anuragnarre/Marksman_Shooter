// Target_Camera_App/src/components/CameraControls.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
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
  isConnected: boolean;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  isCalibrationMode: boolean;
  onToggleCalibration: () => void;
  onFlipCamera: () => void;
  facing: 'back' | 'front';
  computationMode?: VideoComputationMode;
  onSelectComputationMode?: (mode: VideoComputationMode) => void;
  wifiBand?: WiFiFrequencyBand;
  onSelectWifiBand?: (band: WiFiFrequencyBand) => void;
  sendImpactSnapshot?: boolean;
  onToggleSendImpactSnapshot?: () => void;
}

export function CameraControls({
  laneId,
  onSelectLane,
  targetType,
  onSelectTargetType,
  serverUrl,
  onUpdateServerUrl,
  isConnected,
  isStreaming,
  onToggleStreaming,
  isCalibrationMode,
  onToggleCalibration,
  onFlipCamera,
  facing,
  computationMode = 'ON_DEVICE_EDGE',
  onSelectComputationMode,
  wifiBand = '2.4GHz',
  onSelectWifiBand,
  sendImpactSnapshot = true,
  onToggleSendImpactSnapshot,
}: CameraControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(serverUrl);

  const LANES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const TARGET_KEYS = Object.keys(TARGET_SPECS) as TargetTypeCode[];

  return (
    <View style={styles.topContainer}>
      {/* Top Status & Quick Bar */}
      <View style={styles.statusBar}>
        {/* Left: Connection Pill & Lane Pill */}
        <View style={styles.leftPills}>
          <TouchableOpacity
            style={styles.connectionPill}
            onPress={() => setShowSettings(true)}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? '#00E5A0' : '#EF4444' },
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </TouchableOpacity>

          <View style={styles.lanePill}>
            <Text style={styles.laneLabel}>LANE {laneId}</Text>
          </View>

          {/* Mode Pill: Edge Calculation vs Full Video Stream */}
          <TouchableOpacity
            style={[
              styles.modePill,
              computationMode === 'ON_DEVICE_EDGE'
                ? styles.modePillEdge
                : computationMode === 'HYBRID_EDGE_STREAM'
                ? styles.modePillHybrid
                : styles.modePillStream,
            ]}
            onPress={() => setShowSettings(true)}
          >
            <Text style={styles.modePillText}>
              {computationMode === 'ON_DEVICE_EDGE'
                ? '📱 EDGE'
                : computationMode === 'HYBRID_EDGE_STREAM'
                ? '⚡ HYBRID'
                : '📹 STREAM'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right: Actions */}
        <View style={styles.rightActions}>
          {/* Calibration Mode Toggle */}
          <TouchableOpacity
            style={[
              styles.actionPill,
              isCalibrationMode && styles.actionPillActive,
            ]}
            onPress={onToggleCalibration}
          >
            <Text
              style={[
                styles.actionPillText,
                isCalibrationMode && styles.actionPillTextActive,
              ]}
            >
              {isCalibrationMode ? 'DONE CALIB' : 'CALIBRATE'}
            </Text>
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity style={styles.iconPill} onPress={onFlipCamera}>
            <Text style={styles.iconPillText}>{facing === 'back' ? '↻ BACK' : '↺ FRONT'}</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.iconPill}
            onPress={() => setShowSettings(true)}
          >
            <Text style={styles.iconPillText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Target Spec Ribbon */}
      <View style={styles.specRibbon}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specScroll}>
          {TARGET_KEYS.map((key) => {
            const spec = TARGET_SPECS[key];
            const isSelected = targetType === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.specChip, isSelected && styles.specChipActive]}
                onPress={() => onSelectTargetType(key)}
              >
                <Text style={[styles.specChipText, isSelected && styles.specChipTextActive]}>
                  {spec.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Settings / Configuration Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CAMERA RIG & ARCHITECTURE</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Vision Computation Engine */}
            <Text style={styles.inputLabel}>TARGET VISION COMPUTATION ENGINE</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  computationMode === 'ON_DEVICE_EDGE' && styles.segmentBtnActive,
                ]}
                onPress={() => onSelectComputationMode?.('ON_DEVICE_EDGE')}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    computationMode === 'ON_DEVICE_EDGE' && styles.segmentBtnTextActive,
                  ]}
                >
                  📱 EDGE CALC
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  computationMode === 'HYBRID_EDGE_STREAM' && styles.segmentBtnActive,
                ]}
                onPress={() => onSelectComputationMode?.('HYBRID_EDGE_STREAM')}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    computationMode === 'HYBRID_EDGE_STREAM' && styles.segmentBtnTextActive,
                  ]}
                >
                  ⚡ HYBRID
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  computationMode === 'SERVER_VISION' && styles.segmentBtnActive,
                ]}
                onPress={() => onSelectComputationMode?.('SERVER_VISION')}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    computationMode === 'SERVER_VISION' && styles.segmentBtnTextActive,
                  ]}
                >
                  📹 SERVER CV
                </Text>
              </TouchableOpacity>
            </View>

            {/* Wi-Fi Frequency Band Optimization */}
            <Text style={styles.inputLabel}>WI-FI RADIO SPECTRUM OPTIMIZATION</Text>
            <View style={styles.btnRow}>
              {(['2.4GHz', '5GHz', '6GHz+', 'AUTO_DETECT'] as WiFiFrequencyBand[]).map((band) => (
                <TouchableOpacity
                  key={band}
                  style={[
                    styles.bandChip,
                    wifiBand === band && styles.bandChipActive,
                  ]}
                  onPress={() => onSelectWifiBand?.(band)}
                >
                  <Text
                    style={[
                      styles.bandChipText,
                      wifiBand === band && styles.bandChipTextActive,
                    ]}
                  >
                    {band}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Impact Snapshot Toggle */}
            <TouchableOpacity
              style={[
                styles.snapshotToggle,
                sendImpactSnapshot && styles.snapshotToggleActive,
              ]}
              onPress={onToggleSendImpactSnapshot}
            >
              <Text style={styles.snapshotToggleText}>
                📸 IMPACT PHOTO ON HIT: {sendImpactSnapshot ? 'ENABLED' : 'DISABLED'}
              </Text>
            </TouchableOpacity>

            {/* Server URL Input */}
            <Text style={styles.inputLabel}>MARKS MAN GATEWAY / API URL</Text>
            <TextInput
              style={styles.textInput}
              value={tempUrl}
              onChangeText={setTempUrl}
              placeholder="http://192.168.1.100:3001"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Lane Picker */}
            <Text style={styles.inputLabel}>ASSIGNED FIRING LANE (1-12)</Text>
            <View style={styles.laneGrid}>
              {LANES.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.laneGridItem, laneId === l && styles.laneGridItemActive]}
                  onPress={() => onSelectLane(l)}
                >
                  <Text
                    style={[
                      styles.laneGridText,
                      laneId === l && styles.laneGridTextActive,
                    ]}
                  >
                    L{l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Modal Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                onUpdateServerUrl(tempUrl);
                setShowSettings(false);
              }}
            >
              <Text style={styles.saveBtnText}>APPLY SETTINGS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  leftPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lanePill: {
    backgroundColor: '#00E5A0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  laneLabel: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionPillActive: {
    backgroundColor: '#00E5A0',
    borderColor: '#00E5A0',
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionPillTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  iconPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  specRibbon: {
    marginTop: 8,
    paddingHorizontal: 10,
  },
  specScroll: {
    gap: 6,
  },
  specChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  specChipActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.25)',
    borderColor: '#00E5A0',
  },
  specChipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  specChipTextActive: {
    color: '#00E5A0',
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalCloseText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  laneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 16,
  },
  laneGridItem: {
    width: '23%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  laneGridItemActive: {
    backgroundColor: '#00E5A0',
    borderColor: '#00E5A0',
  },
  laneGridText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  laneGridTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  saveBtn: {
    backgroundColor: '#00E5A0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  modePillEdge: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
    borderColor: '#00E5A0',
  },
  modePillHybrid: {
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderColor: '#F5A623',
  },
  modePillStream: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  modePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.25)',
    borderColor: '#00E5A0',
  },
  segmentBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: 'bold',
  },
  segmentBtnTextActive: {
    color: '#00E5A0',
  },
  bandChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bandChipActive: {
    backgroundColor: '#00E5A0',
    borderColor: '#00E5A0',
  },
  bandChipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9,
    fontWeight: '600',
  },
  bandChipTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  snapshotToggle: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 4,
  },
  snapshotToggleActive: {
    borderColor: '#F5A623',
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
  },
  snapshotToggleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

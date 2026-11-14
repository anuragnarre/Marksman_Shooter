// Target_Camera_App/src/components/SessionExportModal.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { Shot, TargetTypeCode } from '../types/target';
import {
  generateScorecardText,
  generateSessionCsv,
  generateSessionJson,
  generateSessionSummary,
} from '../utils/scoringEngine';

interface SessionExportModalProps {
  visible: boolean;
  onClose: () => void;
  shots: Shot[];
  targetType: TargetTypeCode;
  laneId: string;
}

export function SessionExportModal({
  visible,
  onClose,
  shots,
  targetType,
  laneId,
}: SessionExportModalProps) {
  const [activeTab, setActiveTab] = useState<'SCORECARD' | 'CSV' | 'JSON'>('SCORECARD');
  const [shareToast, setShareToast] = useState<string | null>(null);

  const summary = generateSessionSummary(shots, targetType, laneId);
  const scorecardText = generateScorecardText(shots, targetType, laneId);
  const csvText = generateSessionCsv(shots, targetType, laneId);
  const jsonText = generateSessionJson(shots, targetType, laneId);

  const activeContent =
    activeTab === 'SCORECARD' ? scorecardText : activeTab === 'CSV' ? csvText : jsonText;

  const handleShare = async () => {
    try {
      const title =
        activeTab === 'SCORECARD'
          ? `Marksman_Scorecard_Lane${laneId}.txt`
          : activeTab === 'CSV'
          ? `Marksman_Shots_Lane${laneId}.csv`
          : `Marksman_Telemetry_Lane${laneId}.json`;

      await Share.share({
        title,
        message: activeContent,
      });

      setShareToast('✓ Ready to copy, save, or share!');
      setTimeout(() => setShareToast(null), 3000);
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📄 SESSION SCORE SHEET & EXPORT</Text>
              <Text style={styles.subtitle}>
                Official Match Record • Lane {laneId} • {summary.targetName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Match Metrics Strip */}
          <View style={styles.metricsStrip}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>SCORE</Text>
              <Text style={styles.metricValuePrimary}>{summary.decimalTotal.toFixed(1)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>INT</Text>
              <Text style={styles.metricValue}>{summary.totalScore}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>INNER 10s</Text>
              <Text style={styles.metricValueHighlight}>{summary.innerTensCount}★</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>SPREAD</Text>
              <Text style={styles.metricValue}>{summary.extremeSpreadMm}mm</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>SERIES</Text>
              <Text style={styles.metricValue}>{summary.series.length}</Text>
            </View>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'SCORECARD' && styles.tabBtnActive]}
              onPress={() => setActiveTab('SCORECARD')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'SCORECARD' && styles.tabTextActive]}>
                📋 SCORECARD
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'CSV' && styles.tabBtnActive]}
              onPress={() => setActiveTab('CSV')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'CSV' && styles.tabTextActive]}>
                📊 CSV DATA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'JSON' && styles.tabBtnActive]}
              onPress={() => setActiveTab('JSON')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'JSON' && styles.tabTextActive]}>
                💾 JSON TELEMETRY
              </Text>
            </TouchableOpacity>
          </View>

          {/* Text Output Preview */}
          <ScrollView style={styles.previewBox} contentContainerStyle={styles.previewContent}>
            <Text style={styles.monoOutput} selectable>
              {activeContent}
            </Text>
          </ScrollView>

          {/* Toast Notification */}
          {shareToast && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{shareToast}</Text>
            </View>
          )}

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>
                📤 EXPORT & SHARE ({activeTab})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>DONE</Text>
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
  metricsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 8.5,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  metricValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginTop: 1,
  },
  metricValuePrimary: {
    color: '#00E5A0',
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '900',
    marginTop: 1,
  },
  metricValueHighlight: {
    color: '#F5A623',
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginTop: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#00E5A0',
    backgroundColor: 'rgba(0, 229, 160, 0.08)',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#00E5A0',
  },
  previewBox: {
    maxHeight: 340,
    backgroundColor: '#020617',
    padding: 12,
  },
  previewContent: {
    paddingBottom: 20,
  },
  monoOutput: {
    color: '#A7F3D0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9.5,
    lineHeight: 14,
  },
  toast: {
    backgroundColor: 'rgba(0, 229, 160, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  toastText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  shareBtn: {
    flex: 2,
    backgroundColor: '#00E5A0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 11.5,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});


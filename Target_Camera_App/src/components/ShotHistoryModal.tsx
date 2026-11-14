// Target_Camera_App/src/components/ShotHistoryModal.tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Shot } from '../types/target';

interface ShotHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  shots: Shot[];
  selectedShotId: string | null;
  onSelectShot: (shotId: string | null) => void;
  onToggleSighter: (shotId: string) => void;
  onDeleteShot: (shotId: string) => void;
  onClearAll: () => void;
}

export function ShotHistoryModal({
  visible,
  onClose,
  shots,
  selectedShotId,
  onSelectShot,
  onToggleSighter,
  onDeleteShot,
  onClearAll,
}: ShotHistoryModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>SHOT LOG &amp; IMPACT INSPECTOR</Text>
              <Text style={styles.subtitle}>
                Total: {shots.length} Impacts • Tap row to inspect on target
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colHeader, { width: 26 }]}>#</Text>
            <Text style={[styles.colHeader, { width: 42 }]}>SCORE</Text>
            <Text style={[styles.colHeader, { width: 42 }]}>CLK</Text>
            <Text style={[styles.colHeader, { width: 48 }]}>DIST</Text>
            <Text style={[styles.colHeader, { width: 44 }]}>VEL</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>
              STATUS
            </Text>
            <Text style={[styles.colHeader, { width: 24, textAlign: 'center' }]}>DEL</Text>
          </View>

          {/* Table Rows */}
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {shots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No shots logged yet.</Text>
                <Text style={styles.emptySubtext}>Fire shots or enable Auto-CV to record impacts.</Text>
              </View>
            ) : (
              shots.map((shot) => {
                const isSelected = shot.id === selectedShotId;
                const scoreColor =
                  shot.score === 10
                    ? '#00E5A0'
                    : shot.score === 9
                    ? '#38BDF8'
                    : shot.score === 8
                    ? '#FFB703'
                    : '#EF4444';

                return (
                  <TouchableOpacity
                    key={shot.id}
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => onSelectShot(isSelected ? null : shot.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.shotNum}>#{shot.shotNumber}</Text>
                    <Text style={[styles.scoreText, { color: scoreColor }]}>
                      {shot.isInnerTen ? '★ ' : ''}
                      {shot.decimalScore.toFixed(1)}
                    </Text>
                    <Text style={styles.metaText}>{shot.clock.replace(' o\'clock', 'h')}</Text>
                    <Text style={styles.metaText}>{shot.radialDistanceMm}mm</Text>
                    <Text style={styles.metaText}>
                      {shot.muzzleVelocityMps ? `${shot.muzzleVelocityMps}m/s` : '—'}
                    </Text>

                    {/* Sighter vs Record Toggle */}
                    <TouchableOpacity
                      style={[
                        styles.sighterPill,
                        shot.isSighter ? styles.sighterPillActive : styles.recordPill,
                      ]}
                      onPress={() => onToggleSighter(shot.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.sighterPillText,
                          shot.isSighter ? styles.sighterPillTextActive : styles.recordPillText,
                        ]}
                      >
                        {shot.isSighter ? 'SIGHT' : 'MATCH'}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete Shot */}
                    <TouchableOpacity
                      style={styles.delBtn}
                      onPress={() => onDeleteShot(shot.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.delBtnText}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            {shots.length > 0 && (
              <TouchableOpacity onPress={onClearAll} style={styles.clearBtn} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>CLEAR ALL</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.7}>
              <Text style={styles.doneBtnText}>DONE</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  card: {
    backgroundColor: '#0A0E1A',
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 160, 0.3)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 12,
    color: '#00E5A0',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 9.5,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    marginBottom: 6,
  },
  colHeader: {
    color: '#9CA3AF',
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: 'bold',
  },
  scroll: {
    flexGrow: 0,
    maxHeight: 340,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowSelected: {
    backgroundColor: 'rgba(0, 229, 160, 0.18)',
    borderColor: '#00E5A0',
    borderWidth: 1,
  },
  shotNum: {
    width: 26,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  scoreText: {
    width: 42,
    fontFamily: 'monospace',
    fontSize: 10.5,
    fontWeight: '900',
  },
  metaText: {
    width: 45,
    color: '#ECEEF4',
    fontFamily: 'monospace',
    fontSize: 8.5,
  },
  sighterPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sighterPillText: {
    fontFamily: 'monospace',
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  recordPill: {
    backgroundColor: 'rgba(0, 229, 160, 0.12)',
    borderColor: 'rgba(0, 229, 160, 0.35)',
  },
  recordPillText: {
    color: '#00E5A0',
    fontFamily: 'monospace',
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  sighterPillActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.18)',
    borderColor: '#F5A623',
  },
  sighterPillTextActive: {
    color: '#F5A623',
    fontFamily: 'monospace',
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  delBtn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delBtnText: {
    color: '#EF4444',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#6B7280',
    fontFamily: 'monospace',
    fontSize: 8.5,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#EF4444',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  doneBtn: {
    flex: 2,
    backgroundColor: '#00E5A0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#000000',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

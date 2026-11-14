// Target_Camera_App/src/components/SightAdjustmentModal.tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Shot, TargetTypeCode, TARGET_SPECS } from '../types/target';
import {
  calculateSightCorrection,
  calculateGroupAnalytics,
  calculateSeriesBreakdown,
} from '../utils/scoringEngine';

interface SightAdjustmentModalProps {
  visible: boolean;
  onClose: () => void;
  shots: Shot[];
  targetType: TargetTypeCode;
  laneId: string;
}

export function SightAdjustmentModal({
  visible,
  onClose,
  shots,
  targetType,
  laneId,
}: SightAdjustmentModalProps) {
  if (!visible) return null;

  const spec = TARGET_SPECS[targetType];
  const correction = calculateSightCorrection(shots, targetType);
  const analytics = calculateGroupAnalytics(shots);
  const series = calculateSeriesBreakdown(shots);

  const ratingColor =
    correction.tightnessRating === 'MATCH_GRADE'
      ? '#00E5A0'
      : correction.tightnessRating === 'EXCELLENT'
      ? '#38BDF8'
      : correction.tightnessRating === 'GOOD'
      ? '#FFB703'
      : '#EF4444';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>BALLISTIC COACH &amp; SIGHT ADVISOR</Text>
              <Text style={styles.subtitle}>
                Lane {laneId} • {spec.name} • {shots.length} Shots Analyzed
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Primary Sight Correction Card */}
            <View style={styles.advisorCard}>
              <View style={styles.advisorHeader}>
                <Text style={styles.advisorTag}>COACHING CORRECTION</Text>
                <View style={[styles.ratingPill, { borderColor: ratingColor }]}>
                  <Text style={[styles.ratingText, { color: ratingColor }]}>
                    {correction.tightnessRating.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <Text style={styles.adviceSummary}>{correction.adviceSummary}</Text>

              {/* Click Adjustments Grid */}
              <View style={styles.clicksGrid}>
                <View style={styles.clickItem}>
                  <Text style={styles.clickLabel}>WINDAGE (HORIZONTAL)</Text>
                  <Text style={[styles.clickValue, { color: correction.windageClicks > 0 ? '#FFB703' : '#00E5A0' }]}>
                    {correction.windageDirection === 'CENTER'
                      ? '★ ON CENTER'
                      : `${correction.windageClicks} CLICKS ${correction.windageDirection}`}
                  </Text>
                  <Text style={styles.clickSubtext}>
                    MPI offset: {correction.mpiX > 0 ? `+${correction.mpiX}` : correction.mpiX} mm
                  </Text>
                </View>

                <View style={styles.clickItem}>
                  <Text style={styles.clickLabel}>ELEVATION (VERTICAL)</Text>
                  <Text style={[styles.clickValue, { color: correction.elevationClicks > 0 ? '#FFB703' : '#00E5A0' }]}>
                    {correction.elevationDirection === 'CENTER'
                      ? '★ ON CENTER'
                      : `${correction.elevationClicks} CLICKS ${correction.elevationDirection}`}
                  </Text>
                  <Text style={styles.clickSubtext}>
                    MPI offset: {correction.mpiY > 0 ? `+${correction.mpiY}` : correction.mpiY} mm
                  </Text>
                </View>
              </View>
            </View>

            {/* Dispersion Analytics */}
            <Text style={styles.sectionTitle}>PRECISION DISPERSION &amp; METRICS</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>EXTREME SPREAD</Text>
                <Text style={styles.metricVal}>{analytics.extremeSpreadMm} mm</Text>
                <Text style={styles.metricHint}>Group Diameter</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>MEAN RADIUS</Text>
                <Text style={styles.metricVal}>{analytics.meanRadiusMm} mm</Text>
                <Text style={styles.metricHint}>Avg Shot Distance</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>MPI DRIFT</Text>
                <Text style={styles.metricVal}>{correction.mpiRadiusMm} mm</Text>
                <Text style={styles.metricHint}>Centroid to Dead 10</Text>
              </View>
            </View>

            {/* Series Breakdown (ISSF 10-Shot Series) */}
            <Text style={styles.sectionTitle}>ISSF MATCH SERIES BREAKDOWN</Text>
            {series.length === 0 ? (
              <Text style={styles.emptyText}>No series completed yet. Fire shots to record series.</Text>
            ) : (
              series.map((s) => (
                <View key={`series-${s.seriesNumber}`} style={styles.seriesRow}>
                  <View style={styles.seriesLeft}>
                    <Text style={styles.seriesTitle}>SERIES {s.seriesNumber}</Text>
                    <Text style={styles.seriesSub}>
                      {s.shots.length} shots • {s.innerTens} Inner 10s (★) • ES: {s.extremeSpreadMm}mm
                    </Text>
                  </View>
                  <View style={styles.seriesRight}>
                    <Text style={styles.seriesScore}>{s.decimalTotal.toFixed(1)}</Text>
                    <Text style={styles.seriesIntScore}>({s.integerTotal})</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.7}>
            <Text style={styles.doneBtnText}>CLOSE SIGHT ADVISOR</Text>
          </TouchableOpacity>
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
    maxHeight: '90%',
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
    marginBottom: 10,
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
  scroll: {
    flexGrow: 0,
  },
  advisorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 160, 0.25)',
    padding: 12,
    marginBottom: 12,
  },
  advisorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  advisorTag: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: '900',
    color: '#00E5A0',
    letterSpacing: 0.8,
  },
  ratingPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  ratingText: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: 'bold',
  },
  adviceSummary: {
    color: '#ECEEF4',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 16,
  },
  clicksGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  clickItem: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 15, 0.8)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  clickLabel: {
    color: '#9CA3AF',
    fontFamily: 'monospace',
    fontSize: 7.5,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  clickValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  clickSubtext: {
    color: '#6B7280',
    fontFamily: 'monospace',
    fontSize: 8,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricLabel: {
    color: '#9CA3AF',
    fontFamily: 'monospace',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricVal: {
    color: '#00E5A0',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  metricHint: {
    color: '#6B7280',
    fontFamily: 'monospace',
    fontSize: 7.5,
    marginTop: 2,
  },
  seriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  seriesLeft: {
    flex: 1,
  },
  seriesTitle: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  seriesSub: {
    color: '#9CA3AF',
    fontFamily: 'monospace',
    fontSize: 8,
    marginTop: 1,
  },
  seriesRight: {
    alignItems: 'flex-end',
  },
  seriesScore: {
    color: '#00E5A0',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '900',
  },
  seriesIntScore: {
    color: '#6B7280',
    fontFamily: 'monospace',
    fontSize: 8.5,
  },
  emptyText: {
    color: '#6B7280',
    fontFamily: 'monospace',
    fontSize: 9,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  doneBtn: {
    backgroundColor: '#00E5A0',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: {
    color: '#000000',
    fontFamily: 'monospace',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});


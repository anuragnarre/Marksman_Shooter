// Target_Camera_App/src/components/ShotStatsHud.tsx
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Shot } from '../types/target';
import { calculateGroupAnalytics } from '../utils/scoringEngine';

interface ShotStatsHudProps {
  shots: Shot[];
  onClearShots: () => void;
  onSimulateShot: () => void;
  onSimulateAcousticShot?: () => void;
  isCeasefireActive?: boolean;
}

export function ShotStatsHud({
  shots,
  onClearShots,
  onSimulateShot,
  onSimulateAcousticShot,
  isCeasefireActive = false,
}: ShotStatsHudProps) {
  const latestShot = shots[shots.length - 1];
  const analytics = calculateGroupAnalytics(shots);

  return (
    <View style={styles.hudContainer}>
      {/* Ceasefire Alert Banner if Range is Cold */}
      {isCeasefireActive && (
        <View style={styles.ceasefireBanner}>
          <Text style={styles.ceasefireText}>🚨 RANGE CEASEFIRE ORDERED — TARGET CAMERA FROZEN</Text>
        </View>
      )}

      {/* Main HUD Row */}
      <View style={styles.hudContent}>
        {/* Latest Shot Badge */}
        {latestShot ? (
          <View style={styles.latestShotCard}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>{latestShot.decimalScore.toFixed(1)}</Text>
              <View style={styles.scoreMeta}>
                <Text style={styles.innerTenLabel}>
                  {latestShot.isInnerTen ? '★ INNER 10' : `RING ${latestShot.score}`}
                </Text>
                <Text style={styles.clockLabel}>{latestShot.clock}</Text>
              </View>
            </View>

            {/* Acoustic Chronograph Pill */}
            {latestShot.acousticTriggered && latestShot.muzzleVelocityMps ? (
              <View style={styles.acousticPill}>
                <Text style={styles.acousticText}>
                  ⚡ {latestShot.muzzleVelocityMps} m/s ({latestShot.flightTimeMs} ms)
                </Text>
              </View>
            ) : null}

            <Text style={styles.offsetLabel}>
              r: {latestShot.radialDistanceMm}mm (x: {latestShot.xMm > 0 ? `+${latestShot.xMm}` : latestShot.xMm}, y: {latestShot.yMm > 0 ? `+${latestShot.yMm}` : latestShot.yMm})
            </Text>
          </View>
        ) : (
          <View style={styles.standbyCard}>
            <Text style={styles.standbyTitle}>AWAITING SHOT</Text>
            <Text style={styles.standbySubtitle}>Tap target, use optical camera, or phone mic trigger</Text>
          </View>
        )}

        {/* Aggregate Stats */}
        <View style={styles.statsSummary}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SHOTS</Text>
            <Text style={styles.statValue}>{shots.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AVG</Text>
            <Text style={styles.statValue}>{analytics.averageScore}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SPREAD</Text>
            <Text style={styles.statValue}>{analytics.extremeSpreadMm}mm</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onSimulateShot}>
          <Text style={styles.actionBtnText}>+ TEST SHOT</Text>
        </TouchableOpacity>
        {onSimulateAcousticShot && (
          <TouchableOpacity style={[styles.actionBtn, styles.acousticBtn]} onPress={onSimulateAcousticShot}>
            <Text style={[styles.actionBtnText, styles.acousticBtnText]}>🎤 ACOUSTIC TRIG</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={onClearShots}>
          <Text style={[styles.actionBtnText, styles.clearBtnText]}>CLEAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hudContainer: {
    backgroundColor: 'rgba(10, 15, 29, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ceasefireBanner: {
    backgroundColor: '#D32F2F',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  ceasefireText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  hudContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  latestShotCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 160, 0.3)',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00E5A0',
    fontVariant: ['tabular-nums'],
  },
  scoreMeta: {
    flex: 1,
  },
  innerTenLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clockLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  offsetLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  standbyCard: {
    flex: 1,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  standbyTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 'bold',
    fontSize: 12,
  },
  standbySubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  statsSummary: {
    flexDirection: 'row',
    gap: 6,
  },
  statBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 54,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
    borderWidth: 1,
    borderColor: '#00E5A0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#00E5A0',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  clearBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  acousticPill: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: '#0D9488',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  acousticText: {
    color: '#2DD4BF',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  acousticBtn: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: '#0D9488',
  },
  acousticBtnText: {
    color: '#2DD4BF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

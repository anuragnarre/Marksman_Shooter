// Target_Camera_App/src/components/ShotStatsHud.tsx
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CvFrameStats, Shot } from '../types/target';
import { calculateGroupAnalytics } from '../utils/scoringEngine';

interface ShotStatsHudProps {
  shots: Shot[];
  onClearShots: () => void;
  onSimulateShot: () => void;
  isMicArmed?: boolean;
  onToggleMicArmed?: () => void;
  isCeasefireActive?: boolean;
  isStreaming?: boolean;
  onToggleStreaming?: () => void;
  isAutoDetectActive?: boolean;
  onToggleAutoDetect?: () => void;
  onOpenSightAdvisor?: () => void;
  onOpenShotHistory?: () => void;
  isSighterMode?: boolean;
  onToggleSighterMode?: () => void;
  onOpenSessionExport?: () => void;
  cvStats?: CvFrameStats | null;
}

export function ShotStatsHud({
  shots,
  onClearShots,
  onSimulateShot,
  isMicArmed = false,
  onToggleMicArmed,
  isCeasefireActive = false,
  isStreaming = false,
  onToggleStreaming,
  isAutoDetectActive = false,
  onToggleAutoDetect,
  onOpenSightAdvisor,
  onOpenShotHistory,
  isSighterMode = false,
  onToggleSighterMode,
  onOpenSessionExport,
  cvStats = null,
}: ShotStatsHudProps) {
  const latestShot = shots[shots.length - 1];
  const analytics = calculateGroupAnalytics(shots);

  const centroidX =
    shots.length > 0
      ? (shots.reduce((acc, s) => acc + s.xMm, 0) / shots.length).toFixed(1)
      : '0.0';
  const centroidY =
    shots.length > 0
      ? (shots.reduce((acc, s) => acc + s.yMm, 0) / shots.length).toFixed(1)
      : '0.0';

  return (
    <View style={styles.hudContainer}>
      {isCeasefireActive && (
        <View style={styles.ceasefireBanner}>
          <Text style={styles.ceasefireText}>🚨 RANGE CEASEFIRE ORDERED — TARGET CAMERA FROZEN</Text>
        </View>
      )}

      {/* Main HUD Telemetry Card */}
      <View style={styles.hudContent}>
        {latestShot ? (
          <TouchableOpacity
            style={styles.latestShotCard}
            onPress={onOpenShotHistory}
            activeOpacity={0.8}
          >
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>{latestShot.decimalScore.toFixed(1)}</Text>
              <View style={styles.scoreMeta}>
                <View style={styles.shotBadgeRow}>
                  <Text style={styles.innerTenLabel}>
                    {latestShot.isInnerTen ? '★ X' : `R${latestShot.score}`}
                  </Text>
                  {latestShot.isSighter && (
                    <View style={styles.sighterTag}>
                      <Text style={styles.sighterTagText}>SIGHT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.clockLabel} numberOfLines={1}>
                  #{latestShot.shotNumber} • {latestShot.clock}
                </Text>
              </View>
            </View>

            {latestShot.muzzleVelocityMps ? (
              <View style={styles.acousticPill}>
                <Text style={styles.acousticText}>
                  ⚡ {latestShot.muzzleVelocityMps} m/s ({latestShot.flightTimeMs} ms)
                </Text>
              </View>
            ) : null}

            <Text style={styles.offsetLabel} numberOfLines={1}>
              r:{latestShot.radialDistanceMm}mm (x:{latestShot.xMm > 0 ? `+${latestShot.xMm}` : latestShot.xMm}, y:
              {latestShot.yMm > 0 ? `+${latestShot.yMm}` : latestShot.yMm})
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.standbyCard}>
            <Text style={styles.standbyTitle}>
              {cvStats?.baselineLocked ? 'CV BASELINE LOCKED' : 'AWAITING SHOT'}
            </Text>
            <Text style={styles.standbySubtitle} numberOfLines={2}>
              {cvStats
                ? `Luma ${cvStats.lumaAvg.toFixed(0)} • Contrast ${cvStats.contrastScore.toFixed(0)}% • Sharp ${cvStats.sharpnessScore.toFixed(0)}%`
                : 'Tap target, arm LIVE CV, or arm MIC trigger'}
            </Text>
          </View>
        )}

        <View style={styles.statsGroupCol}>
          <TouchableOpacity
            style={styles.statsSummary}
            onPress={onOpenSightAdvisor}
            activeOpacity={0.8}
          >
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SHOTS</Text>
              <Text style={styles.statValue}>{shots.length}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AVG</Text>
              <Text style={styles.statValue}>{analytics.averageScore.toFixed(1)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ES</Text>
              <Text
                style={styles.statValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {analytics.extremeSpreadMm.toFixed(1)}mm
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MPI</Text>
              <Text style={styles.statSubValue} numberOfLines={1} adjustsFontSizeToFit>
                {centroidX}/{centroidY}
              </Text>
            </View>
          </TouchableOpacity>

          {shots.length > 0 && (
            <TouchableOpacity style={styles.clearQuickBtn} onPress={onClearShots} activeOpacity={0.75}>
              <Text style={styles.clearQuickText}>🧹 CLEAR {shots.length} SHOTS</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Clean 2-Row Action Deck (4 balanced buttons per row) */}
      <View style={styles.buttonRow}>
        {onToggleStreaming && (
          <TouchableOpacity
            style={[styles.actionBtn, isStreaming ? styles.liveBtn : styles.streamBtn]}
            onPress={onToggleStreaming}
            disabled={isCeasefireActive}
            activeOpacity={0.75}
          >
            <Text style={[styles.actionBtnText, isStreaming ? styles.liveBtnText : styles.streamBtnText]}>
              {isStreaming ? '🔴 LIVE' : '📹 STREAM'}
            </Text>
          </TouchableOpacity>
        )}

        {onToggleAutoDetect && (
          <TouchableOpacity
            style={[styles.actionBtn, isAutoDetectActive ? styles.autoCvActiveBtn : styles.autoCvBtn]}
            onPress={onToggleAutoDetect}
            disabled={isCeasefireActive}
            activeOpacity={0.75}
          >
            <Text style={[styles.actionBtnText, isAutoDetectActive ? styles.autoCvActiveText : styles.autoCvText]}>
              {isAutoDetectActive ? '● CV ON' : '🤖 LIVE CV'}
            </Text>
          </TouchableOpacity>
        )}

        {onToggleMicArmed && (
          <TouchableOpacity
            style={[styles.actionBtn, isMicArmed ? styles.micArmedBtn : styles.acousticBtn]}
            onPress={onToggleMicArmed}
            disabled={isCeasefireActive}
            activeOpacity={0.75}
          >
            <Text style={[styles.actionBtnText, isMicArmed ? styles.micArmedText : styles.acousticBtnText]}>
              {isMicArmed ? '⚡ MIC ARM' : '🎤 MIC OFF'}
            </Text>
          </TouchableOpacity>
        )}

        {onToggleSighterMode && (
          <TouchableOpacity
            style={[styles.actionBtn, isSighterMode ? styles.sighterModeActive : styles.matchModeActive]}
            onPress={onToggleSighterMode}
            activeOpacity={0.75}
          >
            <Text style={[styles.actionBtnText, isSighterMode ? styles.sighterModeText : styles.matchModeText]}>
              {isSighterMode ? '🔶 SIGHTER' : '🟢 MATCH'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onSimulateShot}
          disabled={isCeasefireActive}
          activeOpacity={0.75}
        >
          <Text style={styles.actionBtnText}>+ TEST HIT</Text>
        </TouchableOpacity>

        {onOpenSightAdvisor && (
          <TouchableOpacity style={[styles.actionBtn, styles.coachBtn]} onPress={onOpenSightAdvisor} activeOpacity={0.75}>
            <Text style={[styles.actionBtnText, styles.coachBtnText]}>🎯 COACH</Text>
          </TouchableOpacity>
        )}

        {onOpenShotHistory && (
          <TouchableOpacity style={[styles.actionBtn, styles.historyBtn]} onPress={onOpenShotHistory} activeOpacity={0.75}>
            <Text style={[styles.actionBtnText, styles.historyBtnText]}>📋 LOG ({shots.length})</Text>
          </TouchableOpacity>
        )}

        {onOpenSessionExport && (
          <TouchableOpacity style={[styles.actionBtn, styles.exportBtn]} onPress={onOpenSessionExport} activeOpacity={0.75}>
            <Text style={[styles.actionBtnText, styles.exportBtnText]}>📤 EXPORT</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hudContainer: {
    backgroundColor: 'rgba(7, 9, 15, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 10,
  },
  ceasefireBanner: {
    backgroundColor: '#D32F2F',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  ceasefireText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  hudContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 6,
  },
  latestShotCard: {
    flex: 1,
    minHeight: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 160, 0.35)',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreNumber: {
    fontSize: 21,
    fontWeight: '900',
    color: '#00E5A0',
    fontVariant: ['tabular-nums'],
  },
  scoreMeta: {
    flex: 1,
  },
  shotBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  innerTenLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sighterTag: {
    backgroundColor: 'rgba(245, 166, 35, 0.2)',
    borderColor: '#F5A623',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 0.5,
  },
  sighterTagText: {
    color: '#F5A623',
    fontSize: 7.5,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  clockLabel: {
    fontSize: 8.5,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  offsetLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  standbyCard: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
  },
  standbyTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: 'bold',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  standbySubtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 8.5,
    marginTop: 2,
  },
  statsGroupCol: {
    justifyContent: 'space-between',
    gap: 4,
  },
  statsSummary: {
    flexDirection: 'row',
    gap: 4,
  },
  statBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 40,
  },
  statLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  statSubValue: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#A0A6B5',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  clearQuickBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    borderRadius: 5,
    paddingVertical: 2.5,
    alignItems: 'center',
  },
  clearQuickText: {
    color: '#FCA5A5',
    fontFamily: 'monospace',
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  actionBtn: {
    backgroundColor: 'rgba(0, 229, 160, 0.12)',
    borderWidth: 1,
    borderColor: '#00E5A0',
    paddingHorizontal: 4,
    paddingVertical: 6.5,
    borderRadius: 7,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#00E5A0',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  acousticBtn: {
    backgroundColor: 'rgba(13, 148, 136, 0.14)',
    borderColor: '#0D9488',
  },
  acousticBtnText: {
    color: '#5EEAD4',
    fontSize: 9,
    fontWeight: 'bold',
  },
  micArmedBtn: {
    backgroundColor: 'rgba(245, 166, 35, 0.24)',
    borderColor: '#F5A623',
  },
  micArmedText: {
    color: '#FCD34D',
    fontSize: 9,
    fontWeight: '900',
  },
  streamBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderColor: '#38BDF8',
  },
  streamBtnText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  liveBtn: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  liveBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  autoCvBtn: {
    backgroundColor: 'rgba(245, 166, 35, 0.14)',
    borderColor: '#F5A623',
  },
  autoCvText: {
    color: '#F5A623',
    fontSize: 9,
    fontWeight: 'bold',
  },
  autoCvActiveBtn: {
    backgroundColor: 'rgba(0, 229, 160, 0.26)',
    borderColor: '#00E5A0',
  },
  autoCvActiveText: {
    color: '#00E5A0',
    fontSize: 9,
    fontWeight: '900',
  },
  sighterModeActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.2)',
    borderColor: '#F5A623',
  },
  sighterModeText: {
    color: '#F5A623',
    fontSize: 9,
    fontWeight: '900',
  },
  matchModeActive: {
    backgroundColor: 'rgba(0, 229, 160, 0.12)',
    borderColor: '#00E5A0',
  },
  matchModeText: {
    color: '#00E5A0',
    fontSize: 9,
    fontWeight: '900',
  },
  coachBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: '#A855F7',
  },
  coachBtnText: {
    color: '#D8B4FE',
    fontSize: 9,
    fontWeight: '900',
  },
  historyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  historyBtnText: {
    color: '#ECEEF4',
    fontSize: 9,
    fontWeight: 'bold',
  },
  acousticPill: {
    backgroundColor: 'rgba(13, 148, 136, 0.22)',
    borderColor: '#0D9488',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  acousticText: {
    color: '#2DD4BF',
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  exportBtn: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
    borderColor: '#00E5A0',
  },
  exportBtnText: {
    color: '#00E5A0',
    fontSize: 9,
    fontWeight: '900',
  },
});

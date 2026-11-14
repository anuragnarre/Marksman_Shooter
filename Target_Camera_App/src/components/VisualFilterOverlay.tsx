// Target_Camera_App/src/components/VisualFilterOverlay.tsx
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { CalibrationCorners, CvFrameStats, Shot, TargetTypeCode } from '../types/target';
import { mapTargetMmToScreenPoint } from '../utils/scoringEngine';

export type VisualFilterMode = 'NATURAL' | 'FALSE_COLOR' | 'HIGH_CONTRAST' | 'MONO_THRESHOLD';

interface VisualFilterOverlayProps {
  filterMode: VisualFilterMode;
  corners: CalibrationCorners;
  targetType: TargetTypeCode;
  targetZoom?: number;
  shots?: Shot[];
  mmToPx?: number;
  topOffset?: number;
  cvStats?: CvFrameStats | null;
  isCalibrationMode?: boolean;
}

export function VisualFilterOverlay({
  filterMode,
  corners,
  targetType,
  targetZoom = 1,
  shots = [],
  mmToPx = 1,
  topOffset = 122,
  cvStats = null,
  isCalibrationMode = false,
}: VisualFilterOverlayProps) {
  if (filterMode === 'NATURAL') return null;

  const projCenter = mapTargetMmToScreenPoint(0, 0, corners, targetType);
  const topW = Math.hypot(corners.topRight.x - corners.topLeft.x, corners.topRight.y - corners.topLeft.y);
  const bottomW = Math.hypot(corners.bottomRight.x - corners.bottomLeft.x, corners.bottomRight.y - corners.bottomLeft.y);
  const leftH = Math.hypot(corners.bottomLeft.x - corners.topLeft.x, corners.bottomLeft.y - corners.topLeft.y);
  const rightH = Math.hypot(corners.bottomRight.x - corners.topRight.x, corners.bottomRight.y - corners.topRight.y);

  const avgWidth = (topW + bottomW) / 2;
  const avgHeight = (leftH + rightH) / 2;
  const rx = (avgWidth / 2) * targetZoom;
  const ry = (avgHeight / 2) * targetZoom;
  const targetRadiusPx = Math.max(24, (rx + ry) / 2);
  const scaleXRatio = avgWidth > 0 ? avgWidth / Math.max(1, (avgWidth + avgHeight) / 2) : 1;
  const scaleYRatio = avgHeight > 0 ? avgHeight / Math.max(1, (avgWidth + avgHeight) / 2) : 1;
  const dxTop = corners.topRight.x - corners.topLeft.x;
  const dyTop = corners.topRight.y - corners.topLeft.y;
  const quadTiltDeg = Math.atan2(dyTop, dxTop) * (180 / Math.PI);

  const liveMetricsLine = cvStats
    ? `L${cvStats.lumaAvg.toFixed(0)} • C${cvStats.contrastScore.toFixed(0)}% • S${cvStats.sharpnessScore.toFixed(0)}%`
    : 'STANDBY';

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {filterMode === 'FALSE_COLOR' && (
        <>
          <View style={[StyleSheet.absoluteFill, styles.falseColorAmbient]} />
          <View
            style={[
              styles.heatTargetZone,
              {
                left: projCenter.x - targetRadiusPx,
                top: projCenter.y - targetRadiusPx,
                width: targetRadiusPx * 2,
                height: targetRadiusPx * 2,
                borderRadius: targetRadiusPx,
                transform: [
                  { rotate: `${quadTiltDeg}deg` },
                  { scaleX: scaleXRatio },
                  { scaleY: scaleYRatio },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.heatCenterHotspot,
                {
                  width: targetRadiusPx,
                  height: targetRadiusPx,
                  borderRadius: targetRadiusPx * 0.5,
                },
              ]}
            />
          </View>

          {shots.slice(-6).map((shot) => {
            const p = mapTargetMmToScreenPoint(shot.xMm, shot.yMm, corners, targetType);
            const shotX = projCenter.x + (p.x - projCenter.x) * targetZoom;
            const shotY = projCenter.y + (p.y - projCenter.y) * targetZoom;
            const haloSize = Math.max(24, shot.caliberMm * mmToPx * targetZoom * 3.5);
            return (
              <View
                key={`thermal-${shot.id}`}
                style={[
                  styles.thermalImpactHalo,
                  {
                    left: shotX - haloSize / 2,
                    top: shotY - haloSize / 2,
                    width: haloSize,
                    height: haloSize,
                    borderRadius: haloSize / 2,
                  },
                ]}
              />
            );
          })}

          {!isCalibrationMode && (
            <View style={[styles.legendContainer, { top: topOffset }]}>
              <Text style={styles.legendTitle} numberOfLines={1}>
                THERM • {liveMetricsLine}
              </Text>
              <View style={styles.spectrumBar}>
                <View style={[styles.spectrumSegment, { backgroundColor: '#1A237E' }]} />
                <View style={[styles.spectrumSegment, { backgroundColor: '#00B0FF' }]} />
                <View style={[styles.spectrumSegment, { backgroundColor: '#00E676' }]} />
                <View style={[styles.spectrumSegment, { backgroundColor: '#FFD600' }]} />
                <View style={[styles.spectrumSegment, { backgroundColor: '#FF1744' }]} />
              </View>
            </View>
          )}
        </>
      )}

      {filterMode === 'HIGH_CONTRAST' && (
        <>
          <View style={[StyleSheet.absoluteFill, styles.highContrastTint]} />
          <View
            style={[
              styles.edgeTargetBox,
              {
                left: projCenter.x - targetRadiusPx,
                top: projCenter.y - targetRadiusPx,
                width: targetRadiusPx * 2,
                height: targetRadiusPx * 2,
                borderRadius: targetRadiusPx,
                transform: [
                  { rotate: `${quadTiltDeg}deg` },
                  { scaleX: scaleXRatio },
                  { scaleY: scaleYRatio },
                ],
              },
            ]}
          />
          {!isCalibrationMode && (
            <View style={[styles.filterBadge, { top: topOffset }]}>
              <Text style={styles.filterBadgeText} numberOfLines={1}>
                EDGE • {liveMetricsLine}
              </Text>
            </View>
          )}
        </>
      )}

      {filterMode === 'MONO_THRESHOLD' && (
        <>
          <View style={[StyleSheet.absoluteFill, styles.monoTint]} />
          <View
            style={[
              styles.monoBullseyeMask,
              {
                left: projCenter.x - targetRadiusPx * 0.42,
                top: projCenter.y - targetRadiusPx * 0.42,
                width: targetRadiusPx * 0.84,
                height: targetRadiusPx * 0.84,
                borderRadius: targetRadiusPx * 0.42,
                transform: [
                  { rotate: `${quadTiltDeg}deg` },
                  { scaleX: scaleXRatio },
                  { scaleY: scaleYRatio },
                ],
              },
            ]}
          />
          {!isCalibrationMode && (
            <View style={[styles.filterBadge, { top: topOffset }]}>
              <Text style={styles.filterBadgeText} numberOfLines={1}>
                MONO • {liveMetricsLine}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 8,
  },
  falseColorAmbient: {
    backgroundColor: 'rgba(0, 20, 60, 0.25)',
  },
  heatTargetZone: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 214, 0, 0.45)',
    backgroundColor: 'rgba(0, 180, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatCenterHotspot: {
    backgroundColor: 'rgba(255, 23, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 0, 0.45)',
  },
  thermalImpactHalo: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 23, 68, 0.7)',
    backgroundColor: 'rgba(255, 214, 0, 0.25)',
  },
  legendContainer: {
    position: 'absolute',
    right: 10,
    backgroundColor: 'rgba(7, 9, 15, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxWidth: 152,
  },
  legendTitle: {
    fontFamily: 'monospace',
    fontSize: 7,
    fontWeight: '900',
    color: '#ECEEF4',
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  spectrumBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  spectrumSegment: {
    flex: 1,
    height: '100%',
  },
  legendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  legendText: {
    fontFamily: 'monospace',
    fontSize: 6.5,
    color: '#A0A6B5',
  },
  highContrastTint: {
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
  },
  edgeTargetBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00E5A0',
    backgroundColor: 'rgba(0, 229, 160, 0.05)',
  },
  monoTint: {
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  monoBullseyeMask: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  filterBadge: {
    position: 'absolute',
    right: 10,
    backgroundColor: 'rgba(7, 9, 15, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxWidth: 152,
  },
  filterBadgeText: {
    fontFamily: 'monospace',
    fontSize: 7.5,
    fontWeight: '800',
    color: '#00E5A0',
    letterSpacing: 0.3,
  },
});

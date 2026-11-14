// Target_Camera_App/src/components/TargetOverlay.tsx
import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  TouchableOpacity,
} from 'react-native';
import {
  CalibrationCorners,
  Point2D,
  Shot,
  TARGET_SPECS,
  TargetTypeCode,
} from '../types/target';
import {
  calculateSightCorrection,
  calculateTargetQuadGeometry,
  mapTargetMmToScreenPoint,
} from '../utils/scoringEngine';

interface TargetOverlayProps {
  width: number;
  height: number;
  targetType: TargetTypeCode;
  corners: CalibrationCorners;
  onUpdateCorners: (corners: CalibrationCorners) => void;
  isCalibrationMode: boolean;
  onExitCalibration?: () => void;
  shots: Shot[];
  onTargetPress?: (screenX: number, screenY: number) => void;
  reticleMode?: 'full' | 'wireframe' | 'crosshair' | 'hidden';
  selectedShotId?: string | null;
  onSelectShot?: (shotId: string | null) => void;
  onToggleSighter?: (shotId: string) => void;
  onDeleteShot?: (shotId: string) => void;
  onSnapCenterQuad?: () => void;
  onAutoDetectTarget?: () => void;
  onLockBaseline?: () => void;
  isDetectingTarget?: boolean;
  baselineLocked?: boolean;
  targetZoom?: number;
  topOffset?: number;
  bottomReservedPx?: number;
}

function QuadLine({
  p1,
  p2,
  color,
  thickness = 2,
  opacity = 0.85,
}: {
  p1: Point2D;
  p2: Point2D;
  color: string;
  thickness?: number;
  opacity?: number;
}) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return null;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: midX - length / 2,
        top: midY - thickness / 2,
        width: length,
        height: thickness,
        backgroundColor: color,
        opacity,
        transform: [{ rotate: `${angleDeg}deg` }],
      }}
    />
  );
}

export function TargetOverlay({
  width,
  height,
  targetType,
  corners,
  onUpdateCorners,
  isCalibrationMode,
  onExitCalibration,
  shots,
  onTargetPress,
  reticleMode = 'wireframe',
  selectedShotId = null,
  onSelectShot,
  onToggleSighter,
  onDeleteShot,
  onSnapCenterQuad,
  onAutoDetectTarget,
  onLockBaseline,
  isDetectingTarget = false,
  baselineLocked = false,
  targetZoom = 1,
  topOffset = 122,
  bottomReservedPx = 195,
}: TargetOverlayProps) {
  const spec = TARGET_SPECS[targetType];

  // Keep latest props in a ref so PanResponders NEVER close over stale state
  const liveRef = useRef({
    width,
    height,
    corners,
    onUpdateCorners,
    isCalibrationMode,
    topOffset,
    bottomReservedPx,
  });
  liveRef.current = {
    width,
    height,
    corners,
    onUpdateCorners,
    isCalibrationMode,
    topOffset,
    bottomReservedPx,
  };

  const projCenter = mapTargetMmToScreenPoint(0, 0, corners, targetType);

  const topW = Math.hypot(corners.topRight.x - corners.topLeft.x, corners.topRight.y - corners.topLeft.y);
  const bottomW = Math.hypot(corners.bottomRight.x - corners.bottomLeft.x, corners.bottomRight.y - corners.bottomLeft.y);
  const leftH = Math.hypot(corners.bottomLeft.x - corners.topLeft.x, corners.bottomLeft.y - corners.topLeft.y);
  const rightH = Math.hypot(corners.bottomRight.x - corners.topRight.x, corners.bottomRight.y - corners.topRight.y);

  const avgW = (topW + bottomW) / 2;
  const avgH = (leftH + rightH) / 2;
  const targetDiameterPx = (avgW + avgH) / 2;
  const targetRadiusPx = targetDiameterPx / 2;
  const quadTiltDeg =
    (Math.atan2(corners.topRight.y - corners.topLeft.y, Math.max(1, corners.topRight.x - corners.topLeft.x)) * 180) /
    Math.PI;

  const quadGeometry = calculateTargetQuadGeometry(corners);

  const startCornersRef = useRef<CalibrationCorners>(corners);

  const createCornerPanResponder = (cornerKey: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => liveRef.current.isCalibrationMode,
      onMoveShouldSetPanResponder: () => liveRef.current.isCalibrationMode,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startCornersRef.current = {
          ...liveRef.current.corners,
          topLeft: { ...liveRef.current.corners.topLeft },
          topRight: { ...liveRef.current.corners.topRight },
          bottomRight: { ...liveRef.current.corners.bottomRight },
          bottomLeft: { ...liveRef.current.corners.bottomLeft },
        };
      },
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const {
          isCalibrationMode: active,
          width: w,
          height: h,
          topOffset: minTop,
          bottomReservedPx: minBottom,
          onUpdateCorners: update,
        } = liveRef.current;
        if (!active) return;

        const base = startCornersRef.current;
        const startPos = base[cornerKey];
        const minY = Math.max(90, minTop - 10);
        const maxY = Math.max(minY + 40, h - minBottom);
        const newX = Math.max(14, Math.min(w - 14, startPos.x + gestureState.dx));
        const newY = Math.max(minY, Math.min(maxY, startPos.y + gestureState.dy));
        update({
          ...base,
          [cornerKey]: { x: newX, y: newY },
          isCalibrated: true,
        });
      },
    });

  const createCenterMovePanResponder = () =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => liveRef.current.isCalibrationMode,
      onMoveShouldSetPanResponder: () => liveRef.current.isCalibrationMode,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startCornersRef.current = {
          ...liveRef.current.corners,
          topLeft: { ...liveRef.current.corners.topLeft },
          topRight: { ...liveRef.current.corners.topRight },
          bottomRight: { ...liveRef.current.corners.bottomRight },
          bottomLeft: { ...liveRef.current.corners.bottomLeft },
        };
      },
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const {
          isCalibrationMode: active,
          width: w,
          height: h,
          topOffset: minTop,
          bottomReservedPx: minBottom,
          onUpdateCorners: update,
        } = liveRef.current;
        if (!active) return;

        const base = startCornersRef.current;
        const pts = [base.topLeft, base.topRight, base.bottomRight, base.bottomLeft];
        const minX = Math.min(...pts.map((p) => p.x));
        const maxX = Math.max(...pts.map((p) => p.x));
        const minY = Math.min(...pts.map((p) => p.y));
        const maxY = Math.max(...pts.map((p) => p.y));

        const boundMinY = Math.max(85, minTop - 10);
        const boundMaxY = Math.max(boundMinY + 60, h - minBottom);

        const clampedDx = Math.max(12 - minX, Math.min(w - 12 - maxX, gestureState.dx));
        const clampedDy = Math.max(boundMinY - minY, Math.min(boundMaxY - maxY, gestureState.dy));

        update({
          topLeft: { x: base.topLeft.x + clampedDx, y: base.topLeft.y + clampedDy },
          topRight: { x: base.topRight.x + clampedDx, y: base.topRight.y + clampedDy },
          bottomRight: { x: base.bottomRight.x + clampedDx, y: base.bottomRight.y + clampedDy },
          bottomLeft: { x: base.bottomLeft.x + clampedDx, y: base.bottomLeft.y + clampedDy },
          isCalibrated: true,
        });
      },
    });

  const tlResponder = useRef(createCornerPanResponder('topLeft')).current;
  const trResponder = useRef(createCornerPanResponder('topRight')).current;
  const brResponder = useRef(createCornerPanResponder('bottomRight')).current;
  const blResponder = useRef(createCornerPanResponder('bottomLeft')).current;
  const moveAllResponder = useRef(createCenterMovePanResponder()).current;

  const baseMmToPx = targetRadiusPx / (spec.totalDiameterMm / 2);
  const effectiveMmToPx = baseMmToPx * targetZoom;
  const effectiveTargetRadiusPx = targetRadiusPx * targetZoom;
  const effectiveTargetDiameterPx = targetDiameterPx * targetZoom;
  const scaleXRatio = targetDiameterPx > 0 ? avgW / targetDiameterPx : 1;
  const scaleYRatio = targetDiameterPx > 0 ? avgH / targetDiameterPx : 1;

  const getZoomedShotScreenPos = (xMm: number, yMm: number): Point2D => {
    const p = mapTargetMmToScreenPoint(xMm, yMm, corners, targetType);
    return {
      x: projCenter.x + (p.x - projCenter.x) * targetZoom,
      y: projCenter.y + (p.y - projCenter.y) * targetZoom,
    };
  };

  const handleTouch = (evt: GestureResponderEvent) => {
    if (isCalibrationMode) return;
    const { locationX, locationY } = evt.nativeEvent;

    // 1. Check if tapping an existing shot marker to inspect/edit instead of duplicating
    if (onSelectShot) {
      let nearestShot: Shot | null = null;
      let nearestDist = 26;
      for (const s of shots) {
        const sp = getZoomedShotScreenPos(s.xMm, s.yMm);
        const d = Math.hypot(sp.x - locationX, sp.y - locationY);
        if (d < nearestDist) {
          nearestDist = d;
          nearestShot = s;
        }
      }
      if (nearestShot) {
        onSelectShot(nearestShot.id === selectedShotId ? null : nearestShot.id);
        return;
      }
    }

    // Dismiss open callout if user tapped empty space while inspecting
    if (selectedShotId && onSelectShot) {
      onSelectShot(null);
      return;
    }

    // Ignore accidental touches near HUD edges
    if (locationY < topOffset - 6 || locationY > height - bottomReservedPx) {
      return;
    }

    if (onTargetPress) {
      const unscaledX = projCenter.x + (locationX - projCenter.x) / targetZoom;
      const unscaledY = projCenter.y + (locationY - projCenter.y) / targetZoom;
      onTargetPress(unscaledX, unscaledY);
    }
  };

  const confColor =
    quadGeometry.confidencePercent >= 92
      ? '#00E5A0'
      : quadGeometry.confidencePercent >= 75
      ? '#FFB703'
      : '#EF4444';

  const selectedShot = shots.find((s) => s.id === selectedShotId);
  const selectedPos = selectedShot ? getZoomedShotScreenPos(selectedShot.xMm, selectedShot.yMm) : null;

  // MPI Centroid overlay when 2+ shots exist
  const correction = shots.length >= 2 ? calculateSightCorrection(shots, targetType) : null;
  const mpiPos = correction ? getZoomedShotScreenPos(correction.mpiX, correction.mpiY) : null;

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.root, { width, height }]}
      onStartShouldSetResponder={() => !isCalibrationMode}
      onResponderRelease={handleTouch}
      pointerEvents={isCalibrationMode ? 'box-none' : 'auto'}
    >
      {/* Subtle Live Quad Frame Outline even during live firing when calibrated */}
      {reticleMode !== 'hidden' && !isCalibrationMode && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <QuadLine p1={corners.topLeft} p2={corners.topRight} color="rgba(0, 229, 160, 0.28)" thickness={1} />
          <QuadLine p1={corners.topRight} p2={corners.bottomRight} color="rgba(0, 229, 160, 0.28)" thickness={1} />
          <QuadLine p1={corners.bottomRight} p2={corners.bottomLeft} color="rgba(0, 229, 160, 0.28)" thickness={1} />
          <QuadLine p1={corners.bottomLeft} p2={corners.topLeft} color="rgba(0, 229, 160, 0.28)" thickness={1} />
        </View>
      )}

      {/* Concentric Target Reticle Rings aligned to projective center & aspect */}
      {reticleMode !== 'hidden' && (
        <View
          pointerEvents="none"
          style={[
            styles.targetContainer,
            {
              left: projCenter.x - effectiveTargetRadiusPx,
              top: projCenter.y - effectiveTargetRadiusPx,
              width: effectiveTargetDiameterPx,
              height: effectiveTargetDiameterPx,
              transform: [
                { rotate: `${quadTiltDeg}deg` },
                { scaleX: scaleXRatio },
                { scaleY: scaleYRatio },
              ],
            },
          ]}
        >
          {reticleMode !== 'crosshair' &&
            spec.rings
              .slice()
              .reverse()
              .map((r) => {
                const radiusPx = r.radiusMm * effectiveMmToPx;
                const isBullseye = r.radiusMm * 2 <= spec.bullseyeDiameterMm;
                const isBullseyePerimeter = Math.abs(r.radiusMm * 2 - spec.bullseyeDiameterMm) < 4;

                if (
                  reticleMode === 'wireframe' &&
                  !isBullseyePerimeter &&
                  r.ring !== 10 &&
                  r.ring !== 1 &&
                  r.ring !== 7 &&
                  r.ring !== 9
                ) {
                  return null;
                }

                return (
                  <View
                    key={`ring-${r.ring}`}
                    style={[
                      styles.ringCircle,
                      {
                        width: radiusPx * 2,
                        height: radiusPx * 2,
                        borderRadius: radiusPx,
                        backgroundColor: 'transparent',
                        borderWidth: isBullseyePerimeter ? 1.5 : 1,
                        borderColor: isBullseyePerimeter
                          ? '#00E5A0'
                          : isBullseye
                          ? 'rgba(0, 229, 160, 0.45)'
                          : 'rgba(255, 255, 255, 0.28)',
                      },
                    ]}
                  >
                    {r.ring <= 8 && radiusPx > 22 && <Text style={styles.ringLabel}>{r.ring}</Text>}
                  </View>
                );
              })}

          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />
          <View
            style={[
              styles.innerTenDot,
              {
                width: Math.max(5, spec.innerTenRadiusMm * effectiveMmToPx * 2),
                height: Math.max(5, spec.innerTenRadiusMm * effectiveMmToPx * 2),
                borderRadius: Math.max(2.5, spec.innerTenRadiusMm * effectiveMmToPx),
              },
            ]}
          />
        </View>
      )}

      {/* Mean Point of Impact (MPI) Group Centroid Crosshair */}
      {mpiPos && reticleMode !== 'hidden' && (
        <View
          pointerEvents="none"
          style={[
            styles.mpiMarker,
            { left: mpiPos.x - 10, top: mpiPos.y - 10 },
          ]}
        >
          <View style={styles.mpiH} />
          <View style={styles.mpiV} />
          <Text style={styles.mpiLabel}>MPI</Text>
        </View>
      )}

      {/* Projected Bullet Hole Markers */}
      {shots.map((shot, idx) => {
        const pos = getZoomedShotScreenPos(shot.xMm, shot.yMm);
        const isLatest = idx === shots.length - 1;
        const isSelected = shot.id === selectedShotId;

        let dotColor = '#00E5A0';
        if (shot.isSighter) dotColor = '#F5A623';
        else if (shot.score === 9) dotColor = '#00B4D8';
        else if (shot.score === 8) dotColor = '#FFB703';
        else if (shot.score < 8) dotColor = '#EF4444';

        const bulletDiameterPx = Math.max(15, shot.caliberMm * effectiveMmToPx);
        const rubRingPx = bulletDiameterPx * 1.35;

        return (
          <View
            key={shot.id}
            pointerEvents="none"
            style={[
              styles.shotMarker,
              {
                left: pos.x - rubRingPx / 2,
                top: pos.y - rubRingPx / 2,
                width: rubRingPx,
                height: rubRingPx,
                borderRadius: rubRingPx / 2,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderColor: dotColor,
                borderWidth: shot.isSighter ? 1.5 : 1,
              },
              isLatest && styles.latestShotGlow,
              isSelected && styles.selectedShotGlow,
            ]}
          >
            <View
              style={[
                styles.leadPunchHole,
                {
                  width: bulletDiameterPx,
                  height: bulletDiameterPx,
                  borderRadius: bulletDiameterPx / 2,
                  backgroundColor: dotColor,
                },
              ]}
            >
              <Text style={styles.shotScoreBadge}>
                {shot.isSighter ? 'S' : shot.isInnerTen ? '★' : shot.shotNumber}
              </Text>
            </View>

            {isLatest && (
              <View
                style={[
                  styles.pulseRing,
                  {
                    borderColor: dotColor,
                    width: rubRingPx * 1.8,
                    height: rubRingPx * 1.8,
                    borderRadius: rubRingPx * 0.9,
                    top: -(rubRingPx * 0.4),
                    left: -(rubRingPx * 0.4),
                  },
                ]}
              />
            )}
          </View>
        );
      })}

      {/* Interactive Selected Shot Inspector Callout */}
      {selectedShot && selectedPos && !isCalibrationMode && (
        <View
          style={[
            styles.tooltipCallout,
            {
              left: Math.max(12, Math.min(width - 216, selectedPos.x - 100)),
              top: Math.max(topOffset + 24, Math.min(height - bottomReservedPx - 80, selectedPos.y - 78)),
            },
          ]}
        >
          <View style={styles.tooltipRow}>
            <Text style={styles.tooltipTitle}>
              SHOT #{selectedShot.shotNumber} {selectedShot.isSighter ? '(SIGHT)' : ''}
            </Text>
            <Text style={styles.tooltipScore}>
              {selectedShot.decimalScore.toFixed(1)} {selectedShot.isInnerTen ? '★' : ''}
            </Text>
          </View>
          <Text style={styles.tooltipDetail}>
            {selectedShot.clock} • r:{selectedShot.radialDistanceMm}mm •{' '}
            {selectedShot.muzzleVelocityMps ? `${selectedShot.muzzleVelocityMps}m/s` : 'Optical'}
          </Text>
          <View style={styles.tooltipActions}>
            {onToggleSighter && (
              <TouchableOpacity
                style={styles.tooltipBtn}
                onPress={() => onToggleSighter(selectedShot.id)}
              >
                <Text style={styles.tooltipBtnText}>
                  {selectedShot.isSighter ? 'SET MATCH' : 'MARK SIGHTER'}
                </Text>
              </TouchableOpacity>
            )}
            {onDeleteShot && (
              <TouchableOpacity
                style={[styles.tooltipBtn, styles.tooltipDelBtn]}
                onPress={() => onDeleteShot(selectedShot.id)}
              >
                <Text style={styles.tooltipDelText}>DELETE</Text>
              </TouchableOpacity>
            )}
            {onSelectShot && (
              <TouchableOpacity
                style={styles.tooltipCloseBtn}
                onPress={() => onSelectShot(null)}
              >
                <Text style={styles.tooltipBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Interactive 4-Corner Perspective Calibration Workspace */}
      {isCalibrationMode && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* True perspective 4-edge wireframe + diagonals */}
          <QuadLine p1={corners.topLeft} p2={corners.topRight} color={confColor} thickness={2} />
          <QuadLine p1={corners.topRight} p2={corners.bottomRight} color={confColor} thickness={2} />
          <QuadLine p1={corners.bottomRight} p2={corners.bottomLeft} color={confColor} thickness={2} />
          <QuadLine p1={corners.bottomLeft} p2={corners.topLeft} color={confColor} thickness={2} />
          <QuadLine p1={corners.topLeft} p2={corners.bottomRight} color={confColor} thickness={1} opacity={0.35} />
          <QuadLine p1={corners.topRight} p2={corners.bottomLeft} color={confColor} thickness={1} opacity={0.35} />

          {/* Center Move-All Handle */}
          <View
            {...moveAllResponder.panHandlers}
            style={[
              styles.moveAllHandle,
              { left: projCenter.x - 24, top: projCenter.y - 24, borderColor: confColor },
            ]}
          >
            <Text style={[styles.moveAllText, { color: confColor }]}>✥ MOVE</Text>
          </View>

          {/* Top-Left Corner Pin */}
          <View
            {...tlResponder.panHandlers}
            style={[styles.cornerHandle, { left: corners.topLeft.x - 24, top: corners.topLeft.y - 24 }]}
          >
            <View style={[styles.cornerHandleInner, { borderColor: confColor }]}>
              <Text style={styles.cornerText}>TL</Text>
            </View>
          </View>

          {/* Top-Right Corner Pin */}
          <View
            {...trResponder.panHandlers}
            style={[styles.cornerHandle, { left: corners.topRight.x - 24, top: corners.topRight.y - 24 }]}
          >
            <View style={[styles.cornerHandleInner, { borderColor: confColor }]}>
              <Text style={styles.cornerText}>TR</Text>
            </View>
          </View>

          {/* Bottom-Right Corner Pin */}
          <View
            {...brResponder.panHandlers}
            style={[styles.cornerHandle, { left: corners.bottomRight.x - 24, top: corners.bottomRight.y - 24 }]}
          >
            <View style={[styles.cornerHandleInner, { borderColor: confColor }]}>
              <Text style={styles.cornerText}>BR</Text>
            </View>
          </View>

          {/* Bottom-Left Corner Pin */}
          <View
            {...blResponder.panHandlers}
            style={[styles.cornerHandle, { left: corners.bottomLeft.x - 24, top: corners.bottomLeft.y - 24 }]}
          >
            <View style={[styles.cornerHandleInner, { borderColor: confColor }]}>
              <Text style={styles.cornerText}>BL</Text>
            </View>
          </View>

          {/* Calibration HUD Card (non-overlapping below Row 2) */}
          <View style={[styles.targetDetectedBanner, { top: topOffset }]}>
            <View style={styles.detectedHeaderRow}>
              <View style={[styles.detectedDot, { backgroundColor: confColor }]} />
              <Text style={styles.detectedTitle} numberOfLines={1}>
                {quadGeometry.statusText}
              </Text>
              <View style={[styles.confidencePill, { borderColor: confColor }]}>
                <Text style={[styles.confidenceText, { color: confColor }]}>
                  {quadGeometry.confidencePercent}%
                </Text>
              </View>
            </View>
            <Text style={styles.geometryMetricsText}>
              {quadGeometry.widthPx}×{quadGeometry.heightPx}px • ASP {quadGeometry.aspectRatio} • SKEW {quadGeometry.skewPercent}% •{' '}
              {baselineLocked ? 'BASE LOCKED' : 'NO BASE'}
            </Text>

            <View style={styles.calibActionsRow}>
              {onSnapCenterQuad && (
                <TouchableOpacity onPress={onSnapCenterQuad} style={styles.calibActionBtn} activeOpacity={0.7}>
                  <Text style={styles.calibActionText}>⌖ CENTER</Text>
                </TouchableOpacity>
              )}
              {onAutoDetectTarget && (
                <TouchableOpacity
                  onPress={onAutoDetectTarget}
                  disabled={isDetectingTarget}
                  style={[styles.calibActionBtn, styles.calibDetectBtn]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.calibDetectText}>
                    {isDetectingTarget ? '⏳ SCAN...' : '🔍 AUTO-LOCK'}
                  </Text>
                </TouchableOpacity>
              )}
              {onLockBaseline && (
                <TouchableOpacity onPress={onLockBaseline} style={styles.calibActionBtn} activeOpacity={0.7}>
                  <Text style={styles.calibActionText}>📸 BASELINE</Text>
                </TouchableOpacity>
              )}
              {onExitCalibration && (
                <TouchableOpacity onPress={onExitCalibration} style={styles.calibDoneBtn} activeOpacity={0.7}>
                  <Text style={styles.calibDoneText}>✓ DONE</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 20,
  },
  targetContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCircle: {
    position: 'absolute',
    borderWidth: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  ringLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginTop: 2,
  },
  crosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0, 229, 160, 0.35)',
  },
  crosshairV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(0, 229, 160, 0.35)',
  },
  innerTenDot: {
    backgroundColor: '#00E5A0',
    position: 'absolute',
  },
  mpiMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 24,
  },
  mpiH: {
    position: 'absolute',
    width: 16,
    height: 2,
    backgroundColor: '#F59E0B',
  },
  mpiV: {
    position: 'absolute',
    height: 16,
    width: 2,
    backgroundColor: '#F59E0B',
  },
  mpiLabel: {
    position: 'absolute',
    top: 17,
    fontFamily: 'monospace',
    fontSize: 7,
    fontWeight: '900',
    color: '#F59E0B',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 2,
  },
  shotMarker: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  leadPunchHole: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  latestShotGlow: {
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  selectedShotGlow: {
    borderColor: '#FFD600',
    borderWidth: 2,
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1.5,
    opacity: 0.65,
  },
  shotScoreBadge: {
    color: '#000000',
    fontSize: 7.5,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  tooltipCallout: {
    position: 'absolute',
    backgroundColor: 'rgba(7, 9, 15, 0.96)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#00E5A0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    zIndex: 80,
    width: 204,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 16,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tooltipTitle: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: '900',
  },
  tooltipScore: {
    color: '#00E5A0',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
  },
  tooltipDetail: {
    color: '#9CA3AF',
    fontFamily: 'monospace',
    fontSize: 8.5,
    marginTop: 2,
  },
  tooltipActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  tooltipBtn: {
    flex: 1,
    backgroundColor: 'rgba(0, 229, 160, 0.14)',
    borderWidth: 1,
    borderColor: '#00E5A0',
    paddingVertical: 4,
    borderRadius: 5,
    alignItems: 'center',
  },
  tooltipDelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: '#EF4444',
  },
  tooltipCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    alignItems: 'center',
  },
  tooltipBtnText: {
    color: '#00E5A0',
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tooltipDelText: {
    color: '#EF4444',
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cornerHandle: {
    position: 'absolute',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 70,
  },
  cornerHandleInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(7, 9, 15, 0.94)',
    borderWidth: 2.2,
    borderColor: '#00E5A0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  cornerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  moveAllHandle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(7, 9, 15, 0.85)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 68,
  },
  moveAllText: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '900',
  },
  targetDetectedBanner: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: 'rgba(7, 9, 15, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    zIndex: 60,
    elevation: 10,
  },
  detectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detectedTitle: {
    color: '#ECEEF4',
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  confidencePill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  confidenceText: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '900',
  },
  geometryMetricsText: {
    color: '#9CA3AF',
    fontFamily: 'monospace',
    fontSize: 8,
    marginTop: 2,
  },
  calibActionsRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 6,
    width: '100%',
  },
  calibActionBtn: {
    flex: 1,
    backgroundColor: 'rgba(0, 229, 160, 0.14)',
    borderWidth: 1,
    borderColor: '#00E5A0',
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  calibActionText: {
    color: '#00E5A0',
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '900',
  },
  calibDetectBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: '#38BDF8',
  },
  calibDetectText: {
    color: '#38BDF8',
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '900',
  },
  calibDoneBtn: {
    backgroundColor: '#00E5A0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  calibDoneText: {
    color: '#000000',
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '900',
  },
});

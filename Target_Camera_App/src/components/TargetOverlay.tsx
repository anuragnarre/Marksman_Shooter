// Target_Camera_App/src/components/TargetOverlay.tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
} from 'react-native';
import { CalibrationCorners, Point2D, Shot, TargetSpec, TARGET_SPECS, TargetTypeCode } from '../types/target';

interface TargetOverlayProps {
  width: number;
  height: number;
  targetType: TargetTypeCode;
  corners: CalibrationCorners;
  onUpdateCorners: (corners: CalibrationCorners) => void;
  isCalibrationMode: boolean;
  shots: Shot[];
  onTargetPress?: (screenX: number, screenY: number) => void;
}

export function TargetOverlay({
  width,
  height,
  targetType,
  corners,
  onUpdateCorners,
  isCalibrationMode,
  shots,
  onTargetPress,
}: TargetOverlayProps) {
  const spec = TARGET_SPECS[targetType];

  // Quad center and scale
  const centerX = (corners.topLeft.x + corners.topRight.x + corners.bottomRight.x + corners.bottomLeft.x) / 4;
  const centerY = (corners.topLeft.y + corners.topRight.y + corners.bottomRight.y + corners.bottomLeft.y) / 4;
  const targetDiameterPx = (
    Math.hypot(corners.topRight.x - corners.topLeft.x, corners.topRight.y - corners.topLeft.y) +
    Math.hypot(corners.bottomRight.x - corners.bottomLeft.x, corners.bottomRight.y - corners.bottomLeft.y)
  ) / 2;
  const targetRadiusPx = targetDiameterPx / 2;

  // Handle dragging corners
  const createCornerPanResponder = (cornerKey: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => isCalibrationMode,
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (!isCalibrationMode) return;
        const currentPos = corners[cornerKey];
        const newX = Math.max(10, Math.min(width - 10, currentPos.x + gestureState.dx));
        const newY = Math.max(10, Math.min(height - 10, currentPos.y + gestureState.dy));
        onUpdateCorners({
          ...corners,
          [cornerKey]: { x: newX, y: newY },
          isCalibrated: true,
        });
      },
    });
  };

  const tlResponder = createCornerPanResponder('topLeft');
  const trResponder = createCornerPanResponder('topRight');
  const brResponder = createCornerPanResponder('bottomRight');
  const blResponder = createCornerPanResponder('bottomLeft');

  const handleTouch = (evt: GestureResponderEvent) => {
    if (isCalibrationMode || !onTargetPress) return;
    const { locationX, locationY } = evt.nativeEvent;
    onTargetPress(locationX, locationY);
  };

  // Convert ring mm radius to pixels on screen
  const mmToPx = targetRadiusPx / (spec.totalDiameterMm / 2);

  return (
    <View
      style={[StyleSheet.absoluteFill, { width, height }]}
      onStartShouldSetResponder={() => !isCalibrationMode}
      onResponderRelease={handleTouch}
      pointerEvents={isCalibrationMode ? 'box-none' : 'auto'}
    >
      {/* Target Concentric Rings */}
      <View
        pointerEvents="none"
        style={[
          styles.targetContainer,
          {
            left: centerX - targetRadiusPx,
            top: centerY - targetRadiusPx,
            width: targetDiameterPx,
            height: targetDiameterPx,
          },
        ]}
      >
        {/* Render concentric rings from outer to inner */}
        {spec.rings.slice().reverse().map((r) => {
          const radiusPx = r.radiusMm * mmToPx;
          const isBullseye = r.radiusMm * 2 <= spec.bullseyeDiameterMm;
          return (
            <View
              key={`ring-${r.ring}`}
              style={[
                styles.ringCircle,
                {
                  width: radiusPx * 2,
                  height: radiusPx * 2,
                  borderRadius: radiusPx,
                  backgroundColor: isBullseye ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.08)',
                  borderColor: isBullseye ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.25)',
                },
              ]}
            >
              {/* Ring number label on outer rings */}
              {r.ring <= 8 && radiusPx > 25 && (
                <Text style={styles.ringLabel}>{r.ring}</Text>
              )}
            </View>
          );
        })}

        {/* Center Crosshairs */}
        <View style={styles.crosshairH} />
        <View style={styles.crosshairV} />

        {/* Center Dot (Inner Ten) */}
        <View
          style={[
            styles.innerTenDot,
            {
              width: Math.max(4, spec.innerTenRadiusMm * mmToPx * 2),
              height: Math.max(4, spec.innerTenRadiusMm * mmToPx * 2),
              borderRadius: Math.max(2, spec.innerTenRadiusMm * mmToPx),
            },
          ]}
        />
      </View>

      {/* Render Shots */}
      {shots.map((shot, idx) => {
        // Map shot target mm back to screen pixels relative to center
        const shotScreenX = centerX + shot.xMm * mmToPx;
        const shotScreenY = centerY + shot.yMm * mmToPx;
        const isLatest = idx === shots.length - 1;

        // Color coding: 10 = Neon Green, 9 = Cyan, 8 = Gold, <=7 = Red
        let dotColor = '#00E5A0';
        if (shot.score === 9) dotColor = '#00B4D8';
        else if (shot.score === 8) dotColor = '#FFB703';
        else if (shot.score < 8) dotColor = '#EF4444';

        const bulletDiameterPx = Math.max(10, shot.caliberMm * mmToPx);

        return (
          <View
            key={shot.id}
            pointerEvents="none"
            style={[
              styles.shotMarker,
              {
                left: shotScreenX - bulletDiameterPx / 2,
                top: shotScreenY - bulletDiameterPx / 2,
                width: bulletDiameterPx,
                height: bulletDiameterPx,
                borderRadius: bulletDiameterPx / 2,
                backgroundColor: dotColor,
                borderColor: '#FFFFFF',
              },
              isLatest && styles.latestShotGlow,
            ]}
          >
            <Text style={styles.shotScoreBadge}>
              {shot.decimalScore.toFixed(1)}
            </Text>
          </View>
        );
      })}

      {/* 4-Point Calibration Boundary & Corner Pins */}
      {isCalibrationMode && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Top-Left Corner Pin */}
          <View
            {...tlResponder.panHandlers}
            style={[styles.cornerHandle, { left: corners.topLeft.x - 22, top: corners.topLeft.y - 22 }]}
          >
            <View style={styles.cornerHandleInner}>
              <Text style={styles.cornerText}>TL</Text>
            </View>
          </View>

          {/* Top-Right Corner Pin */}
          <View
            {...trResponder.panHandlers}
            style={[styles.cornerHandle, { left: corners.topRight.x - 22, top: corners.topRight.y - 22 }]}
          >
            <View style={styles.cornerHandleInner}>
              <Text style={styles.cornerText}>TR</Text>
            </View>
          </View>

          {/* Bottom-Right Corner Pin */}
          <View
            {...brResponder.panHandlers}
            style={[styles.cornerHandle, { left: corners.bottomRight.x - 22, top: corners.bottomRight.y - 22 }]}
          >
            <View style={styles.cornerHandleInner}>
              <Text style={styles.cornerText}>BR</Text>
            </View>
          </View>

          {/* Bottom-Left Corner Pin */}
          <View
            {...blResponder.panHandlers}
            style={[styles.cornerHandle, { left: corners.bottomLeft.x - 22, top: corners.bottomLeft.y - 22 }]}
          >
            <View style={styles.cornerHandleInner}>
              <Text style={styles.cornerText}>BL</Text>
            </View>
          </View>

          {/* Calibration Guidance Banner */}
          <View style={styles.calibrationBanner}>
            <Text style={styles.calibrationBannerText}>
              CALIBRATION MODE: Drag the 4 corner handles to align with the paper target outline.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  crosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0, 229, 160, 0.4)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 229, 160, 0.4)',
  },
  innerTenDot: {
    position: 'absolute',
    backgroundColor: '#00E5A0',
  },
  shotMarker: {
    position: 'absolute',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 4,
  },
  latestShotGlow: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  shotScoreBadge: {
    position: 'absolute',
    top: -16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: '#00E5A0',
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cornerHandle: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  cornerHandleInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00E5A0',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 6,
  },
  cornerText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  calibrationBanner: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00E5A0',
    alignItems: 'center',
  },
  calibrationBannerText: {
    color: '#00E5A0',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

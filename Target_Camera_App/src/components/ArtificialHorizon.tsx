// Target_Camera_App/src/components/ArtificialHorizon.tsx
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MountingMode } from '../types/target';

interface ArtificialHorizonProps {
  rollAngle: number;
  pitchAngle: number;
  mountingMode?: MountingMode;
  width: number;
  visible?: boolean;
  topOffset?: number;
  onZeroCalibration?: () => void;
}

export function ArtificialHorizon({
  rollAngle,
  pitchAngle,
  mountingMode = 'OVERHEAD_DOWN',
  width,
  visible = true,
  topOffset = 122,
  onZeroCalibration,
}: ArtificialHorizonProps) {
  if (!visible) return null;

  const isOverhead = mountingMode === 'OVERHEAD_DOWN' || mountingMode === 'OVERHEAD_UP';
  const isLevel = isOverhead
    ? Math.hypot(rollAngle, pitchAngle) <= 1.2
    : Math.abs(rollAngle) <= 0.8;
  const levelColor = isLevel ? '#00E5A0' : '#FF4D6D';

  // Clamp 2D bubble inside 36px circle radius for overhead spirit level
  const bubbleX = Math.max(-22, Math.min(22, rollAngle * 3.5));
  const bubbleY = Math.max(-22, Math.min(22, pitchAngle * 3.5));

  // Clamp 1D vial bubble for wall rig mode
  const barBubbleOffset = Math.max(-26, Math.min(26, rollAngle * 8));

  return (
    <>
      {/* Visual Spirit Level / Horizon Reticle below shot callout & shot pins */}
      <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
        {isOverhead ? (
          /* 2D Bullseye Spirit Level when camera faces ground/overhead */
          <View style={[styles.spiritOuter, { borderColor: levelColor }]}>
            <View style={styles.spiritCrossH} />
            <View style={styles.spiritCrossV} />
            <View style={[styles.spiritInnerRing, { borderColor: levelColor }]} />
            <View
              style={[
                styles.spiritBubble,
                {
                  backgroundColor: levelColor,
                  transform: [{ translateX: bubbleX }, { translateY: bubbleY }],
                },
              ]}
            />
          </View>
        ) : (
          /* Upright Artificial Horizon Bar for Tripod / Wall Target */
          <View
            style={[
              styles.horizonBar,
              {
                width: Math.min(220, width * 0.48),
                transform: [
                  { translateY: Math.max(-40, Math.min(40, pitchAngle * 1.5)) },
                  { rotate: `${Math.max(-35, Math.min(35, rollAngle))}deg` },
                ],
                borderColor: levelColor,
              },
            ]}
          >
            <View style={[styles.leftWing, { backgroundColor: levelColor }]} />
            <View style={[styles.bubbleVial, { borderColor: levelColor }]}>
              <View
                style={[
                  styles.bubblePip,
                  {
                    backgroundColor: levelColor,
                    transform: [{ translateX: barBubbleOffset }],
                  },
                ]}
              />
            </View>
            <View style={[styles.rightWing, { backgroundColor: levelColor }]} />
          </View>
        )}
      </View>

      {/* Interactive Leveling Readout Pill above TargetOverlay so [TARE] always clicks! */}
      <TouchableOpacity
        style={[
          styles.readoutPill,
          { top: topOffset, maxWidth: Math.min(198, width * 0.54), borderColor: levelColor },
        ]}
        onPress={onZeroCalibration}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
        activeOpacity={0.75}
      >
        <View style={[styles.statusDot, { backgroundColor: levelColor }]} />
        <Text style={[styles.readoutText, { color: levelColor }]} numberOfLines={1} adjustsFontSizeToFit>
          {isOverhead
            ? isLevel
              ? `★ LVL ${rollAngle >= 0 ? '+' : ''}${rollAngle.toFixed(1)}°/${pitchAngle >= 0 ? '+' : ''}${pitchAngle.toFixed(1)}°`
              : `⊕ NADIR ${rollAngle >= 0 ? '+' : ''}${rollAngle.toFixed(1)}°/${pitchAngle >= 0 ? '+' : ''}${pitchAngle.toFixed(1)}°`
            : isLevel
            ? `★ HORIZ ${rollAngle >= 0 ? '+' : ''}${rollAngle.toFixed(1)}°`
            : `${rollAngle > 0 ? '◀' : '▶'} TILT ${rollAngle >= 0 ? '+' : ''}${rollAngle.toFixed(1)}°`}
        </Text>
        {onZeroCalibration && <Text style={styles.zeroHint}>[TARE]</Text>}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 14,
  },
  spiritOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    backgroundColor: 'rgba(7, 9, 15, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spiritInnerRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    opacity: 0.7,
    position: 'absolute',
  },
  spiritCrossH: {
    position: 'absolute',
    width: 64,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  spiritCrossV: {
    position: 'absolute',
    height: 64,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  spiritBubble: {
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.92,
  },
  horizonBar: {
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.88,
  },
  leftWing: {
    width: 40,
    height: 2,
    borderRadius: 1,
  },
  rightWing: {
    width: 40,
    height: 2,
    borderRadius: 1,
  },
  bubbleVial: {
    width: 60,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 9, 15, 0.65)',
  },
  bubblePip: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  readoutPill: {
    position: 'absolute',
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(7, 9, 15, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 48,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  readoutText: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  zeroHint: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 7.5,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginLeft: 2,
  },
});

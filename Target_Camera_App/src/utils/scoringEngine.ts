// Target_Camera_App/src/utils/scoringEngine.ts
import { TargetSpec, TARGET_SPECS, TargetTypeCode, Shot, Point2D, CalibrationCorners } from '../types/target';

/**
 * Calculates ISSF decimal score and clock position for a shot coordinate in target millimeters.
 * (0,0) is target center.
 * +x is right, +y is down.
 */
export function calculateShotScore(
  xMm: number,
  yMm: number,
  targetType: TargetTypeCode = 'air_pistol_10m',
  caliberMm: number = 4.5,
  shotNumber: number = 1
): Shot {
  const spec = TARGET_SPECS[targetType];
  const bulletRadius = caliberMm / 2;

  // Center-to-center distance in millimeters
  const centerDistanceMm = Math.sqrt(xMm * xMm + yMm * yMm);
  // Inward gauging: bullet outer edge reaches inward by bulletRadius
  const gaugedDistanceMm = Math.max(0, centerDistanceMm - bulletRadius);

  // Determine ring score
  let score = 0;
  let decimalScore = 0.0;
  const rings = spec.rings; // Sorted from 10 down to outer

  // Check inner 10
  const isInnerTen = centerDistanceMm <= spec.innerTenRadiusMm + bulletRadius;

  // Find which ring interval the shot lands in
  if (gaugedDistanceMm <= rings[0].radiusMm) {
    // Inside 10-ring: decimal score from 10.0 to 10.9
    // At center (0mm), decimal is 10.9. At outer edge of 10-ring, decimal is 10.0
    const ratio = Math.max(0, Math.min(1, 1 - centerDistanceMm / (rings[0].radiusMm + bulletRadius)));
    decimalScore = parseFloat((10.0 + ratio * 0.9).toFixed(1));
    score = 10;
  } else {
    // Check other rings
    let found = false;
    for (let i = 0; i < rings.length - 1; i++) {
      const inner = rings[i];
      const outer = rings[i + 1];

      if (gaugedDistanceMm <= outer.radiusMm) {
        // Shot belongs to the inner ring score
        score = inner.ring;
        // Decimal interpolation between outer ring edge and inner ring edge
        const span = outer.radiusMm - inner.radiusMm;
        const progress = (outer.radiusMm - gaugedDistanceMm) / span; // 0 at outer line, 1 at inner line
        const decimalPart = Math.floor(progress * 10) / 10;
        decimalScore = parseFloat((score + decimalPart * 0.9).toFixed(1));
        found = true;
        break;
      }
    }

    if (!found) {
      // Check outermost ring
      const lastRing = rings[rings.length - 1];
      if (gaugedDistanceMm <= lastRing.radiusMm) {
        score = lastRing.ring;
        decimalScore = parseFloat((score + 0.0).toFixed(1));
      } else {
        // Miss (out of target area)
        score = 0;
        decimalScore = 0.0;
      }
    }
  }

  // Calculate clock orientation
  const clock = getClockDirection(xMm, yMm);

  // Normalized coordinates (-1 to 1 based on target radius)
  const targetRadiusMm = spec.totalDiameterMm / 2;
  const normalizedX = parseFloat(Math.max(-1.5, Math.min(1.5, xMm / targetRadiusMm)).toFixed(3));
  const normalizedY = parseFloat(Math.max(-1.5, Math.min(1.5, yMm / targetRadiusMm)).toFixed(3));

  return {
    id: `shot-${Date.now()}-${shotNumber}`,
    shotNumber,
    xMm: parseFloat(xMm.toFixed(2)),
    yMm: parseFloat(yMm.toFixed(2)),
    normalizedX,
    normalizedY,
    score,
    decimalScore,
    isInnerTen,
    clock,
    radialDistanceMm: parseFloat(centerDistanceMm.toFixed(2)),
    caliberMm,
    timestamp: Date.now(),
  };
}

/**
 * Converts Cartesian coordinates to a 12-hour clock direction.
 * x: right (+), left (-)
 * y: down (+), up (-)
 */
export function getClockDirection(x: number, y: number): string {
  const dist = Math.sqrt(x * x + y * y);
  if (dist < 1.0) return 'Center';

  // Math.atan2(y, x): angle in radians from positive X axis (3 o'clock).
  // Note: in screen space, +y is 6 o'clock.
  // Angle: 0 = 3 o'clock, PI/2 = 6 o'clock, PI = 9 o'clock, -PI/2 = 12 o'clock.
  let angleDeg = (Math.atan2(y, x) * 180) / Math.PI;
  // Rotate so 12 o'clock (-90 deg) is 0 deg:
  let clockDeg = (angleDeg + 90 + 360) % 360;
  // Convert 360 deg to 12 hours (30 deg each)
  let hour = Math.round(clockDeg / 30);
  if (hour === 0) hour = 12;

  return `${hour} o'clock`;
}

/**
 * Maps a screen coordinate (e.g. touch or optical pixel) inside the 4-corner calibration quad
 * to the target unit square [-1, +1], then scales to physical millimeters.
 */
export function mapScreenPointToTargetMm(
  screenPoint: Point2D,
  corners: CalibrationCorners,
  targetType: TargetTypeCode = 'air_pistol_10m'
): Point2D {
  const spec = TARGET_SPECS[targetType];
  const targetRadiusMm = spec.totalDiameterMm / 2;

  // Bilinear inverse interpolation approximation from 4 corners:
  // TL: (-1, -1), TR: (1, -1), BR: (1, 1), BL: (-1, 1)
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = corners;

  // Approximate center of target on screen
  const centerX = (tl.x + tr.x + br.x + bl.x) / 4;
  const centerY = (tl.y + tr.y + br.y + bl.y) / 4;

  // Approximate target width and height on screen
  const widthScreen = (Math.hypot(tr.x - tl.x, tr.y - tl.y) + Math.hypot(br.x - bl.x, br.y - bl.y)) / 2;
  const heightScreen = (Math.hypot(bl.x - tl.x, bl.y - tl.y) + Math.hypot(br.x - tr.x, br.y - tr.y)) / 2;
  const scaleScreen = (widthScreen + heightScreen) / 2;

  if (scaleScreen <= 0) {
    return { x: 0, y: 0 };
  }

  // Normalized relative to center
  const normX = (screenPoint.x - centerX) / (scaleScreen / 2);
  const normY = (screenPoint.y - centerY) / (scaleScreen / 2);

  // Convert to physical millimeters
  const xMm = normX * targetRadiusMm;
  const yMm = normY * targetRadiusMm;

  return { x: xMm, y: yMm };
}

/**
 * Calculates group analytics: Extreme Spread (mm) and Mean Radius (mm).
 */
export function calculateGroupAnalytics(shots: Shot[]) {
  if (shots.length === 0) {
    return { extremeSpreadMm: 0, meanRadiusMm: 0, averageScore: 0, totalScore: 0 };
  }

  const totalScore = shots.reduce((acc, s) => acc + s.score, 0);
  const totalDecimal = shots.reduce((acc, s) => acc + s.decimalScore, 0);
  const averageScore = parseFloat((totalDecimal / shots.length).toFixed(2));

  // Extreme spread: maximum distance between any two shots in the string
  let maxDistance = 0;
  for (let i = 0; i < shots.length; i++) {
    for (let j = i + 1; j < shots.length; j++) {
      const dx = shots[i].xMm - shots[j].xMm;
      const dy = shots[i].yMm - shots[j].yMm;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDistance) {
        maxDistance = dist;
      }
    }
  }

  // Mean radius: average distance of all shots to group centroid
  const centroidX = shots.reduce((acc, s) => acc + s.xMm, 0) / shots.length;
  const centroidY = shots.reduce((acc, s) => acc + s.yMm, 0) / shots.length;

  const meanRadius = shots.reduce((acc, s) => {
    return acc + Math.hypot(s.xMm - centroidX, s.yMm - centroidY);
  }, 0) / shots.length;

  return {
    extremeSpreadMm: parseFloat(maxDistance.toFixed(2)),
    meanRadiusMm: parseFloat(meanRadius.toFixed(2)),
    averageScore,
    totalScore,
  };
}

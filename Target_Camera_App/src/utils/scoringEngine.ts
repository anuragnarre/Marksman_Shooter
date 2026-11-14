// Target_Camera_App/src/utils/scoringEngine.ts
import { TargetSpec, TARGET_SPECS, TargetTypeCode, Shot, Point2D, CalibrationCorners, SightCorrection, SeriesScore, SessionSummary } from '../types/target';

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
 * Solves 8x8 linear system to compute 3x3 planar projective homography H
 * mapping 4 source points -> 4 destination points (Gaussian elimination with partial pivoting).
 */
export function solveHomography(
  srcPts: [Point2D, Point2D, Point2D, Point2D],
  dstPts: [Point2D, Point2D, Point2D, Point2D]
): number[] | null {
  const a: number[][] = Array.from({ length: 8 }, () => new Array(9).fill(0));
  for (let i = 0; i < 4; i++) {
    const sx = srcPts[i].x;
    const sy = srcPts[i].y;
    const dx = dstPts[i].x;
    const dy = dstPts[i].y;

    const r0 = i * 2;
    a[r0][0] = sx; a[r0][1] = sy; a[r0][2] = 1;
    a[r0][6] = -dx * sx; a[r0][7] = -dx * sy; a[r0][8] = dx;

    const r1 = r0 + 1;
    a[r1][3] = sx; a[r1][4] = sy; a[r1][5] = 1;
    a[r1][6] = -dy * sx; a[r1][7] = -dy * sy; a[r1][8] = dy;
  }

  for (let col = 0; col < 8; col++) {
    let maxRow = col;
    let maxVal = Math.abs(a[col][col]);
    for (let r = col + 1; r < 8; r++) {
      const val = Math.abs(a[r][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = r;
      }
    }
    if (maxVal < 1e-9) return null;
    if (maxRow !== col) {
      const tmp = a[col];
      a[col] = a[maxRow];
      a[maxRow] = tmp;
    }
    const pivot = a[col][col];
    for (let c = col; c <= 8; c++) a[col][c] /= pivot;
    for (let r = 0; r < 8; r++) {
      if (r === col) continue;
      const factor = a[r][col];
      if (factor === 0) continue;
      for (let c = col; c <= 8; c++) a[r][c] -= factor * a[col][c];
    }
  }

  return [
    a[0][8], a[1][8], a[2][8],
    a[3][8], a[4][8], a[5][8],
    a[6][8], a[7][8], 1,
  ];
}

function applyHomography(h: number[], p: Point2D): Point2D {
  const w = h[6] * p.x + h[7] * p.y + h[8];
  if (Math.abs(w) < 1e-9) return { x: 0, y: 0 };
  return {
    x: (h[0] * p.x + h[1] * p.y + h[2]) / w,
    y: (h[3] * p.x + h[4] * p.y + h[5]) / w,
  };
}

const UNIT_TARGET_CORNERS: [Point2D, Point2D, Point2D, Point2D] = [
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
];

/**
 * Maps a screen coordinate (touch or optical hit) inside the 4-corner calibration quad
 * to physical millimeters using a true 2D planar projective homography.
 */
export function mapScreenPointToTargetMm(
  screenPoint: Point2D,
  corners: CalibrationCorners,
  targetType: TargetTypeCode = 'air_pistol_10m'
): Point2D {
  const spec = TARGET_SPECS[targetType];
  const targetRadiusMm = spec.totalDiameterMm / 2;
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = corners;

  const invH = solveHomography([tl, tr, br, bl], UNIT_TARGET_CORNERS);
  if (invH) {
    const unit = applyHomography(invH, screenPoint);
    return {
      x: unit.x * targetRadiusMm,
      y: unit.y * targetRadiusMm,
    };
  }

  // Fallback for degenerate quads
  const centerX = (tl.x + tr.x + br.x + bl.x) / 4;
  const centerY = (tl.y + tr.y + br.y + bl.y) / 4;
  const widthScreen = (Math.hypot(tr.x - tl.x, tr.y - tl.y) + Math.hypot(br.x - bl.x, br.y - bl.y)) / 2;
  const heightScreen = (Math.hypot(bl.x - tl.x, bl.y - tl.y) + Math.hypot(br.x - tr.x, br.y - tr.y)) / 2;
  const scaleScreen = (widthScreen + heightScreen) / 2;
  if (scaleScreen <= 0) return { x: 0, y: 0 };
  return {
    x: ((screenPoint.x - centerX) / (scaleScreen / 2)) * targetRadiusMm,
    y: ((screenPoint.y - centerY) / (scaleScreen / 2)) * targetRadiusMm,
  };
}

/**
 * Forward projective mapping from target millimeters to exact screen coordinate inside the quad.
 */
export function mapTargetMmToScreenPoint(
  xMm: number,
  yMm: number,
  corners: CalibrationCorners,
  targetType: TargetTypeCode = 'air_pistol_10m'
): Point2D {
  const spec = TARGET_SPECS[targetType];
  const targetRadiusMm = spec.totalDiameterMm / 2;
  const u = targetRadiusMm > 0 ? xMm / targetRadiusMm : 0;
  const v = targetRadiusMm > 0 ? yMm / targetRadiusMm : 0;
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = corners;

  const fwdH = solveHomography(UNIT_TARGET_CORNERS, [tl, tr, br, bl]);
  if (fwdH) {
    return applyHomography(fwdH, { x: u, y: v });
  }
  return {
    x: (tl.x + tr.x + br.x + bl.x) / 4,
    y: (tl.y + tr.y + br.y + bl.y) / 4,
  };
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

/**
 * Re-scores an existing shot when target type changes.
 * Preserves the physical xMm, yMm, shotNumber, timestamp, and ballistic chronograph data,
 * but recalculates decimalScore, ring score, innerTen, clock, and normalized coordinates.
 */
export function rescoreShot(shot: Shot, newTargetType: TargetTypeCode): Shot {
  const recalculated = calculateShotScore(
    shot.xMm,
    shot.yMm,
    newTargetType,
    shot.caliberMm,
    shot.shotNumber
  );
  return {
    ...recalculated,
    id: shot.id,
    timestamp: shot.timestamp,
    flightTimeMs: shot.flightTimeMs,
    muzzleVelocityMps: shot.muzzleVelocityMps,
    acousticTriggered: shot.acousticTriggered,
    isSighter: shot.isSighter,
  };
}

/**
 * Evaluates the geometric quality of the 4-corner optical calibration quad.
 * Returns dynamic dimensions, aspect ratio, skew percentage, and optical match confidence (0 - 99.8%).
 */
export interface QuadGeometry {
  widthPx: number;
  heightPx: number;
  aspectRatio: number;
  skewPercent: number;
  confidencePercent: number;
  isSquare: boolean;
  statusText: string;
}

export function calculateTargetQuadGeometry(corners: CalibrationCorners): QuadGeometry {
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = corners;

  const topW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const bottomW = Math.hypot(br.x - bl.x, br.y - bl.y);
  const leftH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const rightH = Math.hypot(br.x - tr.x, br.y - tr.y);

  const avgW = Math.max(1, (topW + bottomW) / 2);
  const avgH = Math.max(1, (leftH + rightH) / 2);

  const widthDiff = Math.abs(topW - bottomW) / Math.max(topW, bottomW, 1);
  const heightDiff = Math.abs(leftH - rightH) / Math.max(leftH, rightH, 1);
  const aspectDiff = Math.abs(avgW - avgH) / Math.max(avgW, avgH, 1);

  const skewPercent = Math.min(100, Math.round((widthDiff * 0.35 + heightDiff * 0.35 + aspectDiff * 0.30) * 100));
  
  // Optical confidence decreases if trapezoid is heavily distorted
  const confidencePercent = Math.max(38.0, Math.min(99.8, parseFloat((99.8 - skewPercent * 0.72).toFixed(1))));

  const isSquare = skewPercent < 15;
  let statusText = 'HIGH CONFIDENCE FIDUCIAL LOCK';
  if (confidencePercent < 70) {
    statusText = 'POOR FIDUCIAL ALIGNMENT';
  } else if (confidencePercent < 88) {
    statusText = 'MODERATE PERSPECTIVE SKEW';
  } else if (confidencePercent >= 96) {
    statusText = 'OPTIMAL FIDUCIAL LOCK';
  }

  return {
    widthPx: Math.round(avgW),
    heightPx: Math.round(avgH),
    aspectRatio: parseFloat((avgW / avgH).toFixed(2)),
    skewPercent,
    confidencePercent,
    isSquare,
    statusText,
  };
}

/**
 * Calculates sight adjustment correction (clicks) and group diagnosis based on
 * Mean Point of Impact (MPI).
 */
export function calculateSightCorrection(
  shots: Shot[],
  targetType: TargetTypeCode = 'air_pistol_10m'
): SightCorrection {
  // Only evaluate competition shots (or all if no sighters)
  const activeShots = shots.filter((s) => !s.isSighter);
  const evalShots = activeShots.length > 0 ? activeShots : shots;

  if (evalShots.length === 0) {
    return {
      mpiX: 0,
      mpiY: 0,
      mpiRadiusMm: 0,
      windageClicks: 0,
      windageDirection: 'CENTER',
      elevationClicks: 0,
      elevationDirection: 'CENTER',
      adviceSummary: 'Zero group recorded. Fire 3-5 shots to calculate sight trim.',
      tightnessRating: 'MATCH_GRADE',
    };
  }

  const spec = TARGET_SPECS[targetType];
  const mpiX = parseFloat((evalShots.reduce((acc, s) => acc + s.xMm, 0) / evalShots.length).toFixed(2));
  const mpiY = parseFloat((evalShots.reduce((acc, s) => acc + s.yMm, 0) / evalShots.length).toFixed(2));
  const mpiRadiusMm = parseFloat(Math.hypot(mpiX, mpiY).toFixed(2));

  // Determine click displacement in mm at the target distance:
  let mmPerClick = 0.5;
  if (targetType === 'air_rifle_10m') mmPerClick = 0.25;
  else if (targetType === 'air_pistol_10m') mmPerClick = 0.5;
  else if (targetType === 'rapid_fire_25m') mmPerClick = 1.0;
  else if (targetType === 'precision_50m') mmPerClick = 1.25;
  else if (targetType === 'nra_b8') mmPerClick = 1.5;

  // Windage correction: if mpiX is negative (hitting LEFT), move rear sight RIGHT to compensate (+X)
  const windageClicks = Math.round(Math.abs(mpiX) / mmPerClick);
  const windageDirection = Math.abs(mpiX) < mmPerClick * 0.5 ? 'CENTER' : mpiX < 0 ? 'RIGHT' : 'LEFT';

  // Elevation correction: if mpiY is positive (hitting LOW in screen coords where +y is down), move sight UP (-Y)
  const elevationClicks = Math.round(Math.abs(mpiY) / mmPerClick);
  const elevationDirection = Math.abs(mpiY) < mmPerClick * 0.5 ? 'CENTER' : mpiY > 0 ? 'UP' : 'DOWN';

  let adviceSummary = 'Sights Centered on Bullseye';
  const parts: string[] = [];
  if (windageDirection !== 'CENTER' && windageClicks > 0) {
    parts.push(`Windage: ${windageClicks} clicks ${windageDirection}`);
  }
  if (elevationDirection !== 'CENTER' && elevationClicks > 0) {
    parts.push(`Elevation: ${elevationClicks} clicks ${elevationDirection}`);
  }
  if (parts.length > 0) {
    adviceSummary = parts.join(' • ');
  }

  // Extreme spread to evaluate tightness
  const analytics = calculateGroupAnalytics(evalShots);
  const tenRadius = spec.rings[0].radiusMm;
  let tightnessRating: SightCorrection['tightnessRating'] = 'MATCH_GRADE';
  if (analytics.extremeSpreadMm <= tenRadius * 1.5) {
    tightnessRating = 'MATCH_GRADE';
  } else if (analytics.extremeSpreadMm <= tenRadius * 2.8) {
    tightnessRating = 'EXCELLENT';
  } else if (analytics.extremeSpreadMm <= tenRadius * 4.5) {
    tightnessRating = 'GOOD';
  } else {
    tightnessRating = 'DISPERSED';
  }

  return {
    mpiX,
    mpiY,
    mpiRadiusMm,
    windageClicks,
    windageDirection,
    elevationClicks,
    elevationDirection,
    adviceSummary,
    tightnessRating,
  };
}

/**
 * Groups shots into 10-shot series (e.g. Series 1, Series 2...) with subtotal metrics.
 */
export function calculateSeriesBreakdown(shots: Shot[], shotsPerSeries = 10): SeriesScore[] {
  if (shots.length === 0) return [];

  const seriesList: SeriesScore[] = [];
  const numSeries = Math.ceil(shots.length / shotsPerSeries);

  for (let i = 0; i < numSeries; i++) {
    const chunk = shots.slice(i * shotsPerSeries, (i + 1) * shotsPerSeries);
    const decimalTotal = parseFloat(chunk.reduce((acc, s) => acc + s.decimalScore, 0).toFixed(1));
    const integerTotal = chunk.reduce((acc, s) => acc + s.score, 0);
    const innerTens = chunk.filter((s) => s.isInnerTen).length;
    const analytics = calculateGroupAnalytics(chunk);

    seriesList.push({
      seriesNumber: i + 1,
      shots: chunk,
      decimalTotal,
      integerTotal,
      innerTens,
      extremeSpreadMm: analytics.extremeSpreadMm,
      meanRadiusMm: analytics.meanRadiusMm,
    });
  }

  return seriesList;
}

/**
 * Compiles a comprehensive session summary object with all series subtotals and dispersion metrics.
 */
export function generateSessionSummary(
  shots: Shot[],
  targetType: TargetTypeCode = 'air_pistol_10m',
  laneId: string = '1'
): SessionSummary {
  const spec = TARGET_SPECS[targetType];
  const matchShots = shots.filter((s) => !s.isSighter);
  const sighterShots = shots.filter((s) => s.isSighter);
  const analytics = calculateGroupAnalytics(matchShots.length > 0 ? matchShots : shots);
  const series = calculateSeriesBreakdown(matchShots.length > 0 ? matchShots : shots, 10);
  const sightCorrection = calculateSightCorrection(shots, targetType);

  const totalScore = matchShots.reduce((acc, s) => acc + s.score, 0);
  const decimalTotal = parseFloat(
    matchShots.reduce((acc, s) => acc + s.decimalScore, 0).toFixed(1)
  );
  const innerTensCount = matchShots.filter((s) => s.isInnerTen).length;

  return {
    laneId,
    targetType,
    targetName: spec.name,
    timestamp: Date.now(),
    totalShots: shots.length,
    matchShotsCount: matchShots.length,
    sighterShotsCount: sighterShots.length,
    totalScore,
    decimalTotal,
    innerTensCount,
    averageScore: analytics.averageScore,
    extremeSpreadMm: analytics.extremeSpreadMm,
    meanRadiusMm: analytics.meanRadiusMm,
    series,
    sightCorrection,
  };
}

/**
 * Formats a clean, printable ASCII score card for competition or training logs.
 */
export function generateScorecardText(
  shots: Shot[],
  targetType: TargetTypeCode = 'air_pistol_10m',
  laneId: string = '1',
  shooterName: string = 'Shooter 1'
): string {
  const summary = generateSessionSummary(shots, targetType, laneId);
  const dateStr = new Date(summary.timestamp).toISOString().replace('T', ' ').substring(0, 19);

  let output = '';
  output += '======================================================\n';
  output += '             MARKSMAN ELECTRONIC SCORING              \n';
  output += '               OFFICIAL MATCH SCORECARD               \n';
  output += '======================================================\n';
  output += `Shooter: ${shooterName.padEnd(20)} Lane: ${laneId}\n`;
  output += `Target:  ${summary.targetName}\n`;
  output += `Date:    ${dateStr} UTC\n`;
  output += `Total Shots: ${summary.totalShots} (Match: ${summary.matchShotsCount}, Sighters: ${summary.sighterShotsCount})\n`;
  output += '------------------------------------------------------\n';
  output += 'SERIES BREAKDOWN:\n';

  if (summary.series.length === 0) {
    output += '  No shots recorded.\n';
  } else {
    summary.series.forEach((s) => {
      const shotScores = s.shots.map((shot) => `${shot.decimalScore.toFixed(1)}${shot.isInnerTen ? '*' : ''}`).join(' ');
      output += `  Series ${s.seriesNumber}:  ${s.decimalTotal.toFixed(1)} (${s.integerTotal}) [${s.innerTens}*] | Spread: ${s.extremeSpreadMm}mm\n`;
      output += `    Shots: ${shotScores}\n`;
    });
  }

  output += '------------------------------------------------------\n';
  output += `TOTAL MATCH SCORE:  ${summary.decimalTotal.toFixed(1)} (${summary.totalScore})\n`;
  output += `Inner Tens (*):     ${summary.innerTensCount}\n`;
  output += `Average Decimal:    ${summary.averageScore.toFixed(2)}\n`;
  output += `Extreme Spread:     ${summary.extremeSpreadMm} mm\n`;
  output += `Mean Radius:        ${summary.meanRadiusMm} mm\n`;
  output += `MPI Offset:         W: ${summary.sightCorrection.mpiX > 0 ? '+' : ''}${summary.sightCorrection.mpiX}mm | E: ${summary.sightCorrection.mpiY > 0 ? '+' : ''}${summary.sightCorrection.mpiY}mm\n`;
  output += `Sight Trim:         ${summary.sightCorrection.adviceSummary}\n`;
  output += `Group Tightness:    ${summary.sightCorrection.tightnessRating}\n`;
  output += '======================================================\n';
  output += '       Generated by Marksman Optical Target Camera    \n';
  output += '======================================================\n';

  return output;
}

/**
 * Exports shot database to standard RFC-4180 CSV format.
 */
export function generateSessionCsv(
  shots: Shot[],
  targetType: TargetTypeCode = 'air_pistol_10m',
  laneId: string = '1'
): string {
  const spec = TARGET_SPECS[targetType];
  const headers = [
    'shot_number',
    'lane_id',
    'target_type',
    'decimal_score',
    'integer_score',
    'is_inner_ten',
    'is_sighter',
    'clock_direction',
    'x_mm',
    'y_mm',
    'radial_distance_mm',
    'muzzle_velocity_mps',
    'flight_time_ms',
    'timestamp_epoch',
  ];

  const rows = shots.map((s) => [
    s.shotNumber,
    laneId,
    spec.code,
    s.decimalScore.toFixed(1),
    s.score,
    s.isInnerTen ? 1 : 0,
    s.isSighter ? 1 : 0,
    `"${s.clock}"`,
    s.xMm.toFixed(2),
    s.yMm.toFixed(2),
    s.radialDistanceMm.toFixed(2),
    s.muzzleVelocityMps ?? '',
    s.flightTimeMs ?? '',
    s.timestamp,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Exports full session telemetry in structured JSON format.
 */
export function generateSessionJson(
  shots: Shot[],
  targetType: TargetTypeCode = 'air_pistol_10m',
  laneId: string = '1'
): string {
  const summary = generateSessionSummary(shots, targetType, laneId);
  return JSON.stringify(
    {
      app: 'Marksman Target Camera',
      version: '1.2.0',
      summary,
      shots,
    },
    null,
    2
  );
}

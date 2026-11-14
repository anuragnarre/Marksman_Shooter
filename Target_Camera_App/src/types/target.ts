export type TargetTypeCode = 
  | 'air_rifle_10m' 
  | 'air_pistol_10m' 
  | 'rapid_fire_25m' 
  | 'precision_50m' 
  | 'nra_b8';

export interface RingSpec {
  ring: number;
  radiusMm: number;
}

export interface TargetSpec {
  code: TargetTypeCode;
  name: string;
  discipline: string;
  distanceM: number;
  totalDiameterMm: number;
  bullseyeDiameterMm: number; // Black center
  innerTenRadiusMm: number;
  rings: RingSpec[];
}

export const TARGET_SPECS: Record<TargetTypeCode, TargetSpec> = {
  air_rifle_10m: {
    code: 'air_rifle_10m',
    name: 'ISSF 10m Air Rifle',
    discipline: 'Rifle',
    distanceM: 10,
    totalDiameterMm: 45.5,
    bullseyeDiameterMm: 30.5, // 4-ring to 10-ring is black
    innerTenRadiusMm: 0.25,
    rings: [
      { ring: 10, radiusMm: 0.25 },
      { ring: 9, radiusMm: 2.75 },
      { ring: 8, radiusMm: 5.25 },
      { ring: 7, radiusMm: 7.75 },
      { ring: 6, radiusMm: 10.25 },
      { ring: 5, radiusMm: 12.75 },
      { ring: 4, radiusMm: 15.25 },
      { ring: 3, radiusMm: 17.75 },
      { ring: 2, radiusMm: 20.25 },
      { ring: 1, radiusMm: 22.75 },
    ],
  },
  air_pistol_10m: {
    code: 'air_pistol_10m',
    name: 'ISSF 10m Air Pistol',
    discipline: 'Pistol',
    distanceM: 10,
    totalDiameterMm: 155.5,
    bullseyeDiameterMm: 59.5, // 7-ring to 10-ring is black
    innerTenRadiusMm: 2.5,
    rings: [
      { ring: 10, radiusMm: 5.75 },
      { ring: 9, radiusMm: 13.75 },
      { ring: 8, radiusMm: 21.75 },
      { ring: 7, radiusMm: 29.75 },
      { ring: 6, radiusMm: 37.75 },
      { ring: 5, radiusMm: 45.75 },
      { ring: 4, radiusMm: 53.75 },
      { ring: 3, radiusMm: 61.75 },
      { ring: 2, radiusMm: 69.75 },
      { ring: 1, radiusMm: 77.75 },
    ],
  },
  rapid_fire_25m: {
    code: 'rapid_fire_25m',
    name: 'ISSF 25m Rapid Fire Pistol',
    discipline: 'Pistol',
    distanceM: 25,
    totalDiameterMm: 500,
    bullseyeDiameterMm: 500, // Entire scoring area is black
    innerTenRadiusMm: 25,
    rings: [
      { ring: 10, radiusMm: 50 },
      { ring: 9, radiusMm: 90 },
      { ring: 8, radiusMm: 130 },
      { ring: 7, radiusMm: 170 },
      { ring: 6, radiusMm: 210 },
      { ring: 5, radiusMm: 250 },
    ],
  },
  precision_50m: {
    code: 'precision_50m',
    name: 'ISSF 50m Precision Rifle',
    discipline: 'Rifle',
    distanceM: 50,
    totalDiameterMm: 154.4,
    bullseyeDiameterMm: 112.4, // 3-ring to 10-ring is black
    innerTenRadiusMm: 2.5,
    rings: [
      { ring: 10, radiusMm: 5.2 },
      { ring: 9, radiusMm: 13.2 },
      { ring: 8, radiusMm: 21.2 },
      { ring: 7, radiusMm: 29.2 },
      { ring: 6, radiusMm: 37.2 },
      { ring: 5, radiusMm: 45.2 },
      { ring: 4, radiusMm: 53.2 },
      { ring: 3, radiusMm: 61.2 },
      { ring: 2, radiusMm: 69.2 },
      { ring: 1, radiusMm: 77.2 },
    ],
  },
  nra_b8: {
    code: 'nra_b8',
    name: 'NRA B-8 25yd Timed & Rapid',
    discipline: 'Tactical / Handgun',
    distanceM: 22.86, // 25yd
    totalDiameterMm: 533.4,
    bullseyeDiameterMm: 279.4, // 9, 10, X rings black
    innerTenRadiusMm: 21.6, // X-ring
    rings: [
      { ring: 10, radiusMm: 43.2 }, // 10 ring
      { ring: 9, radiusMm: 68.6 },
      { ring: 8, radiusMm: 101.6 },
      { ring: 7, radiusMm: 139.7 },
      { ring: 6, radiusMm: 177.8 },
      { ring: 5, radiusMm: 228.6 },
    ],
  },
};

export interface Point2D {
  x: number;
  y: number;
}

export interface CalibrationCorners {
  topLeft: Point2D;
  topRight: Point2D;
  bottomRight: Point2D;
  bottomLeft: Point2D;
  isCalibrated: boolean;
}

export interface Shot {
  id: string;
  shotNumber: number;
  xMm: number; // mm from center (+ right, - left)
  yMm: number; // mm from center (+ down, - up)
  normalizedX: number; // -1.0 to +1.0
  normalizedY: number; // -1.0 to +1.0
  score: number; // Integer ring (e.g. 10)
  decimalScore: number; // ISSF decimal (e.g. 10.7)
  isInnerTen: boolean;
  clock: string; // e.g. "10 o'clock", "Center"
  radialDistanceMm: number;
  caliberMm: number;
  timestamp: number;
  flightTimeMs?: number; // In-flight duration from muzzle crack to impact (ms)
  muzzleVelocityMps?: number; // Calculated muzzle velocity (m/s)
  acousticTriggered?: boolean; // Whether shot was triggered by acoustic sensor
  isSighter?: boolean; // True if designated as unscored sighter shot
}

export interface SightCorrection {
  mpiX: number; // Mean Point of Impact X offset in mm
  mpiY: number; // Mean Point of Impact Y offset in mm
  mpiRadiusMm: number; // Distance of group centroid from dead center
  windageClicks: number;
  windageDirection: 'LEFT' | 'RIGHT' | 'CENTER';
  elevationClicks: number;
  elevationDirection: 'UP' | 'DOWN' | 'CENTER';
  adviceSummary: string;
  tightnessRating: 'MATCH_GRADE' | 'EXCELLENT' | 'GOOD' | 'DISPERSED';
}

export interface SeriesScore {
  seriesNumber: number;
  shots: Shot[];
  decimalTotal: number;
  integerTotal: number;
  innerTens: number;
  extremeSpreadMm: number;
  meanRadiusMm: number;
}

export type MatchDisciplineMode = 'PRACTICE' | 'SIGHTER' | 'MATCH_10' | 'MATCH_20' | 'MATCH_40' | 'MATCH_60';

export type MatchTimerPreset =
  | 'ISSF_60_SHOTS'
  | 'ISSF_40_SHOTS'
  | 'ISSF_PREP_SIGHT'
  | 'ISSF_SERIES_5M'
  | 'RAPID_FIRE_8S'
  | 'RAPID_FIRE_6S'
  | 'RAPID_FIRE_4S'
  | 'CUSTOM';

export interface MatchTimerConfig {
  preset: MatchTimerPreset;
  label: string;
  durationSeconds: number;
  description: string;
}

export const MATCH_TIMER_PRESETS: Record<MatchTimerPreset, MatchTimerConfig> = {
  ISSF_60_SHOTS: {
    preset: 'ISSF_60_SHOTS',
    label: '60 Shots (75m)',
    durationSeconds: 4500,
    description: 'ISSF 10m Air Rifle / Air Pistol 60-shot qualification match (75 mins)',
  },
  ISSF_40_SHOTS: {
    preset: 'ISSF_40_SHOTS',
    label: '40 Shots (50m)',
    durationSeconds: 3000,
    description: 'ISSF Junior / Masters 40-shot qualification match (50 mins)',
  },
  ISSF_PREP_SIGHT: {
    preset: 'ISSF_PREP_SIGHT',
    label: 'Prep & Sight (15m)',
    durationSeconds: 900,
    description: 'Preparation and sighting time before match competition (15 mins)',
  },
  ISSF_SERIES_5M: {
    preset: 'ISSF_SERIES_5M',
    label: '5-Shot Series (5m)',
    durationSeconds: 300,
    description: 'Precision stage 5-shot series (5 mins)',
  },
  RAPID_FIRE_8S: {
    preset: 'RAPID_FIRE_8S',
    label: 'Rapid Fire (8s)',
    durationSeconds: 8,
    description: '25m Rapid Fire stage 1: 5 shots in 8 seconds',
  },
  RAPID_FIRE_6S: {
    preset: 'RAPID_FIRE_6S',
    label: 'Rapid Fire (6s)',
    durationSeconds: 6,
    description: '25m Rapid Fire stage 2: 5 shots in 6 seconds',
  },
  RAPID_FIRE_4S: {
    preset: 'RAPID_FIRE_4S',
    label: 'Rapid Fire (4s)',
    durationSeconds: 4,
    description: '25m Rapid Fire stage 3: 5 shots in 4 seconds',
  },
  CUSTOM: {
    preset: 'CUSTOM',
    label: 'Custom Timer',
    durationSeconds: 600,
    description: 'User specified training drill interval',
  },
};

export interface SessionSummary {
  laneId: string;
  targetType: TargetTypeCode;
  targetName: string;
  timestamp: number;
  totalShots: number;
  matchShotsCount: number;
  sighterShotsCount: number;
  totalScore: number;
  decimalTotal: number;
  innerTensCount: number;
  averageScore: number;
  extremeSpreadMm: number;
  meanRadiusMm: number;
  series: SeriesScore[];
  sightCorrection: SightCorrection;
}

export interface TargetTelemetryPayload {
  laneId: string;
  targetType: TargetTypeCode;
  shot: Shot;
  totalShots: number;
  runningTotalScore: number;
  extremeSpreadMm: number;
  meanRadiusMm: number;
}

export type WiFiFrequencyBand = '2.4GHz' | '5GHz' | '6GHz+' | 'AUTO_DETECT';
export type VideoComputationMode = 'SERVER_VISION' | 'ON_DEVICE_EDGE' | 'HYBRID_EDGE_STREAM';
export type MountingMode = 'OVERHEAD_DOWN' | 'OVERHEAD_UP' | 'WALL_RIG';

export interface OrientationReading {
  rollDeg: number;
  pitchDeg: number;
  gx: number;
  gy: number;
  gz: number;
  totalG: number;
  mountingMode: MountingMode;
}

export interface AudioReading {
  rmsDb: number;
  peakDb: number;
  dbfs: number;
  timestamp: number;
}

export interface CvFrameStats {
  lumaAvg: number;
  contrastScore: number;
  sharpnessScore: number;
  baselineLocked: boolean;
  cameraMoved?: boolean;
  hasImpact?: boolean;
  normU?: number;
  normV?: number;
  clusterPixels?: number;
  impactConfidence?: number;
  meanAbsDiff?: number;
  message: string;
}


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


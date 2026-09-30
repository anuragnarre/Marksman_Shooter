export type TargetType = '10m_air_rifle' | '10m_air_pistol';

export interface TargetSpec {
  id: TargetType;
  name: string;
  pelletDiameter: number;
  innerTenDiameter: number;
  tenRingDiameter: number;
  ringThickness: number;
  decimalStep: number;
  maxScore: number;
  ringsCount: number;
  blackAreaStartRing: number;
}

export const TARGET_SPECS: Record<TargetType, TargetSpec> = {
  '10m_air_rifle': {
    id: '10m_air_rifle',
    name: 'ISSF 10m Air Rifle',
    pelletDiameter: 4.5,
    innerTenDiameter: 0.5,
    tenRingDiameter: 0.5,
    ringThickness: 2.5, // (5.5 - 0.5) / 2
    decimalStep: 0.25,  // 2.5mm thickness / 10 decimal steps
    maxScore: 10.9,
    ringsCount: 10,
    blackAreaStartRing: 4, // Rings 4-9 are black (30.5mm diameter)
  },
  '10m_air_pistol': {
    id: '10m_air_pistol',
    name: 'ISSF 10m Air Pistol',
    pelletDiameter: 4.5,
    innerTenDiameter: 5.0,
    tenRingDiameter: 11.5,
    ringThickness: 8.0, // (27.5 - 11.5) / 2
    decimalStep: 0.8, // 8.0mm thickness / 10 decimal steps
    maxScore: 10.9,
    ringsCount: 10,
    blackAreaStartRing: 7, // Rings 7-10 are black (59.5mm diameter)
  },
};

export interface ShotCoordinates {
  x: number; // in mm relative to center (0,0)
  y: number; // in mm relative to center (0,0)
}

export interface ShotResult {
  score: number;
  isInnerTen: boolean;
  distance: number;
}

/**
 * Calculates the score of a shot based on the target specifications.
 * @param shot x,y coordinates in mm from the center
 * @param targetType the target type spec ID
 * @returns ShotResult with decimal score
 */
export function calculateScore(shot: ShotCoordinates, targetType: TargetType): ShotResult {
  const spec = TARGET_SPECS[targetType];
  const distance = Math.sqrt(shot.x * shot.x + shot.y * shot.y);
  
  const max10Distance = (spec.tenRingDiameter / 2) + (spec.pelletDiameter / 2);
  
  if (distance <= spec.innerTenDiameter / 2) {
    // Technically inner ten distance includes pellet radius, 
    // but simplified here for exact center grouping check.
  }
  
  // Calculate decimal score
  // If distance > max10Distance, it drops below 10.0
  // D <= max10Distance -> 10.0
  // D <= max10Distance - 0.25 -> 10.1 (for rifle)
  
  const distancePastTen = distance - max10Distance;
  
  let score = 0;
  
  if (distancePastTen <= 0) {
    // It's a 10.x
    const decimalDrops = Math.floor(distance / spec.decimalStep);
    score = 10.9 - (decimalDrops * 0.1);
    if (score > 10.9) score = 10.9;
    if (score < 10.0) score = 10.0;
  } else {
    // 9.9 or lower
    const ringsOut = distancePastTen / spec.ringThickness;
    const decimalDrops = Math.ceil(ringsOut * 10);
    score = 9.9 - ((decimalDrops - 1) * 0.1);
    if (score < 0) score = 0;
  }
  
  score = Math.round(score * 10) / 10;
  
  const isInnerTen = distance <= ((spec.innerTenDiameter / 2) + (spec.pelletDiameter / 2));

  return {
    score,
    isInnerTen,
    distance,
  };
}

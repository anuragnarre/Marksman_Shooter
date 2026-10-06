export declare class AtmosphericConditionsDto {
    temp?: number;
    humidity?: number;
    altitude?: number;
    windSpeedMph?: number;
    windAngleDeg?: number;
}
export declare class CreateBallisticsDto {
    weaponType: string;
    caliber: string;
    bulletWeightGrains: number;
    muzzleVelocityFps: number;
    ballisticCoefficient: number;
    zeroDistanceYards: number;
    atmosphericConditions?: AtmosphericConditionsDto;
}

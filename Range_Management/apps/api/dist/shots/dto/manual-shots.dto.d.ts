export declare class ShotEntryDto {
    shotNumber: number;
    score: number;
    x?: number;
    y?: number;
}
export declare class ManualShotsDto {
    sessionId: string;
    shots: ShotEntryDto[];
}

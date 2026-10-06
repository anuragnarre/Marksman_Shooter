declare class ManagedShotEntryDto {
    shotNumber: number;
    score: number;
    x?: number;
    y?: number;
}
export declare class CreateManagedShotsDto {
    shots: ManagedShotEntryDto[];
}
export {};

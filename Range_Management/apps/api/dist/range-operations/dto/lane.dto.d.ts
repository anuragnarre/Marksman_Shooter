export declare enum LaneStatus {
    AVAILABLE = "AVAILABLE",
    OCCUPIED = "OCCUPIED",
    MAINTENANCE = "MAINTENANCE"
}
export declare class CreateLaneDto {
    laneNumber: number;
    name?: string;
    status?: string;
    maxCaliber?: string;
}
export declare class UpdateLaneStatusDto {
    status: string;
    shooterId?: string;
    sessionType?: string;
}

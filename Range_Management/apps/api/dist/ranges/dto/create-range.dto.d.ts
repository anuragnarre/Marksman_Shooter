export declare enum RangeStatus {
    Active = "Active",
    Inactive = "Inactive",
    Maintenance = "Maintenance"
}
export declare class CreateRangeDto {
    name: string;
    status?: RangeStatus;
    maxDistance?: number;
    altitude?: number;
    gpsCoordinates?: string;
    typicalWindDir?: string;
    maxCaliber?: string;
}

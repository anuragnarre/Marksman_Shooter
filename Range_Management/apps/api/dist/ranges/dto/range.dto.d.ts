export declare class CreateRangeDto {
    name: string;
    address?: string;
    phone?: string;
}
export declare class CreateLaneDto {
    laneNumber: number;
    name?: string;
    deviceId?: string;
}
export declare class WalkInGuestDto {
    name: string;
    email?: string;
    laneId: string;
}
export declare class BookLaneDto {
    laneId: string;
    userId: string;
    startTime: string;
    endTime: string;
}
export declare class UpdateLaneDto {
    name?: string;
    deviceId?: string;
    status?: string;
    notes?: string;
}
export declare class LogLaneInspectionDto {
    passed: boolean;
    notes?: string;
    checklistResult?: string;
}

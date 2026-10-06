export declare class SetOperatingHoursDto {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    slotDurationMinutes?: number;
    isOpen?: boolean;
}
export declare class CreateTimeSlotDto {
    laneId?: string;
    startTime: string;
    endTime: string;
    capacity?: number;
    slotType?: string;
}
export declare class CreateBookingDto {
    slotId: string;
    laneId?: string;
    rangeId?: string;
    numberOfShooters?: number;
    notes?: string;
    recurringType?: string;
}
export declare class CancelBookingDto {
    reason?: string;
}
export declare class CheckInBookingDto {
    laneId?: string;
}
export declare class WalkInCheckInDto {
    userId: string;
    numberOfShooters?: number;
}

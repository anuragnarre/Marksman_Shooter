import { BookingService } from '../ranges/booking.service';
import { JwtPayload } from '@shooting-platform/shared-types';
import { CreateBookingDto, CancelBookingDto, CheckInBookingDto } from '../ranges/dto/booking.dto';
export declare class BookingsController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(user: JwtPayload, dto: CreateBookingDto): Promise<{
        waitlisted: boolean;
        position: number;
        slotId: string;
    } | {
        qrData: string;
        id: string;
        createdAt: Date;
        userId: string;
        recurringGroupId: string | null;
        updatedAt: Date;
        status: string;
        notes: string | null;
        laneId: string | null;
        slotId: string;
        numberOfShooters: number;
        recurringType: string;
        bookingReference: string;
        paymentId: string | null;
        checkInAt: Date | null;
        waitlisted?: undefined;
        position?: undefined;
    }>;
    getMyBookings(user: JwtPayload): Promise<({
        lane: {
            name: string | null;
            laneNumber: number;
        } | null;
        slot: {
            id: string;
            rangeId: string;
            status: string;
            laneId: string | null;
            startTime: Date;
            endTime: Date;
            capacity: number;
            slotType: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        recurringGroupId: string | null;
        updatedAt: Date;
        status: string;
        notes: string | null;
        laneId: string | null;
        slotId: string;
        numberOfShooters: number;
        recurringType: string;
        bookingReference: string;
        paymentId: string | null;
        checkInAt: Date | null;
    })[]>;
    cancelBooking(id: string, user: JwtPayload, dto: CancelBookingDto): Promise<{
        cancelled: boolean;
        bookingId: string;
    }>;
    checkIn(id: string, dto: CheckInBookingDto): Promise<{
        lane: {
            name: string | null;
            id: string;
            createdAt: Date;
            rangeId: string;
            updatedAt: Date;
            status: string;
            notes: string | null;
            laneNumber: number;
            deviceId: string | null;
            activeSessionId: string | null;
            targetFrameType: string | null;
            maxCaliber: string | null;
            supportedDistances: number[];
            lastInspectedAt: Date | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        recurringGroupId: string | null;
        updatedAt: Date;
        status: string;
        notes: string | null;
        laneId: string | null;
        slotId: string;
        numberOfShooters: number;
        recurringType: string;
        bookingReference: string;
        paymentId: string | null;
        checkInAt: Date | null;
    }>;
}

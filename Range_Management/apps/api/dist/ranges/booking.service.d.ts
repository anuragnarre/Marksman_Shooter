import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, CancelBookingDto, CheckInBookingDto, CreateTimeSlotDto, SetOperatingHoursDto } from './dto/booking.dto';
export declare class BookingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private generateRef;
    generateFutureSlots(): Promise<void>;
    private generateSlotsForDay;
    setOperatingHours(rangeId: string, dto: SetOperatingHoursDto): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        updatedAt: Date;
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        slotDurationMinutes: number;
        isOpen: boolean;
    }>;
    getOperatingHours(rangeId: string): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        updatedAt: Date;
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        slotDurationMinutes: number;
        isOpen: boolean;
    }[]>;
    createTimeSlot(rangeId: string, dto: CreateTimeSlotDto): Promise<{
        id: string;
        rangeId: string;
        status: string;
        laneId: string | null;
        startTime: Date;
        endTime: Date;
        capacity: number;
        slotType: string;
    }>;
    getAvailability(rangeId: string, date: string): Promise<{
        id: string;
        laneId: string | null;
        laneNumber: number | undefined;
        laneName: string | null | undefined;
        startTime: Date;
        endTime: Date;
        capacity: number;
        bookedCount: number;
        available: boolean;
        status: string;
        slotType: string;
    }[]>;
    createBooking(userId: string, dto: CreateBookingDto): Promise<{
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
    private createRecurringBookings;
    getMyBookings(userId: string): Promise<({
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
    cancelBooking(bookingId: string, userId: string, dto: CancelBookingDto): Promise<{
        cancelled: boolean;
        bookingId: string;
    }>;
    checkInBooking(bookingId: string, dto: CheckInBookingDto): Promise<{
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
    walkInCheckIn(rangeId: string, userId: string, numberOfShooters?: number): Promise<{
        status: string;
        message: string;
        position?: undefined;
        estimatedWait?: undefined;
        bookingId?: undefined;
        bookingReference?: undefined;
        laneNumber?: undefined;
        qrData?: undefined;
    } | {
        status: string;
        position: number;
        estimatedWait: number;
        message?: undefined;
        bookingId?: undefined;
        bookingReference?: undefined;
        laneNumber?: undefined;
        qrData?: undefined;
    } | {
        status: string;
        bookingId: string;
        bookingReference: string;
        laneNumber: number | undefined;
        qrData: string;
        message?: undefined;
        position?: undefined;
        estimatedWait?: undefined;
    }>;
    validateAccess(rangeId: string, userId: string): Promise<{
        allowed: boolean;
        tier: string;
        reason: string;
    }>;
    checkMembershipExpirations(): Promise<boolean>;
}

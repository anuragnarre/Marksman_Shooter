import { PrismaService } from '../prisma/prisma.service';
export declare class RangeOperationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkWaitlistCapacity(): Promise<void>;
    generateRecurringMaintenance(): Promise<void>;
    getStaffShifts(rangeId: string, start?: string, end?: string): Promise<({
        user: {
            name: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
        };
    } & {
        role: string;
        id: string;
        createdAt: Date;
        userId: string;
        rangeId: string;
        status: string;
        notes: string | null;
        startTime: Date;
        endTime: Date;
        clockIn: Date | null;
        clockOut: Date | null;
    })[]>;
    createStaffShift(rangeId: string, data: any): Promise<{
        role: string;
        id: string;
        createdAt: Date;
        userId: string;
        rangeId: string;
        status: string;
        notes: string | null;
        startTime: Date;
        endTime: Date;
        clockIn: Date | null;
        clockOut: Date | null;
    }>;
    clockInStaff(shiftId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    clockOutStaff(shiftId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getBookings(rangeId: string): Promise<{
        id: string;
        laneId: string;
        startTime: string;
        endTime: string;
        shooterName: string;
        type: string;
        status: string;
        caliber: string;
    }[]>;
    getScheduleRequests(rangeId: string): Promise<{
        id: string;
        shooterName: string;
        requestedDate: string;
        requestedTime: string;
        status: string;
    }[]>;
    getLanes(rangeId: string): Promise<({
        device: {
            apiKey: string;
            id: string;
            createdAt: Date;
            userId: string;
            isActive: boolean;
            deviceName: string;
            deviceType: import(".prisma/client").$Enums.DeviceType;
            lastSeenAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
        activeSession: ({
            shooter: {
                name: string;
                role: import(".prisma/client").$Enums.Role;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            shooterId: string;
            discipline: string;
            distance: number;
            weaponType: string;
            numberOfShots: number;
            sessionDate: Date;
            trainingMode: string | null;
            deletedAt: Date | null;
            rangeId: string | null;
            competitionEntryId: string | null;
        }) | null;
    } & {
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
    })[]>;
    updateLaneStatus(laneId: string, status: string, shooterId?: string, sessionType?: string): Promise<{
        activeSession: ({
            shooter: {
                name: string;
                role: import(".prisma/client").$Enums.Role;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            shooterId: string;
            discipline: string;
            distance: number;
            weaponType: string;
            numberOfShots: number;
            sessionDate: Date;
            trainingMode: string | null;
            deletedAt: Date | null;
            rangeId: string | null;
            competitionEntryId: string | null;
        }) | null;
    } & {
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
    }>;
    getWaitlist(rangeId: string): Promise<({
        user: {
            name: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
        };
    } & {
        id: string;
        userId: string;
        slotId: string;
        position: number;
        joinedAt: Date;
        notifiedAt: Date | null;
    })[]>;
    getDashboardStats(rangeId: string): Promise<{
        utilization: {
            totalLanes: number;
            activeLanes: number;
            percentage: number;
        };
        waitlistDepth: number;
        dailyCheckins: number;
        rsoCoverage: {
            active: number;
            scheduled: number;
        };
        rangeStatus: string;
    }>;
    updateRangeStatus(rangeId: string, status: string): Promise<{
        success: boolean;
        status: string;
    }>;
    searchMembers(query: string): Promise<{
        id: string;
        name: string;
        email: string;
        memberId: string;
        type: string;
        status: string;
        waiverSigned: boolean;
        photoUrl: string;
    }[]>;
    checkInMember(rangeId: string, userId: string, partySize?: number): Promise<{
        status: string;
        laneNumber: number | undefined;
        bookingId: string;
        message?: undefined;
        position?: undefined;
        estimatedWait?: undefined;
    } | {
        status: string;
        message: string;
        laneNumber?: undefined;
        bookingId?: undefined;
        position?: undefined;
        estimatedWait?: undefined;
    } | {
        status: string;
        position: number;
        estimatedWait: number;
        laneNumber?: undefined;
        bookingId?: undefined;
        message?: undefined;
    }>;
    getIncidents(rangeId: string): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        description: string;
        status: string;
        type: string;
        laneId: string | null;
        reporterId: string;
        incidentDate: Date;
        severity: string;
    }[]>;
    createIncident(rangeId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        description: string;
        status: string;
        type: string;
        laneId: string | null;
        reporterId: string;
        incidentDate: Date;
        severity: string;
    }>;
    getSafetyRules(rangeId: string): Promise<{
        id: string;
        rangeId: string;
        title: string;
        description: string;
        category: string;
        order: number;
        isMandatory: boolean;
    }[]>;
    getInventory(rangeId: string): Promise<{
        id: string;
        rangeId: string;
        updatedAt: Date;
        quantity: number;
        itemName: string;
        minThreshold: number;
    }[]>;
    addInventoryItem(rangeId: string, data: any): Promise<{
        id: string;
        rangeId: string;
        updatedAt: Date;
        quantity: number;
        itemName: string;
        minThreshold: number;
    }>;
    updateInventoryItem(itemId: string, data: any): Promise<{
        id: string;
        rangeId: string;
        updatedAt: Date;
        quantity: number;
        itemName: string;
        minThreshold: number;
    }>;
}

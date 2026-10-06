import { RangesService } from './ranges.service';
import { BookingService } from './booking.service';
import { WeatherService } from './weather.service';
import { RangeAnalyticsService } from './range-analytics.service';
import { AnnouncementService } from './announcement.service';
import { JwtPayload } from '@shooting-platform/shared-types';
import { CreateRangeDto, CreateLaneDto, BookLaneDto, UpdateLaneDto, LogLaneInspectionDto } from './dto/range.dto';
import { CreateTimeSlotDto, SetOperatingHoursDto, WalkInCheckInDto } from './dto/booking.dto';
import { CreateAnnouncementDto } from './dto/announcement.dto';
export declare class RangesController {
    private readonly rangesService;
    private readonly bookingService;
    private readonly weatherService;
    private readonly analyticsService;
    private readonly announcementService;
    constructor(rangesService: RangesService, bookingService: BookingService, weatherService: WeatherService, analyticsService: RangeAnalyticsService, announcementService: AnnouncementService);
    createRange(user: JwtPayload, dto: CreateRangeDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        code: string;
        rangeStatus: string;
        ownerId: string;
        address: string | null;
        phone: string | null;
        gpsCoordinates: string | null;
        maxLanes: number | null;
        isActive: boolean;
        organizationId: string | null;
    }>;
    getMyRanges(user: JwtPayload): Promise<({
        lanes: {
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
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        code: string;
        rangeStatus: string;
        ownerId: string;
        address: string | null;
        phone: string | null;
        gpsCoordinates: string | null;
        maxLanes: number | null;
        isActive: boolean;
        organizationId: string | null;
    })[]>;
    getRangeDetails(id: string): Promise<{
        bookings: ({
            user: {
                name: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
                id: string;
                googleId: string | null;
                claimToken: string | null;
                passwordHash: string | null;
                createdAt: Date;
                totpSecret: string | null;
                isTwoFactorEnabled: boolean;
                isGuest: boolean;
                managedByRangeId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            rangeId: string;
            updatedAt: Date;
            laneId: string | null;
            startTime: Date;
            endTime: Date;
            amount: number;
            paymentStatus: string;
        })[];
        lanes: ({
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
                    email: string;
                    role: import(".prisma/client").$Enums.Role;
                    id: string;
                    googleId: string | null;
                    claimToken: string | null;
                    passwordHash: string | null;
                    createdAt: Date;
                    totpSecret: string | null;
                    isTwoFactorEnabled: boolean;
                    isGuest: boolean;
                    managedByRangeId: string | null;
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
        })[];
        managedGuests: {
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
            googleId: string | null;
            claimToken: string | null;
            passwordHash: string | null;
            createdAt: Date;
            totpSecret: string | null;
            isTwoFactorEnabled: boolean;
            isGuest: boolean;
            managedByRangeId: string | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        updatedAt: Date;
        code: string;
        rangeStatus: string;
        ownerId: string;
        address: string | null;
        phone: string | null;
        gpsCoordinates: string | null;
        maxLanes: number | null;
        isActive: boolean;
        organizationId: string | null;
    }>;
    createLane(id: string, dto: CreateLaneDto): Promise<{
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
    getLanes(id: string): Promise<({
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
    getLiveLanes(id: string): Promise<({
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
    updateLane(laneId: string, body: UpdateLaneDto): Promise<{
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
    updateLaneStatus(laneId: string, status: string): Promise<{
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
    logLaneInspection(rangeId: string, laneId: string, user: JwtPayload, body: LogLaneInspectionDto): Promise<{
        id: string;
        status: string;
        notes: string | null;
        laneId: string;
        inspectionDate: Date;
        photos: string[];
        rsoId: string;
    }>;
    linkSessionToLane(laneId: string, sessionId: string): Promise<{
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
    clearLane(laneId: string): Promise<{
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
    getOperatingHours(id: string): Promise<{
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
    setOperatingHours(id: string, dto: SetOperatingHoursDto): Promise<{
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
    createTimeSlot(id: string, dto: CreateTimeSlotDto): Promise<{
        id: string;
        rangeId: string;
        status: string;
        laneId: string | null;
        startTime: Date;
        endTime: Date;
        capacity: number;
        slotType: string;
    }>;
    getAvailability(id: string, date: string): Promise<{
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
    walkInCheckIn(id: string, dto: WalkInCheckInDto): Promise<{
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
    validateAccess(id: string, userId: string): Promise<{
        allowed: boolean;
        tier: string;
        reason: string;
    }>;
    getCurrentWeather(id: string): Promise<import("./weather.service").WeatherData | null>;
    getWeatherForecast(id: string): Promise<object | null>;
    getEnvironmentLog(id: string, from?: string, to?: string): Promise<{
        id: string;
        rangeId: string;
        temperature: number | null;
        humidity: number | null;
        windSpeed: number | null;
        windDirection: number | null;
        pressure: number | null;
        visibility: number | null;
        recordedAt: Date;
    }[]>;
    getWindScoreCorrelation(id: string): Promise<({
        windSpeed: number;
        avgScore: number;
        sessionId: string;
        sessionDate: Date;
    } | null)[]>;
    getDashboardKpis(id: string): Promise<{
        laneUtilization: {
            total: number;
            active: number;
            maintenance: number;
            available: number;
            pct: number;
        };
        bookingsToday: number;
        activeMembers: number;
        monthlyCheckins: number;
        activeRSOs: number;
        rangeStatus: string;
    }>;
    getHourlyUtilization(id: string): Promise<{
        hour: number;
        label: string;
        laneHours: number;
    }[]>;
    getHeatmap(id: string): Promise<{
        days: string[];
        hours: string[];
        matrix: number[][];
    }>;
    getMemberRetention(id: string): Promise<{
        d30: any[];
        d60: any[];
        d90: any[];
    }>;
    getRevenueBreakdown(id: string, from?: string, to?: string): Promise<{
        period: {
            from: Date;
            to: Date;
        };
        laneBookings: {
            total: number;
            count: number;
        };
        memberships: {
            total: number;
            count: number;
            byTier: Record<string, number>;
        };
        grandTotal: number;
    }>;
    getUpcomingClosures(id: string): Promise<{
        maintenanceTasks: ({
            lane: {
                laneNumber: number;
            } | null;
            assignedTo: {
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            rangeId: string;
            title: string;
            description: string | null;
            updatedAt: Date;
            status: string;
            laneId: string | null;
            frequency: string;
            nextDueDate: Date;
            assignedToId: string | null;
        })[];
        announcements: {
            id: string;
            createdAt: Date;
            rangeId: string;
            title: string;
            createdById: string;
            isActive: boolean;
            type: string;
            body: string;
            startsAt: Date | null;
            endsAt: Date | null;
        }[];
    }>;
    createAnnouncement(id: string, user: JwtPayload, dto: CreateAnnouncementDto): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        title: string;
        createdById: string;
        isActive: boolean;
        type: string;
        body: string;
        startsAt: Date | null;
        endsAt: Date | null;
    }>;
    getAnnouncements(id: string): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        title: string;
        createdById: string;
        isActive: boolean;
        type: string;
        body: string;
        startsAt: Date | null;
        endsAt: Date | null;
    }[]>;
    deleteAnnouncement(id: string, announcementId: string): Promise<{
        id: string;
        createdAt: Date;
        rangeId: string;
        title: string;
        createdById: string;
        isActive: boolean;
        type: string;
        body: string;
        startsAt: Date | null;
        endsAt: Date | null;
    }>;
    bookLane(id: string, dto: BookLaneDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        rangeId: string;
        updatedAt: Date;
        laneId: string | null;
        startTime: Date;
        endTime: Date;
        amount: number;
        paymentStatus: string;
    }>;
    getLeaderboard(id: string): Promise<{
        rank: number;
        alias: string;
        elo: number;
        discipline: string;
    }[]>;
    getDigitalMembershipCard(req: any): Promise<{
        signedUrl: string;
        expiry: number;
    }>;
    createManualSlot(id: string, body: any): Promise<{
        success: boolean;
        rangeId: string;
        slotCreated: {
            startTime: any;
            endTime: any;
            laneId: any;
        };
    }>;
    updateRangeRules(id: string, rules: string): Promise<{
        success: boolean;
        rangeId: string;
        rulesUpdated: boolean;
    }>;
    getRangeRules(id: string): Promise<{
        rangeId: string;
        rules: string;
    }>;
    issueGuestPass(id: string, guestName: string, validUntil: string): Promise<{
        success: boolean;
        passId: string;
        guestName: string;
        validUntil: string;
    }>;
}

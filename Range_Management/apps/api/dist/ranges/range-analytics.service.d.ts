import { PrismaService } from '../prisma/prisma.service';
export declare class RangeAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardKpis(rangeId: string): Promise<{
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
    getHourlyUtilization(rangeId: string): Promise<{
        hour: number;
        label: string;
        laneHours: number;
    }[]>;
    getHeatmap(rangeId: string): Promise<{
        days: string[];
        hours: string[];
        matrix: number[][];
    }>;
    getMemberRetention(rangeId: string): Promise<{
        d30: any[];
        d60: any[];
        d90: any[];
    }>;
    getRevenueBreakdown(rangeId: string, fromDate?: string, toDate?: string): Promise<{
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
    getUpcomingClosures(rangeId: string): Promise<{
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
}

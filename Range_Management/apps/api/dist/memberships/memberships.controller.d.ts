import { MembershipsService } from './memberships.service';
export declare class MembershipsController {
    private readonly membershipsService;
    constructor(membershipsService: MembershipsService);
    createTier(createTierDto: {
        name: string;
        description?: string;
        monthlyPrice: number;
        maxActiveBookings: number;
        priorityBookingDays: number;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        rangeId: string;
        price: number;
        billingPeriod: string;
        maxBookingsPerMonth: number;
        laneDiscountPct: number;
    }>;
    findAllTiers(): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        rangeId: string;
        price: number;
        billingPeriod: string;
        maxBookingsPerMonth: number;
        laneDiscountPct: number;
    }[]>;
    createSubscription(createSubDto: {
        userId: string;
        tierId: string;
        status: any;
        startDate: Date;
        endDate?: Date;
        organizationId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: string;
        tierId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        autoRenew: boolean;
    }>;
    getUserSubscription(userId: string): Promise<({
        tier: {
            name: string;
            id: string;
            createdAt: Date;
            rangeId: string;
            price: number;
            billingPeriod: string;
            maxBookingsPerMonth: number;
            laneDiscountPct: number;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: string;
        tierId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        autoRenew: boolean;
    }) | null>;
    getAllSubscriptions(): Promise<({
        user: {
            shooterProfile: {
                id: string;
                createdAt: Date;
                userId: string;
                updatedAt: Date;
                phone: string | null;
                shooterCode: string;
                primaryWeapon: string | null;
                managedByCoachId: string | null;
                isManaged: boolean;
                homeRangeId: string | null;
                dateOfBirth: Date | null;
                gender: string | null;
                dominantHand: string | null;
                eyeDominance: string | null;
                stance: string | null;
                nationality: string | null;
                profilePhotoUrl: string | null;
                backgroundCheckStatus: string | null;
                heightCm: number | null;
                weightKg: number | null;
                wingspanCm: number | null;
                emergencyContactName: string | null;
                emergencyContactPhone: string | null;
                currentStreak: number;
                longestStreak: number;
            } | null;
            name: string;
            id: string;
        };
        tier: {
            name: string;
            id: string;
            createdAt: Date;
            rangeId: string;
            price: number;
            billingPeriod: string;
            maxBookingsPerMonth: number;
            laneDiscountPct: number;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: string;
        tierId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        autoRenew: boolean;
    })[]>;
    getAllOrganizations(): Promise<({
        _count: {
            members: number;
        };
        admin: {
            name: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string | null;
        type: string;
        logoUrl: string | null;
        adminUserId: string;
    })[]>;
}

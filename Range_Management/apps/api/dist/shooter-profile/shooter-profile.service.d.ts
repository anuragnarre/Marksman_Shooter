import { PrismaService } from '../prisma/prisma.service';
export declare class ShooterProfileService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        user: {
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    } & {
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
    }>;
    getAllProfiles(): Promise<({
        user: {
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
        };
    } & {
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
    })[]>;
    getPersonalBests(userId: string): Promise<{
        id: string;
        shooterId: string;
        discipline: string;
        distance: number;
        weaponType: string;
        sessionId: string;
        score: number;
        achievedAt: Date;
    }[]>;
    getLicenses(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: string;
        type: string;
        licenseNumber: string;
        issuedBy: string;
        issuedDate: Date;
        expiryDate: Date;
    }[]>;
    updateProfile(userId: string, data: any): Promise<{
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
    }>;
    getCertifications(userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        issuedBy: string;
        issuedDate: Date;
        expiryDate: Date | null;
        credentialId: string | null;
    }[]>;
    getCompletenessScore(userId: string): Promise<{
        score: number;
        totalFields: number;
        filledFields: number;
    }>;
    getCompetitionEligibility(userId: string): Promise<{
        isEligible: boolean;
        reasons: {
            hasValidLicense: boolean;
            backgroundCleared: boolean;
            hasDateOfBirth: boolean;
        };
        ageCategory: string;
    }>;
    private calculateAgeCategory;
    getRankings(userId: string): Promise<({
        rankHistories: {
            id: string;
            createdAt: Date;
            rangeRankingId: string;
            oldEloScore: number;
            newEloScore: number;
            changeReason: string | null;
        }[];
    } & {
        id: string;
        shooterId: string;
        discipline: string;
        distance: number;
        weaponType: string;
        lastUpdated: Date;
        eloScore: number;
        rankTier: string;
    })[]>;
    getMedicalNotes(userId: string, userRole: string): Promise<{
        id: string;
        userId: string;
        lastUpdated: Date;
        conditions: string | null;
        medications: string | null;
        restrictions: string | null;
        coachOnly: boolean;
    } | null>;
    checkLicenseExpiries(): Promise<void>;
}

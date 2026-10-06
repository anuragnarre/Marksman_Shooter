import { ShooterProfileService } from './shooter-profile.service';
import { UpdateShooterProfileDto } from './dto/update-shooter-profile.dto';
export declare class ShooterProfileController {
    private readonly shooterProfileService;
    constructor(shooterProfileService: ShooterProfileService);
    getProfile(req: any): Promise<{
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
    getPersonalBests(req: any): Promise<{
        id: string;
        shooterId: string;
        discipline: string;
        distance: number;
        weaponType: string;
        sessionId: string;
        score: number;
        achievedAt: Date;
    }[]>;
    getLicenses(req: any): Promise<{
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
    getCertifications(req: any): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        issuedBy: string;
        issuedDate: Date;
        expiryDate: Date | null;
        credentialId: string | null;
    }[]>;
    getRankings(req: any): Promise<({
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
    getMedicalNotes(req: any): Promise<{
        id: string;
        userId: string;
        lastUpdated: Date;
        conditions: string | null;
        medications: string | null;
        restrictions: string | null;
        coachOnly: boolean;
    } | null>;
    getCompletenessScore(req: any): Promise<{
        score: number;
        totalFields: number;
        filledFields: number;
    }>;
    getCompetitionEligibility(req: any): Promise<{
        isEligible: boolean;
        reasons: {
            hasValidLicense: boolean;
            backgroundCleared: boolean;
            hasDateOfBirth: boolean;
        };
        ageCategory: string;
    }>;
    updateProfile(req: any, updateData: UpdateShooterProfileDto): Promise<{
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
}

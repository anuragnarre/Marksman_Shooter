import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsResult, WeaponPerformance, OverviewAnalytics, UserRole } from '@shooting-platform/shared-types';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    computeForSessionForActor(actorId: string, role: UserRole, sessionId: string): Promise<AnalyticsResult>;
    computeOverviewForActor(actorId: string, role: UserRole, shooterId?: string): Promise<OverviewAnalytics>;
    computeWeaponSummaryForActor(actorId: string, role: UserRole, shooterId?: string): Promise<WeaponPerformance[]>;
    computeForSession(sessionId: string): Promise<AnalyticsResult>;
    computeWeaponSummary(shooterId: string): Promise<WeaponPerformance[]>;
    computeOverview(shooterId: string): Promise<OverviewAnalytics>;
    private resolveShooterId;
    private assertActorCanAccessShooter;
    private assertCoachCanAccessShooter;
}

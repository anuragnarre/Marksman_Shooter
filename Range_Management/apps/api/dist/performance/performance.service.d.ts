import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SessionContextDto } from './dto/session-context.dto';
import { DeepAnalysis, TrainingPlan, UserRole } from '@shooting-platform/shared-types';
export declare class PerformanceService {
    private readonly prisma;
    private readonly analytics;
    private readonly config;
    private readonly ai;
    constructor(prisma: PrismaService, analytics: AnalyticsService, config: ConfigService);
    getDeepAnalysis(userId: string, sessionId: string, role?: UserRole, shooterIdHint?: string): Promise<DeepAnalysis>;
    saveSessionContext(userId: string, sessionId: string, dto: SessionContextDto, role?: UserRole, shooterIdHint?: string): Promise<{
        id: string;
        createdAt: Date;
        temperature: number | null;
        sessionId: string;
        heartRate: number | null;
        perceivedEffort: number | null;
        windCondition: string | null;
        notes: string | null;
    }>;
    generateTrainingPlan(userId: string, role?: UserRole, shooterId?: string): Promise<TrainingPlan>;
    getTrainingPlans(userId: string, role?: UserRole, shooterId?: string): Promise<TrainingPlan[]>;
    private resolveShooterId;
    private assertActorCanAccessShooter;
    private assertCoachCanAccessShooter;
    private formatPlan;
    private computeSlope;
    private spearmanCorrelation;
    private ranks;
    private estimateClusters;
    private kMeansInertia;
    private findWarmupEnd;
}

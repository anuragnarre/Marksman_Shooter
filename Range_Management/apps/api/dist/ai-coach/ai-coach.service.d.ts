import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AiCoachAnalysis, AiPerformanceAssistant, UserRole } from '@shooting-platform/shared-types';
export declare class AiCoachService {
    private readonly prisma;
    private readonly analyticsService;
    private readonly configService;
    private readonly ai;
    constructor(prisma: PrismaService, analyticsService: AnalyticsService, configService: ConfigService);
    analyzeSession(sessionId: string, requesterId: string, requesterRole: UserRole): Promise<AiCoachAnalysis>;
    analyzePerformance(requesterId: string, requesterRole: UserRole, shooterId?: string): Promise<AiPerformanceAssistant>;
    private resolveCoachShooter;
}

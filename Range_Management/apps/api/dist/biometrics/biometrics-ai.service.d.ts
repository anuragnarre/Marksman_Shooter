import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { BiometricsService } from './biometrics.service';
import type { AiBiometricAnalysis, AdvancedBiometricInsights } from '@shooting-platform/shared-types';
export declare class BiometricsAiService {
    private readonly prisma;
    private readonly analyticsService;
    private readonly biometricsService;
    private readonly configService;
    private ai;
    constructor(prisma: PrismaService, analyticsService: AnalyticsService, biometricsService: BiometricsService, configService: ConfigService);
    analyzeSessionBiometrics(sessionId: string, userId: string): Promise<AiBiometricAnalysis>;
    generateAdvancedInsights(userId: string, days?: number): Promise<AdvancedBiometricInsights>;
}

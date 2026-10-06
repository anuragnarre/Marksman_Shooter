import { PerformanceService } from './performance.service';
import { SessionContextDto } from './dto/session-context.dto';
import { JwtPayload } from '@shooting-platform/shared-types';
export declare class PerformanceController {
    private readonly performanceService;
    constructor(performanceService: PerformanceService);
    getDeepAnalysis(sessionId: string, user: JwtPayload, shooterId: string | undefined): Promise<import("@shooting-platform/shared-types").DeepAnalysis>;
    saveSessionContext(sessionId: string, dto: SessionContextDto, user: JwtPayload, shooterId: string | undefined): Promise<{
        id: string;
        createdAt: Date;
        temperature: number | null;
        sessionId: string;
        heartRate: number | null;
        perceivedEffort: number | null;
        windCondition: string | null;
        notes: string | null;
    }>;
    generateTrainingPlan(user: JwtPayload, shooterId: string | undefined): Promise<import("@shooting-platform/shared-types").TrainingPlan>;
    getTrainingPlans(user: JwtPayload, shooterId: string | undefined): Promise<import("@shooting-platform/shared-types").TrainingPlan[]>;
}

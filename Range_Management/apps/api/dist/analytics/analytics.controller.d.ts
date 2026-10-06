import { AnalyticsService } from './analytics.service';
import { AnalyticsResult, JwtPayload, OverviewAnalytics, WeaponPerformance } from '@shooting-platform/shared-types';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getOverview(user: JwtPayload, shooterId: string | undefined): Promise<OverviewAnalytics>;
    getSessionAnalytics(user: JwtPayload, id: string): Promise<AnalyticsResult>;
    getWeaponSummary(user: JwtPayload, shooterId: string | undefined): Promise<WeaponPerformance[]>;
}

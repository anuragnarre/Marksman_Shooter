import { AnalyticsService } from '../analytics/analytics.service';
import { SuggestionResult, UserRole } from '@shooting-platform/shared-types';
export declare class SuggestionsService {
    private readonly analyticsService;
    private readonly rulesEngine;
    constructor(analyticsService: AnalyticsService);
    getSuggestionsForUser(sessionId: string, requesterId: string, requesterRole: UserRole): Promise<SuggestionResult>;
}

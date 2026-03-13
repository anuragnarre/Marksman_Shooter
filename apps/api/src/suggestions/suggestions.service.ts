// apps/api/src/suggestions/suggestions.service.ts
import { Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { RulesEngine } from './rules.engine';
import { SuggestionResult } from '@shooting-platform/shared-types';

@Injectable()
export class SuggestionsService {
  private readonly rulesEngine = new RulesEngine();

  constructor(private readonly analyticsService: AnalyticsService) {}

  async getSuggestions(sessionId: string): Promise<SuggestionResult> {
    const analytics = await this.analyticsService.computeForSession(sessionId);
    const suggestions = this.rulesEngine.evaluate(analytics);

    return { sessionId, suggestions };
  }
}

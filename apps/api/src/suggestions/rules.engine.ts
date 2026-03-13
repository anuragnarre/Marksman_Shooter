// apps/api/src/suggestions/rules.engine.ts
import { AnalyticsResult } from '@shooting-platform/shared-types';

/**
 * RulesEngine evaluates a set of named rules against computed analytics
 * and returns actionable coaching suggestions for the shooter.
 *
 * Each rule is a private method returning a string[] (0 or 1 suggestion).
 * The public evaluate() method collects all triggered suggestions.
 */
export class RulesEngine {
  evaluate(analytics: AnalyticsResult): string[] {
    const suggestions: string[] = [];

    suggestions.push(...this.checkSightDrift(analytics));
    suggestions.push(...this.checkTriggerControl(analytics));
    suggestions.push(...this.checkEndurance(analytics));
    suggestions.push(...this.checkConsistency(analytics));

    return suggestions;
  }

  /**
   * Sight drift left — MPI x < -0.5
   * Shots grouping to the left indicate the sight needs to be adjusted right.
   */
  private checkSightDrift(analytics: AnalyticsResult): string[] {
    const { x } = analytics.mpi;
    if (x < -0.5) {
      return ['Shots are grouping left — adjust sight right'];
    }
    if (x > 0.5) {
      return ['Shots are grouping right — adjust sight left'];
    }
    return [];
  }

  /**
   * Trigger control — group radius > 5
   * A large spread across the target suggests inconsistent trigger release
   * or follow-through, not just sight alignment.
   */
  private checkTriggerControl(analytics: AnalyticsResult): string[] {
    if (analytics.groupRadius > 5) {
      return [
        'Large group radius detected — focus on trigger control and follow-through',
      ];
    }
    return [];
  }

  /**
   * Endurance — last series average drops more than 0.5 below first series average
   * Declining performance in later series is a signal of fatigue or loss of focus.
   */
  private checkEndurance(analytics: AnalyticsResult): string[] {
    const { seriesAverages } = analytics;
    if (seriesAverages.length < 2) return [];

    const firstSeries = seriesAverages[0];
    const lastSeries = seriesAverages[seriesAverages.length - 1];

    if (lastSeries < firstSeries - 0.5) {
      return [
        'Score drops in later series — incorporate endurance and mental focus training',
      ];
    }
    return [];
  }

  /**
   * Consistency — standard deviation of scores > 1.0
   * High variance suggests the shooter lacks a repeatable technique.
   */
  private checkConsistency(analytics: AnalyticsResult): string[] {
    if (analytics.stdDev > 1.0) {
      return [
        'High score variance — work on repeatable technique and stable position',
      ];
    }
    return [];
  }
}

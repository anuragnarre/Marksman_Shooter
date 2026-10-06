import { AnalyticsResult } from '@shooting-platform/shared-types';
export declare class RulesEngine {
    evaluate(analytics: AnalyticsResult): string[];
    private checkSightDrift;
    private checkTriggerControl;
    private checkEndurance;
    private checkConsistency;
    private checkBreathingControl;
}

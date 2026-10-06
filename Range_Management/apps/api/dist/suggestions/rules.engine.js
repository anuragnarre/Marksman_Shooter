"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesEngine = void 0;
class RulesEngine {
    evaluate(analytics) {
        const suggestions = [];
        suggestions.push(...this.checkSightDrift(analytics));
        suggestions.push(...this.checkTriggerControl(analytics));
        suggestions.push(...this.checkEndurance(analytics));
        suggestions.push(...this.checkConsistency(analytics));
        suggestions.push(...this.checkBreathingControl(analytics));
        return suggestions;
    }
    checkSightDrift(analytics) {
        const { x } = analytics.mpi;
        if (x < -0.5) {
            return ['Shots are grouping left — adjust sight right'];
        }
        if (x > 0.5) {
            return ['Shots are grouping right — adjust sight left'];
        }
        return [];
    }
    checkTriggerControl(analytics) {
        if (analytics.groupRadius > 5) {
            return [
                'Large group radius detected — focus on trigger control and follow-through',
            ];
        }
        return [];
    }
    checkEndurance(analytics) {
        const { seriesAverages } = analytics;
        if (seriesAverages.length < 2)
            return [];
        const firstSeries = seriesAverages[0];
        const lastSeries = seriesAverages[seriesAverages.length - 1];
        if (lastSeries < firstSeries - 0.5) {
            return [
                'Score drops in later series — incorporate endurance and mental focus training',
            ];
        }
        return [];
    }
    checkConsistency(analytics) {
        if (analytics.stdDev > 1.0) {
            return [
                'High score variance — work on repeatable technique and stable position',
            ];
        }
        return [];
    }
    checkBreathingControl(analytics) {
        const verticalDrift = Math.abs(analytics.mpi.y);
        if (verticalDrift > 0.4) {
            const direction = analytics.mpi.y > 0 ? 'high' : 'low';
            return [
                `Shots grouping ${direction} — review your breathing cycle and trigger timing. ` +
                    'Fire at the natural respiratory pause to reduce vertical dispersion.',
            ];
        }
        if (analytics.totalShots >= 10) {
            return [
                'Breathing control needs improvement — practice triggering at the natural ' +
                    'respiratory pause (after a relaxed exhale) to stabilise your aim point.',
            ];
        }
        return [];
    }
}
exports.RulesEngine = RulesEngine;
//# sourceMappingURL=rules.engine.js.map
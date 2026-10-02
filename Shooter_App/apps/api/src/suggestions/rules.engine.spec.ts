import { RulesEngine } from './rules.engine';
import { AnalyticsResult } from '@shooting-platform/shared-types';

describe('RulesEngine', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine();
  });

  const createMockAnalytics = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => {
    return {
      sessionId: 'session-id',
      totalShots: 10,
      averageScore: 9,
      minScore: 8,
      maxScore: 10,
      mpi: { x: 0, y: 0 },
      groupRadius: 2,
      stdDev: 0.5,
      seriesAverages: [9.5, 9.6],
      ...overrides,
    };
  };

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should detect sight drift left', () => {
    const analytics = createMockAnalytics({ mpi: { x: -0.6, y: 0 } });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions).toContain('Shots are grouping left — adjust sight right');
  });

  it('should detect sight drift right', () => {
    const analytics = createMockAnalytics({ mpi: { x: 0.6, y: 0 } });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions).toContain('Shots are grouping right — adjust sight left');
  });

  it('should not detect sight drift if within normal range', () => {
    const analytics = createMockAnalytics({ mpi: { x: 0.2, y: 0 } });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions).not.toContain('Shots are grouping left — adjust sight right');
    expect(suggestions).not.toContain('Shots are grouping right — adjust sight left');
  });

  it('should detect trigger control issues', () => {
    const analytics = createMockAnalytics({ groupRadius: 6 });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions).toContain('Large group radius detected — focus on trigger control and follow-through');
  });

  it('should detect endurance issues', () => {
    const analytics = createMockAnalytics({ seriesAverages: [9.8, 9.5, 9.2] });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions).toContain('Score drops in later series — incorporate endurance and mental focus training');
  });

  it('should ignore endurance if less than 2 series', () => {
    const analytics = createMockAnalytics({ seriesAverages: [9.8] });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions).not.toContain('Score drops in later series — incorporate endurance and mental focus training');
  });

  it('should detect consistency issues', () => {
    const analytics = createMockAnalytics({ stdDev: 1.5 });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions).toContain('High score variance — work on repeatable technique and stable position');
  });

  it('should detect breathing control primary issue - high', () => {
    const analytics = createMockAnalytics({ mpi: { x: 0, y: 0.5 } });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions).toContain('Shots grouping high — review your breathing cycle and trigger timing. Fire at the natural respiratory pause to reduce vertical dispersion.');
  });

  it('should detect breathing control primary issue - low', () => {
    const analytics = createMockAnalytics({ mpi: { x: 0, y: -0.5 } });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions).toContain('Shots grouping low — review your breathing cycle and trigger timing. Fire at the natural respiratory pause to reduce vertical dispersion.');
  });

  it('should provide default breathing tip if >= 10 shots and no other specific rule fired', () => {
    const analytics = createMockAnalytics({ totalShots: 10 });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions).toContain('Breathing control needs improvement — practice triggering at the natural respiratory pause (after a relaxed exhale) to stabilise your aim point.');
  });

  it('should return multiple suggestions if multiple rules are triggered', () => {
    const analytics = createMockAnalytics({
      mpi: { x: -0.6, y: -0.5 },
      groupRadius: 6,
      stdDev: 1.5
    });
    const suggestions = engine.evaluate(analytics);
    expect(suggestions.length).toBeGreaterThan(1);
    expect(suggestions).toContain('Shots are grouping left — adjust sight right');
    expect(suggestions).toContain('Large group radius detected — focus on trigger control and follow-through');
    expect(suggestions).toContain('High score variance — work on repeatable technique and stable position');
  });
});

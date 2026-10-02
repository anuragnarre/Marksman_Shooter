import { Test, TestingModule } from '@nestjs/testing';
import { SuggestionsService } from './suggestions.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { UserRole } from '@shooting-platform/shared-types';

describe('SuggestionsService', () => {
  let service: SuggestionsService;
  let analyticsService: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        {
          provide: AnalyticsService,
          useValue: {
            computeForSessionForActor: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SuggestionsService>(SuggestionsService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSuggestionsForUser', () => {
    it('should correctly format suggestions result using the rules engine and analytics data', async () => {
      // Mock analytics data
      const mockAnalyticsData = {
        sessionId: 'session-123',
        totalShots: 10,
        averageScore: 9.5,
        mpi: { x: -0.6, y: 0.1 },
        groupRadius: 3,
        stdDev: 0.5,
        seriesAverages: [9.8, 9.5],
        minScore: 8,
        maxScore: 10.9,
      };

      (analyticsService.computeForSessionForActor as jest.Mock).mockResolvedValue(mockAnalyticsData);

      const sessionId = 'session-123';
      const requesterId = 'user-456';
      const requesterRole: UserRole = 'SHOOTER';

      const result = await service.getSuggestionsForUser(sessionId, requesterId, requesterRole);

      expect(analyticsService.computeForSessionForActor).toHaveBeenCalledWith(
        requesterId,
        requesterRole,
        sessionId,
      );

      // checkSightDrift should trigger 'Shots are grouping left — adjust sight right' because mpi x is -0.6 (< -0.5)
      expect(result).toEqual({
        sessionId: 'session-123',
        suggestions: [
          'Shots are grouping left — adjust sight right',
          'Breathing control needs improvement — practice triggering at the natural respiratory pause (after a relaxed exhale) to stabilise your aim point.'
        ],
      });
    });

    it('should return multiple suggestions if multiple rules apply', async () => {
      // Mock analytics data
      const mockAnalyticsData = {
        sessionId: 'session-456',
        totalShots: 20,
        averageScore: 8.5,
        mpi: { x: 0.6, y: 0.5 },
        groupRadius: 6,
        stdDev: 1.5,
        seriesAverages: [9.8, 8.2],
        minScore: 7,
        maxScore: 10,
      };

      (analyticsService.computeForSessionForActor as jest.Mock).mockResolvedValue(mockAnalyticsData);

      const sessionId = 'session-456';
      const requesterId = 'user-789';
      const requesterRole: UserRole = 'COACH';

      const result = await service.getSuggestionsForUser(sessionId, requesterId, requesterRole);

      expect(analyticsService.computeForSessionForActor).toHaveBeenCalledWith(
        requesterId,
        requesterRole,
        sessionId,
      );

      expect(result.sessionId).toBe('session-456');
      expect(result.suggestions).toContain('Shots are grouping right — adjust sight left');
      expect(result.suggestions).toContain('Large group radius detected — focus on trigger control and follow-through');
      expect(result.suggestions).toContain('Score drops in later series — incorporate endurance and mental focus training');
      expect(result.suggestions).toContain('High score variance — work on repeatable technique and stable position');
      expect(result.suggestions).toContain('Shots grouping high — review your breathing cycle and trigger timing. Fire at the natural respiratory pause to reduce vertical dispersion.');
    });

    it('should return empty suggestions if no rules apply and under 10 shots', async () => {
      const mockAnalyticsData = {
        sessionId: 'session-789',
        totalShots: 5,
        averageScore: 10,
        mpi: { x: 0, y: 0 },
        groupRadius: 1,
        stdDev: 0.1,
        seriesAverages: [10],
        minScore: 9,
        maxScore: 10.9,
      };

      (analyticsService.computeForSessionForActor as jest.Mock).mockResolvedValue(mockAnalyticsData);

      const result = await service.getSuggestionsForUser('session-789', 'user-000', 'SHOOTER');

      expect(result).toEqual({
        sessionId: 'session-789',
        suggestions: [],
      });
    });
  });
});

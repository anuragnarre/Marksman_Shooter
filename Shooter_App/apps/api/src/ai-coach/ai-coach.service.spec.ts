import { Test, TestingModule } from '@nestjs/testing';
import { AiCoachService } from './ai-coach.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { AiCoachAnalysis } from '@shooting-platform/shared-types';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

describe('AiCoachService', () => {
  let service: AiCoachService;
  let prismaService: PrismaService;
  let analyticsService: AnalyticsService;
  let configService: ConfigService;

  const mockPrismaService = {
    session: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    biometricReading: {
      findMany: jest.fn(),
    },
    coachConnection: {
      findFirst: jest.fn(),
    },
    shooterProfile: {
      findFirst: jest.fn(),
    }
  };

  const mockAnalyticsService = {
    computeForSession: jest.fn(),
    getShooterHistory: jest.fn(),
    computeOverallStats: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('test-api-key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCoachService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AiCoachService>(AiCoachService);
    prismaService = module.get<PrismaService>(PrismaService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeSession', () => {
    const mockSession = {
      id: 'session-1',
      shooterId: 'shooter-1',
      shooter: { id: 'shooter-1', name: 'Test Shooter' },
      shots: [
        { shotNumber: 1, x: 0, y: 0, r: 10, ts: 1000 },
      ],
    };

    const mockAnalytics = {
      averageScore: 10.5,
      minScore: 10.0,
      maxScore: 10.9,
      mpi: { x: 0.1, y: -0.1 },
      groupRadius: 5.5,
      stdDev: 0.2,
      seriesAverages: [10.5],
      metrics: {
        medianAimTime: 3.5,
      }
    };

    const mockAiResponseData = {
      overallAssessment: 'Good session',
      performanceRating: 8,
      findings: [],
      prioritizedActions: ['Action 1'],
      nextSessionFocus: 'Focus 1',
    };

    const mockAiResponse = {
      text: JSON.stringify(mockAiResponseData)
    };

    it('should successfully analyze a session', async () => {
      mockPrismaService.session.findFirst.mockResolvedValue(mockSession);
      mockAnalyticsService.computeForSession.mockResolvedValue(mockAnalytics);
      mockPrismaService.biometricReading.findMany.mockResolvedValue([]);
      mockGenerateContent.mockResolvedValue(mockAiResponse);

      const result = await service.analyzeSession('session-1', 'shooter-1', 'SHOOTER' as any);

      expect(result).toBeDefined();
      expect(result.overallAssessment).toBe('Good session');
      expect(mockPrismaService.session.findFirst).toHaveBeenCalledWith({
        where: { id: 'session-1', deletedAt: null },
        include: expect.any(Object),
      });
      expect(mockAnalyticsService.computeForSession).toHaveBeenCalledWith('session-1');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should throw NotFoundException if session does not exist', async () => {
      mockPrismaService.session.findFirst.mockResolvedValue(null);

      await expect(service.analyzeSession('invalid-id', 'shooter-1', 'SHOOTER' as any))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if requester is not authorized', async () => {
      mockPrismaService.session.findFirst.mockResolvedValue(mockSession);

      await expect(service.analyzeSession('session-1', 'other-shooter', 'SHOOTER' as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to access any session', async () => {
      mockPrismaService.session.findFirst.mockResolvedValue(mockSession);
      mockAnalyticsService.computeForSession.mockResolvedValue(mockAnalytics);
      mockPrismaService.biometricReading.findMany.mockResolvedValue([]);
      mockGenerateContent.mockResolvedValue(mockAiResponse);

      const result = await service.analyzeSession('session-1', 'admin-1', 'ADMIN' as any);

      expect(result).toBeDefined();
    });

    it('should throw InternalServerErrorException if AI returns malformed JSON', async () => {
      mockPrismaService.session.findFirst.mockResolvedValue(mockSession);
      mockAnalyticsService.computeForSession.mockResolvedValue(mockAnalytics);
      mockPrismaService.biometricReading.findMany.mockResolvedValue([]);
      mockGenerateContent.mockResolvedValue({ text: 'invalid json' });

      await expect(service.analyzeSession('session-1', 'shooter-1', 'SHOOTER' as any))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('analyzePerformance', () => {
    const mockSessions = [
      { id: 'sess-1', sessionDate: new Date('2023-01-01').toISOString(), shots: [{score: 10.5}], discipline: 'AIR_RIFLE', weaponType: 'RIFLE', trainingMode: 'MATCH' },
    ];

    const mockOverallStats = {
      averageScore: 10.2,
      trend: 'UP',
      totalShots: 100
    };

    const mockAiResponseData = {
      summary: 'Improving well',
      technicalFocus: ['Trigger control'],
      mentalFocus: ['Visualization'],
      equipmentChecks: ['Barrel weight'],
      suggestedPlan: { warmup: 'Dry fire', core: '60 shots', cooldown: 'Stretching' },
    };

    const mockAiResponse = {
      text: JSON.stringify(mockAiResponseData)
    };

    it('should successfully analyze performance for own user', async () => {
      mockPrismaService.session.findMany.mockResolvedValue(mockSessions);
      mockAnalyticsService.computeOverallStats.mockResolvedValue(mockOverallStats);
      mockGenerateContent.mockResolvedValue(mockAiResponse);

      const result = await service.analyzePerformance('shooter-1', 'SHOOTER' as any);

      expect(result).toBeDefined();
      expect(result.summary).toBe('Improving well');
      expect(mockPrismaService.session.findMany).toHaveBeenCalled();
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should allow coach to access shooter performance', async () => {
      mockPrismaService.coachConnection.findFirst.mockResolvedValue({ id: 'conn-1' });
      mockPrismaService.session.findMany.mockResolvedValue(mockSessions);
      mockAnalyticsService.computeOverallStats.mockResolvedValue(mockOverallStats);
      mockGenerateContent.mockResolvedValue(mockAiResponse);

      const result = await service.analyzePerformance('coach-1', 'COACH' as any, 'shooter-1');

      expect(result).toBeDefined();
      expect(mockPrismaService.coachConnection.findFirst).toHaveBeenCalledWith({
        where: { coachId: 'coach-1', shooterId: 'shooter-1', status: 'APPROVED' },
        select: { id: true },
      });
    });

    it('should throw ForbiddenException if coach is not connected to shooter', async () => {
      mockPrismaService.coachConnection.findFirst.mockResolvedValue(null);
      mockPrismaService.shooterProfile.findFirst.mockResolvedValue(null);

      await expect(service.analyzePerformance('coach-1', 'COACH' as any, 'shooter-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has no sessions', async () => {
      mockPrismaService.session.findMany.mockResolvedValue([]);

      await expect(service.analyzePerformance('shooter-1', 'SHOOTER' as any))
        .rejects.toThrow(ForbiddenException);
    });
  });
});

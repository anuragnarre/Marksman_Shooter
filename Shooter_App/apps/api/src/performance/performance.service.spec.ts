import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService } from './performance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: JSON.stringify({
              coachingNote: 'Test note',
              focusAreas: ['Area 1'],
              weeks: []
            })
          })
        }
      };
    })
  };
});

describe('PerformanceService', () => {
  let service: PerformanceService;
  let prisma: PrismaService;
  let analytics: AnalyticsService;
  let aiMock: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        {
          provide: PrismaService,
          useValue: {
            session: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            trainingPlan: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            coachConnection: {
              findFirst: jest.fn(),
            },
            shooterProfile: {
              findFirst: jest.fn(),
            },
            sessionContext: {
              upsert: jest.fn(),
            },
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            computeForSession: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('fake-key'),
          },
        },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
    prisma = module.get<PrismaService>(PrismaService);
    analytics = module.get<AnalyticsService>(AnalyticsService);
    aiMock = (service as any).ai;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDeepAnalysis', () => {
    it('should throw NotFoundException if session not found', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValue(null);
      await expect(service.getDeepAnalysis('user1', 'session1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if shooterIdHint does not match session', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValue({ shooterId: 'user1' } as any);
      await expect(service.getDeepAnalysis('user1', 'session1', 'SHOOTER', 'user2')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user cannot access shooter', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValue({ shooterId: 'user2' } as any);
      await expect(service.getDeepAnalysis('user1', 'session1')).rejects.toThrow(ForbiddenException);
    });

    it('should return default values if no shots', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValue({ shooterId: 'user1', shots: [] } as any);
      const result = await service.getDeepAnalysis('user1', 'session1');
      expect(result).toEqual({
        sessionId: 'session1',
        fatigueIndex: 0,
        focusScore: 50,
        outlierShots: [],
        clusterCount: 1,
        warmupShots: 0,
        peakSeriesIndex: 0,
        peakSeriesAvg: 0,
      });
    });

    it('should compute analysis for session with shots', async () => {
      const shots = [
        { score: 10, shotNumber: 1, x: 0, y: 0 },
        { score: 9.8, shotNumber: 2, x: 1, y: 1 },
      ];
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValue({ shooterId: 'user1', shots } as any);
      jest.spyOn(analytics, 'computeForSession').mockResolvedValue({
        seriesAverages: [9.9],
        averageScore: 9.9,
        stdDev: 0.1,
      } as any);

      const result = await service.getDeepAnalysis('user1', 'session1');
      expect(result).toBeDefined();
      expect(result.sessionId).toBe('session1');
      expect(result.fatigueIndex).toBeDefined();
      expect(result.focusScore).toBeDefined();
      expect(result.clusterCount).toBeDefined();
    });
  });

  describe('saveSessionContext', () => {
    it('should throw NotFoundException if session not found', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValue(null);
      await expect(service.saveSessionContext('user1', 'session1', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if shooterIdHint does not match session', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValue({ shooterId: 'user1' } as any);
      await expect(service.saveSessionContext('user1', 'session1', {} as any, 'SHOOTER', 'user2')).rejects.toThrow(ForbiddenException);
    });

    it('should upsert session context on success', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValue({ shooterId: 'user1' } as any);
      jest.spyOn(prisma.sessionContext, 'upsert').mockResolvedValue({ id: 'ctx1' } as any);
      const dto = { notes: 'test' };
      const result = await service.saveSessionContext('user1', 'session1', dto as any);
      expect(prisma.sessionContext.upsert).toHaveBeenCalledWith({
        where: { sessionId: 'session1' },
        create: { sessionId: 'session1', ...dto },
        update: { ...dto },
      });
      expect(result).toEqual({ id: 'ctx1' });
    });
  });

  describe('generateTrainingPlan', () => {
    it('should throw ForbiddenException if no sessions found', async () => {
      jest.spyOn(prisma.session, 'findMany').mockResolvedValue([]);
      await expect(service.generateTrainingPlan('user1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw InternalServerErrorException if AI plan generation fails', async () => {
      jest.spyOn(prisma.session, 'findMany').mockResolvedValue([
        { id: 'session1', shooterId: 'user1', shots: [], discipline: '10m Air Rifle' } as any
      ]);

      aiMock.models.generateContent.mockRejectedValueOnce(new Error('AI failed'));

      await expect(service.generateTrainingPlan('user1')).rejects.toThrow(InternalServerErrorException);
    });

    it('should generate a training plan successfully', async () => {
      const mockSession = {
        id: 'session1',
        shooterId: 'user1',
        discipline: '10m Air Rifle',
        shots: [{ score: 10, shotNumber: 1, x: 0, y: 0 }]
      };

      jest.spyOn(prisma.session, 'findMany').mockResolvedValue([mockSession] as any);

      jest.spyOn(service, 'getDeepAnalysis').mockResolvedValue({
        sessionId: 'session1',
        fatigueIndex: -0.1,
        focusScore: 40,
        outlierShots: [1],
        clusterCount: 3,
        warmupShots: 1,
        peakSeriesIndex: 0,
        peakSeriesAvg: 10,
      } as any);

      const mockPlanRecord = {
        id: 'plan1',
        generatedAt: new Date(),
        weekStart: new Date(),
        focusAreas: ['Area 1'],
        content: {
          coachingNote: 'Test note',
          focusAreas: ['Area 1'],
          weeks: []
        }
      };

      jest.spyOn(prisma.trainingPlan, 'create').mockResolvedValue(mockPlanRecord as any);

      const result = await service.generateTrainingPlan('user1');

      expect(prisma.session.findMany).toHaveBeenCalled();
      expect(aiMock.models.generateContent).toHaveBeenCalled();
      expect(prisma.trainingPlan.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('plan1');
    });
  });

  describe('getTrainingPlans', () => {
    it('should return mapped training plans successfully', async () => {
      const mockPlanRecord = {
        id: 'plan1',
        userId: 'user1',
        generatedAt: new Date('2023-01-01'),
        weekStart: new Date('2023-01-02'),
        focusAreas: ['Area 1'],
        content: {
          coachingNote: 'Test note',
          focusAreas: ['Area 1'],
          weeks: []
        }
      };

      jest.spyOn(prisma.trainingPlan, 'findMany').mockResolvedValue([mockPlanRecord] as any);

      const result = await service.getTrainingPlans('user1');

      expect(prisma.trainingPlan.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { generatedAt: 'desc' }
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('plan1');
    });
  });
});

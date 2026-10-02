import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@shooting-platform/shared-types';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            session: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            coachConnection: {
              findFirst: jest.fn(),
            },
            shooterProfile: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeForSessionForActor', () => {
    it('should throw NotFoundException if session is not found', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValueOnce(null);

      await expect(
        service.computeForSessionForActor('actor123', 'SHOOTER' as UserRole, 'session123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if actor is a SHOOTER and does not own the session', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValueOnce({
        id: 'session123',
        shooterId: 'differentShooter',
      } as any);

      await expect(
        service.computeForSessionForActor('actor123', 'SHOOTER' as UserRole, 'session123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should compute analytics if actor owns the session', async () => {
      jest.spyOn(prisma.session, 'findFirst')
        // First findFirst in computeForSessionForActor
        .mockResolvedValueOnce({
          id: 'session123',
          shooterId: 'actor123',
        } as any)
        // Second findFirst in computeForSession
        .mockResolvedValueOnce({
          id: 'session123',
          shots: [],
        } as any);

      const result = await service.computeForSessionForActor('actor123', 'SHOOTER' as UserRole, 'session123');
      expect(result.totalShots).toBe(0);
    });
  });

  describe('computeForSession', () => {
    it('should throw NotFoundException if session is not found', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValueOnce(null);

      await expect(service.computeForSession('session123')).rejects.toThrow(NotFoundException);
    });

    it('should return 0s for a session with 0 shots', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValueOnce({
        id: 'session123',
        shots: [],
      } as any);

      const result = await service.computeForSession('session123');
      expect(result).toEqual({
        sessionId: 'session123',
        totalShots: 0,
        averageScore: 0,
        mpi: { x: 0, y: 0 },
        groupRadius: 0,
        stdDev: 0,
        seriesAverages: [],
        minScore: 0,
        maxScore: 0,
      });
    });

    it('should correctly compute analytics for a session with multiple shots', async () => {
      jest.spyOn(prisma.session, 'findFirst').mockResolvedValueOnce({
        id: 'session123',
        shots: [
          { score: 10, x: 0, y: 0 },
          { score: 8, x: -3, y: 4 },
          { score: 9, x: 3, y: 4 },
        ],
      } as any);

      const result = await service.computeForSession('session123');

      expect(result.totalShots).toBe(3);
      expect(result.averageScore).toBe(9); // (10 + 8 + 9) / 3
      expect(result.mpi).toEqual({
        x: 0, // (0 - 3 + 3) / 3
        y: 2.6667, // (0 + 4 + 4) / 3 -> 2.66666... rounded to 4 decimals
      });
      // groupRadius: max distance between any two points
      // P1 (0,0), P2 (-3,4), P3 (3,4)
      // dist P1-P2 = 5
      // dist P1-P3 = 5
      // dist P2-P3 = 6
      expect(result.groupRadius).toBe(6);
      expect(result.minScore).toBe(8);
      expect(result.maxScore).toBe(10);
    });
  });
});

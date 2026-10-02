import { Test, TestingModule } from '@nestjs/testing';
import { BallisticsService, computeTrajectory } from './ballistics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BallisticsService', () => {
  let service: BallisticsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BallisticsService,
        {
          provide: PrismaService,
          useValue: {
            ballisticProfile: {
              upsert: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BallisticsService>(BallisticsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('computeTrajectory', () => {
    it('should correctly calculate trajectory rows', () => {
      const profile = {
        muzzleVelocityFps: 1000,
        pelletWeightGrains: 10,
        ballisticCoef: 0.1,
        sightHeightInches: 2,
        zeroRangeYards: 50,
      };

      const result = computeTrajectory(profile);

      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({
        range: 0,
        drop: 0, // 0.5 * 32.174 * 0^2 * 12
        vel: 1000,
        ke: 22.2, // (10 * 1000 * 1000) / 450400 = 22.202
      });

      expect(result[1].range).toBe(10);
      expect(result[5].range).toBe(100);

      // Ke should decrease over range
      expect(result[5].ke).toBeLessThan(result[0].ke);
      // Vel should decrease over range
      expect(result[5].vel).toBeLessThan(result[0].vel);
    });
  });

  describe('calculate', () => {
    it('should calculate trajectory and upsert profile', async () => {
      const userId = 'user-1';
      const dto = {
        id: 'profile-1',
        name: 'My Profile',
        muzzleVelocityFps: 1000,
        pelletWeightGrains: 10,
        ballisticCoef: 0.1,
        sightHeightInches: 2,
        zeroRangeYards: 50,
      };

      const mockSavedProfile = { ...dto, userId };
      (prismaService.ballisticProfile.upsert as jest.Mock).mockResolvedValue(mockSavedProfile);

      const result = await service.calculate(userId, dto);

      expect(result.trajectory).toHaveLength(6);
      expect(result.profile).toEqual(mockSavedProfile);

      expect(prismaService.ballisticProfile.upsert).toHaveBeenCalledWith({
        where: { id: dto.id },
        create: { ...dto, userId },
        update: { ...dto },
      });
      expect(prismaService.ballisticProfile.create).not.toHaveBeenCalled();
    });

    it('should fallback to create if upsert fails (e.g. invalid id)', async () => {
      const userId = 'user-1';
      const dto = {
        name: 'New Profile',
        muzzleVelocityFps: 800,
        pelletWeightGrains: 8,
        ballisticCoef: 0.05,
        sightHeightInches: 1.5,
        zeroRangeYards: 25,
      };

      const mockSavedProfile = { ...dto, id: 'new-id', userId };

      (prismaService.ballisticProfile.upsert as jest.Mock).mockRejectedValue(new Error('Record to update not found'));
      (prismaService.ballisticProfile.create as jest.Mock).mockResolvedValue(mockSavedProfile);

      const result = await service.calculate(userId, dto);

      expect(result.profile).toEqual(mockSavedProfile);

      expect(prismaService.ballisticProfile.upsert).toHaveBeenCalledWith({
        where: { id: 'new' }, // fallback for dto.id ?? 'new'
        create: { ...dto, userId },
        update: { ...dto },
      });
      expect(prismaService.ballisticProfile.create).toHaveBeenCalledWith({
        data: { ...dto, userId },
      });
    });
  });
});

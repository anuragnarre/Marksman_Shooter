import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@shooting-platform/shared-types';

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    session: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    coachConnection: {
      findFirst: jest.fn(),
    },
    shooterProfile: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createForActor', () => {
    const defaultDto = {
      discipline: 'Air Rifle',
      distance: 10,
      weaponType: 'Rifle',
      numberOfShots: 60,
      sessionDate: new Date().toISOString(),
      trainingMode: 'Match',
    };

    it('should allow a SHOOTER to create a session for themselves', async () => {
      const actorId = 'shooter1';
      const createdSession = { id: 'session1', shooterId: actorId, ...defaultDto };

      mockPrismaService.session.create.mockResolvedValue(createdSession);

      const result = await service.createForActor(actorId, 'SHOOTER', defaultDto);

      expect(mockPrismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shooterId: actorId,
          discipline: defaultDto.discipline,
        }),
      });
      expect(result).toMatchObject({ shooterId: actorId });
    });

    it('should throw BadRequestException if COACH tries to create a session without providing shooterId', async () => {
      const actorId = 'coach1';

      await expect(
        service.createForActor(actorId, 'COACH', defaultDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if COACH tries to create a session without approved connection or managed profile', async () => {
      const actorId = 'coach1';
      const shooterId = 'shooter1';

      // Simulate no connection and no managed profile
      mockPrismaService.coachConnection.findFirst.mockResolvedValue(null);
      mockPrismaService.shooterProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.createForActor(actorId, 'COACH', defaultDto, shooterId)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow COACH to create a session if there is an approved connection', async () => {
      const actorId = 'coach1';
      const shooterId = 'shooter1';
      const createdSession = { id: 'session1', shooterId, ...defaultDto };

      // Simulate approved connection
      mockPrismaService.coachConnection.findFirst.mockResolvedValue({ id: 'conn1' });
      mockPrismaService.shooterProfile.findFirst.mockResolvedValue(null);
      mockPrismaService.session.create.mockResolvedValue(createdSession);

      const result = await service.createForActor(actorId, 'COACH', defaultDto, shooterId);

      expect(mockPrismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shooterId,
        }),
      });
      expect(result).toMatchObject({ shooterId });
    });

    it('should allow COACH to create a session if they manage the profile', async () => {
      const actorId = 'coach1';
      const shooterId = 'shooter1';
      const createdSession = { id: 'session1', shooterId, ...defaultDto };

      // Simulate managed profile
      mockPrismaService.coachConnection.findFirst.mockResolvedValue(null);
      mockPrismaService.shooterProfile.findFirst.mockResolvedValue({ id: 'profile1' });
      mockPrismaService.session.create.mockResolvedValue(createdSession);

      const result = await service.createForActor(actorId, 'COACH', defaultDto, shooterId);

      expect(mockPrismaService.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shooterId,
        }),
      });
      expect(result).toMatchObject({ shooterId });
    });
  });
});

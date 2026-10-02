import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CoachService } from './coach.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';

describe('CoachService', () => {
  let service: CoachService;
  let prisma: PrismaService;
  let eventsGateway: EventsGateway;

  const mockPrismaService: any = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    coachConnection: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    shooterProfile: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    shot: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    coachFeedback: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(mockPrismaService)),
  };

  const mockEventsGateway = {
    emitConnectionInvite: jest.fn(),
    emitConnectionStatus: jest.fn(),
    emitSessionUpdated: jest.fn(),
    emitFeedbackAdded: jest.fn(),
    emitConnectionAccepted: jest.fn(),
    emitConnectionDeclined: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<CoachService>(CoachService);
    prisma = module.get<PrismaService>(PrismaService);
    eventsGateway = module.get<EventsGateway>(EventsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestConnection', () => {
    it('should successfully create a connection request', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'coach-1', role: 'COACH' });
      mockPrismaService.coachConnection.findFirst.mockResolvedValue(null);
      mockPrismaService.coachConnection.create.mockResolvedValue({ id: 'conn-1', shooterId: 'shooter-1', coachId: 'coach-1', status: 'PENDING', initiatedBy: 'SHOOTER' });

      const result = await service.requestConnection('shooter-1', { coachId: 'coach-1' });

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({ where: { id: 'coach-1', role: 'COACH' } });
      expect(mockPrismaService.coachConnection.findFirst).toHaveBeenCalledWith({
        where: { shooterId: 'shooter-1', coachId: 'coach-1', status: { in: ['PENDING', 'APPROVED'] } },
      });
      expect(mockPrismaService.coachConnection.create).toHaveBeenCalledWith({
        data: { shooterId: 'shooter-1', coachId: 'coach-1', status: 'PENDING', initiatedBy: 'SHOOTER' },
      });
      expect(mockEventsGateway.emitConnectionInvite).toHaveBeenCalledWith('coach-1', 'conn-1');
      expect(result).toHaveProperty('id', 'conn-1');
    });

    it('should throw NotFoundException if coach is not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.requestConnection('shooter-1', { coachId: 'coach-1' }))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw ConflictException if connection already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'coach-1', role: 'COACH' });
      mockPrismaService.coachConnection.findFirst.mockResolvedValue({ id: 'existing-conn' });

      await expect(service.requestConnection('shooter-1', { coachId: 'coach-1' }))
        .rejects
        .toThrow(ConflictException);
    });
  });

  describe('approveConnection', () => {
    it('should approve a connection and emit status', async () => {
      mockPrismaService.coachConnection.findFirst.mockResolvedValue({ id: 'conn-1', coachId: 'coach-1', shooterId: 'shooter-1', status: 'PENDING' });
      mockPrismaService.coachConnection.update.mockResolvedValue({ id: 'conn-1', coachId: 'coach-1', shooterId: 'shooter-1', status: 'APPROVED' });

      const result = await service.approveConnection('conn-1', 'coach-1');

      expect(mockPrismaService.coachConnection.findFirst).toHaveBeenCalledWith({
        where: { id: 'conn-1', coachId: 'coach-1', initiatedBy: 'SHOOTER' },
      });
      expect(mockPrismaService.coachConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { status: 'APPROVED' },
      });
      expect(mockEventsGateway.emitConnectionAccepted).toHaveBeenCalledWith('shooter-1', 'conn-1');
      expect(result.status).toBe('APPROVED');
    });

    it('should throw NotFoundException if connection not found', async () => {
      mockPrismaService.coachConnection.findFirst.mockResolvedValue(null);

      await expect(service.approveConnection('conn-1', 'coach-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectConnection', () => {
    it('should reject a connection and emit status', async () => {
      mockPrismaService.coachConnection.findFirst.mockResolvedValue({ id: 'conn-1', coachId: 'coach-1', shooterId: 'shooter-1', status: 'PENDING' });
      mockPrismaService.coachConnection.update.mockResolvedValue({ id: 'conn-1', coachId: 'coach-1', shooterId: 'shooter-1', status: 'REJECTED' });

      const result = await service.rejectConnection('conn-1', 'coach-1');

      expect(mockPrismaService.coachConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
        data: { status: 'REJECTED' },
      });
      expect(mockEventsGateway.emitConnectionDeclined).toHaveBeenCalledWith('shooter-1', 'conn-1');
      expect(result.status).toBe('REJECTED');
    });

    it('should throw NotFoundException if connection not found', async () => {
      mockPrismaService.coachConnection.findFirst.mockResolvedValue(null);

      await expect(service.rejectConnection('conn-1', 'coach-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('inviteShooter', () => {
    it('should successfully invite a shooter', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'shooter-1', role: 'SHOOTER' });
      mockPrismaService.coachConnection.findFirst.mockResolvedValue(null);
      mockPrismaService.coachConnection.create.mockResolvedValue({ id: 'conn-2', shooterId: 'shooter-1', coachId: 'coach-1', status: 'PENDING', initiatedBy: 'COACH' });

      const result = await service.inviteShooter('coach-1', { shooterId: 'shooter-1' });

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({ where: { id: 'shooter-1', role: 'SHOOTER' } });
      expect(mockPrismaService.coachConnection.findFirst).toHaveBeenCalledWith({
        where: { shooterId: 'shooter-1', coachId: 'coach-1', status: { in: ['PENDING', 'APPROVED'] } },
      });
      expect(mockPrismaService.coachConnection.create).toHaveBeenCalledWith({
        data: { shooterId: 'shooter-1', coachId: 'coach-1', status: 'PENDING', initiatedBy: 'COACH' },
      });
      expect(mockEventsGateway.emitConnectionInvite).toHaveBeenCalledWith('shooter-1', 'conn-2');
      expect(result.id).toBe('conn-2');
    });

    it('should throw NotFoundException if shooter is not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.inviteShooter('coach-1', { shooterId: 'nonexistent-1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if connection already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'shooter-1', role: 'SHOOTER' });
      mockPrismaService.coachConnection.findFirst.mockResolvedValue({ id: 'existing-conn' });

      await expect(service.inviteShooter('coach-1', { shooterId: 'shooter-1' })).rejects.toThrow(ConflictException);
    });
  });
});

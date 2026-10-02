import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleRequestsService } from './schedule-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ScheduleRequestsService', () => {
  let service: ScheduleRequestsService;
  let prisma: PrismaService;
  let gateway: EventsGateway;

  const mockPrisma = {
    eventAssignee: { findFirst: jest.fn() },
    scheduleRequest: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn(), delete: jest.fn() },
    trainingEvent: { update: jest.fn() },
  };

  const mockGateway = {
    emitScheduleRequestCreated: jest.fn(),
    emitScheduleRequestResolved: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<ScheduleRequestsService>(ScheduleRequestsService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<EventsGateway>(EventsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    it('throws ForbiddenException if shooter is not assigned to the event', async () => {
      mockPrisma.eventAssignee.findFirst.mockResolvedValue(null);
      await expect(service.createRequest('shooter-1', { eventId: 'event-1' } as any)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if a pending request already exists', async () => {
      mockPrisma.eventAssignee.findFirst.mockResolvedValue({ event: { coachId: 'coach-1' } });
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue({ id: 'req-1' });
      await expect(service.createRequest('shooter-1', { eventId: 'event-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if self-managed calendar item', async () => {
      mockPrisma.eventAssignee.findFirst.mockResolvedValue({ event: { coachId: 'shooter-1' } });
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue(null);
      await expect(service.createRequest('shooter-1', { eventId: 'event-1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('creates request and emits event', async () => {
      const dto = { eventId: 'event-1', suggestedStart: '2023-01-01T10:00:00Z', notes: 'test note' };
      mockPrisma.eventAssignee.findFirst.mockResolvedValue({ event: { coachId: 'coach-1' } });
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue(null);
      mockPrisma.scheduleRequest.create.mockResolvedValue({ id: 'req-1', coachId: 'coach-1' });

      const result = await service.createRequest('shooter-1', dto as any);

      expect(result).toEqual({ id: 'req-1', coachId: 'coach-1' });
      expect(mockPrisma.scheduleRequest.create).toHaveBeenCalled();
      expect(mockGateway.emitScheduleRequestCreated).toHaveBeenCalledWith('coach-1', 'req-1');
    });
  });

  describe('getRequests', () => {
    it('returns requests for a coach', async () => {
      mockPrisma.scheduleRequest.findMany.mockResolvedValue([{ id: 'req-1' }]);
      const result = await service.getRequests('coach-1', 'COACH');
      expect(result).toEqual([{ id: 'req-1' }]);
      expect(mockPrisma.scheduleRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { coachId: 'coach-1' } }));
    });

    it('returns requests for a shooter', async () => {
      mockPrisma.scheduleRequest.findMany.mockResolvedValue([{ id: 'req-1' }]);
      const result = await service.getRequests('shooter-1', 'SHOOTER');
      expect(result).toEqual([{ id: 'req-1' }]);
      expect(mockPrisma.scheduleRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { shooterId: 'shooter-1' } }));
    });
  });

  describe('getPendingCount', () => {
    it('returns count of pending requests', async () => {
      mockPrisma.scheduleRequest.count.mockResolvedValue(5);
      const result = await service.getPendingCount('coach-1');
      expect(result).toEqual({ count: 5 });
      expect(mockPrisma.scheduleRequest.count).toHaveBeenCalledWith({ where: { coachId: 'coach-1', status: 'PENDING' } });
    });
  });

  describe('resolveRequest', () => {
    it('throws NotFoundException if request does not exist', async () => {
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue(null);
      await expect(service.resolveRequest('coach-1', 'req-1', { status: 'APPROVED' } as any)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if request belongs to different coach', async () => {
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue({ coachId: 'coach-2' });
      await expect(service.resolveRequest('coach-1', 'req-1', { status: 'APPROVED' } as any)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if request is not pending', async () => {
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue({ coachId: 'coach-1', status: 'APPROVED' });
      await expect(service.resolveRequest('coach-1', 'req-1', { status: 'REJECTED' } as any)).rejects.toThrow(BadRequestException);
    });

    it('updates event when approved and applyChanges is true', async () => {
      const request = { coachId: 'coach-1', status: 'PENDING', eventId: 'event-1', suggestedTitle: 'New Title' };
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue(request);
      mockPrisma.scheduleRequest.update.mockResolvedValue({ ...request, status: 'APPROVED' });

      await service.resolveRequest('coach-1', 'req-1', { status: 'APPROVED', applyChanges: true } as any);

      expect(mockPrisma.trainingEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { title: 'New Title' },
      });
      expect(mockGateway.emitScheduleRequestResolved).toHaveBeenCalled();
    });

    it('updates request without modifying event if applyChanges is false', async () => {
      const request = { coachId: 'coach-1', status: 'PENDING', eventId: 'event-1' };
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue(request);
      mockPrisma.scheduleRequest.update.mockResolvedValue({ ...request, status: 'REJECTED' });

      await service.resolveRequest('coach-1', 'req-1', { status: 'REJECTED', applyChanges: false } as any);

      expect(mockPrisma.trainingEvent.update).not.toHaveBeenCalled();
      expect(mockGateway.emitScheduleRequestResolved).toHaveBeenCalled();
    });
  });

  describe('cancelRequest', () => {
    it('throws NotFoundException if request does not exist', async () => {
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue(null);
      await expect(service.cancelRequest('shooter-1', 'req-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if request is not pending', async () => {
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue({ status: 'APPROVED' });
      await expect(service.cancelRequest('shooter-1', 'req-1')).rejects.toThrow(BadRequestException);
    });

    it('deletes pending request', async () => {
      mockPrisma.scheduleRequest.findFirst.mockResolvedValue({ status: 'PENDING' });
      const result = await service.cancelRequest('shooter-1', 'req-1');
      expect(mockPrisma.scheduleRequest.delete).toHaveBeenCalledWith({ where: { id: 'req-1' } });
      expect(result).toEqual({ cancelled: true });
    });
  });
});

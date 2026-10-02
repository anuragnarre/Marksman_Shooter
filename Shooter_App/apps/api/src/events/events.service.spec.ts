import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { RegisterEventDto } from './dto/register-event.dto';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    competitionEvent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    competitionEventRegistration: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    scoreboardEntry: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllPublished', () => {
    it('should return published events', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', status: 'PUBLISHED' },
        { id: '2', title: 'Event 2', status: 'PUBLISHED' },
      ];
      mockPrismaService.competitionEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAllPublished();

      expect(result).toEqual(mockEvents);
      expect(prisma.competitionEvent.findMany).toHaveBeenCalledWith({
        where: { status: 'PUBLISHED' },
        include: {
          categories: true,
          _count: { select: { registrations: true } },
        },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findOnePublished', () => {
    it('should return an event if it exists', async () => {
      const mockEvent = { id: '1', title: 'Event 1', status: 'PUBLISHED' };
      mockPrismaService.competitionEvent.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOnePublished('1');

      expect(result).toEqual(mockEvent);
      expect(prisma.competitionEvent.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          categories: true,
          registrations: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          _count: { select: { registrations: true } },
        },
      });
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrismaService.competitionEvent.findUnique.mockResolvedValue(null);

      await expect(service.findOnePublished('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const dto: CreateEventDto = {
        name: 'New Event', time: '10:00',
        description: 'Test Description',
        date: '2023-12-01T10:00:00Z',
        location: 'Test Location',
      };
      const adminUserId = 'admin1';
      const mockCreatedEvent = { id: '1', ...dto, createdById: adminUserId };

      mockPrismaService.competitionEvent.create.mockResolvedValue(mockCreatedEvent);

      const result = await service.create(dto, adminUserId);

      expect(result).toEqual(mockCreatedEvent);
      expect(prisma.competitionEvent.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          name: 'New Event', time: '10:00',
          createdById: 'admin1',
        }),
        include: { categories: true }
      }));
    });
  });

  describe('register', () => {
    const eventId = 'event1';
    const userId = 'user1';
    const dto: RegisterEventDto = { categoryId: 'cat1' };

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrismaService.competitionEvent.findUnique.mockResolvedValue(null);

      await expect(service.register(eventId, userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if event is not published', async () => {
      mockPrismaService.competitionEvent.findUnique.mockResolvedValue({
        id: eventId,
        status: 'DRAFT',
      });

      await expect(service.register(eventId, userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event is full', async () => {
      mockPrismaService.competitionEvent.findUnique.mockResolvedValue({
        id: eventId,
        status: 'PUBLISHED',
        maxParticipants: 10,
        _count: { registrations: 10 },
      });

      await expect(service.register(eventId, userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user is already registered', async () => {
      mockPrismaService.competitionEvent.findUnique.mockResolvedValue({
        id: eventId,
        status: 'PUBLISHED',
        maxParticipants: 10,
        _count: { registrations: 5 },
      });
      mockPrismaService.competitionEventRegistration.findUnique.mockResolvedValue({
        eventId,
        userId,
      });

      await expect(service.register(eventId, userId, dto)).rejects.toThrow(ConflictException);
    });

    it('should register successfully', async () => {
      mockPrismaService.competitionEvent.findUnique.mockResolvedValue({
        id: eventId,
        status: 'PUBLISHED',
        maxParticipants: 10,
        _count: { registrations: 5 },
      });
      mockPrismaService.competitionEventRegistration.findUnique.mockResolvedValue(null);

      const mockRegistration = { eventId, userId, categoryId: dto.categoryId };
      mockPrismaService.competitionEventRegistration.create.mockResolvedValue(mockRegistration);

      const result = await service.register(eventId, userId, dto);

      expect(result).toEqual(mockRegistration);
      expect(prisma.competitionEventRegistration.create).toHaveBeenCalledWith({
        data: {
          eventId,
          userId,
          categoryId: 'cat1',
          paymentStatus: 'COMING_SOON',
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          category: true,
        },
      });
    });
  });
});

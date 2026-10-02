import { Test, TestingModule } from '@nestjs/testing';
import { RangesService } from './ranges.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { WalkInGuestDto } from './dto/range.dto';

jest.mock('crypto', () => {
  return {
    ...jest.requireActual('crypto'),
    randomBytes: jest.fn(),
  };
});

describe('RangesService', () => {
  let service: RangesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    shootingRange: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    rangeLane: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    laneBooking: {
      create: jest.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RangesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RangesService>(RangesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRange', () => {
    it('should create a new range', async () => {
      const mockUserId = 'user-1';
      const mockDto = { name: 'Test Range', address: '123 Test St', phone: '123-456-7890' };
      const mockCodeBuffer = Buffer.from('123456', 'hex');

      (crypto.randomBytes as jest.Mock).mockReturnValue(mockCodeBuffer);
      mockPrismaService.shootingRange.create.mockResolvedValue({ id: 'range-1', ...mockDto, ownerId: mockUserId, code: '123456' });

      const result = await service.createRange(mockUserId, mockDto);

      expect(crypto.randomBytes).toHaveBeenCalledWith(3);
      expect(prisma.shootingRange.create).toHaveBeenCalledWith({
        data: {
          name: mockDto.name,
          address: mockDto.address,
          phone: mockDto.phone,
          ownerId: mockUserId,
          code: mockCodeBuffer.toString('hex').toUpperCase(),
        },
      });
      expect(result).toEqual({ id: 'range-1', ...mockDto, ownerId: mockUserId, code: '123456' });
    });
  });

  describe('getMyRanges', () => {
    it('should return ranges for a user', async () => {
      const mockUserId = 'user-1';
      const mockRanges = [{ id: 'range-1', name: 'Test Range', lanes: [] }];
      mockPrismaService.shootingRange.findMany.mockResolvedValue(mockRanges);

      const result = await service.getMyRanges(mockUserId);

      expect(prisma.shootingRange.findMany).toHaveBeenCalledWith({
        where: { ownerId: mockUserId },
        include: { lanes: true },
      });
      expect(result).toEqual(mockRanges);
    });
  });

  describe('getRangeDetails', () => {
    it('should return range details if found', async () => {
      const mockRangeId = 'range-1';
      const mockRange = { id: mockRangeId, name: 'Test Range', lanes: [], bookings: [], managedGuests: [] };
      mockPrismaService.shootingRange.findUnique.mockResolvedValue(mockRange);

      const result = await service.getRangeDetails(mockRangeId);

      expect(prisma.shootingRange.findUnique).toHaveBeenCalledWith({
        where: { id: mockRangeId },
        include: {
          lanes: {
            include: {
              activeSession: { include: { shooter: true } },
              device: true
            },
          },
          bookings: {
            include: { user: true }
          },
          managedGuests: true
        },
      });
      expect(result).toEqual(mockRange);
    });

    it('should throw NotFoundException if range is not found', async () => {
      const mockRangeId = 'nonexistent-range';
      mockPrismaService.shootingRange.findUnique.mockResolvedValue(null);

      await expect(service.getRangeDetails(mockRangeId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLane', () => {
    it('should create a lane if lane number does not exist', async () => {
      const mockRangeId = 'range-1';
      const mockDto = { laneNumber: 1, name: 'Lane 1', deviceId: 'device-1' };
      mockPrismaService.rangeLane.findUnique.mockResolvedValue(null);
      mockPrismaService.rangeLane.create.mockResolvedValue({ id: 'lane-1', rangeId: mockRangeId, ...mockDto });

      const result = await service.createLane(mockRangeId, mockDto);

      expect(prisma.rangeLane.findUnique).toHaveBeenCalledWith({
        where: { rangeId_laneNumber: { rangeId: mockRangeId, laneNumber: mockDto.laneNumber } },
      });
      expect(prisma.rangeLane.create).toHaveBeenCalledWith({
        data: {
          rangeId: mockRangeId,
          laneNumber: mockDto.laneNumber,
          name: mockDto.name,
          deviceId: mockDto.deviceId,
        },
      });
      expect(result).toEqual({ id: 'lane-1', rangeId: mockRangeId, ...mockDto });
    });

    it('should throw BadRequestException if lane number exists', async () => {
      const mockRangeId = 'range-1';
      const mockDto = { laneNumber: 1, name: 'Lane 1', deviceId: 'device-1' };
      mockPrismaService.rangeLane.findUnique.mockResolvedValue({ id: 'lane-1', rangeId: mockRangeId, laneNumber: 1 });

      await expect(service.createLane(mockRangeId, mockDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerWalkInGuest', () => {
    it('should register a walk-in guest and update lane status if laneId is provided', async () => {
      const mockRangeId = 'range-1';
      const mockDto: WalkInGuestDto = { name: 'Guest', email: 'guest@test.com', laneId: 'lane-1' };
      const mockUser = { id: 'user-1', name: 'Guest', email: 'guest@test.com', role: 'SHOOTER', isGuest: true, managedByRangeId: mockRangeId };

      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.rangeLane.update.mockResolvedValue({ id: 'lane-1', status: 'OCCUPIED' });

      const result = await service.registerWalkInGuest(mockRangeId, mockDto);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: mockDto.name,
          email: mockDto.email,
          role: 'SHOOTER',
          isGuest: true,
          managedByRangeId: mockRangeId,
        },
      });
      expect(prisma.rangeLane.update).toHaveBeenCalledWith({
        where: { id: mockDto.laneId },
        data: { status: 'OCCUPIED' }
      });
      expect(result).toEqual(mockUser);
    });

    it('should register a walk-in guest with generated email if not provided and not update lane if laneId is missing', async () => {
      const mockRangeId = 'range-1';
      const mockDto = { name: 'Guest' } as WalkInGuestDto;
      const mockDate = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(mockDate);

      const expectedEmail = `guest_${mockDate}@range.local`;
      const mockUser = { id: 'user-1', name: 'Guest', email: expectedEmail, role: 'SHOOTER', isGuest: true, managedByRangeId: mockRangeId };

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.registerWalkInGuest(mockRangeId, mockDto);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: mockDto.name,
          email: expectedEmail,
          role: 'SHOOTER',
          isGuest: true,
          managedByRangeId: mockRangeId,
        },
      });
      expect(prisma.rangeLane.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);

      jest.restoreAllMocks();
    });
  });

  describe('linkSessionToLane', () => {
    it('should link session to lane and set status to OCCUPIED', async () => {
      const mockLaneId = 'lane-1';
      const mockSessionId = 'session-1';
      const mockLane = { id: mockLaneId, activeSessionId: mockSessionId, status: 'OCCUPIED' };

      mockPrismaService.rangeLane.update.mockResolvedValue(mockLane);

      const result = await service.linkSessionToLane(mockLaneId, mockSessionId);

      expect(prisma.rangeLane.update).toHaveBeenCalledWith({
        where: { id: mockLaneId },
        data: { activeSessionId: mockSessionId, status: 'OCCUPIED' },
      });
      expect(result).toEqual(mockLane);
    });
  });

  describe('clearLane', () => {
    it('should clear active session and set status to AVAILABLE', async () => {
      const mockLaneId = 'lane-1';
      const mockLane = { id: mockLaneId, activeSessionId: null, status: 'AVAILABLE' };

      mockPrismaService.rangeLane.update.mockResolvedValue(mockLane);

      const result = await service.clearLane(mockLaneId);

      expect(prisma.rangeLane.update).toHaveBeenCalledWith({
        where: { id: mockLaneId },
        data: { activeSessionId: null, status: 'AVAILABLE' },
      });
      expect(result).toEqual(mockLane);
    });
  });

  describe('bookLane', () => {
    it('should create a lane booking', async () => {
      const mockRangeId = 'range-1';
      const mockDto = { laneId: 'lane-1', userId: 'user-1', startTime: '2023-01-01T10:00:00Z', endTime: '2023-01-01T11:00:00Z' };
      const mockBooking = { id: 'booking-1', rangeId: mockRangeId, laneId: mockDto.laneId, userId: mockDto.userId, startTime: new Date(mockDto.startTime), endTime: new Date(mockDto.endTime), paymentStatus: 'PENDING' };

      mockPrismaService.laneBooking.create.mockResolvedValue(mockBooking);

      const result = await service.bookLane(mockRangeId, mockDto);

      expect(prisma.laneBooking.create).toHaveBeenCalledWith({
        data: {
          rangeId: mockRangeId,
          laneId: mockDto.laneId,
          userId: mockDto.userId,
          startTime: new Date(mockDto.startTime),
          endTime: new Date(mockDto.endTime),
          paymentStatus: 'PENDING',
        },
      });
      expect(result).toEqual(mockBooking);
    });
  });
});

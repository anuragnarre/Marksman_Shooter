import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRangeDto, CreateLaneDto, WalkInGuestDto, BookLaneDto } from './dto/range.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class RangesService {
  constructor(private prisma: PrismaService) {}

  private generateRangeCode(): string {
    return randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  }

  async createRange(userId: string, dto: CreateRangeDto) {
    const code = this.generateRangeCode();
    return this.prisma.shootingRange.create({
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        ownerId: userId,
        code,
      },
    });
  }

  async getMyRanges(userId: string) {
    return this.prisma.shootingRange.findMany({
      where: { ownerId: userId },
      include: { lanes: true },
    });
  }

  async getRangeDetails(rangeId: string) {
    const range = await this.prisma.shootingRange.findUnique({
      where: { id: rangeId },
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
    if (!range) throw new NotFoundException('Range not found');
    return range;
  }

  async createLane(rangeId: string, dto: CreateLaneDto) {
    const existing = await this.prisma.rangeLane.findUnique({
      where: { rangeId_laneNumber: { rangeId, laneNumber: dto.laneNumber } },
    });
    if (existing) throw new BadRequestException('Lane number already exists in this range');

    return this.prisma.rangeLane.create({
      data: {
        rangeId,
        laneNumber: dto.laneNumber,
        name: dto.name,
        deviceId: dto.deviceId,
      },
    });
  }

  async registerWalkInGuest(rangeId: string, dto: WalkInGuestDto) {
    const guestEmail = dto.email || `guest_${Date.now()}@range.local`;
    const guestUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: guestEmail,
        role: 'SHOOTER',
        isGuest: true,
        managedByRangeId: rangeId,
      },
    });

    if (dto.laneId) {
      await this.prisma.rangeLane.update({
        where: { id: dto.laneId },
        data: { status: 'OCCUPIED' } // We can link session later
      });
    }

    return guestUser;
  }

  async linkSessionToLane(laneId: string, sessionId: string) {
    return this.prisma.rangeLane.update({
      where: { id: laneId },
      data: { activeSessionId: sessionId, status: 'OCCUPIED' },
    });
  }

  async clearLane(laneId: string) {
    return this.prisma.rangeLane.update({
      where: { id: laneId },
      data: { activeSessionId: null, status: 'AVAILABLE' },
    });
  }

  async bookLane(rangeId: string, dto: BookLaneDto) {
    return this.prisma.laneBooking.create({
      data: {
        rangeId,
        laneId: dto.laneId,
        userId: dto.userId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        paymentStatus: 'PENDING',
      },
    });
  }
}

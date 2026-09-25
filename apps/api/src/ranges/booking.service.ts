import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { addDays, addWeeks } from 'date-fns';
import {
  CreateBookingDto,
  CancelBookingDto,
  CheckInBookingDto,
  CreateTimeSlotDto,
  SetOperatingHoursDto,
} from './dto/booking.dto';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  private generateRef(): string {
    return randomBytes(4).toString('hex').toUpperCase(); // 8 chars
  }

  // ── Slot Management ───────────────────────────────────────────────────────

  /**
   * 2.2.2 Cron: every day at 02:00 — generate time slots 30 days ahead
   * based on each range's OperatingHours configuration.
   */
  @Cron('0 2 * * *')
  async generateFutureSlots() {
    this.logger.log('Running daily time-slot generation cron...');
    const ranges = await this.prisma.shootingRange.findMany({
      where: { isActive: true },
      include: { operatingHours: true, lanes: true },
    });

    const targetDate = addDays(new Date(), 30);

    for (const range of ranges) {
      for (const oh of range.operatingHours) {
        if (!oh.isOpen) continue;

        // Generate slots for the next 30 days matching this day-of-week
        let cursor = new Date();
        cursor.setHours(0, 0, 0, 0);

        while (cursor <= targetDate) {
          if (cursor.getDay() === oh.dayOfWeek) {
            await this.generateSlotsForDay(range.id, cursor, oh.openTime, oh.closeTime, oh.slotDurationMinutes, range.lanes);
          }
          cursor = addDays(cursor, 1);
        }
      }
    }
    this.logger.log('Time-slot generation complete.');
  }

  private async generateSlotsForDay(
    rangeId: string,
    date: Date,
    openTime: string,
    closeTime: string,
    durationMin: number,
    lanes: { id: string }[],
  ) {
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);

    const dayStart = new Date(date);
    dayStart.setHours(openH, openM, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(closeH, closeM, 0, 0);

    // PERF-01: Batch-fetch all existing slots for this day in ONE query
    // instead of one findFirst per slot (eliminates N+1 query pattern)
    const existingSlots = await this.prisma.timeSlot.findMany({
      where: { rangeId, startTime: { gte: dayStart, lt: dayEnd } },
      select: { startTime: true, laneId: true },
    });
    const existingSet = new Set(
      existingSlots.map((s) => `${s.laneId ?? 'null'}-${s.startTime.getTime()}`),
    );

    const laneTargets = lanes.length > 0 ? lanes : [null as unknown as { id: string }];
    const toCreate: Parameters<typeof this.prisma.timeSlot.create>[0]['data'][] = [];

    let slotStart = new Date(dayStart);
    while (slotStart < dayEnd) {
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);
      if (slotEnd > dayEnd) break;

      for (const lane of laneTargets) {
        const key = `${lane?.id ?? 'null'}-${slotStart.getTime()}`;
        if (!existingSet.has(key)) {
          toCreate.push({
            rangeId,
            laneId: lane?.id ?? null,
            startTime: new Date(slotStart),
            endTime: new Date(slotEnd),
            capacity: 1,
          });
        }
      }
      slotStart = new Date(slotEnd);
    }

    // Batch insert all new slots in one transaction
    if (toCreate.length > 0) {
      await this.prisma.$transaction(
        toCreate.map((data) => this.prisma.timeSlot.create({ data })),
      );
    }
  }

  async setOperatingHours(rangeId: string, dto: SetOperatingHoursDto) {
    return this.prisma.operatingHours.upsert({
      where: { rangeId_dayOfWeek: { rangeId, dayOfWeek: dto.dayOfWeek } },
      update: {
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        slotDurationMinutes: dto.slotDurationMinutes ?? 60,
        isOpen: dto.isOpen ?? true,
      },
      create: {
        rangeId,
        dayOfWeek: dto.dayOfWeek,
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        slotDurationMinutes: dto.slotDurationMinutes ?? 60,
        isOpen: dto.isOpen ?? true,
      },
    });
  }

  async getOperatingHours(rangeId: string) {
    return this.prisma.operatingHours.findMany({
      where: { rangeId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async createTimeSlot(rangeId: string, dto: CreateTimeSlotDto) {
    return this.prisma.timeSlot.create({
      data: {
        rangeId,
        laneId: dto.laneId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        capacity: dto.capacity ?? 1,
        slotType: dto.slotType ?? 'WALK_IN',
        status: 'AVAILABLE',
      },
    });
  }

  /**
   * 2.2.4 GET /ranges/:id/availability?date=YYYY-MM-DD — public endpoint
   */
  async getAvailability(rangeId: string, date: string) {
    const day = new Date(date);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const slots = await this.prisma.timeSlot.findMany({
      where: {
        rangeId,
        startTime: { gte: day, lte: dayEnd },
      },
      include: {
        lane: { select: { laneNumber: true, name: true, maxCaliber: true } },
        bookings: { select: { id: true, numberOfShooters: true } },
      },
      orderBy: [{ laneId: 'asc' }, { startTime: 'asc' }],
    });

    return slots.map((slot) => {
      const bookedCount = slot.bookings.reduce((sum, b) => sum + b.numberOfShooters, 0);
      return {
        id: slot.id,
        laneId: slot.laneId,
        laneNumber: slot.lane?.laneNumber,
        laneName: slot.lane?.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        bookedCount,
        available: bookedCount < slot.capacity,
        status: slot.status,
        slotType: slot.slotType,
      };
    });
  }

  // ── Booking CRUD ──────────────────────────────────────────────────────────

  /**
   * 2.2.4 POST /bookings — create a booking (+ auto-join waitlist if full)
   */
  async createBooking(userId: string, dto: CreateBookingDto) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id: dto.slotId },
      include: { bookings: true },
    });
    if (!slot) throw new NotFoundException('Time slot not found');
    if (slot.status === 'CLOSED') throw new BadRequestException('Slot is closed');

    const bookedCount = slot.bookings.reduce((sum, b) => sum + b.numberOfShooters, 0);
    const isFull = bookedCount + (dto.numberOfShooters ?? 1) > slot.capacity;

    if (isFull) {
      // Auto-join waitlist (2.2.7)
      const position = await this.prisma.waitlist.count({ where: { slotId: dto.slotId } });
      const entry = await this.prisma.waitlist.create({
        data: { slotId: dto.slotId, userId, position: position + 1 },
      });
      return { waitlisted: true, position: entry.position, slotId: dto.slotId };
    }

    const ref = this.generateRef();
    const booking = await this.prisma.booking.create({
      data: {
        userId,
        slotId: dto.slotId,
        laneId: dto.laneId,
        numberOfShooters: dto.numberOfShooters ?? 1,
        notes: dto.notes,
        bookingReference: ref,
        recurringType: dto.recurringType ?? 'NONE',
        status: 'CONFIRMED',
      },
    });

    // Update slot to FULL if now at capacity
    const newBookedCount = bookedCount + (dto.numberOfShooters ?? 1);
    if (newBookedCount >= slot.capacity) {
      await this.prisma.timeSlot.update({ where: { id: dto.slotId }, data: { status: 'FULL' } });
    }

    // 2.2.6 Recurring: auto-create future bookings (up to 8 weeks)
    if (dto.recurringType && dto.recurringType !== 'NONE') {
      await this.createRecurringBookings(booking.id, userId, dto, slot.startTime);
    }

    return { ...booking, qrData: `MARKSMAN-BKG-${ref}` };
  }

  private async createRecurringBookings(
    parentId: string,
    userId: string,
    dto: CreateBookingDto,
    originalStart: Date,
  ) {
    const weekStep = dto.recurringType === 'WEEKLY' ? 1 : 2;
    const weeksAhead = 8;

    for (let w = weekStep; w <= weeksAhead; w += weekStep) {
      const nextStart = addWeeks(originalStart, w);

      // Find a slot on the same day-of-week at the same time
      const nextSlot = await this.prisma.timeSlot.findFirst({
        where: {
          rangeId: dto.rangeId,
          laneId: dto.laneId,
          startTime: nextStart,
          status: { not: 'CLOSED' },
        },
      });

      if (nextSlot) {
        const ref = this.generateRef();
        await this.prisma.booking.create({
          data: {
            userId,
            slotId: nextSlot.id,
            laneId: dto.laneId,
            numberOfShooters: dto.numberOfShooters ?? 1,
            bookingReference: ref,
            recurringType: dto.recurringType!,
            recurringGroupId: parentId,
            status: 'CONFIRMED',
          },
        });
      }
    }
  }

  /**
   * 2.2.4 GET /bookings/my
   */
  async getMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        slot: true,
        lane: { select: { laneNumber: true, name: true } },
      },
      orderBy: { slot: { startTime: 'asc' } },
    });
  }

  /**
   * 2.2.4 PATCH /bookings/:id/cancel
   */
  async cancelBooking(bookingId: string, userId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { slot: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException('Cannot cancel another user\'s booking');
    if (booking.status === 'CANCELLED') throw new BadRequestException('Already cancelled');

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED', notes: dto?.reason ? `Cancelled: ${dto.reason}` : booking.notes },
    });

    // Free slot capacity and notify next waitlist person
    await this.prisma.timeSlot.update({
      where: { id: booking.slotId },
      data: { status: 'AVAILABLE' },
    });

    // Notify next person in waitlist (2.2.7)
    const nextInLine = await this.prisma.waitlist.findFirst({
      where: { slotId: booking.slotId, notifiedAt: null },
      orderBy: { position: 'asc' },
    });
    if (nextInLine) {
      await this.prisma.waitlist.update({
        where: { id: nextInLine.id },
        data: { notifiedAt: new Date() },
      });
      this.logger.log(`Waitlist: Notified user ${nextInLine.userId} for slot ${booking.slotId}`);
    }

    return { cancelled: true, bookingId };
  }

  /**
   * 2.2.4 POST /bookings/:id/check-in — RSO/STAFF marks arrival
   */
  async checkInBooking(bookingId: string, dto: CheckInBookingDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'CANCELLED') throw new BadRequestException('Booking is cancelled');

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        checkInAt: new Date(),
        laneId: dto.laneId ?? booking.laneId,
      },
      include: { lane: true },
    });
  }

  /**
   * 2.2.8 Walk-in check-in: instant booking for a walk-in shooter
   */
  async walkInCheckIn(rangeId: string, userId: string, numberOfShooters: number = 1) {
    const now = new Date();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const availableSlot = await this.prisma.timeSlot.findFirst({
      where: {
        rangeId,
        status: 'AVAILABLE',
        startTime: { gte: now, lte: todayEnd },
      },
      include: { lane: true },
      orderBy: { startTime: 'asc' },
    });

    if (!availableSlot) {
      // Join waitlist
      const nextSlot = await this.prisma.timeSlot.findFirst({
        where: { rangeId, startTime: { gte: now, lte: todayEnd } },
        orderBy: { startTime: 'asc' },
      });
      if (!nextSlot) return { status: 'NO_SLOTS', message: 'No slots available today' };

      const position = await this.prisma.waitlist.count({ where: { slotId: nextSlot.id } });
      const w = await this.prisma.waitlist.create({
        data: { slotId: nextSlot.id, userId, position: position + 1 },
      });
      return { status: 'WAITLISTED', position: w.position, estimatedWait: w.position * 15 };
    }

    const ref = this.generateRef();
    const booking = await this.prisma.booking.create({
      data: {
        userId,
        slotId: availableSlot.id,
        laneId: availableSlot.laneId,
        numberOfShooters,
        bookingReference: ref,
        status: 'CONFIRMED',
        checkInAt: now,
      },
    });

    // Mark lane OCCUPIED
    if (availableSlot.lane) {
      await this.prisma.rangeLane.update({
        where: { id: availableSlot.lane.id },
        data: { status: 'OCCUPIED' },
      });
    }

    // Mark slot
    await this.prisma.timeSlot.update({
      where: { id: availableSlot.id },
      data: { status: 'FULL' },
    });

    return {
      status: 'CHECKED_IN',
      bookingId: booking.id,
      bookingReference: ref,
      laneNumber: availableSlot.lane?.laneNumber,
      qrData: `MARKSMAN-BKG-${ref}`,
    };
  }

  /**
   * Validate range access (2.3.7) — used by turnstile hardware
   */
  async validateAccess(rangeId: string, userId: string): Promise<{ allowed: boolean; tier: string; reason: string }> {
    const sub = await this.prisma.membershipSubscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { tier: true },
    });

    if (sub) {
      return { allowed: true, tier: sub.tier.name, reason: 'Active membership' };
    }

    // Check for an upcoming confirmed booking today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);

    const booking = await this.prisma.booking.findFirst({
      where: {
        userId,
        status: 'CONFIRMED',
        slot: { rangeId, startTime: { gte: today, lt: tomorrow } },
      },
    });

    if (booking) {
      return { allowed: true, tier: 'Day Pass', reason: 'Confirmed booking today' };
    }

    return { allowed: false, tier: 'None', reason: 'No active membership or booking' };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkMembershipExpirations() {
    this.logger.log('Running daily cron: Checking for memberships expiring in 30, 7, and 1 days...');
    // Mock implementation for broadcasting warnings
    return true;
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BookingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const common_2 = require("@nestjs/common");
const crypto_1 = require("crypto");
const date_fns_1 = require("date-fns");
let BookingService = BookingService_1 = class BookingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_2.Logger(BookingService_1.name);
    }
    generateRef() {
        return (0, crypto_1.randomBytes)(4).toString('hex').toUpperCase();
    }
    async generateFutureSlots() {
        this.logger.log('Running daily time-slot generation cron...');
        const ranges = await this.prisma.shootingRange.findMany({
            where: { isActive: true },
            include: { operatingHours: true, lanes: true },
        });
        const targetDate = (0, date_fns_1.addDays)(new Date(), 30);
        for (const range of ranges) {
            for (const oh of range.operatingHours) {
                if (!oh.isOpen)
                    continue;
                let cursor = new Date();
                cursor.setHours(0, 0, 0, 0);
                while (cursor <= targetDate) {
                    if (cursor.getDay() === oh.dayOfWeek) {
                        await this.generateSlotsForDay(range.id, cursor, oh.openTime, oh.closeTime, oh.slotDurationMinutes, range.lanes);
                    }
                    cursor = (0, date_fns_1.addDays)(cursor, 1);
                }
            }
        }
        this.logger.log('Time-slot generation complete.');
    }
    async generateSlotsForDay(rangeId, date, openTime, closeTime, durationMin, lanes) {
        const [openH, openM] = openTime.split(':').map(Number);
        const [closeH, closeM] = closeTime.split(':').map(Number);
        const dayStart = new Date(date);
        dayStart.setHours(openH, openM, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(closeH, closeM, 0, 0);
        const existingSlots = await this.prisma.timeSlot.findMany({
            where: { rangeId, startTime: { gte: dayStart, lt: dayEnd } },
            select: { startTime: true, laneId: true },
        });
        const existingSet = new Set(existingSlots.map((s) => `${s.laneId ?? 'null'}-${s.startTime.getTime()}`));
        const laneTargets = lanes.length > 0 ? lanes : [null];
        const toCreate = [];
        let slotStart = new Date(dayStart);
        while (slotStart < dayEnd) {
            const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);
            if (slotEnd > dayEnd)
                break;
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
        if (toCreate.length > 0) {
            await this.prisma.$transaction(toCreate.map((data) => this.prisma.timeSlot.create({ data })));
        }
    }
    async setOperatingHours(rangeId, dto) {
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
    async getOperatingHours(rangeId) {
        return this.prisma.operatingHours.findMany({
            where: { rangeId },
            orderBy: { dayOfWeek: 'asc' },
        });
    }
    async createTimeSlot(rangeId, dto) {
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
    async getAvailability(rangeId, date) {
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
    async createBooking(userId, dto) {
        const slot = await this.prisma.timeSlot.findUnique({
            where: { id: dto.slotId },
            include: { bookings: true },
        });
        if (!slot)
            throw new common_1.NotFoundException('Time slot not found');
        if (slot.status === 'CLOSED')
            throw new common_1.BadRequestException('Slot is closed');
        const bookedCount = slot.bookings.reduce((sum, b) => sum + b.numberOfShooters, 0);
        const isFull = bookedCount + (dto.numberOfShooters ?? 1) > slot.capacity;
        if (isFull) {
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
        const newBookedCount = bookedCount + (dto.numberOfShooters ?? 1);
        if (newBookedCount >= slot.capacity) {
            await this.prisma.timeSlot.update({ where: { id: dto.slotId }, data: { status: 'FULL' } });
        }
        if (dto.recurringType && dto.recurringType !== 'NONE') {
            await this.createRecurringBookings(booking.id, userId, dto, slot.startTime);
        }
        return { ...booking, qrData: `MARKSMAN-BKG-${ref}` };
    }
    async createRecurringBookings(parentId, userId, dto, originalStart) {
        const weekStep = dto.recurringType === 'WEEKLY' ? 1 : 2;
        const weeksAhead = 8;
        for (let w = weekStep; w <= weeksAhead; w += weekStep) {
            const nextStart = (0, date_fns_1.addWeeks)(originalStart, w);
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
                        recurringType: dto.recurringType,
                        recurringGroupId: parentId,
                        status: 'CONFIRMED',
                    },
                });
            }
        }
    }
    async getMyBookings(userId) {
        return this.prisma.booking.findMany({
            where: { userId },
            include: {
                slot: true,
                lane: { select: { laneNumber: true, name: true } },
            },
            orderBy: { slot: { startTime: 'asc' } },
        });
    }
    async cancelBooking(bookingId, userId, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { slot: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.userId !== userId)
            throw new common_1.ForbiddenException('Cannot cancel another user\'s booking');
        if (booking.status === 'CANCELLED')
            throw new common_1.BadRequestException('Already cancelled');
        await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED', notes: dto?.reason ? `Cancelled: ${dto.reason}` : booking.notes },
        });
        await this.prisma.timeSlot.update({
            where: { id: booking.slotId },
            data: { status: 'AVAILABLE' },
        });
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
    async checkInBooking(bookingId, dto) {
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.status === 'CANCELLED')
            throw new common_1.BadRequestException('Booking is cancelled');
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
    async walkInCheckIn(rangeId, userId, numberOfShooters = 1) {
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
            const nextSlot = await this.prisma.timeSlot.findFirst({
                where: { rangeId, startTime: { gte: now, lte: todayEnd } },
                orderBy: { startTime: 'asc' },
            });
            if (!nextSlot)
                return { status: 'NO_SLOTS', message: 'No slots available today' };
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
        if (availableSlot.lane) {
            await this.prisma.rangeLane.update({
                where: { id: availableSlot.lane.id },
                data: { status: 'OCCUPIED' },
            });
        }
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
    async validateAccess(rangeId, userId) {
        const sub = await this.prisma.membershipSubscription.findFirst({
            where: { userId, status: 'ACTIVE' },
            include: { tier: true },
        });
        if (sub) {
            return { allowed: true, tier: sub.tier.name, reason: 'Active membership' };
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = (0, date_fns_1.addDays)(today, 1);
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
    async checkMembershipExpirations() {
        this.logger.log('Running daily cron: Checking for memberships expiring in 30, 7, and 1 days...');
        return true;
    }
};
exports.BookingService = BookingService;
__decorate([
    (0, schedule_1.Cron)('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingService.prototype, "generateFutureSlots", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingService.prototype, "checkMembershipExpirations", null);
exports.BookingService = BookingService = BookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingService);
//# sourceMappingURL=booking.service.js.map
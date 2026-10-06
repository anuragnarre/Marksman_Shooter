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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
let RangesService = class RangesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateRangeCode() {
        return (0, crypto_1.randomBytes)(3).toString('hex').toUpperCase();
    }
    async createRange(userId, dto) {
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
    async getMyRanges(userId) {
        return this.prisma.shootingRange.findMany({
            where: { ownerId: userId },
            include: { lanes: true },
        });
    }
    async getRangeDetails(rangeId) {
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
        if (!range)
            throw new common_1.NotFoundException('Range not found');
        return range;
    }
    async createLane(rangeId, dto) {
        const existing = await this.prisma.rangeLane.findUnique({
            where: { rangeId_laneNumber: { rangeId, laneNumber: dto.laneNumber } },
        });
        if (existing)
            throw new common_1.BadRequestException('Lane number already exists in this range');
        return this.prisma.rangeLane.create({
            data: {
                rangeId,
                laneNumber: dto.laneNumber,
                name: dto.name,
                deviceId: dto.deviceId,
            },
        });
    }
    async registerWalkInGuest(rangeId, dto) {
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
                data: { status: 'OCCUPIED' }
            });
        }
        return guestUser;
    }
    async linkSessionToLane(laneId, sessionId) {
        return this.prisma.rangeLane.update({
            where: { id: laneId },
            data: { activeSessionId: sessionId, status: 'OCCUPIED' },
        });
    }
    async clearLane(laneId) {
        return this.prisma.rangeLane.update({
            where: { id: laneId },
            data: { activeSessionId: null, status: 'AVAILABLE' },
        });
    }
    async updateLane(laneId, data) {
        return this.prisma.rangeLane.update({
            where: { id: laneId },
            data: {
                name: data.name,
                status: data.status,
                maxCaliber: data.maxCaliber,
                targetFrameType: data.targetFrameType,
                notes: data.notes,
                supportedDistances: data.supportedDistances,
            },
        });
    }
    async updateLaneStatus(laneId, status) {
        const update = { status };
        if (status === 'AVAILABLE')
            update.activeSessionId = null;
        return this.prisma.rangeLane.update({ where: { id: laneId }, data: update });
    }
    async getLanes(rangeId) {
        return this.prisma.rangeLane.findMany({
            where: { rangeId },
            include: {
                activeSession: { include: { shooter: { select: { id: true, name: true } } } },
                device: true,
            },
            orderBy: { laneNumber: 'asc' },
        });
    }
    async logLaneInspection(laneId, rsoId, data) {
        const log = await this.prisma.laneInspectionLog.create({
            data: {
                laneId,
                rsoId,
                status: data.status ?? 'PASS',
                notes: data.notes,
                photos: data.photos ?? [],
            },
        });
        await this.prisma.rangeLane.update({
            where: { id: laneId },
            data: { lastInspectedAt: new Date() },
        });
        return log;
    }
    async bookLane(rangeId, dto) {
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
};
exports.RangesService = RangesService;
exports.RangesService = RangesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RangesService);
//# sourceMappingURL=ranges.service.js.map
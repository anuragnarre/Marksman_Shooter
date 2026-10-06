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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EventsService = class EventsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllPublished() {
        return this.prisma.competitionEvent.findMany({
            where: { status: 'PUBLISHED' },
            include: {
                categories: true,
                _count: { select: { registrations: true } },
            },
            orderBy: { date: 'asc' },
        });
    }
    async findOnePublished(id) {
        const event = await this.prisma.competitionEvent.findUnique({
            where: { id },
            include: {
                categories: true,
                registrations: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
                _count: { select: { registrations: true } },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return event;
    }
    async getUpcomingPublished() {
        return this.prisma.competitionEvent.findMany({
            where: {
                status: 'PUBLISHED',
                date: { gte: new Date() },
            },
            include: {
                categories: true,
                _count: { select: { registrations: true } },
            },
            orderBy: { date: 'asc' },
            take: 5,
        });
    }
    async create(dto, adminUserId) {
        const { categories, ...eventData } = dto;
        return this.prisma.competitionEvent.create({
            data: {
                ...eventData,
                date: new Date(dto.date),
                images: dto.images ?? [],
                videos: dto.videos ?? [],
                createdById: adminUserId,
                categories: categories?.length
                    ? { create: categories }
                    : undefined,
            },
            include: { categories: true },
        });
    }
    async update(id, dto) {
        const event = await this.prisma.competitionEvent.findUnique({ where: { id } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return this.prisma.competitionEvent.update({
            where: { id },
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : undefined,
            },
            include: { categories: true, _count: { select: { registrations: true } } },
        });
    }
    async delete(id) {
        const event = await this.prisma.competitionEvent.findUnique({ where: { id } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        await this.prisma.competitionEvent.delete({ where: { id } });
        return { deleted: true };
    }
    async register(eventId, userId, dto) {
        const event = await this.prisma.competitionEvent.findUnique({
            where: { id: eventId },
            include: { _count: { select: { registrations: true } } },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.status !== 'PUBLISHED') {
            throw new common_1.BadRequestException('Event is not open for registration');
        }
        if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
            throw new common_1.BadRequestException('Event is full');
        }
        const existing = await this.prisma.competitionEventRegistration.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });
        if (existing)
            throw new common_1.ConflictException('Already registered for this event');
        return this.prisma.competitionEventRegistration.create({
            data: {
                eventId,
                userId,
                categoryId: dto.categoryId ?? null,
                paymentStatus: 'COMING_SOON',
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                category: true,
            },
        });
    }
    async getRegistrations(eventId) {
        const event = await this.prisma.competitionEvent.findUnique({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return this.prisma.competitionEventRegistration.findMany({
            where: { eventId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                category: true,
            },
            orderBy: { registeredAt: 'desc' },
        });
    }
    async findAll() {
        return this.prisma.competitionEvent.findMany({
            include: {
                categories: true,
                _count: { select: { registrations: true } },
            },
            orderBy: { date: 'desc' },
        });
    }
    async getScoreboard(eventId) {
        return this.prisma.scoreboardEntry.findMany({
            where: { competitionId: eventId },
            orderBy: [
                { categoryId: 'asc' },
                { totalScore: 'desc' }
            ]
        });
    }
    async updateScoreboard(eventId, data) {
        const entry = await this.prisma.scoreboardEntry.findFirst({
            where: { competitionId: eventId, shooterId: data.shooterId, categoryId: data.categoryId }
        });
        if (entry) {
            return this.prisma.scoreboardEntry.update({
                where: { id: entry.id },
                data: { totalScore: data.totalScore, rank: data.rank }
            });
        }
        else {
            return this.prisma.scoreboardEntry.create({
                data: {
                    competitionId: eventId,
                    categoryId: data.categoryId,
                    shooterId: data.shooterId,
                    totalScore: data.totalScore,
                    rank: data.rank
                }
            });
        }
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map
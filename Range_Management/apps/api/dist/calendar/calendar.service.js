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
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const EVENT_INCLUDE = {
    assignees: {
        include: {
            shooter: {
                select: { id: true, name: true, email: true, role: true, createdAt: true },
            },
        },
    },
};
let CalendarService = class CalendarService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    isSelfManagedEvent(event, userId) {
        return (event.coachId === userId &&
            event.assignees.length === 1 &&
            event.assignees[0]?.shooterId === userId);
    }
    safeDate(value, fallback) {
        const normalized = value?.replace(' ', '+') ?? '';
        const d = new Date(normalized);
        return isNaN(d.getTime()) ? fallback : d;
    }
    async getCoachEvents(coachId, start, end) {
        const defaultStart = new Date(Date.now() - 30 * 86400000);
        const defaultEnd = new Date(Date.now() + 90 * 86400000);
        const events = await this.prisma.trainingEvent.findMany({
            where: {
                coachId,
                deletedAt: null,
                start: { gte: this.safeDate(start, defaultStart) },
                end: { lte: this.safeDate(end, defaultEnd) },
            },
            include: EVENT_INCLUDE,
            orderBy: { start: 'asc' },
        });
        return events;
    }
    async getShooterEvents(shooterId, start, end) {
        const defaultStart = new Date(Date.now() - 30 * 86400000);
        const defaultEnd = new Date(Date.now() + 90 * 86400000);
        const assignees = await this.prisma.eventAssignee.findMany({
            where: {
                shooterId,
                event: {
                    deletedAt: null,
                    start: { gte: this.safeDate(start, defaultStart) },
                    end: { lte: this.safeDate(end, defaultEnd) },
                },
            },
            include: {
                event: { include: EVENT_INCLUDE },
            },
            orderBy: { event: { start: 'asc' } },
        });
        return assignees.map((a) => ({ ...a.event, assigneeStatus: a.status }));
    }
    async createEvent(actorId, actorRole, dto) {
        const isCoach = actorRole === 'COACH';
        const assigneeIds = isCoach ? dto.assigneeIds ?? [] : [actorId];
        if (!isCoach && dto.assigneeIds !== undefined) {
            const validSelfOnly = dto.assigneeIds.length === 1 && dto.assigneeIds[0] === actorId;
            if (!validSelfOnly) {
                throw new common_1.ForbiddenException('Shooters can only assign calendar items to themselves');
            }
        }
        if (isCoach) {
            await this.assertCoachCanAssignShooters(actorId, assigneeIds);
        }
        const groupId = dto.recurringType && dto.recurringType !== 'none'
            ? crypto.randomUUID()
            : null;
        const dates = this.expandDates(dto, groupId);
        const created = await this.prisma.$transaction(dates.map((d) => this.prisma.trainingEvent.create({
            data: {
                title: dto.title,
                description: dto.description ?? null,
                eventType: dto.eventType ?? 'SESSION',
                start: d.start,
                end: d.end,
                allDay: dto.allDay ?? false,
                color: dto.color ?? null,
                recurringGroupId: groupId,
                coachId: actorId,
                assignees: assigneeIds.length
                    ? {
                        create: assigneeIds.map((sid) => ({
                            shooterId: sid,
                            status: 'PENDING',
                        })),
                    }
                    : undefined,
            },
            include: EVENT_INCLUDE,
        })));
        return created;
    }
    async updateEvent(actorId, actorRole, eventId, dto) {
        const isCoach = actorRole === 'COACH';
        const event = await this.prisma.trainingEvent.findFirst({
            where: { id: eventId, deletedAt: null },
            include: { assignees: { select: { shooterId: true } } },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.coachId !== actorId)
            throw new common_1.ForbiddenException('Not your event');
        if (!isCoach && !this.isSelfManagedEvent(event, actorId)) {
            throw new common_1.ForbiddenException('You can only edit your own training items');
        }
        if (!isCoach && dto.assigneeIds !== undefined) {
            throw new common_1.ForbiddenException('Shooters cannot reassign calendar items');
        }
        if (isCoach && dto.assigneeIds !== undefined) {
            await this.assertCoachCanAssignShooters(actorId, dto.assigneeIds);
            await this.prisma.eventAssignee.deleteMany({ where: { eventId } });
            if (dto.assigneeIds.length > 0) {
                await this.prisma.eventAssignee.createMany({
                    data: dto.assigneeIds.map((sid) => ({
                        eventId,
                        shooterId: sid,
                        status: 'PENDING',
                    })),
                    skipDuplicates: true,
                });
            }
        }
        const updated = await this.prisma.trainingEvent.update({
            where: { id: eventId },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.eventType !== undefined && { eventType: dto.eventType }),
                ...(dto.start !== undefined && { start: new Date(dto.start) }),
                ...(dto.end !== undefined && { end: new Date(dto.end) }),
                ...(dto.allDay !== undefined && { allDay: dto.allDay }),
                ...(dto.color !== undefined && { color: dto.color }),
            },
            include: EVENT_INCLUDE,
        });
        return updated;
    }
    async deleteEvent(actorId, actorRole, eventId) {
        const isCoach = actorRole === 'COACH';
        const event = await this.prisma.trainingEvent.findFirst({
            where: { id: eventId, deletedAt: null },
            include: { assignees: { select: { shooterId: true } } },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.coachId !== actorId)
            throw new common_1.ForbiddenException('Not your event');
        if (!isCoach && !this.isSelfManagedEvent(event, actorId)) {
            throw new common_1.ForbiddenException('You can only delete your own training items');
        }
        await this.prisma.trainingEvent.update({
            where: { id: eventId },
            data: { deletedAt: new Date() },
        });
        return { deleted: true };
    }
    async deleteRecurringGroup(actorId, actorRole, groupId) {
        const isCoach = actorRole === 'COACH';
        const events = await this.prisma.trainingEvent.findMany({
            where: { recurringGroupId: groupId, coachId: actorId, deletedAt: null },
            select: { id: true, coachId: true, assignees: { select: { shooterId: true } } },
        });
        if (!isCoach && events.some((event) => !this.isSelfManagedEvent(event, actorId))) {
            throw new common_1.ForbiddenException('You can only delete recurring items you created for yourself');
        }
        if (events.length === 0)
            return { deleted: true };
        await this.prisma.trainingEvent.updateMany({
            where: { id: { in: events.map((event) => event.id) } },
            data: { deletedAt: new Date() },
        });
        return { deleted: true };
    }
    async getConnectedShooters(coachId) {
        const [connections, managedProfiles] = await Promise.all([
            this.prisma.coachConnection.findMany({
                where: { coachId, status: 'APPROVED' },
                include: {
                    shooter: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
                },
            }),
            this.prisma.shooterProfile.findMany({
                where: { managedByCoachId: coachId, isManaged: true },
                include: {
                    user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
                },
            }),
        ]);
        const byId = new Map();
        for (const c of connections)
            byId.set(c.shooter.id, c.shooter);
        for (const profile of managedProfiles)
            byId.set(profile.user.id, profile.user);
        return Array.from(byId.values());
    }
    expandDates(dto, groupId) {
        const start = new Date(dto.start);
        const end = new Date(dto.end);
        const durationMs = end.getTime() - start.getTime();
        if (!groupId || !dto.recurringType || dto.recurringType === 'none') {
            return [{ start, end }];
        }
        const until = dto.recurringUntil ? new Date(dto.recurringUntil) : (() => {
            const d = new Date(start);
            d.setMonth(d.getMonth() + 3);
            return d;
        })();
        const stepMs = {
            none: 0,
            daily: 86400000,
            weekly: 7 * 86400000,
            biweekly: 14 * 86400000,
            monthly: 0,
        };
        const dates = [];
        let current = new Date(start);
        while (current <= until && dates.length < 52) {
            dates.push({ start: new Date(current), end: new Date(current.getTime() + durationMs) });
            if (dto.recurringType === 'monthly') {
                current.setMonth(current.getMonth() + 1);
            }
            else {
                current = new Date(current.getTime() + stepMs[dto.recurringType]);
            }
        }
        return dates;
    }
    async assertCoachCanAssignShooters(coachId, shooterIds) {
        if (shooterIds.length === 0)
            return;
        const uniqueShooterIds = Array.from(new Set(shooterIds));
        const [connections, managedProfiles] = await Promise.all([
            this.prisma.coachConnection.findMany({
                where: { coachId, status: 'APPROVED', shooterId: { in: uniqueShooterIds } },
                select: { shooterId: true },
            }),
            this.prisma.shooterProfile.findMany({
                where: { managedByCoachId: coachId, isManaged: true, userId: { in: uniqueShooterIds } },
                select: { userId: true },
            }),
        ]);
        const allowedIds = new Set([
            ...connections.map((c) => c.shooterId),
            ...managedProfiles.map((p) => p.userId),
        ]);
        const forbiddenShooterId = uniqueShooterIds.find((id) => !allowedIds.has(id));
        if (forbiddenShooterId) {
            throw new common_1.ForbiddenException('You can only assign events to your connected or managed shooters');
        }
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map
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
exports.ScheduleRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../gateway/events.gateway");
const REQUEST_INCLUDE = {
    event: {
        select: {
            id: true,
            title: true,
            start: true,
            end: true,
            eventType: true,
            coachId: true,
        },
    },
    shooter: {
        select: { id: true, name: true, email: true },
    },
    coach: {
        select: { id: true, name: true, email: true },
    },
};
let ScheduleRequestsService = class ScheduleRequestsService {
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async createRequest(shooterId, dto) {
        const assignee = await this.prisma.eventAssignee.findFirst({
            where: { eventId: dto.eventId, shooterId },
            include: { event: { select: { coachId: true } } },
        });
        if (!assignee) {
            throw new common_1.ForbiddenException('You are not assigned to this event');
        }
        const existing = await this.prisma.scheduleRequest.findFirst({
            where: { eventId: dto.eventId, shooterId, status: 'PENDING' },
        });
        if (existing) {
            throw new common_1.BadRequestException('A pending request already exists for this event');
        }
        const coachId = assignee.event.coachId;
        if (coachId === shooterId) {
            throw new common_1.BadRequestException('Self-managed calendar items do not need a change request');
        }
        const request = await this.prisma.scheduleRequest.create({
            data: {
                eventId: dto.eventId,
                shooterId,
                coachId,
                suggestedStart: dto.suggestedStart ? new Date(dto.suggestedStart) : null,
                suggestedEnd: dto.suggestedEnd ? new Date(dto.suggestedEnd) : null,
                suggestedTitle: dto.suggestedTitle ?? null,
                notes: dto.notes ?? null,
            },
            include: REQUEST_INCLUDE,
        });
        this.gateway.emitScheduleRequestCreated(coachId, request.id);
        return request;
    }
    async getRequests(userId, role) {
        const where = role === 'COACH'
            ? { coachId: userId }
            : { shooterId: userId };
        return this.prisma.scheduleRequest.findMany({
            where,
            include: REQUEST_INCLUDE,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPendingCount(coachId) {
        const count = await this.prisma.scheduleRequest.count({
            where: { coachId, status: 'PENDING' },
        });
        return { count };
    }
    async resolveRequest(coachId, requestId, dto) {
        const request = await this.prisma.scheduleRequest.findFirst({
            where: { id: requestId },
            include: REQUEST_INCLUDE,
        });
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (request.coachId !== coachId)
            throw new common_1.ForbiddenException('Not your request to resolve');
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException('Request already resolved');
        if (dto.status === 'APPROVED' && dto.applyChanges) {
            const updateData = {};
            if (request.suggestedStart)
                updateData.start = request.suggestedStart;
            if (request.suggestedEnd)
                updateData.end = request.suggestedEnd;
            if (request.suggestedTitle)
                updateData.title = request.suggestedTitle;
            if (Object.keys(updateData).length > 0) {
                await this.prisma.trainingEvent.update({
                    where: { id: request.eventId },
                    data: updateData,
                });
            }
        }
        const updated = await this.prisma.scheduleRequest.update({
            where: { id: requestId },
            data: {
                status: dto.status,
                coachNote: dto.coachNote ?? null,
                resolvedAt: new Date(),
            },
            include: REQUEST_INCLUDE,
        });
        this.gateway.emitScheduleRequestResolved(request.shooterId, requestId, dto.status);
        return updated;
    }
    async cancelRequest(shooterId, requestId) {
        const request = await this.prisma.scheduleRequest.findFirst({
            where: { id: requestId, shooterId },
        });
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException('Can only cancel pending requests');
        await this.prisma.scheduleRequest.delete({ where: { id: requestId } });
        return { cancelled: true };
    }
};
exports.ScheduleRequestsService = ScheduleRequestsService;
exports.ScheduleRequestsService = ScheduleRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], ScheduleRequestsService);
//# sourceMappingURL=schedule-requests.service.js.map
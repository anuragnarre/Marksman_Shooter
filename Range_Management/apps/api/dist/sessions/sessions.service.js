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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const weather_service_1 = require("../ranges/weather.service");
let SessionsService = class SessionsService {
    constructor(prisma, weatherService) {
        this.prisma = prisma;
        this.weatherService = weatherService;
    }
    async createForActor(actorId, role, dto, shooterId) {
        const targetShooterId = await this.resolveShooterForWrite(actorId, role, shooterId);
        const session = await this.prisma.session.create({
            data: {
                shooterId: targetShooterId,
                discipline: dto.discipline,
                distance: dto.distance,
                weaponType: dto.weaponType,
                numberOfShots: dto.numberOfShots,
                sessionDate: new Date(dto.sessionDate),
                trainingMode: dto.trainingMode ?? null,
                rangeId: dto.rangeId ?? null,
            },
        });
        if (dto.rangeId) {
            try {
                const weather = await this.weatherService.getWeatherForRange(dto.rangeId);
                if (weather) {
                    await this.prisma.sessionContext.upsert({
                        where: { sessionId: session.id },
                        create: {
                            sessionId: session.id,
                            temperature: weather.temperature,
                            windCondition: `${weather.windSpeed} km/h`,
                        },
                        update: {
                            temperature: weather.temperature,
                            windCondition: `${weather.windSpeed} km/h`,
                        },
                    });
                }
            }
            catch {
            }
        }
        return this.mapSession(session);
    }
    async findAllForActor(actorId, role, shooterId) {
        const targetShooterId = await this.resolveShooterForRead(actorId, role, shooterId);
        const sessions = await this.prisma.session.findMany({
            where: { shooterId: targetShooterId, deletedAt: null },
            orderBy: { sessionDate: 'desc' },
        });
        return sessions.map((s) => this.mapSession(s));
    }
    async findOneWithShotsForActor(sessionId, actorId, role, shooterIdHint) {
        const session = await this.prisma.session.findFirst({
            where: { id: sessionId, deletedAt: null },
            include: {
                shots: { orderBy: { shotNumber: 'asc' } },
                feedback: {
                    include: { coach: { select: { id: true, name: true, email: true, role: true, createdAt: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException(`Session ${sessionId} not found`);
        }
        if (shooterIdHint && shooterIdHint !== session.shooterId) {
            throw new common_1.ForbiddenException('Session does not belong to the requested shooter');
        }
        await this.assertActorCanReadShooter(actorId, role, session.shooterId);
        return this.mapSession(session);
    }
    async softDeleteForActor(sessionId, actorId, role, shooterIdHint) {
        const session = await this.prisma.session.findFirst({
            where: { id: sessionId, deletedAt: null },
        });
        if (!session) {
            throw new common_1.NotFoundException(`Session ${sessionId} not found`);
        }
        if (shooterIdHint && shooterIdHint !== session.shooterId) {
            throw new common_1.ForbiddenException('Session does not belong to the requested shooter');
        }
        await this.assertActorCanWriteShooter(actorId, role, session.shooterId);
        await this.prisma.session.update({
            where: { id: sessionId },
            data: { deletedAt: new Date() },
        });
    }
    async resolveShooterForRead(actorId, role, shooterId) {
        if (role === 'COACH') {
            if (!shooterId)
                throw new common_1.BadRequestException('shooterId is required for coach access');
            await this.assertCoachCanAccessShooter(actorId, shooterId);
            return shooterId;
        }
        return actorId;
    }
    async resolveShooterForWrite(actorId, role, shooterId) {
        if (role === 'COACH') {
            if (!shooterId)
                throw new common_1.BadRequestException('shooterId is required for coach access');
            await this.assertCoachCanAccessShooter(actorId, shooterId);
            return shooterId;
        }
        return actorId;
    }
    async assertActorCanReadShooter(actorId, role, shooterId) {
        if (role === 'COACH') {
            await this.assertCoachCanAccessShooter(actorId, shooterId);
            return;
        }
        if (actorId !== shooterId)
            throw new common_1.ForbiddenException('Access denied');
    }
    async assertActorCanWriteShooter(actorId, role, shooterId) {
        if (role === 'COACH') {
            await this.assertCoachCanAccessShooter(actorId, shooterId);
            return;
        }
        if (actorId !== shooterId)
            throw new common_1.ForbiddenException('You do not own this session');
    }
    async assertCoachCanAccessShooter(coachId, shooterId) {
        const [connection, managedProfile] = await Promise.all([
            this.prisma.coachConnection.findFirst({
                where: { coachId, shooterId, status: 'APPROVED' },
                select: { id: true },
            }),
            this.prisma.shooterProfile.findFirst({
                where: { userId: shooterId, managedByCoachId: coachId, isManaged: true },
                select: { id: true },
            }),
        ]);
        if (!connection && !managedProfile) {
            throw new common_1.ForbiddenException('No approved coaching relationship with this shooter');
        }
    }
    mapSession(session) {
        return {
            id: session.id,
            shooterId: session.shooterId,
            discipline: session.discipline,
            distance: session.distance,
            weaponType: session.weaponType,
            numberOfShots: session.numberOfShots,
            sessionDate: session.sessionDate,
            trainingMode: session.trainingMode,
            createdAt: session.createdAt,
            deletedAt: session.deletedAt ?? undefined,
            shots: session.shots,
            feedback: session.feedback,
        };
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        weather_service_1.WeatherService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map
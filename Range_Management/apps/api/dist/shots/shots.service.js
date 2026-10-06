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
var ShotsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShotsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../gateway/events.gateway");
const shots_parser_1 = require("./shots.parser");
const vision_service_1 = require("./vision.service");
let ShotsService = ShotsService_1 = class ShotsService {
    constructor(prisma, eventsGateway, visionService) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
        this.visionService = visionService;
    }
    async createShots(sessionId, actorId, actorRole, shots, shooterIdHint) {
        if (shots.length === 0) {
            throw new common_1.BadRequestException('No shots provided');
        }
        const session = await this.prisma.session.findFirst({
            where: { id: sessionId, deletedAt: null },
            select: { id: true, shooterId: true, competitionEntryId: true, discipline: true },
        });
        if (!session) {
            throw new common_1.NotFoundException(`Session ${sessionId} not found or access denied`);
        }
        if (shooterIdHint && shooterIdHint !== session.shooterId) {
            throw new common_1.ForbiddenException('Session does not belong to the requested shooter');
        }
        if (actorRole === 'COACH') {
            await this.assertCoachCanAccessShooter(actorId, session.shooterId);
        }
        else if (session.shooterId !== actorId) {
            throw new common_1.ForbiddenException('You do not own this session');
        }
        const existingForNumbering = await this.prisma.shot.count({ where: { sessionId } });
        if (session.competitionEntryId) {
            let maxShots = 0;
            if (session.discipline.includes('10m Air Rifle') || session.discipline.includes('10m Air Pistol')) {
                maxShots = 60;
            }
            else if (session.discipline.includes('50m 3P')) {
                maxShots = 120;
            }
            else if (session.discipline.includes('25m')) {
                maxShots = 60;
            }
            if (maxShots > 0 && (existingForNumbering + shots.length > maxShots)) {
                throw new common_1.BadRequestException(`ISSF Format Enforcement: Maximum ${maxShots} shots allowed for ${session.discipline}`);
            }
        }
        const created = await this.prisma.$transaction(shots.map((shot, i) => this.prisma.shot.create({
            data: {
                sessionId,
                shotNumber: shot.shotNumber ?? (existingForNumbering + i + 1),
                score: shot.score,
                x: shot.x ?? 0,
                y: shot.y ?? 0,
            },
        })));
        const totalShots = await this.prisma.shot.count({ where: { sessionId } });
        this.eventsGateway.emitSessionUpdated(sessionId, totalShots);
        this.evaluatePersonalBestAndAchievements(session.id, session.shooterId).catch(err => {
            console.error('[shots] PB/Achievement eval failed:', err);
        });
        return created.map((s) => ({
            id: s.id,
            sessionId: s.sessionId,
            shotNumber: s.shotNumber,
            score: s.score,
            x: s.x,
            y: s.y,
            timestamp: s.timestamp,
        }));
    }
    async importFromFile(sessionId, actorId, actorRole, file, shooterIdHint) {
        const shots = await (0, shots_parser_1.parseFile)(file.buffer, file.mimetype, file.originalname);
        return this.createShots(sessionId, actorId, actorRole, shots, shooterIdHint);
    }
    async createManual(dto, actorId, actorRole, shooterIdHint) {
        return this.createShots(dto.sessionId, actorId, actorRole, dto.shots, shooterIdHint);
    }
    async analyzePhoto(sessionId, actorId, actorRole, file, shooterIdHint) {
        const analysisResult = await this.visionService.analyzeImage(file.buffer, file.mimetype, 'air_rifle_10m');
        if (!analysisResult.targetDetected || analysisResult.shots.length === 0) {
            throw new common_1.BadRequestException('No bullet holes detected in this photo. Ensure the target is clearly visible and well-lit.');
        }
        const shots = analysisResult.shots.map((s) => ({
            shotNumber: s.shotNumber,
            score: s.score,
            x: s.x,
            y: s.y,
        }));
        return this.createShots(sessionId, actorId, actorRole, shots, shooterIdHint);
    }
    async analyzePhotoFull(sessionId, actorId, actorRole, file, targetType = 'air_rifle_10m', shooterIdHint, persist = true) {
        const analysisResult = await this.visionService.analyzeImage(file.buffer, file.mimetype, targetType);
        const visionShots = analysisResult.shots.map((s) => ({
            shotNumber: s.shotNumber,
            score: s.score,
            x: s.x,
            y: s.y,
            pixelX: 500,
            pixelY: 500,
            confidence: 0.95,
            isInnerTen: s.score >= 10.2,
            distMm: Math.sqrt(s.x * s.x + s.y * s.y),
        }));
        const inputs = visionShots.map((vs) => ({
            shotNumber: vs.shotNumber,
            score: vs.score,
            x: vs.x,
            y: vs.y,
        }));
        const savedShots = (persist && analysisResult.targetDetected && inputs.length > 0)
            ? await this.createShots(sessionId, actorId, actorRole, inputs, shooterIdHint)
            : [];
        return {
            shots: visionShots,
            targetDetected: analysisResult.targetDetected,
            processingTimeMs: analysisResult.processingTimeMs,
            savedShots,
            warpCenterX: 500,
            warpCenterY: 500,
            warpWidth: 1000,
            warpHeight: 1000,
            warpMmPerPixel: 0.17,
        };
    }
    async findBySession(sessionId) {
        const shots = await this.prisma.shot.findMany({
            where: { sessionId },
            orderBy: { shotNumber: 'asc' },
        });
        return shots.map((s) => ({
            id: s.id,
            sessionId: s.sessionId,
            shotNumber: s.shotNumber,
            score: s.score,
            x: s.x,
            y: s.y,
            timestamp: s.timestamp,
        }));
    }
    async deleteShot(shotId, actorId, actorRole) {
        const shot = await this.prisma.shot.findFirst({
            where: { id: shotId },
            select: { id: true, sessionId: true, session: { select: { shooterId: true } } },
        });
        if (!shot) {
            throw new common_1.NotFoundException(`Shot ${shotId} not found`);
        }
        if (actorRole === 'COACH') {
            await this.assertCoachCanAccessShooter(actorId, shot.session.shooterId);
        }
        else if (shot.session.shooterId !== actorId) {
            throw new common_1.ForbiddenException('You do not own this shot');
        }
        await this.prisma.shot.delete({ where: { id: shotId } });
        const remainingCount = await this.prisma.shot.count({ where: { sessionId: shot.sessionId } });
        this.eventsGateway.emitSessionUpdated(shot.sessionId, remainingCount);
        return { deleted: true };
    }
    async processLiveFrame(payload) {
        const shot = {
            score: payload.score,
            x: payload.x,
            y: payload.y,
        };
        if (payload.sessionId) {
            try {
                const session = await this.prisma.session.findFirst({
                    where: { id: payload.sessionId, deletedAt: null },
                    select: { id: true, shooterId: true },
                });
                if (session) {
                    const count = await this.prisma.shot.count({ where: { sessionId: payload.sessionId } });
                    const created = await this.prisma.shot.create({
                        data: {
                            sessionId: payload.sessionId,
                            shotNumber: count + 1,
                            score: payload.score,
                            x: payload.x,
                            y: payload.y,
                        },
                    });
                    shot.id = created.id;
                    shot.sessionId = created.sessionId;
                    shot.shotNumber = created.shotNumber;
                    shot.timestamp = created.timestamp;
                    this.eventsGateway.emitSessionUpdated(payload.sessionId, count + 1);
                }
            }
            catch (err) {
                console.error('[shots] DB save failed for live frame:', err);
            }
        }
        this.eventsGateway.emitShotDetected(payload.rangeId, {
            x: payload.x,
            y: payload.y,
            score: payload.score,
            pixelX: payload.pixelX,
            pixelY: payload.pixelY,
            targetType: payload.targetType,
            confidence: payload.confidence ?? 1.0,
            timestamp: payload.timestamp ?? Date.now(),
        });
        return { saved: !!shot.id, shot };
    }
    async updateShot(shotId, actorId, actorRole, dto) {
        const shot = await this.prisma.shot.findFirst({
            where: { id: shotId },
            select: {
                id: true,
                sessionId: true,
                x: true,
                y: true,
                shotNumber: true,
                score: true,
                timestamp: true,
                session: { select: { shooterId: true, discipline: true } },
            },
        });
        if (!shot) {
            throw new common_1.NotFoundException(`Shot ${shotId} not found`);
        }
        if (actorRole === 'COACH') {
            await this.assertCoachCanAccessShooter(actorId, shot.session.shooterId);
        }
        else if (shot.session.shooterId !== actorId) {
            throw new common_1.ForbiddenException('You do not own this shot');
        }
        const newX = dto.x ?? shot.x;
        const newY = dto.y ?? shot.y;
        const ringWidth = ShotsService_1.RING_WIDTH_MM[shot.session.discipline] ?? 8.0;
        const distMm = Math.sqrt(newX ** 2 + newY ** 2);
        const rawScore = 10.9 - distMm / ringWidth;
        const newScore = Math.round(Math.max(0, Math.min(10.9, rawScore)) * 10) / 10;
        const updated = await this.prisma.shot.update({
            where: { id: shotId },
            data: { x: newX, y: newY, score: newScore },
        });
        const shotCount = await this.prisma.shot.count({ where: { sessionId: shot.sessionId } });
        this.eventsGateway.emitSessionUpdated(shot.sessionId, shotCount);
        return {
            id: updated.id,
            sessionId: updated.sessionId,
            shotNumber: updated.shotNumber,
            score: updated.score,
            x: updated.x,
            y: updated.y,
            timestamp: updated.timestamp,
        };
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
    async evaluatePersonalBestAndAchievements(sessionId, shooterId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { shots: true }
        });
        if (!session || session.shots.length === 0)
            return;
        const sessionScore = session.shots.reduce((acc, shot) => acc + shot.score, 0);
        const existingPb = await this.prisma.personalBest.findUnique({
            where: {
                shooterId_discipline_distance_weaponType: {
                    shooterId,
                    discipline: session.discipline,
                    distance: session.distance,
                    weaponType: session.weaponType
                }
            }
        });
        if (!existingPb || sessionScore > existingPb.score) {
            const pb = await this.prisma.personalBest.upsert({
                where: {
                    shooterId_discipline_distance_weaponType: {
                        shooterId,
                        discipline: session.discipline,
                        distance: session.distance,
                        weaponType: session.weaponType
                    }
                },
                create: {
                    shooterId,
                    discipline: session.discipline,
                    distance: session.distance,
                    weaponType: session.weaponType,
                    score: sessionScore,
                    sessionId: session.id
                },
                update: {
                    score: sessionScore,
                    sessionId: session.id,
                    achievedAt: new Date()
                }
            });
            this.eventsGateway.emitPbUpdated(shooterId, pb);
        }
        const nr = await this.prisma.nationalRecord.findUnique({
            where: {
                discipline_distance_weaponType_ageCategory_gender: {
                    discipline: session.discipline,
                    distance: session.distance,
                    weaponType: session.weaponType,
                    ageCategory: 'OPEN',
                    gender: 'MIXED'
                }
            }
        });
        if (!nr || sessionScore > nr.score) {
            const newNr = await this.prisma.nationalRecord.upsert({
                where: {
                    discipline_distance_weaponType_ageCategory_gender: {
                        discipline: session.discipline,
                        distance: session.distance,
                        weaponType: session.weaponType,
                        ageCategory: 'OPEN',
                        gender: 'MIXED'
                    }
                },
                create: {
                    discipline: session.discipline,
                    distance: session.distance,
                    weaponType: session.weaponType,
                    ageCategory: 'OPEN',
                    gender: 'MIXED',
                    score: sessionScore,
                    holderId: shooterId,
                },
                update: {
                    score: sessionScore,
                    holderId: shooterId,
                    achievedAt: new Date()
                }
            });
            this.eventsGateway.emitNewNotification(shooterId, {
                notification: { title: 'New National Record!', body: `You set a new record of ${sessionScore}!` },
                unreadCount: 1
            });
        }
        if (session.shots.length >= 10 && session.shots.every(s => s.score >= 10.0)) {
            await this.awardAchievement(shooterId, 'PERFECT_10', 'Perfect 10s', 'Scored 10.0 or higher on every shot in a session (min 10 shots).');
        }
        const sessionCount = await this.prisma.session.count({ where: { shooterId } });
        if (sessionCount === 1) {
            await this.awardAchievement(shooterId, 'FIRST_SESSION', 'First Session', 'Completed your first training session.');
        }
    }
    async awardAchievement(userId, type, name, description) {
        const existing = await this.prisma.achievement.findFirst({
            where: { userId, type }
        });
        if (!existing) {
            const achievement = await this.prisma.achievement.create({
                data: { userId, type, name, description }
            });
            this.eventsGateway.emitAchievementEarned(userId, achievement);
            this.eventsGateway.emitNewNotification(userId, {
                notification: { title: 'Achievement Unlocked!', body: `You earned: ${name}` },
                unreadCount: 1
            });
        }
    }
};
exports.ShotsService = ShotsService;
ShotsService.RING_WIDTH_MM = {
    air_rifle_10m: 2.5,
    air_pistol_10m: 8.0,
    air_rifle_50m: 8.0,
    nr_50m: 8.0,
    nr_25m: 25.0,
    issf_300m_rifle: 50.0,
    nra_b8_25yd: 25.4,
    airgun_multi_bull: 2.5,
    field_target_ft: 40.0,
};
exports.ShotsService = ShotsService = ShotsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway,
        vision_service_1.VisionService])
], ShotsService);
//# sourceMappingURL=shots.service.js.map
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
exports.CompetitionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../gateway/events.gateway");
let CompetitionsService = class CompetitionsService {
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async createCompetition(data) {
        return this.prisma.competition.create({
            data: {
                name: data.name,
                description: data.description,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                rangeId: data.rangeId,
                categories: {
                    create: data.categories,
                }
            },
            include: { categories: true }
        });
    }
    async getCompetitions(status) {
        return this.prisma.competition.findMany({
            where: status ? { status } : undefined,
            include: { categories: true },
            orderBy: { startDate: 'asc' }
        });
    }
    async getCompetition(id) {
        const comp = await this.prisma.competition.findUnique({
            where: { id },
            include: {
                categories: true,
                entries: {
                    include: {
                        user: { select: { name: true } },
                        result: true
                    }
                }
            }
        });
        if (!comp)
            throw new common_1.NotFoundException('Competition not found');
        return comp;
    }
    async enterCompetition(competitionId, categoryId, userId) {
        const comp = await this.prisma.competition.findUnique({ where: { id: competitionId } });
        if (!comp)
            throw new common_1.NotFoundException('Competition not found');
        if (comp.status === 'COMPLETED')
            throw new common_1.BadRequestException('Competition is over');
        const profile = await this.prisma.shooterProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.BadRequestException('Complete shooter profile first');
        const licenses = await this.prisma.license.findMany({
            where: { userId, status: 'VALID', expiryDate: { gte: new Date() } }
        });
        if (licenses.length === 0 || profile.backgroundCheckStatus !== 'CLEARED') {
            throw new common_1.ForbiddenException('Not eligible to enter: Missing valid license or cleared background check.');
        }
        const existing = await this.prisma.competitionEntry.findUnique({
            where: { userId_categoryId: { userId, categoryId } }
        });
        if (existing)
            throw new common_1.BadRequestException('Already entered in this category');
        return this.prisma.competitionEntry.create({
            data: {
                userId,
                competitionId,
                categoryId,
                status: 'PENDING'
            }
        });
    }
    async coachBatchEntry(competitionId, categoryId, coachId, shooterIds) {
        const comp = await this.prisma.competition.findUnique({ where: { id: competitionId } });
        if (!comp)
            throw new common_1.NotFoundException('Competition not found');
        const results = [];
        for (const userId of shooterIds) {
            try {
                const entry = await this.enterCompetition(competitionId, categoryId, userId);
                results.push({ userId, status: 'SUCCESS', entry });
            }
            catch (err) {
                results.push({ userId, status: 'FAILED', reason: err.message });
            }
        }
        return results;
    }
    async getScoreboard(competitionId) {
        const entries = await this.prisma.competitionEntry.findMany({
            where: { competitionId, status: { in: ['APPROVED', 'PAID'] } },
            include: {
                user: { select: { name: true } },
                result: true,
                category: true
            }
        });
        entries.sort((a, b) => {
            const aScore = a.result?.totalScore || 0;
            const bScore = b.result?.totalScore || 0;
            if (bScore !== aScore)
                return bScore - aScore;
            return (b.result?.innerTens || 0) - (a.result?.innerTens || 0);
        });
        return entries;
    }
    async broadcastScoreboardUpdate(competitionId) {
        const scoreboard = await this.getScoreboard(competitionId);
        this.eventsGateway.emitCompetitionScoreboard(competitionId, scoreboard);
    }
    async finalizeCompetition(competitionId) {
        const comp = await this.prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
                entries: {
                    include: { result: true }
                }
            }
        });
        if (!comp)
            throw new common_1.NotFoundException('Competition not found');
        const categoryEntries = {};
        for (const entry of comp.entries) {
            if (!categoryEntries[entry.categoryId]) {
                categoryEntries[entry.categoryId] = [];
            }
            categoryEntries[entry.categoryId].push(entry);
        }
        for (const categoryId in categoryEntries) {
            const entries = categoryEntries[categoryId].filter((e) => e.result);
            entries.sort((a, b) => {
                const aScore = a.result.totalScore || 0;
                const bScore = b.result.totalScore || 0;
                if (bScore !== aScore)
                    return bScore - aScore;
                return (b.result.innerTens || 0) - (a.result.innerTens || 0);
            });
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                let medal = null;
                if (i === 0)
                    medal = 'GOLD';
                else if (i === 1)
                    medal = 'SILVER';
                else if (i === 2)
                    medal = 'BRONZE';
                const category = await this.prisma.competitionCategory.findUnique({ where: { id: entry.categoryId } });
                if (category) {
                    const expectedShots = category.discipline === '10m Air Rifle' ? 60 : (category.discipline.includes('3P') ? 120 : 0);
                    const totalShots = entry.sessions.reduce((acc, s) => acc + (s.shots?.length || 0), 0);
                    if (expectedShots > 0 && totalShots < expectedShots) {
                        await this.prisma.competitionEntry.update({
                            where: { id: entry.id },
                            data: { status: 'INCOMPLETE' }
                        });
                    }
                }
                const resultRecord = await this.prisma.competitionResult.update({
                    where: { id: entry.result.id },
                    data: {
                        rank: i + 1,
                        medal
                    },
                    include: { entry: { include: { category: true, user: true } } }
                });
                if (category && i === 0) {
                    const existingRecord = await this.prisma.nationalRecord.findFirst({
                        where: {
                            discipline: category.discipline,
                            distance: category.distance,
                            weaponType: category.weaponType,
                            ageCategory: category.ageCategory || 'OPEN'
                        },
                        orderBy: { score: 'desc' }
                    });
                    if (!existingRecord || resultRecord.totalScore > existingRecord.score) {
                        await this.prisma.nationalRecord.create({
                            data: {
                                discipline: category.discipline,
                                distance: category.distance,
                                weaponType: category.weaponType,
                                ageCategory: category.ageCategory || 'OPEN',
                                score: resultRecord.totalScore,
                                holderId: resultRecord.entry.user.id,
                            }
                        });
                        this.eventsGateway.emitNationalRecordBroken(comp.id, {
                            shooter: resultRecord.entry.user.name,
                            score: resultRecord.totalScore,
                            discipline: category.discipline
                        });
                    }
                }
            }
        }
        return this.prisma.competition.update({
            where: { id: competitionId },
            data: { status: 'COMPLETED' }
        });
    }
    async getTrainingDelta(entryId) {
        const entry = await this.prisma.competitionEntry.findUnique({
            where: { id: entryId },
            include: {
                category: true,
                result: true,
                sessions: {
                    include: { shots: true }
                }
            }
        });
        if (!entry)
            throw new common_1.NotFoundException('Entry not found');
        const compScore = entry.result?.totalScore || 0;
        const compTotalShots = entry.sessions.reduce((acc, s) => acc + s.shots.length, 0);
        const compAvg = compTotalShots > 0 ? compScore / compTotalShots : 0;
        const trainingSessions = await this.prisma.session.findMany({
            where: {
                shooterId: entry.userId,
                discipline: entry.category.discipline,
                distance: entry.category.distance,
                competitionEntryId: null,
                deletedAt: null
            },
            orderBy: { sessionDate: 'desc' },
            take: 5,
            include: { shots: true }
        });
        let trainScore = 0;
        let trainTotalShots = 0;
        for (const ts of trainingSessions) {
            trainScore += ts.shots.reduce((acc, s) => acc + s.score, 0);
            trainTotalShots += ts.shots.length;
        }
        const trainAvg = trainTotalShots > 0 ? trainScore / trainTotalShots : 0;
        const pressureIndex = trainAvg > 0 ? (compAvg / trainAvg) * 100 : 0;
        return {
            competitionAverage: compAvg,
            trainingAverage: trainAvg,
            pressureIndex,
            isUnderPerforming: pressureIndex < 95
        };
    }
    async getRankings(discipline) {
        const filterDiscipline = discipline || '10m Olympic';
        const pbs = await this.prisma.personalBest.findMany({
            where: { discipline: filterDiscipline },
            include: {
                user: { select: { id: true, name: true } }
            },
            orderBy: { score: 'desc' },
            take: 50
        });
        if (pbs.length === 0) {
            return [
                { rank: '#1', name: 'E. Varga', score: '632.4', xCount: '58x', avgVel: '592 fps', isTop: true },
                { rank: '#2', name: 'S. Lindholm', score: '631.8', xCount: '55x', avgVel: '590 fps', isTop: false },
            ];
        }
        return pbs.map((pb, index) => {
            const xCount = Math.floor(pb.score / 10.9) + 'x';
            return {
                rank: `#${index + 1}`,
                name: pb.user?.name || 'Unknown Shooter',
                score: pb.score.toFixed(1),
                xCount,
                avgVel: 'N/A',
                isTop: index === 0
            };
        });
    }
    async getActiveChallenge() {
        return {
            title: "Micro-Grouping Directive",
            description: "Achieve the smallest 5-shot group at 50 yards.",
            target: "50y",
            shots: 5,
            currentBest: "0.18\"",
            currentLeader: "E. Varga"
        };
    }
};
exports.CompetitionsService = CompetitionsService;
exports.CompetitionsService = CompetitionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], CompetitionsService);
//# sourceMappingURL=competitions.service.js.map
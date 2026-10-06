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
exports.SafetyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SafetyService = class SafetyService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createIncidentReport(data) {
        return this.prisma.incidentReport.create({ data: data });
    }
    async getAllIncidents() {
        return this.prisma.incidentReport.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
    async getIncidentById(id) {
        return this.prisma.incidentReport.findUnique({
            where: { id },
            include: { IncidentPhoto: true, CorrectiveAction: true },
        });
    }
    async updateIncidentStatus(id, status) {
        return this.prisma.incidentReport.update({
            where: { id },
            data: { status },
        });
    }
    async uploadIncidentPhoto(incidentId, photoUrl) {
        return this.prisma.incidentPhoto.create({
            data: {
                incidentId,
                photoUrl,
            }
        });
    }
    async acknowledgeSafety(userId, rangeId) {
        return this.prisma.safetyAcknowledgment.create({
            data: {
                userId,
                rangeId,
                version: 1,
            }
        });
    }
    async checkSafetyAcknowledgment(userId, rangeId) {
        return this.prisma.safetyAcknowledgment.findFirst({
            where: { userId, rangeId },
            orderBy: { acknowledgedAt: 'desc' }
        });
    }
    async createQuiz(rangeId, data) {
        return this.prisma.safetyQuiz.create({
            data: { ...data, rangeId }
        });
    }
    async getQuizzes(rangeId) {
        return this.prisma.safetyQuiz.findMany({
            where: { rangeId }
        });
    }
    async submitQuizAttempt(userId, quizId, score) {
        const quiz = await this.prisma.safetyQuiz.findUnique({ where: { id: quizId } });
        if (!quiz)
            throw new common_1.BadRequestException('Quiz not found');
        const lastAttempt = await this.prisma.quizAttempt.findFirst({
            where: { userId, quizId, passed: false },
            orderBy: { attemptedAt: 'desc' },
        });
        if (lastAttempt) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (lastAttempt.attemptedAt > oneHourAgo) {
                throw new common_1.ForbiddenException('You must wait 1 hour after a failed attempt before trying again.');
            }
        }
        const passed = score >= quiz.passingScore;
        return this.prisma.quizAttempt.create({
            data: { userId, quizId, score, passed }
        });
    }
    async getFirstAidKits(rangeId) {
        return this.prisma.firstAidKit.findMany({
            where: { rangeId }
        });
    }
    async updateFirstAidKit(id, data) {
        return this.prisma.firstAidKit.update({
            where: { id },
            data
        });
    }
    async getAuditLogs(rangeId) {
        return this.prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100
        });
    }
};
exports.SafetyService = SafetyService;
exports.SafetyService = SafetyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SafetyService);
//# sourceMappingURL=safety.service.js.map
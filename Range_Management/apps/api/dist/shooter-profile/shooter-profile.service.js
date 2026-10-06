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
var ShooterProfileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShooterProfileService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
let ShooterProfileService = ShooterProfileService_1 = class ShooterProfileService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ShooterProfileService_1.name);
    }
    async getProfile(userId) {
        const profile = await this.prisma.shooterProfile.findUnique({
            where: { userId },
            include: {
                user: { select: { name: true, email: true, role: true } },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Shooter profile not found');
        }
        return profile;
    }
    async getAllProfiles() {
        return this.prisma.shooterProfile.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
            },
        });
    }
    async getPersonalBests(userId) {
        const profile = await this.getProfile(userId);
        return this.prisma.personalBest.findMany({
            where: { shooterId: profile.id },
            orderBy: { achievedAt: 'desc' },
        });
    }
    async getLicenses(userId) {
        return this.prisma.license.findMany({
            where: { userId },
            orderBy: { expiryDate: 'asc' },
        });
    }
    async updateProfile(userId, data) {
        return this.prisma.shooterProfile.update({
            where: { userId },
            data,
        });
    }
    async getCertifications(userId) {
        return this.prisma.certification.findMany({
            where: { userId },
            orderBy: { expiryDate: 'asc' },
        });
    }
    async getCompletenessScore(userId) {
        const profile = await this.prisma.shooterProfile.findUnique({
            where: { userId },
            include: { user: true },
        });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        const fieldsToCheck = [
            profile.dateOfBirth, profile.gender, profile.dominantHand,
            profile.eyeDominance, profile.stance, profile.nationality,
            profile.profilePhotoUrl, profile.heightCm, profile.weightKg,
            profile.wingspanCm, profile.phone, profile.emergencyContactName,
            profile.primaryWeapon
        ];
        const filledFields = fieldsToCheck.filter(f => f !== null && f !== undefined && f !== '');
        const score = Math.round((filledFields.length / fieldsToCheck.length) * 100);
        return { score, totalFields: fieldsToCheck.length, filledFields: filledFields.length };
    }
    async getCompetitionEligibility(userId) {
        const profile = await this.prisma.shooterProfile.findUnique({
            where: { userId },
        });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        const licenses = await this.prisma.license.findMany({
            where: { userId, status: 'VALID', expiryDate: { gte: new Date() } }
        });
        const isEligible = licenses.length > 0 && profile.backgroundCheckStatus === 'CLEARED' && !!profile.dateOfBirth;
        return {
            isEligible,
            reasons: {
                hasValidLicense: licenses.length > 0,
                backgroundCleared: profile.backgroundCheckStatus === 'CLEARED',
                hasDateOfBirth: !!profile.dateOfBirth,
            },
            ageCategory: this.calculateAgeCategory(profile.dateOfBirth)
        };
    }
    calculateAgeCategory(dob) {
        if (!dob)
            return 'UNKNOWN';
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (age < 14)
            return 'U14';
        if (age < 17)
            return 'U17';
        if (age < 21)
            return 'U21';
        if (age < 45)
            return 'Senior';
        return 'Master';
    }
    async getRankings(userId) {
        return this.prisma.rangeRanking.findMany({
            where: { shooterId: userId },
            orderBy: { eloScore: 'desc' },
            include: { rankHistories: { orderBy: { createdAt: 'desc' }, take: 5 } }
        });
    }
    async getMedicalNotes(userId, userRole) {
        return this.prisma.medicalNote.findUnique({
            where: { userId }
        });
    }
    async checkLicenseExpiries() {
        this.logger.log('Running daily license expiry check...');
    }
};
exports.ShooterProfileService = ShooterProfileService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShooterProfileService.prototype, "checkLicenseExpiries", null);
exports.ShooterProfileService = ShooterProfileService = ShooterProfileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShooterProfileService);
//# sourceMappingURL=shooter-profile.service.js.map
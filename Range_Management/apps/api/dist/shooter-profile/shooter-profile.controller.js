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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShooterProfileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const shooter_profile_service_1 = require("./shooter-profile.service");
const update_shooter_profile_dto_1 = require("./dto/update-shooter-profile.dto");
let ShooterProfileController = class ShooterProfileController {
    constructor(shooterProfileService) {
        this.shooterProfileService = shooterProfileService;
    }
    async getProfile(req) {
        return this.shooterProfileService.getProfile(req.user.id);
    }
    async getAllProfiles() {
        return this.shooterProfileService.getAllProfiles();
    }
    async getPersonalBests(req) {
        return this.shooterProfileService.getPersonalBests(req.user.id);
    }
    async getLicenses(req) {
        return this.shooterProfileService.getLicenses(req.user.id);
    }
    async getCertifications(req) {
        return this.shooterProfileService.getCertifications(req.user.id);
    }
    async getRankings(req) {
        return this.shooterProfileService.getRankings(req.user.id);
    }
    async getMedicalNotes(req) {
        return this.shooterProfileService.getMedicalNotes(req.user.id, req.user.role);
    }
    async getCompletenessScore(req) {
        return this.shooterProfileService.getCompletenessScore(req.user.id);
    }
    async getCompetitionEligibility(req) {
        return this.shooterProfileService.getCompetitionEligibility(req.user.id);
    }
    async updateProfile(req, updateData) {
        return this.shooterProfileService.updateProfile(req.user.id, updateData);
    }
};
exports.ShooterProfileController = ShooterProfileController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user shooter profile' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShooterProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all shooter profiles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShooterProfileController.prototype, "getAllProfiles", null);
__decorate([
    (0, common_1.Get)('personal-bests'),
    (0, swagger_1.ApiOperation)({ summary: 'Get personal bests for current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShooterProfileController.prototype, "getPersonalBests", null);
__decorate([
    (0, common_1.Get)('licenses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get licenses for current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShooterProfileController.prototype, "getLicenses", null);
__decorate([
    (0, common_1.Get)('certifications'),
    (0, swagger_1.ApiOperation)({ summary: 'Get certifications for current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShooterProfileController.prototype, "getCertifications", null);
__decorate([
    (0, common_1.Get)('rankings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get range rankings for current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShooterProfileController.prototype, "getRankings", null);
__decorate([
    (0, common_1.Get)('medical-notes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get medical notes for current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShooterProfileController.prototype, "getMedicalNotes", null);
__decorate([
    (0, common_1.Get)('completeness'),
    (0, swagger_1.ApiOperation)({ summary: 'Get profile completeness score' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShooterProfileController.prototype, "getCompletenessScore", null);
__decorate([
    (0, common_1.Get)('competition-eligibility'),
    (0, swagger_1.ApiOperation)({ summary: 'Get competition eligibility for current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShooterProfileController.prototype, "getCompetitionEligibility", null);
__decorate([
    (0, common_1.Put)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update shooter profile' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_shooter_profile_dto_1.UpdateShooterProfileDto]),
    __metadata("design:returntype", Promise)
], ShooterProfileController.prototype, "updateProfile", null);
exports.ShooterProfileController = ShooterProfileController = __decorate([
    (0, swagger_1.ApiTags)('Shooter Profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('shooter-profile'),
    __metadata("design:paramtypes", [shooter_profile_service_1.ShooterProfileService])
], ShooterProfileController);
//# sourceMappingURL=shooter-profile.controller.js.map
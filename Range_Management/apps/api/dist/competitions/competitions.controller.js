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
exports.CompetitionsController = void 0;
const public_decorator_1 = require("../auth/decorators/public.decorator");
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const competitions_service_1 = require("./competitions.service");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let CompetitionsController = class CompetitionsController {
    constructor(competitionsService) {
        this.competitionsService = competitionsService;
    }
    async createCompetition(data) {
        return this.competitionsService.createCompetition(data);
    }
    async getCompetitions(status) {
        return this.competitionsService.getCompetitions(status);
    }
    getRankings(discipline) {
        return this.competitionsService.getRankings(discipline);
    }
    getActiveChallenge() {
        return this.competitionsService.getActiveChallenge();
    }
    async getCompetition(id) {
        return this.competitionsService.getCompetition(id);
    }
    async enterCompetition(id, categoryId, req) {
        return this.competitionsService.enterCompetition(id, categoryId, req.user.id);
    }
    async coachBatchEntry(id, categoryId, shooterIds, req) {
        return this.competitionsService.coachBatchEntry(id, categoryId, req.user.id, shooterIds);
    }
    async getScoreboard(id) {
        return this.competitionsService.getScoreboard(id);
    }
    async finalizeCompetition(id) {
        return this.competitionsService.finalizeCompetition(id);
    }
    async getTrainingDelta(entryId) {
        return this.competitionsService.getTrainingDelta(entryId);
    }
};
exports.CompetitionsController = CompetitionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('RANGE_ADMIN', 'RANGE_OPERATOR'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "createCompetition", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getCompetitions", null);
__decorate([
    (0, common_1.Get)('rankings'),
    __param(0, (0, common_1.Query)('discipline')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "getRankings", null);
__decorate([
    (0, common_1.Get)('challenges/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "getActiveChallenge", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getCompetition", null);
__decorate([
    (0, common_1.Post)(':id/entries'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('categoryId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "enterCompetition", null);
__decorate([
    (0, common_1.Post)(':id/batch-entries'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('categoryId')),
    __param(2, (0, common_1.Body)('shooterIds')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array, Object]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "coachBatchEntry", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/scoreboard'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getScoreboard", null);
__decorate([
    (0, common_1.Post)(':id/finalize'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('RANGE_ADMIN', 'RANGE_OPERATOR'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "finalizeCompetition", null);
__decorate([
    (0, common_1.Get)('entries/:entryId/vs-training'),
    __param(0, (0, common_1.Param)('entryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionsController.prototype, "getTrainingDelta", null);
exports.CompetitionsController = CompetitionsController = __decorate([
    (0, common_1.Controller)('competitions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [competitions_service_1.CompetitionsService])
], CompetitionsController);
//# sourceMappingURL=competitions.controller.js.map
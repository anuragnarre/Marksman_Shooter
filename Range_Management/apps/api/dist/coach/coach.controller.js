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
exports.CoachController = void 0;
const common_1 = require("@nestjs/common");
const coach_service_1 = require("./coach.service");
const create_connection_dto_1 = require("./dto/create-connection.dto");
const create_feedback_dto_1 = require("./dto/create-feedback.dto");
const invite_shooter_dto_1 = require("./dto/invite-shooter.dto");
const create_managed_shooter_dto_1 = require("./dto/create-managed-shooter.dto");
const update_managed_shooter_dto_1 = require("./dto/update-managed-shooter.dto");
const create_managed_shots_dto_1 = require("./dto/create-managed-shots.dto");
const create_session_dto_1 = require("../sessions/dto/create-session.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CoachController = class CoachController {
    constructor(coachService) {
        this.coachService = coachService;
    }
    async requestConnection(user, dto) {
        return this.coachService.requestConnection(user.sub, dto);
    }
    async approveConnection(user, connectionId) {
        return this.coachService.approveConnection(connectionId, user.sub);
    }
    async rejectConnection(user, connectionId) {
        return this.coachService.rejectConnection(connectionId, user.sub);
    }
    async getPendingRequests(user) {
        return this.coachService.getPendingRequests(user.sub);
    }
    async searchShooter(email) {
        return this.coachService.findShooterByEmail(email);
    }
    async inviteShooter(user, dto) {
        return this.coachService.inviteShooter(user.sub, dto);
    }
    async getOutgoingInvites(user) {
        return this.coachService.getOutgoingInvites(user.sub);
    }
    async cancelInvite(user, connectionId) {
        return this.coachService.cancelInvite(connectionId, user.sub);
    }
    async getIncomingInvites(user) {
        return this.coachService.getIncomingInvites(user.sub);
    }
    async approveInvite(user, connectionId) {
        return this.coachService.approveInvite(connectionId, user.sub);
    }
    async rejectInvite(user, connectionId) {
        return this.coachService.rejectInvite(connectionId, user.sub);
    }
    async getAvailableCoaches() {
        return this.coachService.getAvailableCoaches();
    }
    async getMyConnections(user) {
        return this.coachService.getMyConnections(user.sub);
    }
    async getMyShooters(user) {
        return this.coachService.getMyShooters(user.sub);
    }
    async getDashboard(user) {
        return this.coachService.getCoachDashboard(user.sub);
    }
    async getManagedShooterProfiles(user) {
        return this.coachService.getManagedShooterProfiles(user.sub);
    }
    async createManagedShooterProfile(user, dto) {
        return this.coachService.createManagedShooterProfile(user.sub, dto);
    }
    async updateManagedShooterProfile(user, shooterId, dto) {
        return this.coachService.updateManagedShooterProfile(user.sub, shooterId, dto);
    }
    async getShooterSessions(user, shooterId) {
        return this.coachService.getShooterSessions(shooterId, user.sub);
    }
    async createManagedShooterSession(user, shooterId, dto) {
        return this.coachService.createManagedShooterSession(user.sub, shooterId, dto);
    }
    async addManagedShooterSessionShots(user, shooterId, sessionId, dto) {
        return this.coachService.addManagedShooterSessionShots(user.sub, shooterId, sessionId, dto);
    }
    async removeManagedShooterSession(user, shooterId, sessionId) {
        return this.coachService.removeManagedShooterSession(user.sub, shooterId, sessionId);
    }
    async getShooterPerformanceSummary(user, shooterId) {
        return this.coachService.getShooterPerformanceSummary(user.sub, shooterId);
    }
    async addFeedback(user, dto) {
        return this.coachService.addFeedback(user.sub, dto);
    }
    async getCoachDirectory() {
        return this.coachService.getCoachDirectory();
    }
    async getSquadPerformance(squadId, user) {
        return this.coachService.getSquadPerformance(squadId, user.sub);
    }
    async createGroupSession(user, data) {
        return this.coachService.createGroupSession(user.sub, data);
    }
};
exports.CoachController = CoachController;
__decorate([
    (0, common_1.Post)('connect'),
    (0, roles_decorator_1.Roles)('SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_connection_dto_1.CreateConnectionDto]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "requestConnection", null);
__decorate([
    (0, common_1.Patch)('connect/:id/approve'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "approveConnection", null);
__decorate([
    (0, common_1.Patch)('connect/:id/reject'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "rejectConnection", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Get)('shooters/search'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "searchShooter", null);
__decorate([
    (0, common_1.Post)('invite'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, invite_shooter_dto_1.InviteShooterDto]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "inviteShooter", null);
__decorate([
    (0, common_1.Get)('outgoing-invites'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getOutgoingInvites", null);
__decorate([
    (0, common_1.Delete)('invite/:id'),
    (0, roles_decorator_1.Roles)('COACH'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "cancelInvite", null);
__decorate([
    (0, common_1.Get)('incoming-invites'),
    (0, roles_decorator_1.Roles)('SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getIncomingInvites", null);
__decorate([
    (0, common_1.Patch)('invite/:id/approve'),
    (0, roles_decorator_1.Roles)('SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "approveInvite", null);
__decorate([
    (0, common_1.Patch)('invite/:id/reject'),
    (0, roles_decorator_1.Roles)('SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "rejectInvite", null);
__decorate([
    (0, common_1.Get)('coaches'),
    (0, roles_decorator_1.Roles)('SHOOTER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getAvailableCoaches", null);
__decorate([
    (0, common_1.Get)('my-connections'),
    (0, roles_decorator_1.Roles)('SHOOTER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getMyConnections", null);
__decorate([
    (0, common_1.Get)('shooters'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getMyShooters", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('managed-shooters'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getManagedShooterProfiles", null);
__decorate([
    (0, common_1.Post)('managed-shooters'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_managed_shooter_dto_1.CreateManagedShooterDto]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "createManagedShooterProfile", null);
__decorate([
    (0, common_1.Patch)('managed-shooters/:shooterId'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('shooterId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_managed_shooter_dto_1.UpdateManagedShooterDto]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "updateManagedShooterProfile", null);
__decorate([
    (0, common_1.Get)('shooters/:shooterId/sessions'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getShooterSessions", null);
__decorate([
    (0, common_1.Post)('shooters/:shooterId/sessions'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('shooterId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_session_dto_1.CreateSessionDto]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "createManagedShooterSession", null);
__decorate([
    (0, common_1.Post)('shooters/:shooterId/sessions/:sessionId/shots'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('shooterId')),
    __param(2, (0, common_1.Param)('sessionId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, create_managed_shots_dto_1.CreateManagedShotsDto]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "addManagedShooterSessionShots", null);
__decorate([
    (0, common_1.Delete)('shooters/:shooterId/sessions/:sessionId'),
    (0, roles_decorator_1.Roles)('COACH'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('shooterId')),
    __param(2, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "removeManagedShooterSession", null);
__decorate([
    (0, common_1.Get)('shooters/:shooterId/performance'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getShooterPerformanceSummary", null);
__decorate([
    (0, common_1.Post)('feedback'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_feedback_dto_1.CreateFeedbackDto]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "addFeedback", null);
__decorate([
    (0, common_1.Get)('directory'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getCoachDirectory", null);
__decorate([
    (0, common_1.Get)('squads/:id/performance'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getSquadPerformance", null);
__decorate([
    (0, common_1.Post)('group-sessions'),
    (0, roles_decorator_1.Roles)('COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "createGroupSession", null);
exports.CoachController = CoachController = __decorate([
    (0, common_1.Controller)('coach'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [coach_service_1.CoachService])
], CoachController);
//# sourceMappingURL=coach.controller.js.map
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
exports.MembershipsController = void 0;
const common_1 = require("@nestjs/common");
const memberships_service_1 = require("./memberships.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let MembershipsController = class MembershipsController {
    constructor(membershipsService) {
        this.membershipsService = membershipsService;
    }
    createTier(createTierDto) {
        return this.membershipsService.createMembershipTier(createTierDto);
    }
    findAllTiers() {
        return this.membershipsService.getAllTiers();
    }
    createSubscription(createSubDto) {
        return this.membershipsService.createSubscription(createSubDto);
    }
    getUserSubscription(userId) {
        return this.membershipsService.getUserSubscription(userId);
    }
    getAllSubscriptions() {
        return this.membershipsService.getAllSubscriptions();
    }
    getAllOrganizations() {
        return this.membershipsService.getAllOrganizations();
    }
};
exports.MembershipsController = MembershipsController;
__decorate([
    (0, common_1.Post)('tiers'),
    (0, roles_decorator_1.Roles)('RANGE_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "createTier", null);
__decorate([
    (0, common_1.Get)('tiers'),
    (0, roles_decorator_1.Roles)('RANGE_ADMIN', 'STAFF'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "findAllTiers", null);
__decorate([
    (0, common_1.Post)('subscriptions'),
    (0, roles_decorator_1.Roles)('RANGE_ADMIN', 'STAFF'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "createSubscription", null);
__decorate([
    (0, common_1.Get)('subscriptions/user/:userId'),
    (0, roles_decorator_1.Roles)('RANGE_ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "getUserSubscription", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    (0, roles_decorator_1.Roles)('RANGE_ADMIN', 'STAFF', 'RANGE_OPERATOR'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "getAllSubscriptions", null);
__decorate([
    (0, common_1.Get)('organizations'),
    (0, roles_decorator_1.Roles)('RANGE_ADMIN', 'STAFF', 'RANGE_OPERATOR'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "getAllOrganizations", null);
exports.MembershipsController = MembershipsController = __decorate([
    (0, common_1.Controller)('memberships'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [memberships_service_1.MembershipsService])
], MembershipsController);
//# sourceMappingURL=memberships.controller.js.map
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
exports.PerformanceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const performance_service_1 = require("./performance.service");
const session_context_dto_1 = require("./dto/session-context.dto");
let PerformanceController = class PerformanceController {
    constructor(performanceService) {
        this.performanceService = performanceService;
    }
    getDeepAnalysis(sessionId, user, shooterId) {
        return this.performanceService.getDeepAnalysis(user.sub, sessionId, user.role, shooterId);
    }
    saveSessionContext(sessionId, dto, user, shooterId) {
        return this.performanceService.saveSessionContext(user.sub, sessionId, dto, user.role, shooterId);
    }
    generateTrainingPlan(user, shooterId) {
        if (user.role === 'COACH' && !shooterId) {
            throw new common_1.BadRequestException('shooterId is required for coach training plans');
        }
        return this.performanceService.generateTrainingPlan(user.sub, user.role, shooterId);
    }
    getTrainingPlans(user, shooterId) {
        if (user.role === 'COACH' && !shooterId) {
            throw new common_1.BadRequestException('shooterId is required for coach training plans');
        }
        return this.performanceService.getTrainingPlans(user.sub, user.role, shooterId);
    }
};
exports.PerformanceController = PerformanceController;
__decorate([
    (0, common_1.Get)('deep-analysis/:sessionId'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "getDeepAnalysis", null);
__decorate([
    (0, common_1.Post)('session-context/:sessionId'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, session_context_dto_1.SessionContextDto, Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "saveSessionContext", null);
__decorate([
    (0, common_1.Post)('training-plan'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "generateTrainingPlan", null);
__decorate([
    (0, common_1.Get)('training-plans'),
    (0, roles_decorator_1.Roles)('SHOOTER', 'COACH'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "getTrainingPlans", null);
exports.PerformanceController = PerformanceController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('performance'),
    __metadata("design:paramtypes", [performance_service_1.PerformanceService])
], PerformanceController);
//# sourceMappingURL=performance.controller.js.map
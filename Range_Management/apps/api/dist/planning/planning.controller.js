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
exports.PlanningController = void 0;
const common_1 = require("@nestjs/common");
const planning_service_1 = require("./planning.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
let PlanningController = class PlanningController {
    constructor(planningService) {
        this.planningService = planningService;
    }
    async getDrills() {
        return this.planningService.getDrills();
    }
    async saveSessionPlan(req, data) {
        return this.planningService.saveSessionPlan(req.user.sub, data);
    }
    async getSessionPlan(shooterId) {
        return this.planningService.getSessionPlan(shooterId);
    }
};
exports.PlanningController = PlanningController;
__decorate([
    (0, common_1.Get)('drills'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlanningController.prototype, "getDrills", null);
__decorate([
    (0, common_1.Post)('session-plan'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlanningController.prototype, "saveSessionPlan", null);
__decorate([
    (0, common_1.Get)('session-plan/:shooterId'),
    __param(0, (0, common_1.Param)('shooterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlanningController.prototype, "getSessionPlan", null);
exports.PlanningController = PlanningController = __decorate([
    (0, common_1.Controller)('planning'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [planning_service_1.PlanningService])
], PlanningController);
//# sourceMappingURL=planning.controller.js.map